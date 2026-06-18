"""
copilot.py — the "Ask ParkPulse" agent (Google Gemini automatic function calling).
Maps a natural-language question to REAL ParkPulse computations over the 298K-record models, so every
answer is grounded (not generated prose). The Gemini SDK runs the tool loop automatically. No Streamlit.
"""
import json
import core

DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
_DAYS = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}

def _dow_index(name):
    return _DAYS.get(str(name or "sat").strip().lower()[:3], 5)

def _clean(o):
    """Coerce numpy scalars to native types so the tool result is JSON-serialisable for Gemini."""
    return json.loads(json.dumps(o, default=lambda x: x.item() if hasattr(x, "item") else str(x)))

SYSTEM = (
    "You are ParkPulse's enforcement co-pilot for the Bengaluru Traffic Police. You help officers decide "
    "where and when to deploy parking-enforcement teams, using ONLY the tools provided — which run on "
    "298,000 real violation records. Talk like a sharp duty officer: concise, concrete, operational. "
    "For any 'where should I deploy / plan teams' request, call make_patrol_plan. Ground every number in a "
    "tool result; never invent figures. If the weekday, time window or team count is missing, assume a "
    "sensible default and say so. You may answer in English, Hindi or Kannada to match the user."
)

def _make_tools(ctx):
    """Build the tool callables as closures over ctx (df, zones, fc). Gemini introspects their
       type hints + docstrings to build the schema, and executes them via automatic function calling."""
    df, zones, fc = ctx["df"], ctx["zones"], ctx["fc"]

    def make_patrol_plan(weekday: str, start_hour: int, end_hour: int,
                         teams: int, area: str = "") -> dict:
        """Generate an optimal, spatially-spread patrol deployment plan and return the deployments.

        Args:
            weekday: e.g. 'Saturday'.
            start_hour: shift start hour, 0-23 IST.
            end_hour: shift end hour, 0-23 IST.
            teams: number of patrol teams to place.
            area: optional; restrict to zones whose name contains this text, e.g. 'KR Market'.
        """
        dow = _dow_index(weekday)
        h0, h1 = max(0, min(23, int(start_hour))), max(0, min(23, int(end_hour)))
        if h1 < h0:
            h0, h1 = h1, h0
        teams = max(1, int(teams))
        zsub = zones
        if area and area.strip():
            mask = zones["label"].str.contains(area.strip(), case=False, na=False)
            if mask.any():
                zsub = zones[mask]
        pred = core.predict_load(fc, dow, range(h0, h1 + 1))
        plan = core.allocate_patrols(zsub, pred, k=teams)
        ctx["plan"] = plan
        return _clean({"weekday": DOW[dow], "window": f"{h0:02d}:00-{h1:02d}:59",
                       "teams": int(len(plan)), "scope": f"area: {area}" if area else "city-wide",
                       "deployments": plan[["team", "label", "pred_load",
                                            "impact_score"]].head(teams).to_dict("records")})

    def top_hotspots(n: int = 10) -> dict:
        """List the highest Congestion-Impact-Score parking hotspots city-wide.

        Args:
            n: how many hotspots to return.
        """
        n = max(1, int(n))
        return _clean({"hotspots": zones.head(n)[["label", "violations", "impact_score",
                                                  "top_violation"]].to_dict("records")})

    def coverage_stats() -> dict:
        """Enforcement coverage by time of day, incl. the morning concentration and evening blind spot."""
        cov = core.coverage_by_hour(df)
        return _clean({"pct_before_1pm": round(cov[cov.hour < 13]["share"].sum() * 100, 1),
                       "pct_evening_5_9pm": round(cov[cov.hour.between(17, 21)]["share"].sum() * 100, 2),
                       "peak_hour_ist": int(cov.loc[cov["share"].idxmax(), "hour"])})

    def repeat_offenders() -> dict:
        """Statistics on chronic repeat-offender vehicles."""
        vc = core.vehicle_counts(df); rep = vc[vc >= 2]
        return _clean({"unique_vehicles": int(len(vc)), "repeat_vehicles": int(len(rep)),
                       "repeat_share_pct": round(rep.sum() / len(df) * 100, 1),
                       "worst_offender_count": int(vc.iloc[0]) if len(vc) else 0})

    return [make_patrol_plan, top_hotspots, coverage_stats, repeat_offenders]

def run_agent(client, query, ctx, model="gemini-2.5-flash"):
    """Returns (answer_text, plan_DataFrame_or_None). `client` is a google.genai.Client.
       Uses Gemini automatic function calling — the SDK runs the tool loop and returns the final text."""
    from google.genai import types
    ctx = dict(ctx); ctx["plan"] = None
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM, tools=_make_tools(ctx), temperature=0.3)
    resp = client.models.generate_content(model=model, contents=query, config=config)
    return (resp.text or "I couldn't find an answer — try rephrasing."), ctx.get("plan")
