# ParkPulse — Pages & Modules Guide

> The app is a closed loop: **Detect → Score → Forecast → Deploy → Target.** Each of the six pages owns one
> hop of that loop, and the AI co-pilot (a floating assistant everywhere + a full "Ask" page) lets an officer
> drive the whole loop in plain English — in English, Hindi, or Kannada.

Both deployable apps share one brain (`app/core.py`). The Next.js frontend never touches the models directly —
it calls the FastAPI backend (`fullstack/backend/main.py`), which wraps `core.py` + `copilot.py`. The typed
client lives in `fullstack/frontend/src/lib/api.ts`; every endpoint below is reachable as `api.<name>()`.

**Backend dataset (one source of truth):** 298,445 real BTP parking-violation records, Nov 2023 – Apr 2024
(150 days, ~1,990/day), 802 geohash-6 zones, 5,753 geohash-7 hotspot cells, 168 named junctions. The forecaster
is an empirical-Bayes shrinkage model (alpha=12) backtested honestly on a held-out time split: **Pearson r = 0.70,
MAE 2.01** (a LightGBM Poisson baseline scored lower at 0.69, so we kept the interpretable model).

---

## 1 · Command Center — `/`  ·  *Detect*

**What it does.** The landing view: a full-bleed 3-D deck.gl hotspot map over Bengaluru with the headline KPIs
floating on top and three insight cards below.

**Why it exists.** First thing an officer sees — it answers "where is the parking pain, right now, across the
whole city?" and immediately surfaces the evening blind spot so nobody mistakes enforcement logs for true demand.

**Key components.** `HotspotMap` (deck.gl density layer, client-only via `next/dynamic`), glass KPI tiles
(Violations logged · Hotspot zones · Named junctions · Repeat-offender load), and three `Card`s: enforcement-by-hour
`Bars` (highlighting the **<0.3% 5–9 PM** evening blind spot vs **~93% before 1 PM**), top impact zones ranked by
Congestion Impact Score, and an "Honest forecasting" card stating the backtest **r = 0.70, MAE 2.01**.

**Backend endpoints.** `api.meta` (totals, coverage summary, repeat stats, backtest, top hotspots),
`api.grid` (per-cell lat/lon/count for the map). The `CommandInsights` block also draws on `api.impact` /
`api.coverage`.

---

## 2 · Hotspot Explorer — `/explorer`  ·  *Detect (sliced)*

**What it does.** A live, filterable hotspot map: pick weekday(s), an hour range, violation type, and/or police
station, and the zones + counts re-rank on the fly.

**Why it exists.** "Show me no-parking violations near Indiranagar on Saturday mornings" — an officer interrogates
the data for a specific shift or campaign instead of staring at a single static heatmap.

**Key components.** `ZoneMap` (deck.gl), shadcn `Select` (type / station), a weekday multi-select, an hour-range
`Slider`, `Badge`s for the active filters, and a results count. Colour ramps by impact score.

**Backend endpoints.** `api.facets` (available types / stations / weekday names to populate the controls),
`api.explorer` (filtered + re-scored zones with a live `count`).

---

## 3 · Forecast & Patrol — `/forecast`  ·  *Forecast → Deploy*

**What it does.** Choose a weekday, a shift window (start/end hour), and a number of teams; the page returns a
spaced, ready-to-deploy patrol plan (team → zone → predicted load) and a downloadable CSV.

**Why it exists.** This is the deploy step — it turns the forecast into an actual roster. The greedy optimiser does
**maximum coverage with a minimum-spacing constraint** so teams don't pile onto one junction.

**Key components.** Weekday `Select`, shift + teams `Slider`s, a `Table` of the plan, `Badge`s for the window,
a `ZoneMap` showing team placements, and a CSV export.

**Backend endpoints.** `api.forecast` (`dow` + `hours` → empirical-Bayes load per zone, alpha=12),
`api.patrol` (POST: weekday / start / end / teams / optional area → the spaced allocation plan).

---

## 4 · Coverage & ROI — `/coverage`  ·  *Deploy (proven)*

**What it does.** Quantifies the payoff: the **validated-impact card**, the staffing sweet-spot (ROI/Pareto curve
of teams vs coverage), and the evening blind-spot view.

