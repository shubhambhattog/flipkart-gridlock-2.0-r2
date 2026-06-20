# 📑 ParkPulse — Submission Deck (judge- & AI-readable)

**Theme 1 — Poor Visibility on Parking-Induced Congestion · Gridlock Hackathon 2.0 · for the Bengaluru Traffic Police**

> **This deck is for *submission and review*, not live narration.** It is built to be *read* — by the BTP/Flipkart
> judges and by an AI screener — without a presenter. So every slide is **self-contained**: the headline states the
> conclusion, the bullets carry the full point, and one "On screen" line names the proof. Each slide is tagged with the
> **judging criterion** it earns (Feasibility · Relevance · Innovation · Real-world impact · plus Technical & Design).

- **Live web app:** Next.js / React / deck.gl on **Vercel** (frontend) + **FastAPI** on **Render** (backend): `[Vercel URL]`.
- **One engine:** both call the shared `app/core.py`; the Gemini co-pilot runs server-side.
- **Generated PPTX:** `pitch/ParkPulse_Deck.pptx` (regenerate via `python pitch/build_pptx.py`).
- **Numbers that must stay exact:** 298,445 records · 151 days · 802 zones · r = 0.70 (MAE 2.01) ·
  **38% vs 1.3%** on 31 held-out days · top 1% of cells = 33% · 15% of vehicles = 34% · 93% before 1 PM / <0.3% in the 5–9 PM peak.

---

## Slide 1 — Title  *(first impression · Design)*
**ParkPulse — from 298,000 parking tickets to where to stand tomorrow.**
- An enforcement-intelligence system for the Bengaluru Traffic Police, built entirely on their **own** challan data.
- Detects parking hotspots, scores them by real traffic impact, **forecasts** when they recur, and hands a supervisor a
  ready-to-brief **patrol plan** — plus an AI co-pilot they can just *ask*.
- Theme 1 · Gridlock Hackathon 2.0 · **TeamX**

**On screen:** the Command Center 3-D hotspot map (tilted), product name overlaid, both demo links.

---

## Slide 2 — The problem  *(Relevance)*
**Today, parking enforcement flies blind.**
- Illegal parking near markets, metros and commercial hubs blocks live lanes and junctions — Bengaluru's most visible,
  most-complained congestion source.
- Enforcement is **reactive and patrol-based**: a duty officer has a few teams and a whole division, and sends them on
  instinct.
- There is **no city-wide heatmap, no prioritization, and no way to schedule scarce teams** by where/when parking
  actually hurts.

**On screen:** a choked Bengaluru junction beside a blank map (the "blindness").

---

## Slide 3 — The data  *(Feasibility + credibility)*
**We didn't invent data — we sharpened theirs.**
- **298,445** real BTP violation records · **151 days** · **802** zones · **0 missing fields**.
- Violations are wildly concentrated: the **top 1%** of locations hold **33%** of all violations.
- A small set of chronic vehicles drives the rest: **15% of vehicles cause 34%** of violations.
- That concentration is the entire opportunity — a few well-placed teams can cover a disproportionate share.

**On screen:** three big stat tiles + a Pareto curve (1% of cells → 33% of violations).

---

## Slide 4 — The honest insight  *(Trust — what sets us apart)*
**We read the data for what it is — enforcement, not demand.**
- This is where officers **caught** parking, not a god's-eye view of where parking is worst.
- It's morning-heavy: **~93%** of tickets are written **before 1 PM**; **<0.3%** land in the **5–9 PM** evening peak.
- So we make two honest claims, never one inflated one: **(1)** optimize the enforcement effort you already spend, and
  **(2)** flag the **evening blind spot** you're missing — instead of pretending to predict the whole city.

**On screen:** coverage-by-hour bar chart, the 5–9 PM hours highlighted in red.

---

## Slide 5 — The solution  *(Innovation)*
**Not a dashboard — a closed decision loop.**
- **Detect → Score → Forecast → Deploy → Target →** (outcomes feed back).
- It doesn't end in a chart to stare at; it ends in **an action a supervisor can brief at tomorrow's roll-call.**
- Every stage is transparent and explainable — no black boxes a judge (or an officer) has to take on faith.

