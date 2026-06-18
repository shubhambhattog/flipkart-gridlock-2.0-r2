"""
copilot.py — the "Ask ParkPulse" agent.
Maps a natural-language question to REAL ParkPulse computations via Anthropic tool-use, so every
answer is grounded in the 298K-record models (not generated prose). No Streamlit here → testable.
"""
import json
import core

DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
_DAYS = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}

def _dow_index(name):
    return _DAYS.get(str(name or "sat").strip().lower()[:3], 5)

SYSTEM = (
    "You are ParkPulse's enforcement co-pilot for the Bengaluru Traffic Police. You help officers decide "
    "where and when to deploy parking-enforcement teams, using ONLY the tools provided — which run on "
    "298,000 real violation records. Talk like a sharp duty officer: concise, concrete, operational. "
    "For any 'where should I deploy / plan teams' request, call make_patrol_plan. Ground every number in a "
    "tool result; never invent figures. If the weekday, time window or team count is missing, assume a "
    "sensible default and say so. You may answer in English, Hindi or Kannada to match the user."
)

TOOLS = [
    {"name": "make_patrol_plan",
     "description": "Generate an optimal, spatially-spread patrol deployment plan for a weekday, time "
                    "window and team count. Use for any 'where should I send/deploy/plan teams' request.",
     "input_schema": {"type": "object", "properties": {
         "weekday": {"type": "string", "description": "e.g. Saturday"},
         "start_hour": {"type": "integer", "description": "0-23 IST shift start"},
         "end_hour": {"type": "integer", "description": "0-23 IST shift end"},
         "teams": {"type": "integer", "description": "number of patrol teams"},
         "area": {"type": "string", "description": "optional: restrict to zones whose name contains this, "
                                                   "e.g. 'KR Market'"}},
         "required": ["weekday", "start_hour", "end_hour", "teams"]}},
    {"name": "top_hotspots",
     "description": "List the highest Congestion-Impact-Score parking hotspots city-wide.",
     "input_schema": {"type": "object",
                      "properties": {"n": {"type": "integer", "description": "how many"}},
                      "required": ["n"]}},
    {"name": "coverage_stats",
     "description": "Enforcement coverage by time of day, including the morning concentration and the "
                    "evening blind spot.",
     "input_schema": {"type": "object", "properties": {}}},
    {"name": "repeat_offenders",
     "description": "Statistics on chronic repeat-offender vehicles.",
     "input_schema": {"type": "object", "properties": {}}},
]

def _execute(name, args, ctx):
    df, zones, fc = ctx["df"], ctx["zones"], ctx["fc"]
    if name == "make_patrol_plan":
        dow = _dow_index(args.get("weekday"))
        h0, h1 = int(args.get("start_hour", 9)), int(args.get("end_hour", 13))
        h0, h1 = max(0, min(23, h0)), max(0, min(23, h1))
        if h1 < h0:
            h0, h1 = h1, h0
        teams = max(1, int(args.get("teams", 8)))
        zsub, area = zones, (args.get("area") or "").strip()
        if area:
            mask = zones["label"].str.contains(area, case=False, na=False)
            if mask.any():
                zsub = zones[mask]
        pred = core.predict_load(fc, dow, range(h0, h1 + 1))
        plan = core.allocate_patrols(zsub, pred, k=teams)
        ctx["plan"] = plan
        return {"weekday": DOW[dow], "window": f"{h0:02d}:00-{h1:02d}:59", "teams": int(len(plan)),
                "scope": f"area: {area}" if area else "city-wide",
                "deployments": plan[["team", "label", "pred_load", "impact_score"]]
                                   .head(teams).to_dict("records")}
    if name == "top_hotspots":
        n = max(1, int(args.get("n", 10)))
        return {"hotspots": zones.head(n)[["label", "violations", "impact_score",
                                           "top_violation"]].to_dict("records")}
    if name == "coverage_stats":
        cov = core.coverage_by_hour(df)
        return {"pct_before_1pm": round(cov[cov.hour < 13]["share"].sum() * 100, 1),
                "pct_evening_5_9pm": round(cov[cov.hour.between(17, 21)]["share"].sum() * 100, 2),
                "peak_hour_ist": int(cov.loc[cov["share"].idxmax(), "hour"])}
    if name == "repeat_offenders":
        vc = core.vehicle_counts(df); rep = vc[vc >= 2]
        return {"unique_vehicles": int(len(vc)), "repeat_vehicles": int(len(rep)),
                "repeat_share_pct": round(rep.sum() / len(df) * 100, 1),
                "worst_offender_count": int(vc.iloc[0]) if len(vc) else 0}
    return {"error": f"unknown tool {name}"}

def run_agent(client, query, ctx, model="claude-sonnet-4-6", max_steps=4):
    """Returns (answer_text, plan_DataFrame_or_None). `client` is an anthropic.Anthropic instance."""
    ctx = dict(ctx); ctx["plan"] = None
    messages = [{"role": "user", "content": query}]
    for _ in range(max_steps):
        resp = client.messages.create(model=model, max_tokens=1024, system=SYSTEM,
                                       tools=TOOLS, messages=messages)
        if resp.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": resp.content})
            results = []
            for b in resp.content:
                if b.type == "tool_use":
                    out = _execute(b.name, b.input or {}, ctx)
                    results.append({"type": "tool_result", "tool_use_id": b.id,
                                    "content": json.dumps(out, default=str)})
            messages.append({"role": "user", "content": results})
        else:
            return "".join(b.text for b in resp.content if b.type == "text"), ctx.get("plan")
    return "I couldn't complete that in a few steps — try rephrasing.", ctx.get("plan")
