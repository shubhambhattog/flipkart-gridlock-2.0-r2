# 🚦 ParkPulse — Parking Enforcement Intelligence for Bengaluru

**Flipkart Gridlock Hackathon 2.0 · Round 2 (Prototype Phase) · Theme 1 — Poor Visibility on Parking-Induced Congestion**
Built for the **Bengaluru Traffic Police (BTP)** · judged by BTP + Flipkart · **Team TeamX** — Shubham, Satyam, Palash.

> 🔴 **Live web app** (Next.js · Vercel): **[Vercel URL]**  ·  ⚙️ **API** (FastAPI · Render): **[Render URL]/health**
> 💻 **Repo:** https://github.com/shubhambhattog/flipkart-gridlock-2.0-r2  ·  🎥 **Demo video:** **[video link]**
> ⚡ **Instant, no-setup demo** (Streamlit prototype, same engine): https://flipkart-gridlock-20-r2-rinxb9yibzp8knp6quhfew.streamlit.app

ParkPulse turns **298,445 real BTP parking-violation records** (151 days of data) into a decision-support tool that tells
the Bengaluru Traffic Police **where** illegal parking chokes traffic, **how much** each hotspot matters, **when**
violations recur, and **how** to deploy limited patrol teams for maximum impact — with every recommendation
**explainable both ways**, and a **Gemini co-pilot** (English / Hindi / Kannada) that calls the *real* models to answer
questions and hand back ready-to-deploy patrol plans.

It is not a static dashboard — it is a closed loop: **detect → score → forecast → deploy → target**, ending in a plan a
supervisor can brief at tomorrow's roll-call.

> 📖 The full write-up of the idea, logic and algorithms is in **[SOLUTION.md](SOLUTION.md)**.
> 🎤 For a from-scratch walkthrough + judge-Q&A prep, see **[WALKTHROUGH.md](WALKTHROUGH.md)**.

---

## 🏆 The proof

- **Honest backtest — Pearson r = 0.70 (MAE 2.01).** A strict time-split (train on the first 80% of the
  calendar, predict the held-out tail). A LightGBM Poisson model scored *lower* (r = 0.69), so we kept the
  interpretable empirical-Bayes forecaster.
- **Validated impact — ~38% of catchable violations.** A counterfactual replay on **31 held-out days the
  model never saw**: a 10-team ParkPulse plan would have been positioned for **~38% of the violations
  actually logged**, versus **~1.3%** for teams spread evenly. Honest framing: that is the share of
  *catchable / logged* violations (enforcement efficiency); against a plain static heatmap, day-level capture
  is ~tied — ParkPulse adds the shift-by-shift **timing**, a **ready-to-deploy plan**, and the **co-pilot**.

**Honesty note:** the timestamps record *when enforcement happened* (patrols are morning-heavy — ~93% logged
before 1 PM, <0.3% in the 5–9 PM peak), not ground-truth parking demand. We treat this explicitly: we optimise
**enforcement efficiency** on the observed signal and flag the **evening coverage blind spot**, never claiming
to predict true demand.

---

## What it does

| Page | Capability |
|---|---|
| **Command Center** | City-wide 3-D hotspot map, headline KPIs, the enforcement **blind-spot** insight, **unusual-day (event) detection**, and a data-freshness + **integrity** card |
| **Hotspot Explorer** | Slice 298K records live by weekday / hour / violation type / police station; hotspots re-rank instantly |
| **Forecast & Patrol** | Predicts enforcement load per *zone × weekday × hour* and auto-generates a spatially-spread plan for *N* teams — **tap a team for "why here?"**, an **"Also considered"** panel shows *why a strong zone isn't picked*, and share by **WhatsApp / print / CSV** |
| **Full-day Planner** | Plans morning / afternoon / evening at once, **derives** the evening blind spot from coverage data, and **nudges reallocating** low-value morning teams into it |
| **Coverage & ROI** | The validated **38%** impact card + the data-driven staffing sweet-spot + the evening enforcement blind spot |
| **Repeat Offenders** | Surfaces the chronic **15% of vehicles responsible for ~34% of violations**; exports owner-notice / escalated-penalty / tow-priority CSV lists |
| **Ask ParkPulse** 🤖 | Natural-language **+ voice** co-pilot (English / Hindi / Kannada) — **Gemini** function-calling over the *real* models, with conversation memory; plus a floating assistant on every page |

**Also:** the UI is **fully responsive** (desktop + mobile), and a **data flywheel** — a live `POST /ingest` cleans new
challans and rebuilds the models in seconds — is wired in as **in-memory only**: the fixed competition dataset is
**never modified**, so the architecture for a nightly BTP feed is demonstrated without touching the official records.

**Congestion Impact Score (0–100):** `violations × avg_severity × flow_multiplier`, log-scaled — transparent
and monotone by design, so every ranking is explainable.

**Forecast:** an empirical-Bayes shrinkage estimator (`alpha = 12`) of load per *zone × weekday × hour*;
sparse weekday cells borrow strength from the zone's overall hour profile.

**Scale of the problem (from the data):** 802 neighbourhood zones, ~5.7K hotspot cells, 168 named junctions —
the top **1%** of ~100 m cells hold **33%** of all violations.

---

## 🧱 Architecture — one engine, two front-ends