**Why it exists.** Answers a commander's two budget questions — "is this worth it?" and "how many teams is enough?"
The flagship proof lives here: a **counterfactual replay on 31 held-out days the model never saw** — a 10-team
ParkPulse plan would have been positioned for **~38% of the violations actually logged**, versus **~1.3%** spread
evenly. Honest framing: that is the share of *catchable / logged* violations (enforcement efficiency, not true
demand); versus a plain static hotspot heatmap, day-level capture is roughly tied — ParkPulse's edge is the
shift-by-shift timing, the ready-to-deploy plan, and the co-pilot.

**Key components.** The impact `Card` (38% vs 1.3% on 31 unseen days), an ROI/marginal-coverage curve, a
Pareto/staffing sweet-spot chart, the evening-blind-spot `Bars`, KPIs, and `Badge`s.

**Backend endpoints.** `api.impact` (the held-out counterfactual replay — `core.deployment_simulation`),
`api.roi` (`dow` + start/end → optimal-vs-even coverage curve), `api.coverage` (enforcement share by hour).

---

## 5 · Repeat Offenders — `/offenders`  ·  *Target*

**What it does.** Ranks the worst chronic repeat-violator vehicles and frames the concentration finding.

**Why it exists.** The target step: **15% of vehicles cause 34% of violations**, so naming the chronic plates lets
BTP focus notices/escalation where they bite hardest — a small, actionable watch-list instead of the whole city.

**Key components.** A `Table` of top vehicles + counts, `Badge`s, and a headline stat card driven by the repeat
summary (unique vehicles, repeat share %, worst single offender).

**Backend endpoints.** `api.offenders` (top-25 repeat vehicles + counts), `api.meta` (repeat summary for the
"15% → 34%" framing).

---

## 6 · Ask ParkPulse — `/ask`  ·  *Drive the whole loop*

**What it does.** The full conversational co-pilot page — ask anything ("plan 8 teams for Indiranagar Saturday
evening", "who are the worst offenders?") and get an answer plus, when relevant, a rendered patrol plan.

**Why it exists.** An officer who doesn't want to click through five pages can just ask. Google **Gemini
(gemini-2.5-flash)** does automatic function-calling over the `core.py` tools — `make_patrol_plan`,
`top_hotspots`, `coverage_stats`, `repeat_offenders` — and replies in **English / Hindi / Kannada**.

**Key components.** A chat transcript, an `Input`/send box, and an inline `Table` when the answer carries a patrol
plan. Guardrailed and scoped to ParkPulse.

**Backend endpoints.** `api.copilot` (POST `{ message }` → `{ answer, plan }`, runs `copilot.run_agent`
server-side; needs `GEMINI_API_KEY`).

---

## ✦ Floating Assistant — *every page*

**What it does.** A guardrailed chat bubble pinned to every page (`FloatingChat`) — a lightweight, navigation-aware
helper that answers questions and can hand back a patrol plan without leaving the current view.

**Why it exists.** Help is always one tap away, in any of the three languages, so the co-pilot is never more than a
click from wherever the officer is in the loop.

**Key components.** A floating button + popover, chat transcript, and an inline plan `Table` when applicable.

**Backend endpoints.** `api.assistant` (POST `{ message }` → `{ answer, plan }`, runs `copilot.run_assistant`;
falls back to page shortcuts if `GEMINI_API_KEY` is unset).

---

### Endpoint ↔ page cheat-sheet

| Endpoint | Method | Used by |
|---|---|---|
| `/meta` | GET | Command Center, Repeat Offenders |
| `/grid` | GET | Command Center (hotspot map) |
| `/zones` | GET | maps / ranking |
| `/coverage` | GET | Command Center, Coverage & ROI |
| `/impact` | GET | Coverage & ROI (validated 38% vs 1.3% on 31 held-out days) |
| `/roi` | GET | Coverage & ROI (staffing sweet-spot) |
| `/facets` | GET | Hotspot Explorer (filter options) |
| `/explorer` | GET | Hotspot Explorer (filtered zones) |
| `/forecast` | GET | Forecast & Patrol (empirical-Bayes load, alpha=12) |
| `/patrol` | POST | Forecast & Patrol (spaced deployment plan) |
| `/offenders` | GET | Repeat Offenders |
| `/copilot` | POST | Ask ParkPulse |
| `/assistant` | POST | Floating assistant |
| `/health` | GET | keep-warm ping (BetterStack → Render) |
