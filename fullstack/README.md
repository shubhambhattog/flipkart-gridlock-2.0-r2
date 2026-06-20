# ParkPulse — full-stack (FastAPI + Next.js)

The production-grade version of ParkPulse: a **FastAPI** backend that wraps the *same* intelligence
(`../app/core.py`, `../app/copilot.py`) and a **Next.js 16 + shadcn/ui + deck.gl** frontend that calls it. This is
the **finale build** — polished UI, the Gemini co-pilot server-side, ready for Vercel + Render.

**Status: complete.** All **6 pages** are built on **shadcn/ui** (Tailwind v4) with a **guardrailed floating
assistant** on every page — Command Center (3-D hotspot map + KPIs + blind-spot insight), Hotspot Explorer,
Forecast & Patrol, Coverage & ROI, Repeat Offenders, and Ask ParkPulse.

```
fullstack/
├─ backend/    FastAPI — loads the models once at startup, exposes JSON endpoints + the co-pilot
└─ frontend/   Next.js 16 (App Router, TS, Tailwind v4, shadcn/ui, deck.gl) — 6 pages + floating assistant
```

> One source of truth: the backend imports `core.py`/`copilot.py` from the repo's `app/` — no duplicated logic.

---

## Run locally

**1. Backend** (terminal 1, from the repo root):
```bash
pip install -r fullstack/backend/requirements.txt
# optional — enables the AI co-pilot + floating assistant:
export GEMINI_API_KEY="AIza..."        # Windows: set GEMINI_API_KEY=...
python fullstack/backend/main.py        # serves http://localhost:8000  (GET /health)
```
> Instead of exporting it, you can drop `GEMINI_API_KEY=AIza...` into **`fullstack/backend/.env`**
> (git-ignored) — the backend reads it from the environment or that file.

**2. Frontend** (terminal 2):
```bash
cd fullstack/frontend
npm install
npm run dev                              # http://localhost:3000
```
`fullstack/frontend/.env.local` already points at `http://localhost:8000`.

---

## API (backend)

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/health` | `{status, ready}` — keep this trivial (BetterStack pings it) |
| GET | `/meta` | headline stats: totals, coverage curve, repeat, backtest, top hotspots |
| GET | `/impact` | **validated-impact** card data — the 31-day held-out counterfactual replay |
| GET | `/zones` · `/grid` | per-zone summary · gh7 density hexes |
| GET | `/coverage` · `/offenders` · `/facets` | coverage-by-hour · top offenders · filter options |
| GET | `/forecast?dow=&hours=` | predicted load per zone |
| GET | `/roi?dow=&start=&end=` | ROI / staffing curve |
| GET | `/explorer?dows=&h0=&h1=&types=&stations=` | server-side filtered zones |
| POST | `/patrol` | `{weekday,start_hour,end_hour,teams,area?}` → deployment plan |
| POST | `/copilot` | `{message, history}` → `{answer, plan}` (Gemini function-calling over core.py, with memory) |
| POST | `/assistant` | `{message, history}` → `{answer, plan}` — the guardrailed in-app floating assistant |
| POST | `/ingest` | `{records[], persist}` → cleans new RAW challans, appends, rebuilds models in place |
| POST | `/refresh` | reload `clean.pkl` from disk + rebuild — the "nightly drop → go live" hook, no restart |

The intelligence behind these endpoints (all in `../app/core.py`): a log-scaled **Congestion Impact Score**, an
empirical-Bayes shrinkage forecaster (`alpha=12`) of load per zone × weekday × hour — an honest time-split backtest
scores **r=0.70 (MAE 2.01)**, beating a LightGBM Poisson baseline (0.69), so we kept the interpretable model — and a
greedy minimum-spacing patrol optimiser. The **flagship proof** powering `/impact`: a counterfactual replay on **31
held-out days** the model never saw, where a 10-team ParkPulse plan would have been positioned for **~38%** of the
violations actually logged, vs ~1.3% spread evenly (this is the share of catchable/logged violations — enforcement
*efficiency*, never true demand).

> **Precompute note:** the backend runs `core.py` once at startup and caches the results (zones, grid, forecaster,
> impact replay) in memory, so every endpoint above answers from precomputed state — no per-request model work.

---

## Deploy

### Backend → Render
- **New Web Service** → connect this repo. **Root Directory:** repo root. **Region:** **Singapore** (closest to Bengaluru → lowest latency).
- **Build:** `pip install -r fullstack/backend/requirements.txt`
- **Start:** `uvicorn fullstack.backend.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path:** `/health`
- **Env:** `GEMINI_API_KEY` (powers the co-pilot **and** the floating assistant), optional `COPILOT_MODEL=gemini-2.5-flash`.
  Locally this can instead live in `fullstack/backend/.env` (git-ignored); on Render set it as a dashboard secret.
- **Keep warm (avoid the free-tier 50 s cold start):** add a **BetterStack** (Better Uptime) monitor that pings
  `https://<your-service>.onrender.com/health` every **~5 min**. One always-on free service ≈ 730 h/month — fits the
  ~750 h free allowance. Before a live demo, hit `/health` a few times manually and don't deploy right before presenting.

### Frontend → Vercel
- **Import** the repo. **Root Directory:** `fullstack/frontend`.
- **Env:** `NEXT_PUBLIC_API_URL = https://<your-service>.onrender.com`
- Deploy. (Next.js 16 + Turbopack; everything is client-rendered against the API.)

---

## How it splits the work (vs the Streamlit version)
The backend computes everything in Python (one source of truth, no TS port of the models); the frontend is the thin,
polished client — all **6 pages** built on **shadcn/ui** plus the **floating assistant**, calling the API. Both the
co-pilot and the assistant run **server-side** (the API key never reaches the browser). The build is **done**; the
only operational care is keeping the backend warm — handled by the BetterStack ping above.

> Next.js 16 has breaking changes vs older versions — see `frontend/AGENTS.md`; check `node_modules/next/dist/docs/`
> before changing frontend patterns.
