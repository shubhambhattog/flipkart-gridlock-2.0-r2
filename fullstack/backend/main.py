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

@asynccontextmanager
async def lifespan(app: FastAPI):
    df = core.load_clean()
    zones = core.add_impact(core.build_zones(df))
    STATE.update(
        df=df, zones=zones, fc=core.build_forecaster(df),
        grid=(df.groupby("gh7").agg(lat=("lat", "median"), lon=("lon", "median"),
                                    n=("lat", "size")).reset_index()),
        meta=_build_meta(df, zones),
        impact=core.deployment_simulation(df))
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
    return {"weekday": copilot.DOW[dow], "window": f"{h0:02d}:00-{h1:02d}:59",
            "teams": int(len(plan)), "plan": _records(plan)}

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
