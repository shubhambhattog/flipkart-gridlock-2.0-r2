# 🚦 ParkPulse — Parking Enforcement Intelligence for Bengaluru

**Flipkart Gridlock Hackathon 2.0 · Round 2 (Prototype Phase) · Theme 1 — Poor Visibility on Parking-Induced Congestion**
Built for the **Bengaluru Traffic Police (BTP)** · judged by BTP + Flipkart.

> 🔴 **Live demo:** https://flipkart-gridlock-20-r2-rinxb9yibzp8knp6quhfew.streamlit.app
> 💻 **Repo:** https://github.com/shubhambhattog/flipkart-gridlock-2.0-r2

ParkPulse turns **298,445 real BTP parking-violation records** (Nov 2023 – Apr 2024, 150 days) into a
decision-support tool that tells the Bengaluru Traffic Police **where** illegal parking chokes traffic,
**how much** each hotspot matters, **when** violations recur, and **how** to deploy limited patrol teams
for maximum impact.

It is not a static dashboard — it is a closed loop: **detect → score → forecast → deploy → target**, with a
**Gemini co-pilot** (English / Hindi / Kannada) that calls the real models to answer questions and hand back
ready-to-deploy patrol plans.

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

## What it does (6 modules)

| Page | Capability |
|---|---|
| **Command Center** | City-wide 3-D hotspot map, KPIs, and the enforcement-coverage *blind-spot* insight |
| **Hotspot Explorer** | Slice 298K records live by weekday / hour / violation type / police station; hotspots re-rank instantly |
| **Forecast & Patrol** | Predicts enforcement load per *zone × weekday × hour* and auto-generates a spatially-spread deployment plan for *N* teams (+ CSV export) |
| **Coverage & ROI** | The validated-impact card + Pareto / data-driven staffing sweet-spot + the evening enforcement blind spot |
| **Repeat Offenders** | Surfaces the chronic **15% of vehicles responsible for ~34% of violations** |
| **Ask ParkPulse** 🤖 | Natural-language co-pilot (English / Hindi / Kannada) — **Gemini** function-calling over the *real* models; plus a floating assistant on every page |

**Congestion Impact Score (0–100):** `violations × avg_severity × flow_multiplier`, log-scaled — transparent
and monotone by design, so every ranking is explainable.

**Forecast:** an empirical-Bayes shrinkage estimator (`alpha = 12`) of load per *zone × weekday × hour*;
sparse weekday cells borrow strength from the zone's overall hour profile.

**Scale of the problem (from the data):** 802 neighbourhood zones, 5,753 hotspot cells, 168 named junctions —
the top **1%** of ~100 m cells hold **33%** of all violations.

---

## 🗺️ Repo map

```
round2/
├─ README.md                  # ← you are here (front door)
├─ SOLUTION.md                # idea, logic & algorithms behind every module
├─ WALKTHROUGH.md             # from-scratch build walkthrough + judge Q&A
├─ DEPLOY.md                  # deployment guide (Streamlit Cloud, Render, Vercel)
├─ problem_statement.md       # the Theme-1 brief
├─ requirements.txt           # Streamlit-app dependencies
│
├─ app/                       # Streamlit app + the shared intelligence brain
│  ├─ app.py                  #   Command Center (entry point)
│  ├─ core.py                 #   THE BRAIN — zones, Impact Score, forecaster, patrol optimiser,
│  │                          #   repeat-offender analysis, deployment_simulation() (shared by BOTH apps)
│  ├─ copilot.py              #   Gemini function-calling co-pilot over core.py tools
│  ├─ ui.py                   #   cached loaders, colour ramps, pydeck/plotly builders
│  ├─ prep.py                 #   raw CSV → data/clean.pkl + junctions.pkl
│  ├─ export_json.py          #   exports model outputs to JSON
│  └─ pages/                  #   Hotspot Explorer · Forecast & Patrol · Repeat Offenders · Coverage & ROI · Ask ParkPulse
│
├─ data/                      # clean.pkl (31 MB, committed) + junctions.pkl — both apps run without the raw CSV
│
├─ fullstack/                 # the finale-grade polished version (imports the SAME app/core.py)
│  ├─ backend/                #   FastAPI (wraps core.py + copilot.py) — main.py, /impact, /health
│  ├─ frontend/               #   Next.js 16 + shadcn/ui + Tailwind v4 + deck.gl (6 pages + floating assistant)
│  └─ README.md               #   full-stack setup & architecture
│
├─ pitch/                     # PITCH_DECK.md · GAMMA_DECK.md · VIDEO_SCRIPT.md
└─ .streamlit/                # dark theme + secrets template
```

`python app/core.py` runs a standalone smoke test of the intelligence layer (zones, backtest, sample plan).

---

## ▶️ Run it

Both apps import the **same** `app/core.py` — one source of truth, two surfaces.

### Streamlit (the fast, complete demo — the Round-2 submission)

```bash
pip install -r requirements.txt
streamlit run app/app.py
```

Then open **http://localhost:8501**.
`data/clean.pkl` is committed, so it runs out of the box — no raw CSV or rebuild needed.

### Full-stack (the finale-grade polished version)

```bash
# backend (FastAPI)
pip install -r fullstack/backend/requirements.txt
python fullstack/backend/main.py

# frontend (Next.js) — in a second terminal
cd fullstack/frontend
npm install
npm run dev
```

> 🔑 **Co-pilot config:** the AI co-pilot needs a **`GEMINI_API_KEY`** server-side.
> Backend reads it from the environment or `fullstack/backend/.env`; Streamlit reads `.streamlit/secrets.toml`;
> on the cloud, set it via the platform's dashboard secrets. Never expose it client-side.

---

## 📚 More docs

- **[SOLUTION.md](SOLUTION.md)** — the idea, logic and algorithms behind every module.
- **[WALKTHROUGH.md](WALKTHROUGH.md)** — from-scratch walkthrough + judge-Q&A prep.
- **[DEPLOY.md](DEPLOY.md)** — deploying to Streamlit Cloud, Render (backend) and Vercel (frontend).
- **[fullstack/README.md](fullstack/README.md)** — full-stack architecture & setup.
- **[pitch/](pitch/)** — pitch deck, Gamma deck and demo video script.

---

*Built for the Bengaluru Traffic Police · uses only the provided Theme-1 BTP parking-violation dataset.*
