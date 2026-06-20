"use client";
import { useEffect, useState } from "react";
import { Sun, Sunset, Moon, CalendarClock } from "lucide-react";
import { api, DOW, type PatrolResp } from "@/lib/api";
import { Card, Spinner } from "@/components/ui";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SHIFTS = [
  { key: "morning", label: "Morning", window: "06:00–12:59", h0: 6, h1: 12, icon: Sun, blind: false },
  { key: "afternoon", label: "Afternoon", window: "13:00–16:59", h0: 13, h1: 16, icon: Sunset, blind: false },
  { key: "evening", label: "Evening", window: "17:00–20:59", h0: 17, h1: 20, icon: Moon, blind: true },
] as const;

const fmt = (n: number) => n.toLocaleString("en-IN");
const totalCatches = (r: PatrolResp | null) =>
  r ? Math.round(r.plan.reduce((s, d) => s + d.pred_load, 0)) : 0;

export default function DayPage() {
  const [dow, setDow] = useState(5); // Sat
  const [teams, setTeams] = useState(6);
  const [plans, setPlans] = useState<Record<string, PatrolResp | null>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(false);
    Promise.all(
      SHIFTS.map((s) =>
        api.patrol({ weekday: DOW[dow], start_hour: s.h0, end_hour: s.h1, teams })
          .then((r) => [s.key, r] as const)),
    )
      .then((entries) => { if (alive) { setPlans(Object.fromEntries(entries)); setLoading(false); } })
      .catch(() => { if (alive) { setErr(true); setLoading(false); } });
    return () => { alive = false; };
  }, [dow, teams]);

  if (err)
    return (
      <div className="p-8 text-destructive">
        Can&apos;t reach the API. Start the backend: <code>python fullstack/backend/main.py</code> (:8000).
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6 flex items-start gap-3">
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight">Full-day Planner</h1>
          <p className="mt-1.5 max-w-2xl text-muted-foreground">
            Plan a whole day in one view — teams rotate to chase the demand curve across shifts. The evening
            shift is the <span className="text-foreground">blind spot</span>: deploying there is what starts
            closing it.
          </p>
        </div>
      </header>

      <Card className="mb-6">
        <div className="flex flex-wrap items-end gap-5">
          <div className="space-y-1.5">
            <Label>Weekday</Label>
            <Select value={String(dow)} onValueChange={(v) => setDow(Number(v))}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{DOW.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="w-48 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Teams per shift</Label>
              <span className="text-sm font-semibold tabular-nums text-primary">{teams}</span>
            </div>
            <Slider min={1} max={20} step={1} value={[teams]}
              onValueChange={(v) => setTeams(Array.isArray(v) ? v[0] : v)} className="py-2.5" />
          </div>
        </div>
      </Card>

      {loading ? (
        <Spinner label="Planning all three shifts…" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {SHIFTS.map((s) => {
            const r = plans[s.key] ?? null;
            const Icon = s.icon;
            return (
              <Card key={s.key} className={cn(s.blind && "border-primary/40 bg-primary/[0.03]")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("grid h-9 w-9 place-items-center rounded-lg",
                      s.blind ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold">{s.label}</div>
                      <div className="text-[11px] text-muted-foreground">{s.window} IST</div>
                    </div>
                  </div>
                  {s.blind && <Badge className="gap-1">blind spot</Badge>}
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums">{fmt(totalCatches(r))}</span>
                  <span className="text-xs text-muted-foreground">forecast catches · {r?.plan.length ?? 0} teams</span>
                </div>

                <ol className="mt-4 space-y-1.5">
                  {(r?.plan ?? []).slice(0, 6).map((d, i) => (
                    <li key={d.team} className="flex items-center gap-2 text-sm">
                      <span className="w-4 text-xs text-muted-foreground">{i + 1}</span>
                      <span className="flex-1 truncate">{d.label}</span>
                      <span className="tabular-nums text-muted-foreground">{Math.round(d.pred_load)}</span>
                    </li>
                  ))}
                  {(r?.plan.length ?? 0) === 0 && (
                    <li className="text-sm text-muted-foreground">No forecast hotspots for this shift.</li>
                  )}
                </ol>

                {s.blind && (
                  <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
                    Today &lt;0.3% of enforcement happens here. Deploy a few teams in the evening and those
                    catches become new data — the forecast learns the true evening pattern and the gap closes.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Same team count, three windows — notice how the highest-impact corners shift through the day.
      </p>
    </div>
  );
}
