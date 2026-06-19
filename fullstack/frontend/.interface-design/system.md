# ParkPulse — Interface Design System

Enforcement-intelligence dashboard for Bengaluru Traffic Police (Gridlock Hackathon 2.0).
Surface: `fullstack/frontend` (Next.js 16 · React 19 · Tailwind v4 · shadcn/ui Base UI · deck.gl).

## Direction & feel
A **calm, precise operations tool** — a traffic command room, not a marketing site. Data leads; chrome
recedes. We use the **standard shadcn neutral theme** (monochrome greyscale chrome) on purpose, so that
**color only ever carries meaning** — never decoration. Always **dark mode** (`<html class="dark">`).

## Color (the rule that matters most)
- **Chrome is monochrome.** `background / card / popover / secondary / muted / border` are neutral greys;
  `primary` is monochrome (near-white in dark). Build every surface from tokens — never raw hex.
- **Color = signal, three jobs only:**
  - **Severity ramp** (blue → amber → red), in JS `impactColor()` — the signature, used on maps + impact bars.
  - **`chart-2` green** — "good / coverage climbing" (e.g. the ROI curve).
  - **`destructive` red** — warnings, the evening blind-spot bars, the worst repeat offenders.
- No second accent. No gradients-as-decoration. The one allowed glass/gradient is the **map overlay** (`.glass`).

## Depth & shape
- **Borders-only** depth (`border border-border`). Whisper-quiet — borders should disappear until you look
  for them. No drop shadows on surfaces.
- Cards: `bg-card` + 1px border + `rounded-xl` (radius `0.625rem`). Never nest cards in cards.
- Subtle elevation comes from the token greys (card is one step off background), not shadows.

## Spacing & layout
- Page shell: `mx-auto max-w-6xl px-6 py-10`. Card padding `p-6`. Grid gaps `gap-3` (KPI rows) / `gap-6` (sections).
- One density per page (comfortable). KPI rows = 2-up mobile, 4-up desktop.

## Typography
- **Inter** everywhere (`--font-inter`). Headings `font-bold tracking-tight`. Body `text-sm`.
- All numerics use `tabular-nums`. Vehicle IDs / codes use `font-mono`.

## Components
- Prefer shadcn primitives: **Button, Input, Label, Select, Slider, Table, Badge, Tooltip, Tabs, Skeleton**.
  Never raw `<select>`/`<input>` (native dropdowns break the dark theme).
- Custom helpers in `components/ui.tsx`: `Card`, `Kpi` (label + big tabular value + optional icon/hint),
  `Bars` (dependency-free bar chart), `Spinner`, `Pill`.
- Maps: `ZoneMap` (scatter + team pins) and `HotspotMap` (3-D hex density) — deck.gl + maplibre Carto
  dark basemap. Load via `dynamic(..., { ssr: false })`; wrap in a `relative` box with explicit height.
- Icons: **lucide**, quiet, `h-4 w-4` (nav/body) or `h-5 w-5` (page headers). One icon per concept.

## States
Every data view ships **loading (`Spinner`/`Skeleton`), empty, and error** treatments — never bare placeholder
text. Errors use `text-destructive`.

## Signature
Severity-as-signal-light (the blue→amber→red ramp) running through the maps and impact bars, plus the 3-D
hotspot map. If a screen has no severity color and no map, it should still feel like this system through the
monochrome+tabular discipline.
