# 🚦 ParkPulse — Parking Enforcement Intelligence for Bengaluru

### Gridlock Hackathon 2.0 · Round 2 Prototype · Theme 1 — *Poor Visibility on Parking-Induced Congestion*

**🔴 Live demo:** https://flipkart-gridlock-20-r2-rinxb9yibzp8knp6quhfew.streamlit.app

> **In one line:** ParkPulse turns **298,445 real BTP parking-violation records** into a decision system that shows *where* illegal parking chokes traffic, *how much* each hotspot matters, *when* violations will recur, and *how* to deploy limited patrol teams to catch the most of it.

---

## Table of contents
1. [Executive summary](#1-executive-summary)
2. [The problem we're solving](#2-the-problem-were-solving)
3. [Our solution at a glance](#3-our-solution-at-a-glance)
4. [A day in the life](#4-a-day-in-the-life)
5. [The data — and an honest reading of it](#5-the-data--and-an-honest-reading-of-it)
6. [How it works — logic & algorithms](#6-how-it-works--logic--algorithms)
7. [Validation — does the forecast actually work?](#7-validation--does-the-forecast-actually-work)
8. [System architecture](#8-system-architecture)
9. [Real-world impact & rollout](#9-real-world-impact--rollout)
10. [Limitations & future work](#10-limitations--future-work)
11. [Why ParkPulse](#11-why-parkpulse)

---

## 1. Executive summary

On-street illegal parking near markets, metro stations and commercial areas chokes Bengaluru's
carriageways and intersections. Today enforcement is **patrol-based and reactive** — officers go where
experience tells them, with no city-wide picture of *which* parking violations actually hurt traffic, or
*when*. There is no heatmap, no prioritization, no way to schedule scarce teams optimally.

**ParkPulse** is a working prototype that closes that gap. From the Traffic Police's own violation data it:

- **maps** the city's parking hotspots in 3-D,
- **scores** each hotspot by its real traffic-flow impact (not just raw counts),
- **forecasts** where and when violations will recur, down to the weekday and hour,
- **generates a ready-to-brief patrol deployment plan** for any shift and team count, and
- **surfaces the chronic repeat offenders** — a small minority causing a third of all violations.

And we **prove it pays off**: on a counterfactual replay over **31 held-out days the model never saw**, a
10-team ParkPulse plan would have been positioned for **~38%** of the violations actually logged, versus
**~1.3%** for teams spread evenly (see §7.1). It runs on a laptop, needs no new sensors, and uses **only the
data BTP already collects**.

---

## 2. The problem we're solving

From the official Theme 1 statement:

> *"On-street illegal parking and spillover parking near commercial areas, metro stations, and events
> choke carriageways and intersections."*
>
> **Why it's hard today:** enforcement is patrol-based and reactive · no heatmap of parking violations vs.
> congestion impact · difficult to prioritize enforcement zones.
>
> **Direction:** *How can AI-driven parking intelligence detect illegal-parking hotspots and quantify
> their impact on traffic flow to enable targeted enforcement?*

So the job has three verbs: **detect** hotspots, **quantify** their impact, **enable targeted**
enforcement. ParkPulse delivers all three — and adds a forward-looking forecast and an actual deployment
plan on top.

---

## 3. Our solution at a glance

ParkPulse is not a static dashboard. It is a **closed decision loop**:

```
   DETECT   ─►   SCORE    ─►   FORECAST   ─►   DEPLOY    ─►   TARGET
 (hotspots)    (impact)    (when / where)   (patrol plan)  (repeat offenders)
      ▲                                                          │
      └───────────────────────  feeds back  ◄────────────────────┘
```

Delivered as a **6-page web app** (plus a guardrailed floating co-pilot on every page):

| Page | What it gives the officer |
|---|---|
| **Command Center** | City-wide 3-D hotspot map, headline numbers, and the enforcement *blind-spot* insight |
| **Hotspot Explorer** | Slice 298K records live by time / weekday / violation type / station — hotspots re-rank instantly |
| **Forecast & Patrol Planner** | Predicts load per *zone × weekday × hour* and auto-builds a spaced-out deployment plan for *N* teams |
| **Coverage & ROI** | The **validated-impact card** (see §7) plus the targeting payoff (Pareto + staffing sweet-spot) and the evening enforcement blind spot |
| **Repeat-Offender Intelligence** | The chronic ~15% of vehicles behind ~34% of violations, as a target list |
| **Ask ParkPulse** | A natural-language co-pilot (English / Hindi / Kannada) — Gemini function-calling over the real models returns actual patrol plans |

---

## 4. A day in the life

> It's **Friday afternoon**. The Upparpet division shift supervisor opens ParkPulse, picks **Saturday,
> 9 AM–1 PM, 8 teams**. In two seconds the map shows the **8 highest-impact, well-spaced deployment
> points** — Elite Junction, KR Market, Safina Plaza, Central Street… — each with the *expected number of
> violations* a team will encounter there. She clicks **Download plan**, and briefs her teams from the CSV.
>
> The next morning, instead of patrolling on instinct, every team is already standing where the data says
> the worst parking congestion will be — **before** it builds up.

That is the entire value proposition: **turn instinct-based, reactive enforcement into data-driven,
proactive enforcement** — with the tools BTP already has.

---

## 5. The data — and an honest reading of it

**Source:** BTP parking-violation e-challan records, **Nov 2023 → Apr 2024** (150 days), provided by
HackerEarth. After cleaning: **298,445 violations**, ~1,990 per day, with **zero missing values** on every
field we rely on (location, time, violation type, vehicle, police station, junction).

**What the data is rich in:**

| Signal | Evidence |
|---|---|
| Tight spatial hotspots | The top **1%** of ~100 m cells hold **33%** of all violations |
| Named enforcement zones | **168** BTP junctions (Elite, KR Market, Safina Plaza, Sagar Theatre, …) |
| Repeat behaviour | **15.3%** of vehicles cause **34.2%** of all violations |
| Flow-relevant types | "Parking in a main road", "near road crossing", "on footpath", "wrong/no parking" |
| Strong time structure | Clear weekday and hour-of-day rhythms → forecastable |

**The crucial caveat — and we state it up front.** These are **enforcement records**, not traffic
sensors. They capture *when an officer wrote a ticket* — and that is heavily **morning-biased**:

- **~93%** of violations are logged **before 1 PM**;
- **< 0.3%** are logged in the **5–9 PM** evening peak.

So the data measures *where enforcement caught illegal parking*, **not** the full ground truth of where
illegal parking happens. Likewise, the dataset has **no congestion sensor**, so "impact on traffic flow"
must be a **transparent constructed proxy**, not a measurement.

**We turn this honesty into a strength.** ParkPulse:
- optimizes **enforcement efficiency** on the observed signal (catch more, with the same teams), and
- explicitly flags **coverage blind spots** (e.g. evenings) for re-deployment,

rather than pretending to predict true demand. The evaluators are BTP — they know their own data, and a
solution that respects its limits is more credible than one that over-claims.

---

## 6. How it works — logic & algorithms

Each module below is described twice: the **logic** (why) and the **algorithm** (how).

### 6.1 Data foundation (`prep.py`)
**Logic.** Make the raw CSV analysis-ready and give every violation a *traffic-flow severity*.

**Algorithm.**
- Parse `violation_type` (a JSON-list string, e.g. `["WRONG PARKING","NO PARKING"]`) into real types.
- Assign each type a **flow-severity weight ∈ [0, 1]** by how much it blocks the carriageway:

  | Violation type | Weight | Rationale |
  |---|---|---|
  | Parking in a main road | 1.00 | blocks a moving arterial lane |
  | Parking near road crossing | 0.90 | blocks junction sight-lines & turns |
  | Double parking | 0.85 | blocks a live lane |
  | Wrong parking | 0.80 | partial lane obstruction |
  | No parking | 0.60 | designated no-park zone |
  | Parking on footpath | 0.50 | pushes pedestrians into the road |
  | Defective number plate | 0.10 | not a flow issue |

  A record's severity = **max** over its types (the worst offense drives impact).
- Parse timestamps as UTC → convert to **IST**; derive `hour`, `weekday`, `date`, `month`.
- **Geohash-encode** every `(lat, lon)` into base-32 strings at two resolutions:
  **precision-7 ≈ 153 m** (fine hotspots) and **precision-6 ≈ 1.2 km** (neighbourhoods). This turns
  continuous coordinates into discrete **zones** we can aggregate and forecast over.

### 6.2 Hotspot detection (`core.build_zones`)
**Logic.** Collapse the 298K-point cloud into ~800 neighbourhood zones with stats and a readable name.

**Algorithm.** `groupby(geohash-6)` → violation count, mean severity, junction-fraction, main-road-fraction.
Each zone's **label** = the dominant named junction inside it (statistical mode), falling back to the
police station — so the map speaks BTP's language ("KR Market Junction"), not geohash codes. (Repeat-offender
behaviour is analysed separately in §6.6.)

### 6.3 Congestion Impact Score (`core.add_impact`)
**Logic.** Raw counts mislead — 100 footpath tickets are not as traffic-critical as 100 main-road
blockings at a junction. We want a single **0–100 priority number** fusing volume + severity + flow-criticality.

**Algorithm.**
```
flow_mult    = 1 + 0.5·junction_frac + 0.5·main_road_frac        # ranges 1.0 … 2.0
impact_raw   = violations × avg_severity × flow_mult
impact_score = 100 · (log1p(impact_raw) − min) / (max − min)     # normalised to 0..100
```
- **Why the log transform:** violation counts are heavy-tailed; without it, a handful of mega-hotspots
  crush every other zone to ~0. Log spreads the mid-tier so the score actually discriminates.
- **Why this exact form:** every input is monotone-increasing, so the score is fully **explainable** —
  "more volume, worse violation types, nearer a junction ⇒ higher priority." No black box, which matters
  for a government audience that must justify where it sends officers.

### 6.4 Spatio-temporal forecaster (`core.build_forecaster`, `core.predict_load`) — the brain
**Logic.** To schedule patrols *proactively*, predict "expected violations in zone *Z*, weekday *D*, hour
*H*." The naive answer — average that exact cell's history — fails because cells are **sparse**: there are
only ~21 Saturdays in 150 days, and many `zone × weekday × hour` cells have only a handful of samples →
noisy, unstable estimates.

**Algorithm — empirical-Bayes / hierarchical shrinkage.**
```
count[Z,D,H] = total violations observed in that cell over the period
n_dow[D]     = number of times weekday D occurred (~21)
r_zh[Z,H]    = the zone's average at hour H, pooled over ALL weekdays   ← stable "prior"

rate[Z,D,H]  = ( count[Z,D,H] + α · r_zh[Z,H] ) / ( n_dow[D] + α ),   α = 12
```
- We **pull each noisy weekday-specific rate toward the zone's overall hour profile**, with strength α
  (measured in pseudo-observations).
- A **data-rich** cell (`n_dow ≫ α`) keeps its own estimate; a **sparse** cell (`n_dow ≈ α`) defers to the
  stable backoff. This is the classic **bias–variance trade**: accept a little bias to cut a lot of variance.
- `predict_load(D, hours)` then sums `rate` over the chosen shift window → expected load per zone.

### 6.5 Patrol allocation optimizer (`core.allocate_patrols`)
**Logic.** Given the forecast and *K* teams, *where* do we send them? Picking the top-K zones by load
**fails**, because the hottest zones cluster on the same arterial — you'd stack 5 teams around one market
and leave the rest of the city blind. We want maximum coverage **with geographic spread**.

**Algorithm — greedy max-coverage with a separation constraint.**
1. Sort all zones by predicted load (descending).
2. Walk the list; **accept a zone only if it is ≥ `min_sep_m` (Haversine distance, default 600 m) from
   every already-chosen zone** — otherwise skip it. Stop once *K* teams are placed.

It's a greedy facility-location / dispersion heuristic: instant, fully explainable, and it produces a
sensible, spread-out plan. Output: a Team → zone table with expected catches, map pins, and a CSV the
supervisor can hand to teams.

### 6.6 Repeat-offender intelligence (`pages/3_Repeat_Offenders.py`)
**Logic.** Enforcement is far more effective when it targets the chronic minority (owner notices,
escalated penalties, tow priority). The Pareto structure — **15% of vehicles → 34% of violations** — makes
a short, high-value target list.

**Algorithm.** Frequency count over (anonymised) `vehicle_number`; bucket by repeat count (1, 2, 3, 4–5,
6–10, 10+); for the worst offenders, aggregate vehicle type, number of distinct zones, and main area. The
6+ buckets become the action list.

---

## 7. Validation — does the forecast actually work?

We validate the forecaster the **honest** way — a **time-split backtest**, never testing on data it trained on:

1. Train the shrinkage rates on the **first 80%** of the calendar.
2. Predict the **held-out final 20%** (everything after **2024-03-09**).
3. Compare predicted vs. actual per-day rates at each `zone × weekday × hour` cell with enough signal.

**Result:** Pearson **r = 0.70**, **MAE = 2.01** violations per cell, over the evaluated `zone × weekday × hour` cells.

This is deliberately presented as *moderate, not magical*: the held-out labels are themselves noisy (only
~4 of each weekday remain in the tail), and enforcement scheduling carries irreducible randomness. A team
claiming r = 0.99 here would be over-fitting or leaking. **0.70 on a clean time-split is a real,
trustworthy signal** — strong enough to rank zones and drive deployment, honestly reported.

**We earned the right to keep the simple model.** We did *not* assume the interpretable forecaster was
best — we benchmarked it against a **LightGBM Poisson** regressor on the same time-split. The gradient-boosted
model scored **lower (r = 0.69)**, so we kept the empirical-Bayes shrinkage model: it is more accurate here
*and* fully explainable, which matters for a government audience that must justify deployments. Complexity
was rejected on the evidence, not on faith.

### 7.1 Validated impact — the flagship proof (`core.deployment_simulation` · backend `/impact`)

A correlation is reassuring; a **counterfactual replay** is convincing. We took **31 held-out days the model
never saw**, generated a **10-team ParkPulse deployment plan** for each, and measured what fraction of the
violations *actually logged* on those days fell within the planned positions:

| Strategy | Share of logged violations captured |
|---|---|
| **ParkPulse 10-team plan** | **~38%** |
| Teams spread evenly across the city | ~1.3% |

So on days it had never trained on, a ParkPulse plan would have been standing where **~38%** of the
catchable, logged violations occurred — versus **~1.3%** for a naive even spread.

**Framed honestly:** this is the share of *catchable / logged* violations (enforcement **efficiency**), not
true demand. Against a plain static hotspot heatmap, **day-level** capture is roughly tied — ParkPulse's edge
is the **shift-by-shift timing**, the **ready-to-deploy plan** (down to spaced map pins and a CSV), and the
**co-pilot** that delivers it in plain language. The card lives on the **Coverage & ROI** page.

---

## 8. System architecture

A deliberate **brain ≠ face** split, so the intelligence is testable independently of the UI:

```
round2/
├─ app/                     → Streamlit demo + THE BRAIN
│  ├─ prep.py     → one-time:  raw CSV → data/clean.pkl + junctions.pkl
│  ├─ core.py     → THE BRAIN: zones, impact score, forecaster, patrol optimiser,
│  │                deployment_simulation (the validated-impact replay)
│  │                (pure pandas/numpy — no Streamlit → unit-testable, reusable)
│  ├─ copilot.py  → Gemini function-calling layer over core.py
│  ├─ app.py      → Command Center (entry page)
│  └─ pages/      → Hotspot Explorer · Forecast & Patrol · Coverage & ROI ·
│                   Repeat Offenders · Ask ParkPulse
├─ fullstack/              → finale-grade full-stack app (same core.py)
│  ├─ backend/    → FastAPI wrapping core.py + copilot.py (incl. /impact, /health)
│  └─ frontend/   → Next.js 16 + shadcn/ui + Tailwind v4 + deck.gl (6 pages + assistant)
├─ data/                   → committed artefacts (clean.pkl, junctions.pkl)
└─ .streamlit/             → dark theme + secrets
```

- **`core.py` is the single brain shared by BOTH apps and has zero UI dependency** — `python app/core.py`
  runs the whole intelligence stack standalone (builds zones, runs the backtest, prints a sample patrol
  plan). That's how we validated the model before a single map rendered.
- **Two deployable apps, one source of truth.** Both import the same `app/core.py`:
  1. **Streamlit** (`app/`) — the fast, complete demo and the Round-2 submission Demo Link; deploys free to
     Streamlit Community Cloud.
  2. **Full-stack** (`fullstack/`) — a **FastAPI** backend (wrapping `core.py` + `copilot.py`) behind a
     **Next.js 16 / shadcn/ui / Tailwind v4 / deck.gl** frontend; the finale-grade polished build. Deploys to
     **Render** (backend, kept warm via a `/health` ping) + **Vercel** (frontend).
- **Tech stack:** Python · pandas / numpy (logic) · empirical-Bayes shrinkage forecasting (benchmarked
  against LightGBM Poisson — see §7) · **Streamlit** + **FastAPI** + **Next.js** · **pydeck / deck.gl** (3-D
  maps) · **Plotly** (charts) · **Google Gemini (`gemini-2.5-flash`)** — the natural-language co-pilot, via
  automatic function-calling over the same `core.py`, surfaced both as a full "Ask ParkPulse" page and a
  guardrailed **floating assistant on every page**.
- **Lightweight by design:** no GPU, no new hardware — the engine runs on a standard laptop, and the
  committed `data/clean.pkl` means both apps run without the raw CSV.

---

## 9. Real-world impact & rollout

**What BTP gains immediately**
- A **city-wide hotspot heatmap** — the visibility the problem statement says is missing today.
- **Prioritised enforcement zones** by real traffic impact, not gut feel.
- **Proactive shift planning**: every team starts the day where the data says congestion will build.
- A **repeat-offender list** for escalated, targeted action.
- **Coverage-gap awareness** — the evenings/areas current patrols miss.
- A **co-pilot** (English / Hindi / Kannada) that turns any of the above into a plan in plain language.

**Rollout path (uses only data BTP already has):**
1. **Phase 1 — Retrospective (today).** Run on historical e-challan exports; plan next week's shifts. *This
   prototype already does this — and the §7.1 held-out replay shows a 10-team plan would have been positioned
   for ~38% of the violations actually logged.*
2. **Phase 2 — Nightly refresh.** Point it at the daily e-challan feed; plans update every morning.
3. **Phase 3 — Live ASTraM integration.** Wire to the real-time ASTraM stream for intra-day re-deployment.

**Scalability.** The geohash-based engine is **city-agnostic** — the same code works for any region or any
violation type, and the computation is trivial (seconds on a laptop for a full city). Extending from
parking to all ASTraM incident types is a configuration change, not a rewrite.

---

## 10. Limitations & future work

We are explicit about what this prototype does and does not do — maturity matters.

| Limitation | Honest framing / planned fix |
|---|---|
| Data is enforcement-*observation* time, not true demand | Framed as enforcement-efficiency + blind-spot flagging; fix by fusing with live traffic feeds |
| No direct congestion measurement | Impact is a transparent proxy; validate against ASTraM speed/flow data in Phase 3 |
| Forecast r = 0.70 (moderate) | Honest on a clean time-split (a LightGBM Poisson scored lower, 0.69); improve with covariates — weather, events |
| Planned-event spikes not modelled | Out of scope for Theme 1; complementary to event-driven congestion work |
| Repeat-offender = anonymised IDs | Production version links to ANPR / RTO for real notices |

**Roadmap:** live-feed fusion · weather & event overlays · congestion-sensor validation of the impact score
· ANPR linkage for automated repeat-offender notices · mobile view for field officers.

---

## 11. Why ParkPulse

- **It answers the brief end-to-end** — detect, quantify impact, *and* enable targeted enforcement, plus a
  forecast and a deployable plan on top.
- **It produces a decision, not a chart** — a downloadable patrol plan an officer can act on tomorrow.
- **Every number is explainable** — critical for a public-enforcement audience that must justify its actions.
- **It is honest about its data** — earning credibility with the people who generated that data.
- **It is real and feasible today** — working software, on real BTP data, on a laptop, with a clear path to
  live deployment.

> **ParkPulse turns 298,445 rows of "what already happened" into "where to stand tomorrow."**

---

*Built for Bengaluru Traffic Police (ASTraM) · Gridlock Hackathon 2.0 · uses only the provided Theme-1 dataset.*
