"""
ParkPulse API — FastAPI wrapping the shared intelligence (app/core.py, app/copilot.py).
Loads the models once at startup (keep-warm keeps them resident), exposes JSON endpoints, and
runs the Gemini co-pilot server-side. Deploy on Render (root = repo, start = uvicorn).

Run locally:  python fullstack/backend/main.py     (serves on :8000)
"""
import os, sys, json
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta

_IST = timezone(timedelta(hours=5, minutes=30))

def _now_ist() -> str:
    """Current Bengaluru wall-clock time, so the co-pilot greets by the real time of day."""
    return datetime.now(_IST).strftime("%A %d %B %Y, %H:%M IST")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")  # optional: fullstack/backend/.env (git-ignored)

# --- import the shared brain from the repo's app/ (single source of truth) ---
APP_DIR = Path(__file__).resolve().parents[2] / "app"
sys.path.insert(0, str(APP_DIR))
import core, copilot  # noqa: E402

STATE: dict = {}

def _records(df):
    """DataFrame -> JSON-native list of records (handles numpy scalars via pandas)."""
    return json.loads(df.to_json(orient="records"))

def _build_meta(df, zones):
    cov = core.coverage_by_hour(df)
    vc = core.vehicle_counts(df); rep = vc[vc >= 2]
    bt = core.backtest(df)
    return {
        "totals": {"violations": int(len(df)), "zones": int(len(zones)),
                   "days": int(df["ymd"].nunique()),
                   "junctions": int(df.loc[df.has_junction, "junction_name"].nunique())},
        "coverage": _records(cov.assign(share=cov["share"].round(4))[["hour", "share"]]),
        "coverage_summary": {"before_1pm": round(cov[cov.hour < 13]["share"].sum() * 100, 1),
                             "evening_5_9": round(cov[cov.hour.between(17, 21)]["share"].sum() * 100, 2)},
        "repeat": {"unique": int(len(vc)), "repeat_vehicles": int(len(rep)),
                   "share_pct": round(rep.sum() / len(df) * 100, 1),
                   "worst": int(vc.iloc[0]) if len(vc) else 0},
        "backtest": bt,
        "top_hotspots": _records(zones.head(10)[["label", "violations", "impact_score"]]),
        "dow_names": copilot.DOW,
    }

DATA_DIR = Path(__file__).resolve().parents[2] / "data"

def _build_state(df):
    """(Re)compute every derived model from the violations df and store it in STATE.
       Called at startup and again after /ingest or /refresh — no server restart needed."""
    zones = core.add_impact(core.build_zones(df))
    STATE.update(
        df=df, zones=zones, fc=core.build_forecaster(df),
        grid=(df.groupby("gh7").agg(lat=("lat", "median"), lon=("lon", "median"),
                                    n=("lat", "size")).reset_index()),
        meta=_build_meta(df, zones),
        impact=core.deployment_simulation(df),
        anomalies=core.detect_anomalies(df),
        trends=core.zone_trends(df))

@asynccontextmanager
async def lifespan(app: FastAPI):
    _build_state(core.load_clean())
    STATE["outcomes"] = []
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        from google import genai
        STATE["genai"] = genai.Client(api_key=key)
    else:
        STATE["genai"] = None
    yield
    STATE.clear()

app = FastAPI(title="ParkPulse API", version="1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False,
                   allow_methods=["*"], allow_headers=["*"])

# ------------------------------------------------------------------ read-only
@app.get("/health")
def health():
    return {"status": "ok", "ready": "df" in STATE}

@app.get("/meta")
def meta():
    return STATE["meta"]

@app.get("/impact")
def impact():
    return STATE["impact"]

@app.get("/anomalies")
def anomalies():
    """Unusual high-violation days (likely events / festivals) — robust z-score per weekday."""
    return {"anomalies": STATE.get("anomalies", [])}

