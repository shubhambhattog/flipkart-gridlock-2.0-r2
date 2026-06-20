# 🎬 ParkPulse — Demo Video: full shoot pack (script + delivery + wardrobe)

**Target length: 3:00** (most hackathon caps are 2–3 min — if yours is 2:00, use the *2-min cut* tags below).
**Format:** ~20% talking-head (you on camera) + ~80% screen-recording of the live app with voiceover.
Judges watch the video *first* and rank heavily on it — so the first 10 seconds and the 38% moment decide everything.

---

## 0. Before you record (read this twice)

**What to wear**
- A **solid, mid-tone shirt** — navy, deep teal, charcoal, or a muted slate-blue (it echoes ParkPulse's blue accent).
  A **collar / smart-casual** reads as credible to government + corporate judges.
- **Avoid:** pure white (blooms on camera), black (loses your shape), bright red/green (clashes with the map's
  red/blue), busy stripes/checks/logos (moiré shimmer + distraction).
- Groomed, minimal accessories. If presenting as a team, **coordinate tones** (all smart-casual) — don't dress identical.

**Setup**
- **Light on your face, not behind you.** Sit facing a window or a soft lamp; never a window at your back.
- **Background:** a plain wall or a tidy, slightly out-of-focus room. No clutter, no bright posters.
- **Camera at eye level**, framed chest-up. Phone is fine — prop it steady, don't hand-hold.
- **Screen recording:** 1080p, full-screen the app, hide bookmarks/tabs/notifications, zoom the browser to ~110% so
  text is legible on a phone. Record the demo clicks *first and clean*, then lay the voiceover on top.
- **Audio is half the score.** Quiet room, mic close (a ₹500 lapel mic or phone earbuds beat a laptop mic). Record
  voiceover separately if you can. No fan / traffic noise.

**How to deliver (expressions & energy)**
- **Look INTO the lens** on talking-head bits — that's eye contact with the judges. (Don't look at your own preview.)
- **Smile genuinely** at the open (0:00) and close (2:55). Warm on the problem, **crisp** on the tech, **proud** on the proof.
- **Speak ~10% slower than feels natural.** Nervousness speeds you up; fight it.
- **Pause for one full beat after "38%"** — silence makes a number land.
- Hands: natural gestures are good; don't fidget, don't cross arms. Sit/stand tall, shoulders back, chin level.
- **Rehearse 3–4 full run-throughs** out loud with a timer before the real take. Re-record any segment freely; you'll
  stitch them.

**⚠ Demo integrity rule (read this):** Only *click* things that **analyze the fixed 298,445 records** — the maps,
forecast, patrol plan, full-day planner, "why here?", WhatsApp/print. **Never click any "add data / ingest / simulate
challan" control on camera** — *describe* that capability in words. The competition dataset stays fixed; showing data
being added looks like tampering and risks disqualification. (The judge-facing UI has no add-data button — it only
describes the ingest pipeline — so you're safe, but don't go looking for one.)

**Total time budget (3:00)** — talking-head 0:00–0:12 and 2:50–3:00 (~22s); everything else is screen + voiceover.

---

## 1. Minute-by-minute script

> Format: **[TIME] — MODE — SCREEN action → SAY (verbatim).** Word counts are tuned to the time; don't rush.

### 0:00–0:12 · HOOK — *talking head, look at lens, smile*
**SAY:** "Every morning, Bengaluru's traffic police go out to fight illegal parking — on instinct. We turned **298,000**
of their own parking tickets into a system that tells them exactly **where to stand tomorrow.** This is **ParkPulse.**"

### 0:12–0:32 · THE PROBLEM — *screen: Command Center, slowly drag/tilt the 3-D map*
**SAY:** "Illegal parking near markets, metros and commercial hubs blocks live lanes and junctions every day. Today
enforcement is reactive — no heatmap, no priorities. But the data has a pattern: the **top one percent** of locations
hold a **third** of all violations." *(let the tall red hexagons speak — point with the cursor)*

### 0:32–0:50 · THE HONEST INSIGHT — *screen: scroll to the coverage-by-hour bars*
**SAY:** "And here's the honest part — this is *enforcement* data, not demand. **Ninety-three percent** of tickets are
written before 1 PM; evenings are a **blind spot.** We don't over-claim — we make enforcement sharper, and we flag the
gaps." *(2-min cut: keep this — the honesty is a differentiator)*

