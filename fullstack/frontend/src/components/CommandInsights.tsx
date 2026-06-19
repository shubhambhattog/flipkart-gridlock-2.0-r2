"use client";
import { Card, Bars } from "@/components/ui";
import type { Meta } from "@/lib/api";

export default function CommandInsights({ meta }: { meta: Meta }) {
  const fmt = (n: number) => n.toLocaleString("en-IN");
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="text-lg font-bold">When does enforcement happen?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta.coverage_summary.before_1pm}% before 1 PM · {meta.coverage_summary.evening_5_9}% in the 5–9 PM
            evening peak — enforcement time, not demand. Evenings are a blind spot.
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
          <p className="mt-1 text-sm text-muted-foreground">Ranked by Congestion Impact Score</p>
          <ul className="mt-4 space-y-2.5">
            {meta.top_hotspots.slice(0, 8).map((h, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-5 text-sm text-muted-foreground">{i + 1}</span>
                <span className="flex-1 truncate text-sm">{h.label}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{fmt(h.violations)}</span>
                <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${h.impact_score}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="md:col-span-2">
          <h3 className="text-lg font-bold">Honest forecasting</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Validated on held-out weeks: Pearson r = {meta.backtest.pearson_r}, MAE {meta.backtest.mae} across{" "}
            {fmt(meta.backtest.cells)} cells. Trained on the past, tested on the unseen future — no inflated
            in-sample numbers.
          </p>
        </Card>
      </div>
    </section>
  );
}