@app.get("/zones")
def zones():
    cols = ["gh6", "lat", "lon", "label", "violations", "impact_score",
            "avg_severity", "junction_frac", "main_road_frac", "top_violation"]
    return _records(STATE["zones"][cols])

@app.get("/grid")
def grid():
    return _records(STATE["grid"][["lat", "lon", "n"]])

@app.get("/coverage")
def coverage():
    return _records(core.coverage_by_hour(STATE["df"]))

@app.get("/offenders")
def offenders():
    vc = core.vehicle_counts(STATE["df"]).head(25).rename("violations").reset_index()
    vc.columns = ["vehicle", "violations"]
    return _records(vc)

@app.get("/facets")
def facets():
    df = STATE["df"]
    types = sorted(df["primary_type"].unique().tolist())
    stations = sorted(s for s in df["police_station"].unique().tolist() if str(s).lower() != "nan")
    return {"types": types, "stations": stations, "dows": copilot.DOW}

@app.get("/forecast")
def forecast(dow: int, hours: str):
    hrs = [int(h) for h in hours.split(",") if h.strip() != ""]
    return _records(core.predict_load(STATE["fc"], dow, hrs))

@app.get("/roi")
def roi(dow: int, start: int, end: int):
    h0, h1 = sorted((max(0, min(23, start)), max(0, min(23, end))))
    pred = core.predict_load(STATE["fc"], dow, range(h0, h1 + 1))
    return _records(core.roi_curve(pred, 20))

@app.get("/explorer")
def explorer(dows: str = "", h0: int = 0, h1: int = 23, types: str = "", stations: str = ""):
    df = STATE["df"]
    m = df["hour"].between(h0, h1)
    if dows:
        names = [d for d in dows.split(",") if d]
        m &= df["dow"].map(dict(enumerate(copilot.DOW))).isin(names)
    if types:
        m &= df["primary_type"].isin([t for t in types.split("|") if t])
    if stations:
        m &= df["police_station"].isin([s for s in stations.split("|") if s])
    sub = df[m]
    if sub.empty:
        return {"count": 0, "zones": []}
    z = core.add_impact(core.build_zones(sub))
    cols = ["gh6", "lat", "lon", "label", "violations", "impact_score", "top_violation"]
    return {"count": int(len(sub)), "zones": _records(z[cols].head(80))}

# ------------------------------------------------------------------ actions
class PatrolReq(BaseModel):
    weekday: str = "Saturday"
    start_hour: int = 9
    end_hour: int = 13
    teams: int = 8
    area: str | None = None

@app.post("/patrol")
def patrol(req: PatrolReq):
    dow = copilot._dow_index(req.weekday)
    h0, h1 = sorted((max(0, min(23, req.start_hour)), max(0, min(23, req.end_hour))))
    zsub = STATE["zones"]
    if req.area:
        mask = STATE["zones"]["label"].str.contains(req.area, case=False, na=False)
        if mask.any():
            zsub = STATE["zones"][mask]
    pred = core.predict_load(STATE["fc"], dow, range(h0, h1 + 1))
    plan = core.allocate_patrols(zsub, pred, k=max(1, req.teams))
    recs = _records(plan)
    trends = STATE.get("trends", {})
    for r in recs:                                    # attach the zone's recent trend for explainability
        t = trends.get(r.get("gh6"))
        if t:
            r["trend"], r["trend_pct"] = t["trend"], t["pct"]
    return {"weekday": copilot.DOW[dow], "window": f"{h0:02d}:00-{h1:02d}:59",
            "teams": int(len(plan)), "plan": recs}

# ---- data flywheel: ingest new challans + rebuild models in place (no restart) ----
@app.post("/refresh")
def refresh():
    """Reload data/clean.pkl from disk and rebuild all models in place. This is the 'nightly drop ->
       refresh' hook: a job writes a fresh clean.pkl (via prep), then calls this to go live."""
    _build_state(core.load_clean())
    return {"status": "refreshed", "violations": int(len(STATE["df"])),
            "backtest": STATE["meta"]["backtest"]}