```
                         ┌────────────────────────────────────────────────┐
  data/clean.pkl  ─────► │  app/core.py  — ONE BRAIN (pure pandas/numpy)   │
  (298,445 records)      │  Impact Score · EB-shrinkage forecaster ·       │
                         │  spaced patrol optimiser · honest backtest ·    │
                         │  counterfactual deployment_simulation()         │
                         └───────────────┬─────────────────┬──────────────┘
                                         │                 │
                  ┌──────────────────────▼───┐   ┌─────────▼───────────────────────────┐
                  │  FastAPI backend (Render) │   │  Streamlit app (app/app.py) —       │
                  │  + Gemini co-pilot,       │   │  standalone prototype, same engine  │
                  │  server-side              │   └─────────────────────────────────────┘
                  └──────────┬───────────────┘
                             │ JSON
                  ┌──────────▼────────────────────────────────────┐
                  │  Next.js 16 / React 19 / deck.gl (Vercel) — UI │
                  └────────────────────────────────────────────────┘
```

The **full-stack product** (Next.js frontend on Vercel + FastAPI backend on Render) is the main app; a **Streamlit**
build of the *same* `app/core.py` is also included as a zero-setup prototype. No GPU, no training pipeline, no black box.

---

## 🗺️ Repo map

```
round2/
├─ README.md                  # ← you are here (front door)
├─ SOLUTION.md                # idea, logic & algorithms behind every module
├─ WALKTHROUGH.md             # from-scratch build walkthrough + judge Q&A
├─ DEPLOY.md                  # deployment guide (Render backend + Vercel frontend; Streamlit Cloud)
├─ problem_statement.md       # the Theme-1 brief
├─ requirements.txt           # Streamlit-app dependencies
│
├─ app/                       # the shared intelligence brain (+ the Streamlit app)
│  ├─ core.py                 #   THE BRAIN — zones, Impact Score, forecaster, patrol optimiser, repeat
│  │                          #   offenders, anomaly/trend detection, deployment_simulation() (shared by ALL apps)
│  ├─ copilot.py              #   Gemini function-calling co-pilot over core.py tools (memory + multilingual)
│  ├─ app.py / ui.py          #   Streamlit Command Center + cached loaders / colour ramps / pydeck builders
│  ├─ prep.py                 #   raw CSV → data/clean.pkl + junctions.pkl
│  └─ pages/                  #   Streamlit: Explorer · Forecast · Offenders · Coverage · Ask
│
├─ data/                      # clean.pkl (31 MB, committed) + junctions.pkl — runs without the raw CSV
│
├─ fullstack/                 # the main product (imports the SAME app/core.py)
│  ├─ backend/                #   FastAPI: /health /meta /impact /forecast /patrol /ingest /refresh
│  │                          #            /anomalies /outcome /copilot /assistant
│  └─ frontend/               #   Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + deck.gl
│                             #   7 pages + floating assistant · fully responsive (desktop + mobile)
│
└─ pitch/                     # PITCH_DECK.md · SUBMISSION_DECK.md · GAMMA_DECK.md · DECK_FOR_AI.txt
                              # VIDEO_SCRIPT.md · SUBMISSION_FORM.md · build_*.py · diagrams/ · screenshots/ · *.pptx
```

`python app/core.py` runs a standalone smoke test of the intelligence layer (zones, backtest, sample plan).

---

## ▶️ Run it

Both surfaces import the **same** `app/core.py` — one source of truth. `data/clean.pkl` is committed, so everything runs
out of the box with **no raw CSV or rebuild**. Prerequisites: **Python 3.12.x** and **Node 18+**.

### Full-stack (the main product)

```bash
# 1) backend — FastAPI on :8000  (from the project root)
pip install -r fullstack/backend/requirements.txt
python fullstack/backend/main.py            # verify http://localhost:8000/health → {"status":"ok","ready":true}

# 2) frontend — Next.js on :3000  (second terminal)
cd fullstack/frontend
#   create .env.local  with:  NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev                                 # open http://localhost:3000
```

### Streamlit (the zero-setup prototype)

```bash
pip install -r requirements.txt
streamlit run app/app.py                    # open http://localhost:8501
```

> 🔑 **Co-pilot config:** the AI co-pilot needs a **`GEMINI_API_KEY`** server-side. Without it, every data / forecast /
> patrol feature still works; only the co-pilot is disabled. The backend reads it from the environment or
> `fullstack/backend/.env`; Streamlit reads `.streamlit/secrets.toml`; on the cloud, set it via the platform's secrets.
> **Never expose it client-side.**

---

## 📚 More docs

- **[SOLUTION.md](SOLUTION.md)** — the idea, logic and algorithms behind every module.
- **[WALKTHROUGH.md](WALKTHROUGH.md)** — from-scratch walkthrough + judge-Q&A prep.
- **[DEPLOY.md](DEPLOY.md)** — deploying to Render (backend) + Vercel (frontend), and Streamlit Cloud.
- **[fullstack/DEPLOY.md](fullstack/DEPLOY.md)** — full-stack deploy guide · **[fullstack/PAGES.md](fullstack/PAGES.md)** — page-by-page.
- **[pitch/](pitch/)** — pitch decks (PITCH / SUBMISSION / Gamma), `DECK_FOR_AI.txt`, video script, submission-form copy, diagrams & screenshots.

---

*Built for the Bengaluru Traffic Police · uses only the provided Theme-1 BTP parking-violation dataset — the fixed
298,445 records are never modified. **Team TeamX** — Shubham, Satyam, Palash.*
