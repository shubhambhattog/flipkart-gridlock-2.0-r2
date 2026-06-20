# ParkPulse — Gamma-ready deck text (submission / review version)

**HOW TO USE (don't paste this part):**
1. Go to **gamma.app** → **Create new** → **Paste in text**.
2. Copy **everything below the `=== PASTE BELOW ===` line** and paste it in.
3. Choose **"Cards" / one card per `---`**, set tone to *Professional*, theme *dark*.
4. Generate. Then drop in the app screenshots (Command Center map, Patrol plan + "Also considered" panel, Full-day planner, Repeat-offender chart).
5. Team name (TeamX) and the live demo link are already filled in.

> This version is built to be **read by judges / an AI screener** (self-contained), not narrated. Each card is tagged
> with the judging criterion it earns.

=== PASTE BELOW ===

# ParkPulse
### From 298,000 parking tickets to where to stand tomorrow.
Enforcement intelligence for the Bengaluru Traffic Police — built on their own challan data.
Theme 1 — Poor Visibility on Parking-Induced Congestion · Gridlock Hackathon 2.0 · TeamX

---

# The problem — enforcement is flying blind  ·  Relevance
- Illegal parking near markets, metros & commercial hubs blocks live lanes and junctions — the city's most visible congestion source.
- Enforcement is **reactive and patrol-based**: a few teams, a whole division, sent on instinct.
- **No city-wide heatmap · no prioritization · no way to schedule** scarce teams by where/when parking actually hurts.

---

# We didn't invent data — we sharpened theirs  ·  Feasibility
- **298,445** real BTP violation records · **151 days** · **802** zones · **zero** missing fields.
- Wildly concentrated: the **top 1%** of locations hold **33%** of all violations.
- **15%** of vehicles cause **34%** of violations — a chronic-offender tail.
- That concentration is the opportunity: a few well-placed teams cover a disproportionate share.

---

# We read the data honestly — enforcement, not demand  ·  Trust
- It shows where officers **caught** parking, not a god's-eye view of where parking is worst.
- Morning-heavy: **~93%** of tickets are written **before 1 PM**; **<0.3%** in the **5–9 PM** evening peak.
- So we make two honest claims, not one inflated one: **optimize the effort you already spend**, and **flag the evening blind spot** — instead of pretending to predict the whole city.

---

# Not a dashboard — a closed decision loop  ·  Innovation
**Detect → Score → Forecast → Deploy → Target → (outcomes feed back)**
- It ends in an **action a supervisor can brief at tomorrow's roll-call**, not a chart to stare at.
- Every stage is transparent and explainable — no black boxes to take on faith.

---

# Detect & Score — one transparent number per zone  ·  Technical
- City-wide **3-D hotspot map** over geohash hexbins (gh6 ≈ 1.2 km, gh7 ≈ 150 m).
- **Congestion Impact Score (0–100) = violations × avg severity × flow-criticality.**
- Junction-blocking and main-road violations weigh most — 100 cars on a footpath ≠ 100 blocking a junction.
- Fully explainable: anyone can see *why* a zone scores what it does.

---

# Forecast — tested on the future, not the past  ·  Innovation + credibility
- Predicts violations per **zone × weekday × hour** via an empirical-Bayes **shrinkage** model (sparse cells stay stable).
- **Honest held-out backtest: r = 0.70, MAE 2.01** — trained on early weeks, scored on weeks it never saw.
- Benchmarked **LightGBM**: it scored **lower (0.69)** and we couldn't explain it → kept the interpretable model.

---

# Proven impact — not a claim  ·  Real-world impact ⭐
- Replayed a **10-team plan** across **31 held-out days** the model never saw.
- Those teams would have been sitting on **~38%** of the violations actually logged — vs **~1.3%** spread evenly (and well above a static "usual hotspots" plan).
- A **validated efficiency gain on unseen data**, not a projection — most teams have *zero* validation.

---

# Deploy & Target — the deliverable, auditable both ways  ·  Impact + Trust
- One click → a **spaced patrol plan** (teams ≥600 m apart), shared by **WhatsApp / print / CSV** at roll-call.
- **Why a team IS there:** tap it for forecast load · junction/main-road impact · 3-week trend.
- **Why a strong zone ISN'T (new):** an **"Also considered"** panel shows what just missed and why — "add 1 team to include" vs "skipped to avoid stacking within 600 m." Auditable, not a black box.
- **Target chronic offenders (15% → 34%):** ready owner-notice / escalated-penalty / tow-priority CSV lists.

---

# Ask ParkPulse — a real AI agent, not a chatbot  ·  Innovation 🤖
- **Gemini function-calling** runs the *actual* forecaster & optimizer; every number is grounded in a tool result.
- **Multilingual** (English / Hindi / Kannada) + **voice input** + **conversation memory** + saved chat history.
- An officer just **asks or says**: *"Plan 6 teams for Friday evening near KR Market."* No dashboard training needed.

---

# Live, explainable & self-improving  ·  Integrity
- **Event-aware:** auto-flags unusual days (festivals / match days) above the weekday norm.
- **Full-day planner:** morning → afternoon → evening at once (**361 → 36 → 2** forecast catches) — *see* the evening blind spot.
- **Data flywheel:** a live ingest endpoint cleans new challans + rebuilds models in seconds; officers log real outcomes.
- **Integrity:** we **never modify the fixed competition dataset** — ingest is live-data *architecture*, outcome logs in-memory only.

---

# Architecture & tech — two front-ends, one brain  ·  Technical
- **One engine** (`core.py`, pandas/numpy): EB-shrinkage forecaster · impact score · spaced greedy optimizer · honest backtest · counterfactual simulator.
- **Two apps share it:** a live **Streamlit** demo + a full-stack **FastAPI** (Render) & **Next.js 16 / React 19 / deck.gl** (Vercel) product.
- **Gemini co-pilot** runs server-side over the real models — **no GPU, no training pipeline, no black box.**

---

# Deployable today  ·  Feasibility
- Runs on a **laptop** · only the **existing challan data** · **no new sensors, no procurement**.
- The **geohash engine generalizes** to any city or violation type — not parking-specific.
- **Rollout:** ① Retrospective (works today) → ② Nightly challan feed + evening pilot deployments → ③ Live ASTraM / camera feed.

---

# Why ParkPulse wins
- **Feasible** — working software today, on data BTP already has.
- **Relevant** — their data, their problem, read honestly.
- **Innovative** — a decision loop + an agentic voice co-pilot + transparency both ways.
- **Real impact** — a plan you brief tomorrow, a **38% validated** efficiency gain, offender targeting.

---

# ParkPulse
### Turning "what already happened" into "where to stand tomorrow."
Live demo: https://flipkart-gridlock-20-r2-rinxb9yibzp8knp6quhfew.streamlit.app
TeamX · Thank you
