# ParkPulse — full-stack (FastAPI + Next.js)

The production-grade version of ParkPulse: a **FastAPI** backend that wraps the *same* intelligence
(`../app/core.py`, `../app/copilot.py`) and a **Next.js + deck.gl** frontend that calls it. This is the
**finale build** — polished UI, the Gemini co-pilot server-side, ready for Vercel + Render.

```
fullstack/
├─ backend/    FastAPI — loads the models once at startup, exposes JSON endpoints + the co-pilot
└─ frontend/   Next.js 16 (App Router, TS, Tailwind, deck.gl) — 6 pages, calls the API
```

> One source of truth: the backend imports `core.py`/`copilot.py` from the repo's `app/` — no duplicated logic.

---

## Run locally

**1. Backend** (terminal 1, from the repo root):
```bash
pip install -r fullstack/backend/requirements.txt
# optional — enables the AI co-pilot:
export GEMINI_API_KEY="AIza..."        # Windows: set GEMINI_API_KEY=...
python fullstack/backend/main.py        # serves http://localhost:8000  (GET /health)
```

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
| GET | `/zones` · `/grid` | per-zone summary · gh7 density hexes |
| GET | `/coverage` · `/offenders` · `/facets` | coverage-by-hour · top offenders · filter options |
| GET | `/forecast?dow=&hours=` | predicted load per zone |
| GET | `/roi?dow=&start=&end=` | ROI / staffing curve |
| GET | `/explorer?dows=&h0=&h1=&types=&stations=` | server-side filtered zones |
| POST | `/patrol` | `{weekday,start_hour,end_hour,teams,area?}` → deployment plan |
| POST | `/copilot` | `{message}` → `{answer, plan}` (Gemini function-calling over core.py) |

---

## Deploy

### Backend → Render
- **New Web Service** → connect this repo. **Root Directory:** repo root. **Region:** **Singapore** (closest to Bengaluru → lowest latency).
- **Build:** `pip install -r fullstack/backend/requirements.txt`
- **Start:** `uvicorn fullstack.backend.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path:** `/health`
- **Env:** `GEMINI_API_KEY` (for the co-pilot), optional `COPILOT_MODEL=gemini-2.5-flash`.
- **Keep warm (avoid the free-tier 50 s cold start):** add a **BetterStack** (Better Uptime) monitor that pings
  `https://<your-service>.onrender.com/health` every **~5 min**. One always-on free service ≈ 730 h/month — fits the
  ~750 h free allowance. Before a live demo, hit `/health` a few times manually and don't deploy right before presenting.

### Frontend → Vercel
- **Import** the repo. **Root Directory:** `fullstack/frontend`.
- **Env:** `NEXT_PUBLIC_API_URL = https://<your-service>.onrender.com`
- Deploy. (Next.js 16 + Turbopack; everything is client-rendered against the API.)

---

## How it splits the work (vs the Streamlit version)
The backend computes everything in Python (one source of truth, no TS port of the models); the frontend is a thin,
polished client that calls it. The co-pilot runs **server-side** (the API key never reaches the browser). The only
operational care is keeping the backend warm — handled by the BetterStack ping above.

> Next.js 16 has breaking changes vs older versions — see `frontend/AGENTS.md`; check `node_modules/next/dist/docs/`
> before changing frontend patterns.