**On screen:** the five-stage loop diagram, arrow returning from Target to Detect.

---

## Slide 6 — Detect & Score  *(Innovation · Technical)*
**One transparent number ranks every zone.**
- City-wide **3-D hotspot map** over geohash hexbins (gh6 ≈ 1.2 km, gh7 ≈ 150 m cells).
- **Congestion Impact Score (0–100) = violations × avg severity × flow-criticality** — junction-blocking and main-road
  violations weigh most (100 cars on a footpath ≠ 100 cars blocking a main-road junction).
- Fully explainable: anyone can see *why* a zone scores what it does — no learned weights to defend.

**On screen:** Command Center map + the "Top impact zones" list + the blue→amber→red severity legend.

---

## Slide 7 — Forecast — validated honestly  *(Innovation + credibility)*
**A forecast we tested on the future, not the past.**
- Predicts violations per **zone × weekday × hour** using an empirical-Bayes **shrinkage** model (sparse cells shrink
  toward the zone-hour average, so they stay stable).
- **Honest held-out backtest: r = 0.70, MAE 2.01** — trained on early weeks, scored on weeks it had never seen
  (real signal, not an overfit 0.99).
- We benchmarked a **LightGBM** gradient-boosting model — it scored **lower (0.69)** *and* we couldn't explain it, so we
  kept the interpretable one. An honest model you trust beats a black box that's marginally worse.

**On screen:** Forecast & Patrol page with the "Forecast accuracy r = 0.70" KPI.

---

## Slide 8 — Proven impact, not a claim ⭐  *(Real-world impact — the mic-drop)*
**38% of real violations covered — tested on 31 days the model never saw.**
- We replayed a **10-team plan** across **31 held-out days**: for each day, asked *where would ParkPulse have sent ten
  teams?*, then measured the share of that day's **actual** violations those teams would have been sitting on.
- ParkPulse: **~38%** captured. An even spread of the same ten teams: **~1.3%**. A static "go to the usual hotspots"
  plan scores well below ParkPulse too.
- This is a **validated efficiency gain on unseen data — not a projection.** It is the strongest, hardest-to-fake card
  in the deck, and most teams have *zero* validation.

**On screen:** the Coverage & ROI "Proven impact" card — 38% vs 1.3% bars.

---

