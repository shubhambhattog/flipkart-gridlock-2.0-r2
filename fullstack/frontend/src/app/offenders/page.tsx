"use client";
import { useEffect, useState } from "react";
import { Mail, TrendingUp, Truck } from "lucide-react";
import { api, type Meta, type Offender } from "@/lib/api";
import { Card, Kpi, Bars, Spinner } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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
      <div className="p-8 text-destructive">
        Can&apos;t reach the API. Start the backend: <code>python fullstack/backend/main.py</code> (:8000).
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Repeat-Offender Intelligence</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
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
            <Kpi label="Repeat offenders" value={fmt(meta.repeat.repeat_vehicles)} hint="caught more than once" />
            <Kpi label="Their share of violations" value={`${meta.repeat.share_pct}%`} hint="of all tickets logged" />
            <Kpi label="Worst offender" value={`${fmt(meta.repeat.worst)}×`} hint="times the single worst plate was caught" />
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3 p-0">
              <div className="flex items-baseline justify-between p-6 pb-3">
                <div>
                  <h3 className="text-lg font-bold">Top 25 repeat offenders</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ranked by distinct violations per vehicle.
                  </p>
                </div>
              </div>
              <div className="max-h-[460px] overflow-y-auto px-2 pb-2">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead className="text-right">Times caught</TableHead>
                      <TableHead className="w-28" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offenders.slice(0, 25).map((o, i) => {
                      const max = offenders[0]?.violations || 1;
                      const hot = i < 3;
                      return (
                        <TableRow key={o.vehicle}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-mono text-[13px]">{o.vehicle}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">{fmt(o.violations)}</TableCell>
                          <TableCell>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div className={cn("h-full", hot ? "bg-destructive" : "bg-primary")}
                                style={{ width: `${(o.violations / max) * 100}%` }} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <div className="grid content-start gap-6 lg:col-span-2">
              <Card>
                <h3 className="text-lg font-bold">Offence frequency, top 25</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  The steep drop-off is the signal: a handful of plates tower over the rest.
                </p>
                <div className="mt-5">
                  <Bars
                    data={offenders.slice(0, 25).map((o, i) => ({ key: i + 1, value: o.violations }))}
                    colorFor={(d) => (Number(d.key) <= 3 ? "var(--destructive)" : "var(--primary)")}
                    labels={["#1", "#13", "#25"]}
                  />
                </div>
              </Card>

              <Card>
                <h3 className="text-lg font-bold">Why this list matters</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Vehicles caught many times aren&apos;t random — they&apos;re prime candidates for{" "}
                  <span className="text-foreground">owner notices</span>,{" "}
                  <span className="text-foreground">escalated penalties</span>, and{" "}
                  <span className="text-foreground">tow priority</span>. Acting on the top of this list removes
                  the most persistent congestion sources first.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1"><Mail className="h-3 w-3" /> owner notice</Badge>
                  <Badge variant="secondary" className="gap-1"><TrendingUp className="h-3 w-3" /> escalated penalty</Badge>
                  <Badge variant="secondary" className="gap-1"><Truck className="h-3 w-3" /> tow priority</Badge>
                </div>
              </Card>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {meta.repeat.share_pct}% of violations trace back to repeat offenders — roughly{" "}
            <span className="text-foreground">15% of vehicles cause a third of all violations.</span>
          </p>
        </>
      )}
    </div>
  );
}
