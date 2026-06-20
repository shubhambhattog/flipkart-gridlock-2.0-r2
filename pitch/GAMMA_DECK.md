# ParkPulse — Gamma-ready deck text

**HOW TO USE (don't paste this part):**
1. Go to **gamma.app** → **Create new** → **Paste in text**.
2. Copy **everything below the `=== PASTE BELOW ===` line** and paste it in.
3. Choose **"Cards" / one card per `---`**, set tone to *Professional*, theme *dark*.
4. Generate. Then drop in the app screenshots (Command Center map, Patrol plan, Repeat-offender chart).
5. Replace `[Team Name]` with your team name (the live demo link is already filled in).

=== PASTE BELOW ===

# ParkPulse
### From 298K parking tickets to where to stand tomorrow.
Theme 1 — Poor Visibility on Parking-Induced Congestion
Gridlock Hackathon 2.0 · [Team Name]

---

# The problem
Illegal parking chokes Bengaluru's busiest roads.
- Markets, metro stations, commercial hubs — vehicles block live lanes and junctions every day.
- One of the city's most visible and most complained-about congestion sources.

---

# Why it's hard today
- Enforcement is **reactive** and patrol-based — officers go on instinct.
- **No heatmap** of where violations actually hurt traffic.
- **No way to prioritize** zones or schedule limited teams.

---

# Meet ParkPulse
**A closed decision loop — not a dashboard.**
**Detect → Score → Forecast → Deploy → Target**
- Detect the hotspots, score them by real traffic impact, forecast when they recur, generate a patrol plan, and target repeat offenders.

---

# Built on real data — read honestly
- **298,445** real BTP violation records · 150 days · zero missing fields.
- **Honest insight:** this is *enforcement time, not demand* — ~93% logged before 1 PM.
- So we optimize **enforcement efficiency** and flag **evening blind spots** — we don't over-claim.

---

# Detect & Score
- City-wide **3-D hotspot map** — the top **1%** of locations hold **33%** of all violations.
- **Congestion Impact Score (0–100)** = volume × severity × flow-criticality.
- One transparent number to rank every zone — junction-blocking and main-road violations weigh most.

---

# Forecast
- Predict violations per **zone × weekday × hour.**
- Empirical-Bayes shrinkage keeps even sparse cells stable.
- **Honest backtest: r ≈ 0.70** (MAE 2.01) on held-out weeks — real signal, not an overfit 0.99.
- We even tried a LightGBM Poisson model — it scored *lower* (0.69), so we kept the interpretable one.

---

# Proven impact — not a claim
- We replayed a 10-team ParkPulse plan on **31 held-out days the model never saw.**
- It would have been positioned for **~38% of the violations actually logged** — vs **~1.3%** for teams spread evenly.
- That's the share of catchable, logged violations — a **validated** efficiency gain, not a projection.

---

# Deploy — the patrol planner
- Pick a shift window + number of teams → an instant, **spatially-spread deployment plan.**
- Each team gets a zone with its **expected catches**; download as CSV and brief the teams.
- **Every team starts where congestion will build — before it does.**

---

# Coverage & ROI — targeting pays
- A handful of zones hold most of the action — a few well-placed teams capture a large share of violations.
- We surface the **staffing sweet spot**: past it, each extra team adds < 1 percentage point of coverage.
- And the **blind spot**: ~93% of enforcement is before 1 PM, almost none in the 5–9 PM evening peak.

---

# Target repeat offenders
- **15%** of vehicles cause **34%** of all violations.
- Auto-generated target list → owner notices and escalated penalties.
- A short, high-value action list with outsized impact.

---

# Ask ParkPulse — the AI co-pilot 🤖
- Ask **by text or voice**, in **English, Hindi or Kannada**: *"Plan 6 teams for Friday evening around KR Market."*
- **Gemini function-calling** runs our *real* forecaster + optimiser and returns an actual plan + map.
- A true **agent** over the models — with conversation **memory** and saved chat history. Not a chatbot.
- A field officer just **asks**; no dashboard training needed.

---

# It gets better every day
- Every new challan **sharpens** the forecast — a nightly refresh, no heavy retraining.
- Deploy a few evening teams → new data → the **blind spot fills itself** → next plan is better. A compounding loop.
- **Rollout:** ① Retrospective (works today) → ② Nightly refresh → ③ Live ASTraM / camera feed.
- Uses **only data BTP already collects** — no new sensors, runs on a laptop.

---

# Why ParkPulse wins
- **Feasible** — working software, today.
- **Innovative** — outputs a decision, not a chart.
- **Explainable** — every score is justifiable.
- **Scalable** — geohash engine; any city, any violation type.
- **Honest** — credible with the people who own the data.

---

# ParkPulse
### Turning "what already happened" into "where to stand tomorrow."
Live demo: https://flipkart-gridlock-20-r2-rinxb9yibzp8knp6quhfew.streamlit.app
[Team Name] · Thank you