## Slide 9 — Deploy & Target  *(Real-world impact · Trust)*
**The deliverable an officer actually uses — auditable both ways.**
- One click → a **spaced patrol plan** (teams ≥600 m apart so they don't stack), shared by **WhatsApp / print / CSV** at
  roll-call.
- **Explainable why a team *is* there:** tap any team for forecast load · junction/main-road impact · 3-week trend.
- **Transparent why a strong zone *isn't* there** *(new):* an "Also considered" panel shows zones that just missed and
  *why* — "add 1 more team to include it" vs "skipped to avoid stacking within 600 m." The recommendation is auditable,
  not a black box.
- **Target the chronic offenders** (15% → 34%): ready CSV lists for owner-notice / escalated-penalty / tow-priority.

**On screen:** generate a plan → tap a team (why here) → the "Also considered" strip → WhatsApp/Print/CSV buttons → offender lists.

---

## Slide 10 — Ask ParkPulse: the AI co-pilot  *(Innovation)*
**A real AI agent over the live models — not a scripted chatbot.**
- Google **Gemini function-calling** runs the *actual* forecaster and optimizer, then answers with a real plan + map —
  every number is grounded in a tool result, never generated prose.
- **Multilingual** (English / Hindi / Kannada), **voice input**, and **conversation memory** (reuses the weekday/shift/team
  count you already gave it).
- An officer never has to learn the dashboard — they just **ask or say:** *"Plan 6 teams for Friday evening near KR Market."*

**On screen:** the Ask page — type or speak a query → plan + map render, with the conversation-history rail.

---

## Slide 11 — Live, explainable & self-improving  *(by design · Integrity)*
**Built to get smarter the more BTP uses it — without ever touching the fixed dataset.**
- **Event-aware:** auto-flags unusual days (festivals / match days) running above the weekday norm via a robust z-score.
- **Full-day planner:** morning / afternoon / evening at once — you can *see* the evening blind spot
  (e.g. **361 → 36 → 2** forecast catches across the three shifts on the real data).
- **Data flywheel:** a live `POST /ingest` cleans new challans and rebuilds the models in seconds — the architecture for a
  nightly BTP feed; **outcome logging** lets officers record what a team actually found, closing the loop.
- **Integrity (stated plainly):** we **never modify the fixed competition dataset.** The ingest pipeline is shown as
  *architecture* for live BTP data — it is not run on the official 298,445 records, and outcome logs are in-memory only.

**On screen:** Full-day Planner (361 → 36 → 2) beside the Data-freshness card with its integrity note.

> **Demo rule:** *describe* the ingest endpoint — never click an "add data" control on camera. Everything demonstrated is
> analysis of the official, untouched 298,445 records.

---

## Slide 12 — Architecture & tech  *(Technical)*
**One engine, two services — small, fast, explainable.**
- **One engine** (`core.py`, pure pandas/numpy): EB-shrinkage forecaster · transparent impact score · greedy
  maximum-coverage optimizer with a minimum-spacing constraint · honest time-split backtest · counterfactual simulator.
- **The product:** a **Next.js 16 / React 19 / deck.gl** frontend (Vercel) + a **FastAPI** backend (Render) — both
  calling the one engine — plus the **Gemini** co-pilot, server-side.
- **No training pipeline to babysit, no GPU, no black box** — the whole model is auditable and rebuilds in seconds.

**On screen:** one-line architecture: Data → core.py (one brain) → FastAPI (Render) → Next.js (Vercel) + Gemini co-pilot.

---

## Slide 13 — Feasibility & rollout  *(Feasibility)*
**Deployable now — on data BTP already collects.**
- Runs on a **laptop** · uses **only the existing challan data** · **no new sensors, no procurement**.
- Already live as a web app today; the full-stack product is deployment-ready (FastAPI on Render + Next.js on Vercel).
- The **geohash engine generalizes** to any city or violation type — not parking-specific.
- **Next step for BTP:** a nightly challan feed + a few evening pilot deployments to start the flywheel, then fuse the
  live ASTraM feed.

**On screen:** the rollout one-liner + "no new hardware" callout.

---

## Slide 14 — Why ParkPulse wins  *(close)*
**Feasible · Relevant · Innovative · Proven.**
- **Feasible** — working software today, on data BTP already has, no new hardware.
- **Relevant** — their data, their problem, read **honestly** (enforcement ≠ demand; the evening blind spot named).
- **Innovative** — a closed decision loop + an agentic voice co-pilot + transparency both ways.
- **Real impact** — a plan you brief tomorrow, a **38% validated** efficiency gain, and offender targeting.
- *ParkPulse turns 298,000 rows of what already happened into where to stand tomorrow.*

**On screen:** title card again + both demo links + repo.

---

## Appendix — Anticipated judge / reviewer questions
- **"Isn't this enforcement data, not real demand?"** → Exactly, and we say so (Slide 4). We optimize the effort you
  already spend and flag the evening gap; as you deploy there, the data fills in and the model learns true demand. That
  honesty is why the numbers are believable.
- **"How do you know it works?"** → The **38%** counterfactual on **31 days the model never saw** (Slide 8). Not a claim — a test.
- **"Why not deep learning / a fancier model?"** → We tried LightGBM; it scored **lower (0.69 vs 0.70)** and we couldn't
  explain it. An interpretable model you trust beats a marginally-worse black box.
- **"Why isn't my known hotspot in the plan?"** → The plan ranks by **forecast load for that exact window**, not the
  static overall Impact, then spaces teams ≥600 m apart — and the **"Also considered"** panel shows exactly why a zone
  missed (Slide 9). Raise the team count or change the window and it appears.
- **"Will it scale / need new sensors?"** → No new hardware. Geohash engine, runs on a laptop, any city.
- **"Did you add to the dataset?"** → No. The competition's 298,445 records are untouched; ingest is live-data
  architecture only, and outcome logs are in-memory (Slide 11).
