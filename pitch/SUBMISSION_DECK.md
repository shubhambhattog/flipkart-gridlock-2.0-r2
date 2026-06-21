# 📄 ParkPulse — Submission Deck (official Gridlock template)

**Theme 1 — Poor Visibility on Parking-Induced Congestion · Gridlock Hackathon 2.0 · Bengaluru Traffic Police**

> Built to the **official Gridlock R2 submission structure** (Context → Problem → Analysis ×2 → Solution ×3 → Supporting
> Links), enriched to the ~10-slide hackathon norm by inserting a dedicated **Validation** slide and a **Feasibility &
> Integrity** slide (the two cards that win on judging but the bare 8-section outline omits). This deck is for **reading
> by judges + an AI screener**, so every slide is self-contained: headline = the conclusion, bullets carry the point,
> "On screen" names the proof. Each slide is tagged with the criterion it earns.
>
> **Numbers that must stay exact:** 298,445 records · 151 days · 802 zones · r = 0.70 (MAE 2.01) ·
> **38% vs 1.3%** on 31 held-out days · top 1% of cells = 33% · 15% of vehicles = 34% · 93% before 1 PM / <0.3% in the 5–9 PM peak.

---

## Slide 1 — Context & Scope  *(First impression · Relevance)*
**ParkPulse — turning 298,000 parking tickets into where to stand tomorrow.**
- **Scope:** illegal **on-street parking** near markets, metro stations and commercial hubs in Bengaluru — vehicles
  parked in live lanes and at junctions, the city's most visible, most-complained congestion source.
- **Overarching goal:** give the Bengaluru Traffic Police a **data-driven enforcement system** — built entirely on their
  own challan records — that says *which* parking hurts traffic, *when* it recurs, and *where to send scarce teams*.
- **In one line:** detect hotspots → score them by traffic impact → forecast when they recur → hand a supervisor a
  ready-to-brief patrol plan, plus an AI co-pilot they can just ask.

**On screen:** the Command Center 3-D hotspot map (tilted), product name + theme overlaid.

---

## Slide 2 — Problem Description  *(Relevance)*
**Enforcement is reactive and blind — and that's why it's hard.**
- A duty officer has a handful of teams and a whole division, and decides where to send them on **instinct** — there is
  no city-wide picture of where parking actually blocks traffic.
- **Why existing methods fall short:** manual patrols don't scale or prioritize; generic traffic/ANPR cameras are
  capital-heavy, slow to procure, and don't tell you *where to deploy people tomorrow*; static "known hotspot" lists
  ignore *when* violations happen and quickly go stale.
- The data to fix this **already exists** (challan records) but sits unused — there's no heatmap, no ranking, no schedule.

**On screen:** a choked Bengaluru junction beside a blank map (the "blindness").

---

## Slide 3 — Analysis & Research, Part 1: The "Why"  *(Root causes · Relevance)*
**The problem is real, and it's extremely concentrated.**
- Built on **298,445 real BTP violation records · 151 days · 802 geohash zones · zero missing fields** — their own data,
  cleaned, nothing invented.
- **Root cause is spatial concentration:** the **top 1%** of locations hold **33%** of all violations — a handful of
  junctions, markets and metro mouths generate a disproportionate share.
- **And a chronic-offender tail:** **15% of vehicles cause 34%** of violations — repeat parkers in the same spots.
- That concentration is the entire opportunity: a few well-placed teams can cover a large fraction of the problem.

**On screen:** three stat tiles + a Pareto curve (1% of cells → 33% of violations) + the city hotspot map.

---

## Slide 4 — Analysis & Research, Part 2: Impact  *(Impact · Trust)*
**The gridlock hits commuters, businesses and deliveries — and the data has an honest gap we name.**
- Illegal parking in live lanes and at junctions slows **commuters**, blocks **bus stops and main roads**, and chokes
  **last-mile delivery** access around exactly the commercial hubs that depend on it.
- **The honest insight (this earns trust):** this is **enforcement data, not demand** — it shows where officers *caught*
  parking. It's morning-heavy: **~93%** of tickets are written **before 1 PM**, **<0.3%** in the **5–9 PM** evening peak.
- So we make two honest claims, not one inflated one: **(1)** optimize the effort already spent, and **(2)** flag the
  **evening blind spot** — instead of pretending to predict the whole city.

**On screen:** coverage-by-hour bar chart, the 5–9 PM hours highlighted in red.

---

## Slide 5 — Proposed Solution, Part 1: The Concept  *(Innovation)*
**Not a dashboard — a closed decision loop that ends in an action.**
- **Detect → Score → Forecast → Deploy → Target →** (outcomes feed back). It ends in a plan a supervisor briefs at
  tomorrow's roll-call, not a chart to stare at.
- **Core mechanics (a transparent data model, no black box):**
  - **Congestion Impact Score (0–100)** = violations × avg severity × flow-criticality (junction/main-road weight).
  - **Forecaster:** empirical-Bayes shrinkage of violations per **zone × weekday × hour** (sparse cells stay stable).
  - **Patrol optimizer:** greedy maximum-coverage with a **≥600 m spacing** constraint (no stacking teams on one street).
- Every stage is explainable — anyone (officer or judge) can see *why* a number is what it is.

