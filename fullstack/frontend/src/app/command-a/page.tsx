"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api, type Meta, type GridCell } from "@/lib/api";
import { Spinner } from "@/components/ui";
import CommandInsights from "@/components/CommandInsights";

// PATH A — cinematic full-bleed hero, fixed: map sits on black (no grey seam),
// a left scrim + text-shadow make the headline readable, calmer 3-D hexes.
const HotspotMap = dynamic(() => import("@/components/HotspotMap"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-white/50">Loading map…</div>,
});

export default function CommandA() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [grid, setGrid] = useState<GridCell[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => setErr(true));
    api.grid().then(setGrid).catch(() => setErr(true));
  }, []);

  const fmt = (n: number) => n.toLocaleString("en-IN");
  if (err) return <div className="p-8 text-destructive">Can&apos;t reach the API (:8000).</div>;

  const kpis = meta
    ? [
        { l: "Violations logged", v: fmt(meta.totals.violations) },
        { l: "Hotspot zones", v: fmt(meta.totals.zones) },
        { l: "Named junctions", v: fmt(meta.totals.junctions) },
        { l: "Repeat-offender load", v: `${meta.repeat.share_pct}%` },
      ]
    : [];

  return (
    <div>
      <section className="relative h-[78vh] min-h-[460px] w-full overflow-hidden bg-black">
        {grid && <HotspotMap grid={grid} pitch={35} elevationScale={10} opacity={0.85} zoom={10.5} />}
        {/* readability scrims, all on black → no grey seam with the basemap */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/85 to-transparent" />

        <div className="absolute left-8 top-7 flex items-center gap-2.5">
          <span className="text-2xl">🚦</span>
          <div>
            <div className="text-sm font-semibold text-white">ParkPulse</div>
            <div className="text-[11px] text-white/55">Enforcement Intelligence · Bengaluru</div>
          </div>
        </div>

        <div className="absolute bottom-32 left-8 max-w-xl">
          <h1
            className="text-[2.6rem] font-bold leading-[1.08] text-white"
            style={{ textShadow: "0 2px 30px rgba(0,0,0,0.92)" }}
          >
            Turning 298,000 parking tickets into where to stand tomorrow.
          </h1>
          <p
            className="mt-3 max-w-md text-sm text-white/75"
            style={{ textShadow: "0 1px 16px rgba(0,0,0,0.92)" }}
          >
            Detect → Score → Forecast → Deploy → Target. Drag the map to explore the city&apos;s violation density.
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.l} className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 backdrop-blur">
                <div className="text-2xl font-bold text-white tabular-nums">{k.v}</div>
                <div className="text-xs text-white/60">{k.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {meta ? <CommandInsights meta={meta} /> : <Spinner />}
    </div>
  );
}