### 0:50–1:18 · THE LOOP + SCORE + FORECAST — *screen: open Forecast & Patrol; point at the r=0.70 KPI*
**SAY:** "ParkPulse is a closed loop — **detect, score, forecast, deploy, target.** We score every zone by real traffic
impact, zero to a hundred. Then we forecast violations by weekday and hour — and we validate it the hard way: trained
on the past, tested on the **unseen future.** Correlation **point-seven-zero** — real signal, not an overfit number."

### 1:18–1:44 · DEPLOY — *screen: Saturday · 9–13 · 8 teams → plan appears → tap a team ("why?") → click WhatsApp*
**SAY:** "Now the payoff. A supervisor picks a shift and the number of teams — and ParkPulse places every team on the
highest-impact, well-spaced corners. Tap a team and it tells you **why** it's there. Then share the plan straight to a
**WhatsApp** patrol group, or export a CSV to brief at roll-call. Instant, deployable, today."
*(tap a row as you say "why it's there"; hover the WhatsApp button as you say "WhatsApp")*

### 1:42–2:08 · THE PROOF ⭐ — *screen: Coverage & ROI → the "Proven impact" card; pause on the 38% bars*
**SAY:** "Does it actually work? We replayed a ten-team plan on **31 days the model had never seen.** It would have been
sitting on **thirty-eight percent** of the violations that actually happened —" *(PAUSE — one full beat)* "— versus
**one-point-three percent** spread evenly. That's not a claim. That's **proven** on unseen data."

### 2:08–2:34 · THE CO-PILOT — *screen: Ask page; click the mic and SPEAK the query out loud*
**SAY (into the app's mic):** "Plan six teams for Friday evening near KR Market." *(plan + map render)*
**SAY (voiceover):** "And any officer can just **ask** — by voice or text, in English, Hindi or Kannada. This is a real
AI **agent** running our actual models, not a chatbot. It even remembers the conversation."

### 2:34–2:50 · LIVE & SELF-IMPROVING — *screen: open the Full-day Planner (/day) — morning 361 → evening 2*
**SAY:** "And it's built to get better. The full-day view shows the evening blind spot — almost no enforcement there
today. New challans flow through a live ingest endpoint that rebuilds the models in seconds — the architecture for a
nightly feed. Deploy in the evenings and the gap fills itself. And we never touch the fixed competition data — that
pipeline is for live BTP data." *(DESCRIBE the ingest — do NOT click any add-data control. 2-min cut: "The full-day
view shows the evening blind spot; deploy there and it fills itself.")*

### 2:50–3:00 · CLOSE — *talking head, look at lens, calm smile*
**SAY:** "ParkPulse — turning what already happened into **where to stand tomorrow.** Thank you." *(hold the smile 2s
before you stop recording; end on the title card + demo URL)*

---

## 2. The 2-minute cut (if your limit is 2:00)
Keep: 0:00 hook · problem (10s) · honest insight (8s) · forecast+r=0.70 (15s) · deploy+CSV (18s) ·
**the 38% proof (20s)** · co-pilot voice (18s) · one-line flywheel (6s) · close (8s). Drop the slow map tilt and
the score explanation; the proof and the co-pilot must stay.

---

## 3. Shot list / b-roll to capture (record these clean, in this order)
1. Command Center map — a slow drag + tilt (10s of usable footage).
2. Coverage-by-hour bars (the evening dip).
3. Forecast page — r=0.70 KPI + generating a plan + **tap a team ("why here?")** + the **WhatsApp/CSV** buttons.
4. Full-day Planner (`/day`) — the morning→evening collapse (**361 → 36 → 2**) + the evening blind-spot card.
5. Coverage & ROI — the **38% Proven-impact card** (hold 4s).
6. Ask page — the **mic** click + a spoken query rendering a plan + the conversation history rail.
7. Command Center — the **Data-freshness card** (just show it + its integrity note) + the **Unusual-days** card.
8. (Optional) Offenders page — the CSV target-list buttons.
*(Never record an "add data / ingest" click — there's no such button in the judge UI, by design.)*

Then record the **two talking-head clips** (hook + close), then the **voiceover** over the b-roll.

---

## 4. Numbers to say correctly (don't fumble these on camera)
298,000 tickets · **r = 0.70** · **38% vs 1.3%** on **31 unseen days** · top 1% = 33% · 15% of vehicles = 34% ·
93% before 1 PM · English / Hindi / Kannada.
