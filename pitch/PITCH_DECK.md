# 🎤 ParkPulse — Pitch Deck (finale-ready)

**Theme 1 — Poor Visibility on Parking-Induced Congestion · Gridlock Hackathon 2.0 · for the Bengaluru Traffic Police**

This is the master slide-by-slide. Each slide has: **on-slide content** (what the audience reads — keep it sparse),
**SAY** (speaker notes — what you say out loud), and **VISUAL** (what's on screen). A ready-to-paste block for
Gamma/PowerPoint is in `GAMMA_DECK.md`; an actual generated `.pptx` is at `pitch/ParkPulse_Deck.pptx`.

- **Live demo:** https://flipkart-gridlock-20-r2-rinxb9yibzp8knp6quhfew.streamlit.app
- **Length:** ~5 min spoken (13 slides). For a 3-min cut, present slides 1, 3, 5, 8, 9, 10, 13.
- **Numbers that must be exact:** 298,445 records · r = 0.70 (MAE 2.01) · **38% vs 1.3%** on 31 held-out days ·
  top 1% of cells = 33% · 15% of vehicles = 34% · 93% before 1 PM / <0.3% in the 5–9 PM peak.

---

## Slide 1 — Title / Hook
**On slide:**
- **ParkPulse**
- *From 298,000 parking tickets to where to stand tomorrow.*
- Theme 1 · Gridlock Hackathon 2.0 · [Team Name]

**SAY:** "Illegal parking is one of Bengaluru's most visible, most complained-about congestion sources — and today
the Traffic Police fight it almost blind. We turned 298,000 of their *own* parking tickets into a system that tells
them exactly where to stand tomorrow. This is ParkPulse."

**VISUAL:** The Command Center 3-D hotspot map (let it rotate/tilt). Title overlaid.

---

## Slide 2 — The problem *(Relevance)*
**On slide:**
- Illegal parking near markets, metros & commercial hubs blocks live lanes and junctions.
- Enforcement is **reactive & patrol-based** — officers go on instinct.
- **No heatmap · no prioritization · no way to schedule scarce teams.**

**SAY:** "A duty officer has a handful of teams and a whole division. Where do they send them? Right now that's
experience and gut feel. There's no city-wide picture of *which* parking actually hurts traffic, or *when*."

**VISUAL:** A photo of a choked Bengaluru junction beside a blank map (the "blindness").

---

## Slide 3 — The data *(Feasibility + credibility)*
**On slide:**
- **298,445** real BTP violation records · 150 days · **0 missing fields**.
- Top **1%** of locations hold **33%** of all violations.
- **15%** of vehicles cause **34%** of them.

**SAY:** "We didn't invent data — this is the Traffic Police's own challan record, cleaned. And it's rich: violations
are wildly concentrated, and a small set of repeat vehicles drive a third of everything. That concentration is the
opportunity."

**VISUAL:** Three big stat tiles; a Pareto curve (1% → 33%).

---

## Slide 4 — The honest insight *(this is what earns the judges' trust)*
**On slide:**
- This is **enforcement data, not demand** — it shows where officers *caught* parking.
- **~93%** of tickets are written **before 1 PM**; **<0.3%** in the **5–9 PM** evening peak.
- So we optimize **enforcement efficiency** and **flag the evening blind spot** — we never over-claim.

**SAY:** "Here's the part most teams will skip. This data is morning-heavy — it's when officers are out writing
tickets, not when parking is worst. We say that out loud, because *you* made this data and you know its limits. We
make your existing effort sharper, and we point at the gap you're missing — instead of pretending we predict the
whole city."

**VISUAL:** The coverage-by-hour bar chart with the evening hours highlighted in red.

---

## Slide 5 — The solution: a closed decision loop *(Innovation)*
**On slide:**
- **Detect → Score → Forecast → Deploy → Target.**
- Not a dashboard. A loop that ends in an **action a supervisor can brief tomorrow.**

**SAY:** "ParkPulse isn't another dashboard you stare at. It's a loop: we detect the hotspots, score them by real
traffic impact, forecast when they recur, generate a patrol plan, and target repeat offenders — and the outcomes
feed back in."

**VISUAL:** The five-stage loop diagram (circular, arrow returning to Detect).

---

## Slide 6 — Detect & Score
**On slide:**
- City-wide **3-D hotspot map** (geohash hexbins).
- **Congestion Impact Score 0–100** = violations × severity × flow-criticality.
- One transparent number ranks every zone — junction-blocking & main-road violations weigh most.

**SAY:** "Not all violations hurt equally — 100 cars on a footpath isn't 100 cars blocking a main-road junction. So we
combine *how many*, *how bad*, and *how flow-critical* into one explainable 0–100 score per zone."

**VISUAL:** Command Center map + the "Top impact zones" list. Add the **legend** (blue→red = low→high, taller = more).

---

## Slide 7 — Forecast — validated honestly *(Innovation + credibility)*
**On slide:**
- Predicts violations per **zone × weekday × hour**.
- **Honest held-out backtest: r = 0.70, MAE 2.01** — trained on the past, tested on the *unseen future*.
- Benchmarked a LightGBM model — it scored **lower (0.69)** → we kept the **interpretable** one.

**SAY:** "We forecast load for every zone, weekday and hour. And we validate it the hard way — trained on early
weeks, tested on weeks the model never saw: correlation 0.70. Real signal, not an overfit 0.99. We even tried a
gradient-boosting model; it did *worse*, so we kept the one we can explain to a judge in one line."

**VISUAL:** Forecast & Patrol page; the "Forecast accuracy r = 0.70" KPI.

---

## Slide 8 — Proven impact, not a claim ⭐ *(Real-world impact — the mic-drop)*
**On slide:**
- We replayed a **10-team plan on 31 days the model never saw.**
- It would have been positioned for **~38%** of the violations *actually* logged — vs **~1.3%** spread evenly.
- A **validated** efficiency gain, not a projection.

**SAY:** *(slow down, let it land)* "So — does it actually work? We ran a counterfactual. We took 31 held-out days,
and for each one asked: where would ParkPulse have sent ten teams? Those ten teams would have been sitting on
**thirty-eight percent** of the violations that actually happened that day. Spread evenly, you'd cover one-point-three.
That's not a promise. That's tested on data it had never seen."

**VISUAL:** The Coverage & ROI "Proven impact" card — the 38% vs 1.3% bars.

---

## Slide 9 — Deploy & Target *(Real-world impact)*
**On slide:**
- One click → a **spaced patrol plan** a supervisor shares by **WhatsApp / print / CSV** at roll-call.
- **Explainable:** tap any team for *why it's placed there* (forecast load · junction/main-road impact · recent trend).
- **Repeat-offender target lists** (15% → 34%): owner-notice / escalated-penalty / tow-priority CSV.

**SAY:** "This is the deliverable an officer actually uses. Pick the shift and the number of teams — ParkPulse places
each team on the highest-impact, well-spaced corners. Tap a team and it tells you *why* it's there. Then share the
whole plan straight to a WhatsApp patrol group, print it, or export a CSV — and target the chronic repeat offenders
with a ready list for notices and tow priority."

**VISUAL:** Generate a plan live → tap a team to show the "why here?" → click the WhatsApp/Print buttons. Then the
offender CSV buttons.

---

## Slide 10 — Ask ParkPulse: the AI co-pilot *(Innovation)*
**On slide:**
- A true **AI agent** — Google **Gemini function-calling over the real models** (not a scripted chatbot).
- **Multilingual** (English / Hindi / Kannada) + **voice input** + **conversation memory**.
- An officer just **asks** — or **says** — *"Plan 6 teams for Friday evening near KR Market."*

**SAY:** "And you don't need to learn the dashboard. Any officer can just ask — by text or by voice, in English,
Hindi or Kannada — and the co-pilot runs the *actual* forecaster and optimizer and answers with a real plan and map.
It remembers the conversation. This is an agent over our models, not a chatbot."

**VISUAL:** The Ask page — type or speak a query → plan + map render. Show the conversation history rail.

---

## Slide 11 — Live, explainable & self-improving *(by design)*
**On slide:**
- **Event-aware:** auto-flags unusual days (festivals / match days) running above the weekday norm.
- **Full-day view:** plans morning/afternoon/evening at once — exposes the evening blind spot visually.
- **Self-improving by design:** a live `POST /ingest` cleans new challans and rebuilds the models in seconds — the
  architecture for a nightly BTP feed. The evening blind spot is self-healing: deploy there → new data → better plan.
- **Integrity:** we never modify the competition dataset — the ingest pipeline is shown as architecture, not run on it.

**SAY:** "Three things make this more than a demo. One — it flags unusual days, like festivals, automatically. Two —
the full-day planner shows all three shifts at once, and you can *see* the evening blind spot. Three — it's built to
improve: new challans flow through a live ingest endpoint that rebuilds the models in seconds — the architecture for a
nightly feed. And to be clear, we never touch the fixed competition data; that pipeline is for live BTP data. The
evening gap you saw? Deploy there and it fills itself — it gets smarter the more they use it."

**VISUAL:** The **Full-day Planner** — morning **361** → afternoon **36** → evening **2** forecast catches (the blind
spot, live on the fixed data) — beside the Data-freshness card showing the ingest/refresh architecture + integrity note.

> **Demo rule:** *describe* the ingest endpoint — do **not** click any "add data" control on camera. The dataset
> stays fixed; everything you click in the demo is analysis of the official 298,445 records.

---

## Slide 12 — Feasibility & rollout
**On slide:**
- Runs on a **laptop** · uses **only data BTP already collects** · **no new sensors**.
- Two deployable apps share one brain: a live Streamlit demo + a polished full-stack product.
- **Geohash engine generalizes** to any city or violation type.

**SAY:** "This is deployable now. No new hardware, no procurement — just the data you already have. It's live today
as a web app, and the engine isn't parking-specific: the same approach scales to any city, any violation type."

**VISUAL:** Architecture one-liner: Data → core.py (one brain) → Streamlit + FastAPI/Next.js.

---

## Slide 13 — Why ParkPulse wins / Close
**On slide:**
- **Feasible** — working software today. **Relevant** — your data, your problem, read honestly.
- **Innovative** — a decision loop + an agentic voice co-pilot + a validated counterfactual.
- **Real impact** — a plan you brief tomorrow, a **38%** proven efficiency gain, offender targeting.
- *Turning what already happened into where to stand tomorrow.*

**SAY:** "Feasible, relevant, innovative, and proven to make a real difference. ParkPulse turns 298,000 rows of what
already happened into where to stand tomorrow. Thank you."

**VISUAL:** Title card again + live demo URL + repo. Confident hold on the last frame.

---

## Anticipated judge questions (have these ready)
- **"Isn't this just enforcement data, not real demand?"** → "Exactly — and we say so. We optimize the effort you
  already spend and flag the evening gap. As you deploy there, the data fills in and the model learns true demand.
  That honesty is why our numbers are believable."
- **"How do you know it works?"** → "The 38% counterfactual on 31 days the model never saw. Not a claim — a test."
- **"Why not deep learning / a fancier model?"** → "We tried; LightGBM scored lower (0.69 vs 0.70) and we couldn't
  explain it to you. An interpretable model you trust beats a black box that's marginally worse."
- **"Will it scale / need new sensors?"** → "No new hardware. Geohash engine, runs on a laptop, any city."
- **"What's the very next step for BTP?"** → "A nightly challan feed + a few evening pilot deployments to start the
  flywheel; then fuse the live ASTraM feed."
