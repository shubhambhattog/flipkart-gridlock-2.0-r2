"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api, type Meta, type GridCell } from "@/lib/api";
import { Card, Bars, Spinner } from "@/components/ui";

const HotspotMap = dynamic(() => import("@/components/HotspotMap"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-[var(--muted)]">Loading map…</div>,
});

export default function Home() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [grid, setGrid] = useState<GridCell[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => setErr(true));
    api.grid().then(setGrid).catch(() => setErr(true));
  }, []);

  const fmt = (n: number) => n.toLocaleString("en-IN");

  if (err)
    return (
      <div className="p-8 text-red-300">
        Can&apos;t reach the API. Start the backend: <code>python fullstack/backend/main.py</code> (:8000).
      </div>
    );

  return (
    <div>
      <section className="relative h-[62vh] min-h-[420px] w-full overflow-hidden">
        {grid && <HotspotMap grid={grid} />}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0b0f17]/80 via-transparent to-[#0b0f17]" />
        <div className="pointer-events-none absolute bottom-28 left-8 max-w-2xl">
          <h1 className="text-4xl font-bold leading-[1.15]">
            Turning <span className="text-[var(--accent)]">298,000</span> parking tickets into{" "}
            <span className="text-[var(--accent)]">where to stand tomorrow.</span>
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Detect → Score → Forecast → Deploy → Target. Drag the map to explore violation density.
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {meta &&
              [
                { l: "Violations logged", v: fmt(meta.totals.violations) },
                { l: "Hotspot zones", v: fmt(meta.totals.zones) },
                { l: "Named junctions", v: fmt(meta.totals.junctions) },
                { l: "Repeat-offender load", v: `${meta.repeat.share_pct}%` },
              ].map((k) => (
                <div key={k.l} className="glass rounded-2xl px-5 py-4">
                  <div className="text-2xl font-bold">{k.v}</div>
                  <div className="text-xs text-[var(--muted)]">{k.l}</div>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {!meta ? (
          <Spinner />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <h3 className="text-lg font-bold">When does enforcement happen?</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {meta.coverage_summary.before_1pm}% before 1 PM · {meta.coverage_summary.evening_5_9}% in the
                5–9 PM evening peak — enforcement time, not demand. Evenings are a blind spot.
              </p>
              <div className="mt-5">
                <Bars
                  data={meta.coverage.map((c) => ({ key: c.hour, value: c.share }))}
                  colorFor={(d) =>
                    Number(d.key) >= 17 && Number(d.key) <= 21
                      ? "#E2352B"
                      : Number(d.key) < 13
                        ? "var(--accent)"
                        : "#3a4254"
                  }
                  labels={["12 AM", "12 PM", "11 PM"]}
                />
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-bold">Top impact zones</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">Ranked by Congestion Impact Score</p>
              <ul className="mt-4 space-y-2.5">
                {meta.top_hotspots.slice(0, 8).map((h, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-5 text-sm text-[var(--muted)]">{i + 1}</span>
                    <span className="flex-1 truncate text-sm">{h.label}</span>
                    <span className="text-xs text-[var(--muted)]">{fmt(h.violations)}</span>
                    <div className="h-2 w-20 overflow-hidden rounded bg-[#222b3d]">
                      <div className="h-full" style={{ width: `${h.impact_score}%`, background: "var(--accent)" }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="md:col-span-2">
              <h3 className="text-lg font-bold">Honest forecasting</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Validated on held-out weeks: Pearson r = {meta.backtest.pearson_r}, MAE {meta.backtest.mae}{" "}
                across {fmt(meta.backtest.cells)} cells. Trained on the past, tested on the unseen future — no
                inflated in-sample numbers.
              </p>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
