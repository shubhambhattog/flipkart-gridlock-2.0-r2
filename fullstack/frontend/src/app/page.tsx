"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Database, AlertTriangle, ShieldCheck } from "lucide-react";
import { api, type Meta, type GridCell, type Anomaly } from "@/lib/api";
import { Card, Bars, Spinner } from "@/components/ui";

const HotspotMap = dynamic(() => import("@/components/HotspotMap"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-[var(--muted-foreground)]">Loading map…</div>,
});

export default function Home() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [grid, setGrid] = useState<GridCell[] | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => setErr(true));
    api.grid().then(setGrid).catch(() => setErr(true));
    api.anomalies().then((r) => setAnomalies(r.anomalies)).catch(() => {});
  }, []);

  const fmt = (n: number) => n.toLocaleString("en-IN");

  if (err)
    return (
      <div className="p-8 text-destructive">
        Can&apos;t reach the API. Start the backend: <code>python fullstack/backend/main.py</code> (:8000).
      </div>
    );

  return (
    <div>
      <section className="relative h-[62vh] min-h-[420px] w-full overflow-hidden">
        {grid && <HotspotMap grid={grid} />}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/85 via-transparent to-background" />

        {/* map legend — what the colours and hexagon heights mean (for a first-time viewer) */}
        <div className="glass pointer-events-none absolute right-4 top-4 w-52 rounded-xl px-4 py-3">
          <div className="text-xs font-semibold">Parking-violation density</div>
          <div
            className="mt-2 h-2.5 w-full rounded-full"
            style={{
              background:
                "linear-gradient(to right, rgb(46,134,222), rgb(92,160,180), rgb(245,205,90), rgb(245,158,65), rgb(238,110,55), rgb(226,53,43))",
            }}
          />
          <div className="mt-1 flex justify-between text-[10px] text-foreground/70">
            <span>Low</span>
            <span>High</span>
          </div>
          <div className="mt-2.5 flex items-center gap-2 text-[10px] text-foreground/70">
            <span className="flex items-end gap-0.5">
              <span className="inline-block w-1.5 rounded-sm bg-foreground/40" style={{ height: 6 }} />
              <span className="inline-block w-1.5 rounded-sm bg-foreground/60" style={{ height: 11 }} />
              <span className="inline-block w-1.5 rounded-sm bg-foreground/80" style={{ height: 16 }} />
            </span>
            Taller hexagon = more violations
          </div>
        </div>
        {/* soft dark blurred scrim behind the headline → readable over the map */}
        <div
          className="pointer-events-none absolute bottom-10 left-0 h-80 w-[720px] max-w-full"
          style={{
            background:
              "radial-gradient(closest-side at 26% 52%, rgba(0,0,0,0.92), rgba(0,0,0,0.6) 42%, rgba(0,0,0,0) 72%)",
            filter: "blur(14px)",
          }}
        />
        <div className="pointer-events-none absolute bottom-24 left-5 right-5 max-w-2xl md:bottom-28 md:left-8 md:right-auto">
          <h1 className="text-3xl font-bold leading-[1.15] md:text-4xl" style={{ textShadow: "0 2px 26px rgba(0,0,0,0.9)" }}>
            Turning <span className="text-[var(--primary)]">298,000</span> parking tickets into{" "}
            <span className="text-[var(--primary)]">where to stand tomorrow.</span>
          </h1>
          <p className="mt-3 text-foreground/80" style={{ textShadow: "0 1px 16px rgba(0,0,0,0.9)" }}>
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
                  <div className="text-xs text-[var(--muted-foreground)]">{k.l}</div>
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
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {meta.coverage_summary.before_1pm}% before 1 PM · {meta.coverage_summary.evening_5_9}% in the
                5–9 PM evening peak — enforcement time, not demand. Evenings are a blind spot.
              </p>
              <div className="mt-5">
                <Bars
                  data={meta.coverage.map((c) => ({ key: c.hour, value: c.share }))}
                  colorFor={(d) =>
                    Number(d.key) >= 17 && Number(d.key) <= 21
                      ? "var(--destructive)"
                      : Number(d.key) < 13
                        ? "var(--primary)"
                        : "var(--muted)"
                  }
                  labels={["12 AM", "12 PM", "11 PM"]}
                />
              </div>
            </Card>
            <Card>
              <h3 className="text-lg font-bold">Top impact zones</h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Ranked by Congestion Impact Score</p>
              <ul className="mt-4 space-y-2.5">
                {meta.top_hotspots.slice(0, 8).map((h, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="w-5 text-sm text-[var(--muted-foreground)]">{i + 1}</span>
                    <span className="flex-1 truncate text-sm">{h.label}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{fmt(h.violations)}</span>
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${h.impact_score}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold">Data freshness</h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Built to ingest new challans and rebuild the models in seconds — ready for a nightly BTP feed.
                  </p>
                </div>
                <Database className="h-5 w-5 text-[var(--muted-foreground)]/60" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums">{fmt(meta.totals.violations)}</span>
                <span className="text-xs text-[var(--muted-foreground)]">violations loaded</span>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-[var(--muted-foreground)]">
                <li><code className="text-foreground">POST /ingest</code> — new records cleaned, appended, models rebuilt in place.</li>
                <li><code className="text-foreground">POST /refresh</code> — pull a fresh dataset live, no restart.</li>
              </ul>
              <p className="mt-4 flex items-start gap-2 rounded-md bg-secondary/50 px-3 py-2 text-[11px] text-[var(--muted-foreground)]">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]" />
                <span>Integrity: the competition dataset stays fixed. This pipeline is the architecture for live BTP
                data — described here, not run on the hackathon records.</span>
              </p>
            </Card>

            <Card>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold">Unusual days</h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Spikes well above the norm for that weekday — likely events or festivals.
                  </p>
                </div>
                <AlertTriangle className="h-5 w-5 text-[var(--muted-foreground)]/60" />
              </div>
              {anomalies.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--muted-foreground)]">No strong anomalies detected.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {anomalies.slice(0, 5).map((a) => (
                    <li key={a.date} className="flex items-center gap-3 text-sm">
                      <span className="w-24 shrink-0 tabular-nums text-[var(--muted-foreground)]">{a.date}</span>
                      <span className="w-8 text-xs text-[var(--muted-foreground)]">{a.weekday}</span>
                      <span className="flex-1 font-medium tabular-nums">{fmt(a.violations)}</span>
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-medium text-destructive">
                        +{a.pct_above}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="md:col-span-2">
              <h3 className="text-lg font-bold">Honest forecasting</h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
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
