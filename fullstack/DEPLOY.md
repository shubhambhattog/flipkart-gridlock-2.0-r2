# 🚀 Deploying ParkPulse (full-stack): Backend → Render, Frontend → Vercel

Two services. **Deploy the backend first**, copy its URL, then deploy the frontend pointed at it.

```
  Next.js (Vercel)  ──HTTPS──►  FastAPI (Render)  ──►  app/core.py + data/clean.pkl
  NEXT_PUBLIC_API_URL              GEMINI_API_KEY
```

**Prerequisites:** the repo on GitHub (done), a free Render account, a free Vercel account, and your Gemini API key.

---

## Part A — Backend → Render

1. **Render → New → Web Service** → connect your GitHub repo.
2. Configure:
   | Setting | Value |
   |---|---|
   | **Root Directory** | `fullstack/backend` |
   | **Runtime** | Python 3 |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
   | **Health Check Path** | `/health` |
   | **Instance Type** | Free (or Starter $7/mo to avoid cold starts during judging) |
3. **Environment** → add:
   - `PYTHON_VERSION` = `3.12.7`   *(critical — numpy 1.26.4 fails to build on 3.13; a `.python-version` file is also committed as backup)*
   - `GEMINI_API_KEY` = `AIza…your key…`
   - *(optional)* `COPILOT_MODEL` = `gemini-2.5-flash`
4. **Create Web Service.** First build + model load takes ~3–5 min.
5. Copy the URL, e.g. `https://parkpulse-api.onrender.com`. Verify in a browser:
   - `…/health` → `{"status":"ok","ready":true}`
   - `…/meta` → returns stats (confirms `data/clean.pkl` loaded).

> The committed `data/clean.pkl` (31 MB) ships with the repo, so the backend runs with **no extra data setup**.
> The raw CSV is git-ignored and **not** needed in production.

---

## Part B — Frontend → Vercel

1. **Vercel → Add New → Project** → import the same GitHub repo.
2. Configure:
   | Setting | Value |
   |---|---|
   | **Root Directory** | `fullstack/frontend` |
   | **Framework Preset** | Next.js (auto-detected) |
   | Build / Install / Output | leave defaults |
3. **Environment Variables** → add **before** deploying:
   - `NEXT_PUBLIC_API_URL` = your Render URL, **no trailing slash** (e.g. `https://parkpulse-api.onrender.com`)
   - ⚠️ `NEXT_PUBLIC_*` is **baked in at build time** — if you set/change it later, you must **redeploy**.
4. **Deploy.** ~2 min. Open the Vercel URL — the app loads and pulls live data from Render.

---

## Part C — Verify & keep warm

- The backend already sends `Access-Control-Allow-Origin: *`, so the Vercel domain works out of the box.
- **Keep the free backend warm:** add a free **UptimeRobot / BetterStack** monitor pinging `…/health` every 5–10 min.
  Render Free spins down after 15 min idle; the first request after sleep takes ~20–30 s while models reload.
  *(For the judging demo, either upgrade to Starter, or just open `/health` a minute before you present.)*
- **Gemini key lives only on Render** (the backend). Never put it in Vercel / the frontend.

## Common gotchas
| Symptom | Fix |
|---|---|
| Render build fails compiling numpy | `PYTHON_VERSION=3.12.7` not set → set it (or the `.python-version` file) |
| Frontend loads but data/maps are empty | `NEXT_PUBLIC_API_URL` wrong / has trailing slash / set after build → fix + redeploy |
| Co-pilot says "isn't configured" | `GEMINI_API_KEY` missing on Render |
| First load very slow | Free-tier cold start — keep-warm ping, or upgrade |