**On screen:** the five-stage loop diagram, arrow returning from Target to Detect.

---

## Slide 6 — Proposed Solution, Part 2: Architecture & Tech Stack  *(Technical)*
**One engine, two services — small, fast, auditable, no GPU.**
- **One engine** (`core.py`, pure pandas/numpy): the impact score, the EB-shrinkage forecaster, the spaced greedy
  optimizer, an honest time-split backtest, and a counterfactual deployment simulator.
- **The product:** a **Next.js 16 / React 19 / deck.gl** frontend on **Vercel**, talking to a **FastAPI** backend on
  **Render** — both calling the one engine.
- **AI co-pilot:** **Google Gemini** *automatic function-calling* runs the real tools server-side; the key never leaves
  the server. No training pipeline, no IoT hardware, no black box — the whole model rebuilds in seconds.

**On screen:** data-flow diagram — Data → core.py (one brain) → FastAPI (Render) → Next.js (Vercel) + Gemini co-pilot.

---

## Slide 7 — Proposed Solution, Part 3: Implementation  *(Demonstration · Innovation)*
**How it's actually executed — and the features that set it apart.**
- **The deliverable:** pick a weekday + shift + team count → a spaced patrol plan, shared by **WhatsApp / print / CSV**
  at roll-call. One click, no training.
- **Auditable both ways (unique):** tap a team for *why it's placed* (forecast load · junction/main-road impact · 3-week
  trend); an **"Also considered"** panel shows *why a strong zone isn't* there ("add 1 team to include" vs "skipped to
  avoid stacking within 600 m"). The recommendation is transparent, not a black box.
- **Full-day planner** plans all three shifts at once, exposes the evening blind spot (**361 → 36 → 2** forecast catches),
  and gives a **reallocation nudge** ("shift N low-value morning teams to the evening to seed the gap").
- **Ask ParkPulse co-pilot:** ask or *speak* in **English / Hindi / Kannada**, with conversation memory —
  *"Plan 6 teams for Friday evening near KR Market."*
- **Target the chronic offenders** (15% → 34%): ready owner-notice / escalated-penalty / tow-priority CSV lists.

**On screen:** screenshot strip — patrol plan → "why here" + "Also considered" → WhatsApp/CSV → co-pilot → full-day blind spot.

---

## Slide 8 — Validation & Proven Impact ⭐  *(Feasibility · Real-world impact)*
**38% of real violations covered — tested on 31 days the model never saw.**
- **Forecast validated the hard way:** trained on early weeks, scored on weeks it never saw → **r = 0.70, MAE 2.01**
  (real signal, not an overfit 0.99). We benchmarked a **LightGBM** model — it scored **lower (0.69)** and wasn't
  explainable, so we kept the interpretable one.
- **Counterfactual proof:** we replayed a **10-team plan across 31 held-out days**. Those teams would have been sitting
  on **~38%** of the violations actually logged — vs **~1.3%** spread evenly (and well above a static "usual hotspots"
  plan). A **validated efficiency gain on unseen data**, not a projection — most teams have *zero* validation.

**On screen:** the Coverage & ROI "Proven impact" card — 38% vs 1.3% bars + the r = 0.70 KPI.

---

## Slide 9 — Feasibility, Rollout & Integrity  *(Real-world impact · Completeness)*
**Deployable today, on data BTP already collects — and we never touched the fixed dataset.**
- **Feasible now:** runs on a **laptop**, uses **only existing challan data**, **no new sensors or procurement**. Live as
  a web app today; full-stack product is deployment-ready (FastAPI on Render + Next.js on Vercel).
- **Self-improving by design:** a live `POST /ingest` cleans new challans and rebuilds models in seconds — the
  architecture for a nightly BTP feed; **outcome logging** lets officers record what a team found, closing the loop.
- **Generalizes:** the geohash engine works for any city or violation type — not parking-specific.
- **Integrity (stated plainly):** we **never modify the fixed competition dataset** — ingest is *in-memory only* and
  shown as architecture for live data; outcome logs are in-memory. The official 298,445 records are untouched.
- **Roadmap:** ① Retrospective (works today) → ② Nightly challan feed + evening pilot deployments → ③ Fuse the live ASTraM / camera feed.

**On screen:** rollout timeline ①→②→③ + the "no new hardware" + integrity callouts.

---

## Slide 10 — ParkPulse, in summary  *(close)*
**Feasible. Relevant. Innovative. Proven — the evidence.**
- **Feasible** — runs today on data BTP already collects; no new sensors or hardware.
- **Relevant** — built on their own 298,445 records, read honestly (enforcement data, not demand; the evening gap named).
- **Innovative** — a closed decision loop, explainable both ways, with an agentic voice co-pilot.
- **Proven** — **38%** of real violations captured on **31 days the model never saw**; held-out r = 0.70.
- **By the numbers:** 298,445 records · r = 0.70 · 38% vs 1.3% · 802 zones · English / Hindi / Kannada · runs on a laptop.

*ParkPulse turns what already happened into where to stand tomorrow.*

**On screen:** the four criteria as evidenced one-liners + a by-the-numbers strip + **one QR to the live app**. *(Title,
Description, Links, Run Instructions and Source Code are separate submission-form fields — not repeated on the slide.)*
