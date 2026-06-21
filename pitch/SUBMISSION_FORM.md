# 📝 ParkPulse: Final Submission Form (copy-paste ready)

Fill the `[bracketed]` links with your deployed URLs / repo / video before submitting.

---

## Title
> *Field: "Give your submission a clear, descriptive title."*

**ParkPulse: Predictive, Explainable Parking-Enforcement Intelligence for the Bengaluru Traffic Police**

*(Alt, punchier if a shorter title is preferred: “ParkPulse: From 298,000 Parking Tickets to Where to Stand Tomorrow”)*

---

## Description
> *Field: "Describe your project, solution, or idea." (formatting + links allowed)*

**ParkPulse turns 298,445 of the Bengaluru Traffic Police's own parking-violation records into targeted, explainable enforcement: it tells officers _where_ parking actually blocks traffic, _when_ it recurs, and _where to send scarce teams tomorrow._**

### The problem (Theme 1)
Illegal parking near markets, metros and junctions is one of Bengaluru's most visible congestion sources, but enforcement is **reactive and blind**. A duty officer has a few teams and a whole division, and deploys them on instinct: no heatmap, no prioritization, no schedule.

### What ParkPulse does: a closed decision loop
**Detect → Score → Forecast → Deploy → Target**, with outcomes feeding back:
- **Detect & Score** every zone with a transparent **Congestion Impact Score (0–100)** = violations × avg severity × flow-criticality (junction / main-road weight).
- **Forecast** violations per zone × weekday × hour with an empirical-Bayes shrinkage model, validated the hard way: trained on the past, tested on weeks it never saw (**held-out r = 0.70, MAE 2.01**, beating a LightGBM baseline we kept the *interpretable* model over).
- **Deploy** a spatially-spread patrol plan (teams ≥ 600 m apart), shared by **WhatsApp / print / CSV** at roll-call.
- **Target** the chronic offenders (**15% of vehicles = 34% of violations**) with ready owner-notice / tow-priority CSV lists.

### Why judges can trust the numbers (we read the data honestly)
This is **enforcement** data, not demand: **93%** of tickets are written before 1 PM. So we don't fake a city-wide demand model; we sharpen the effort already spent and **flag the evening blind spot** (< 0.3% of enforcement in the 5–9 PM peak) instead of over-claiming.

### Proven, not claimed
We replayed a 10-team plan across **31 days the model had never seen**: it would have been positioned for **~38% of the violations that actually happened**, versus **~1.3%** for an even spread (and well above a static "usual hotspots" plan). A **validated efficiency gain on unseen data**, not a projection.

### Features that matter (and why)
- **Auditable both ways:** tap a team for *why it's placed* (forecast load, junction/main-road impact, recent trend); an **"Also considered"** panel shows *why a strong zone isn't* (just-below-the-cut vs the 600 m spacing). No black box, which builds officer trust.
- **Full-day planner:** **derives** the evening blind spot from coverage data (not hardcoded) and nudges reallocating low-value morning teams into it, turning the blind spot into an action.
- **AI co-pilot:** ask or **speak** in **English / Hindi / Kannada** ("Plan 6 teams for Friday evening near KR Market"); a **Gemini function-calling agent** that runs the real models, not a scripted chatbot. No dashboard training needed.
- **Data flywheel:** a live ingest cleans new challans and rebuilds the models in seconds (**in-memory only; the fixed dataset is never modified**), so it gets better the more BTP uses it.

### Feasibility & tech
Runs on a **laptop**, on data BTP **already collects**, with **no new sensors or procurement**. One engine (`core.py`, pure pandas/numpy) powers a **Next.js 16 / React 19 / deck.gl** frontend on **Vercel** plus a **FastAPI** backend on **Render**, with a server-side **Google Gemini** co-pilot. No GPU, no training pipeline, no black box; the whole model rebuilds in seconds.

### Why it stands up to the brief
- **Feasible:** working software today, their data, no hardware.
- **Relevant:** their exact Theme-1 problem, read honestly.
- **Innovative:** a closed decision loop, transparency both ways, an agentic voice co-pilot, and a validated counterfactual.
- **Real-world impact:** a plan an officer briefs tomorrow, a **38% validated** efficiency gain, and offender targeting.

### Links
- 🔴 **Live app** (Next.js · Vercel): **[Vercel URL]**
- ⚙️ **API** (FastAPI · Render): **[Render URL]/health**
- 💻 **Source code**: **[GitHub repo URL]**
- 🎥 **Demo video**: **[video link]**

**Team TeamX:** Shubham, Satyam, Palash.

---

## Instructions to Run
> *Field: "Add steps to run your project so reviewers can test it."*

**ParkPulse runs locally in two parts: a FastAPI backend and a Next.js frontend.** The cleaned dataset
(`data/clean.pkl`) ships inside the source, so there is **no data-prep step**.

**Prerequisites:** Python **3.12.x** and Node **18+** (npm).

### 1) Backend (FastAPI · serves on :8000)
```bash
# from the project root
pip install -r fullstack/backend/requirements.txt

# (optional) enable the AI co-pilot. Without this, every data/forecast/patrol feature
# still works; only the "Ask ParkPulse" co-pilot is disabled.
#   create fullstack/backend/.env  with:   GEMINI_API_KEY=your_google_gemini_key

python fullstack/backend/main.py
```
First start loads the models (~5–15 s). Verify: open **http://localhost:8000/health** → `{"status":"ok","ready":true}`.

### 2) Frontend (Next.js · serves on :3000)
```bash
cd fullstack/frontend

# point the UI at the backend
#   create .env.local  with:   NEXT_PUBLIC_API_URL=http://localhost:8000

npm install
npm run dev
```
Open **http://localhost:3000**; the app loads and pulls live data from the backend.

### What to try (reviewer walkthrough)
- **/** Command Center: the 3-D hotspot map plus the enforcement blind-spot insight.
- **/forecast**: pick a weekday, shift and team count to get a patrol plan; **tap a team** for "why here?" and see the **"Also considered"** panel.
- **/coverage**: the **38% vs 1.3%** "Proven impact" card (validated on held-out data).
- **/day**: the full-day planner, with the derived evening blind spot and the reallocation nudge.
- **/ask**: the AI co-pilot (type or use voice; English / Hindi / Kannada).

### Optional: the Streamlit prototype
A standalone Streamlit version of the same engine is also included:
```bash
pip install -r requirements.txt
streamlit run app/app.py
```

### Deploy (optional)
Full cloud deploy (FastAPI → Render, Next.js → Vercel) is documented in **`fullstack/DEPLOY.md`**.

---

## Source Code (the upload)
Upload **`ParkPulse_source.zip`** (generated in `pitch/`). It contains the full source: the shared engine
(`app/`), the FastAPI backend, the Next.js frontend, the cleaned dataset (`data/clean.pkl`), and the docs.
It **excludes** `node_modules`, build caches, and raw datasets, so it stays well under 50 MB. Reviewers just run
`npm install` / `pip install` per the steps above.