class IngestReq(BaseModel):
    records: list[dict]          # RAW rows: latitude, longitude, created_datetime, violation_type, ...
    persist: bool = True         # also write to clean.pkl so they survive a restart

@app.post("/ingest")
def ingest(req: IngestReq):
    """Append new RAW violation records (source-CSV schema), clean them like prep.py, rebuild the models,
       and optionally persist to clean.pkl. Makes the 'gets better over time' story literally true."""
    cleaned = core.clean_raw(req.records)
    if cleaned.empty:
        return {"status": "no_valid_records", "added": 0, "violations": int(len(STATE["df"]))}
    import pandas as pd
    df = pd.concat([STATE["df"], cleaned], ignore_index=True)
    if req.persist:
        df.to_pickle(DATA_DIR / "clean.pkl")
    _build_state(df)
    return {"status": "ingested", "added": int(len(cleaned)),
            "violations": int(len(STATE["df"])), "backtest": STATE["meta"]["backtest"]}

# ---- outcome logging: officers record what a deployed team actually found (pilot feedback loop) ----
class OutcomeReq(BaseModel):
    team: str = ""
    zone: str = ""
    gh6: str = ""
    weekday: str = ""
    window: str = ""
    found: int = 0

@app.post("/outcome")
def log_outcome(req: OutcomeReq):
    """An officer logs what a deployed team actually found — the pilot feedback loop. Kept IN MEMORY only
       (no file written), so the demo never persists anything to disk. Resets on restart."""
    STATE.setdefault("outcomes", []).append(req.model_dump())
    return {"status": "logged", "total": len(STATE["outcomes"])}

@app.get("/outcomes")
def get_outcomes():
    o = STATE.get("outcomes", [])
    return {"outcomes": o[-50:], "total": len(o),
            "total_found": int(sum(int(x.get("found", 0)) for x in o))}

class Turn(BaseModel):
    role: str = "user"          # "user" | "assistant"
    text: str = ""

class CopilotReq(BaseModel):
    message: str
    history: list[Turn] = []     # prior turns, for conversation memory

@app.post("/copilot")
def copilot_endpoint(req: CopilotReq):
    if STATE.get("genai") is None:
        return {"answer": "⚠️ Co-pilot isn't configured — set GEMINI_API_KEY on the server.", "plan": None}
    ctx = {"df": STATE["df"], "zones": STATE["zones"], "fc": STATE["fc"]}
    model = os.environ.get("COPILOT_MODEL", "gemini-2.5-flash")
    history = [t.model_dump() for t in req.history]
    try:
        answer, plan = copilot.run_agent(STATE["genai"], req.message, ctx, model=model,
                                         history=history, now=_now_ist())
    except Exception as e:
        return {"answer": f"⚠️ {type(e).__name__}: {e}", "plan": None}
    return {"answer": answer, "plan": _records(plan) if plan is not None and len(plan) else None}

@app.post("/assistant")
def assistant_endpoint(req: CopilotReq):
    if STATE.get("genai") is None:
        return {"answer": "The in-app assistant needs GEMINI_API_KEY set on the server. "
                          "Meanwhile, use the page shortcuts below to get around.", "plan": None}
    ctx = {"df": STATE["df"], "zones": STATE["zones"], "fc": STATE["fc"]}
    model = os.environ.get("COPILOT_MODEL", "gemini-2.5-flash")
    history = [t.model_dump() for t in req.history]
    try:
        answer, plan = copilot.run_assistant(STATE["genai"], req.message, ctx, model=model,
                                             history=history, now=_now_ist())
    except Exception as e:
        return {"answer": f"⚠️ {type(e).__name__}: {e}", "plan": None}
    return {"answer": answer, "plan": _records(plan) if plan is not None and len(plan) else None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
