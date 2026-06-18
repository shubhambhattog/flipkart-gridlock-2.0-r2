"use client";
import { useEffect, useState } from "react";
import { api, type Meta, type Offender } from "@/lib/api";
import { Card, Kpi, Bars, Spinner, Pill } from "@/components/ui";

export default function OffendersPage() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [offenders, setOffenders] = useState<Offender[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => setErr(true));
    api.offenders().then(setOffenders).catch(() => setErr(true));
  }, []);

  const fmt = (n: number) => n.toLocaleString("en-IN");

  if (err)
    return (
      <div className="p-8 text-red-300">
        Can&apos;t reach the API. Start the backend: <code>python fullstack/backend/main.py</code> (:8000).
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Repeat-Offender Intelligence</h1>
          <Pill>🔁 owner notices · escalation · tow priority</Pill>
        </div>
        <p className="mt-2 max-w-2xl text-[var(--muted-foreground)]">
          A small group of vehicles is caught again and again. Surfacing them turns reactive ticketing into
          targeted accountability.
        </p>
      </header>

      {!meta || !offenders ? (
        <Spinner label="Loading offender intelligence…" />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Unique vehicles" value={fmt(meta.repeat.unique)} hint="distinct plates seen" />
            <Kpi
              label="Repeat offenders"
              value={fmt(meta.repeat.repeat_vehicles)}
              hint="caught more than once"
            />
            <Kpi
              label="Their share of violations"
              value={`${meta.repeat.share_pct}%`}
              hint="of all tickets logged"
            />
            <Kpi
              label="Worst offender"
              value={`${fmt(meta.repeat.worst)}×`}
              hint="times the single worst plate was caught"
            />
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-bold">Top 25 repeat offenders</h3>
                <span className="text-xs text-[var(--muted-foreground)]">Times caught</span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Ranked by the number of distinct violations attributed to each vehicle.
              </p>
              <div className="mt-4 max-h-[460px] overflow-y-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-[#141926] text-left text-xs text-[var(--muted-foreground)]">
                    <tr>
                      <th className="w-12 py-2 pr-2 font-medium">#</th>
                      <th className="py-2 pr-2 font-medium">Vehicle</th>
                      <th className="w-28 py-2 pr-2 text-right font-medium">Times caught</th>
                      <th className="w-24 py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {offenders.slice(0, 25).map((o, i) => {
                      const max = offenders[0]?.violations || 1;
                      return (
                        <tr key={o.vehicle} className="border-t border-[var(--border)]">
                          <td className="py-2 pr-2 text-[var(--muted-foreground)]">{i + 1}</td>
                          <td className="py-2 pr-2 font-mono">{o.vehicle}</td>
                          <td className="py-2 pr-2 text-right font-semibold">{fmt(o.violations)}</td>
                          <td className="py-2">
                            <div className="h-2 w-full overflow-hidden rounded bg-[#222b3d]">
                              <div
                                className="h-full"
                                style={{
                                  width: `${(o.violations / max) * 100}%`,
                                  background: i < 3 ? "#E2352B" : "var(--primary)",
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid content-start gap-6 lg:col-span-2">
              <Card>
                <h3 className="text-lg font-bold">Offence frequency, top 25</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  The steep drop-off is the signal: a handful of plates tower over the rest.
                </p>
                <div className="mt-5">
                  <Bars
                    data={offenders.slice(0, 25).map((o, i) => ({ key: i + 1, value: o.violations }))}
                    colorFor={(d) => (Number(d.key) <= 3 ? "#E2352B" : "var(--primary)")}
                    labels={["#1", "#13", "#25"]}
                  />
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-bold">Why this list matters</h3>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Vehicles caught many times aren&apos;t random — they&apos;re prime candidates for{" "}
                  <span className="text-[var(--text)]">owner notices</span>,{" "}
                  <span className="text-[var(--text)]">escalated penalties</span>, and{" "}
                  <span className="text-[var(--text)]">tow priority</span>. Acting on the top of this list
                  removes the most persistent congestion sources first.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill>📮 owner notice</Pill>
                  <Pill>⬆️ escalated penalty</Pill>
                  <Pill>🚛 tow priority</Pill>
                </div>
              </Card>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
            {meta.repeat.share_pct}% of violations trace back to repeat offenders — roughly{" "}
            <span className="text-[var(--text)]">15% of vehicles cause a third of all violations.</span>
          </p>
        </>
      )}
    </div>
  );
}
