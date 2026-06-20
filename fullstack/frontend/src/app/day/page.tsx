"use client";
import { useEffect, useState } from "react";
import { Sun, Sunset, Moon, CalendarClock, ArrowRightLeft } from "lucide-react";
import { api, DOW, type PatrolResp, type CoverageRow } from "@/lib/api";
import { Card, Spinner } from "@/components/ui";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SHIFTS = [
  { key: "morning", label: "Morning", window: "06:00–12:59", h0: 6, h1: 12, icon: Sun },
  { key: "afternoon", label: "Afternoon", window: "13:00–16:59", h0: 13, h1: 16, icon: Sunset },
  { key: "evening", label: "Evening", window: "17:00–20:59", h0: 17, h1: 20, icon: Moon },
] as const;

const fmt = (n: number) => n.toLocaleString("en-IN");
const totalCatches = (r: PatrolResp | null) =>
  r ? Math.round(r.plan.reduce((s, d) => s + d.pred_load, 0)) : 0;
// coverage shares are fractions; show one decimal for the tiny blind-spot values
const pctFmt = (x: number) => (x * 100 < 1 ? (x * 100).toFixed(1) : Math.round(x * 100).toString());

export default function DayPage() {
  const [dow, setDow] = useState(5); // Sat
  const [teams, setTeams] = useState(6);
  const [plans, setPlans] = useState<Record<string, PatrolResp | null>>({});
  const [coverage, setCoverage] = useState<CoverageRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  // enforcement coverage by hour — used to DERIVE which shift is the blind spot (not hardcoded)
  useEffect(() => {
    api.coverage().then(setCoverage).catch(() => setCoverage(null));
  }, []);

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

  // ---- DERIVED blind spot: the shift with the lowest historical enforcement coverage ----
  // share of all logged enforcement that falls in each shift's window (re-derives as data changes)
  const covShare = (h0: number, h1: number) =>
    coverage ? coverage.filter((c) => c.hour >= h0 && c.hour <= h1).reduce((s, c) => s + c.share, 0) : null;
  const shiftCov: Record<string, number> = Object.fromEntries(
    SHIFTS.map((s) => [s.key, covShare(s.h0, s.h1) ?? 0]),
  );
  const blindKey = coverage
    ? SHIFTS.map((s) => s.key).reduce((a, b) => (shiftCov[b] < shiftCov[a] ? b : a))
    : null;
  const mostKey = coverage
    ? SHIFTS.map((s) => s.key).reduce((a, b) => (shiftCov[b] > shiftCov[a] ? b : a))
    : null;
  const blindLabel = SHIFTS.find((s) => s.key === blindKey)?.label ?? "evening";

  if (err)
    return (
      <div className="p-8 text-destructive">
        Can&apos;t reach the API. Start the backend: <code>python fullstack/backend/main.py</code> (:8000).
      </div>
    );

  // Reallocation nudge: shift the marginal (long-tail) teams from the MOST-covered shift to the DERIVED
  // blind spot. Quantify the forecast-load cost so the trade is honest. All numbers come from the model.
  const reallocation = (() => {
    if (loading || !blindKey || !mostKey || blindKey === mostKey) return null;
    const src = plans[mostKey]?.plan ?? [];
    if (src.length < 2) return null;
    const srcTotal = totalCatches(plans[mostKey] ?? null);
    const blindTotal = totalCatches(plans[blindKey] ?? null);
    const top = src[0]?.pred_load ?? 0;
    const marginal = src.filter((d, i) => i >= 1 && d.pred_load < top * 0.2).length; // clearly low-value tail
    const n = Math.min(marginal, Math.max(1, Math.floor(teams / 3)));
    if (n < 1) return null;
    const cost = src.slice(src.length - n).reduce((s, d) => s + d.pred_load, 0);
    const pct = srcTotal ? Math.round((cost / srcTotal) * 100) : 0;
    return {
      n, cost: Math.round(cost), pct, srcTotal, blindTotal,
      srcLabel: SHIFTS.find((x) => x.key === mostKey)?.label ?? "",
      blindLabel: SHIFTS.find((x) => x.key === blindKey)?.label ?? "",
    };
  })();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6 flex items-start gap-3">
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight">Full-day Planner</h1>
          <p className="mt-1.5 max-w-2xl text-muted-foreground">
            Plan a whole day in one view — teams rotate to chase the demand curve across shifts. The
            least-enforced shift (<span className="text-foreground">derived from the data</span>) is the blind
            spot: deploying there is what starts closing it.
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
            const isBlind = s.key === blindKey;
            const cov = coverage ? shiftCov[s.key] : null;
            return (
              <Card key={s.key} className={cn(isBlind && "border-primary/40 bg-primary/[0.03]")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("grid h-9 w-9 place-items-center rounded-lg",
                      isBlind ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold">{s.label}</div>
                      <div className="text-[11px] text-muted-foreground">{s.window} IST</div>
                    </div>
                  </div>
                  {isBlind && <Badge className="gap-1">blind spot</Badge>}
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tabular-nums">{fmt(totalCatches(r))}</span>
                  <span className="text-xs text-muted-foreground">forecast catches · {r?.plan.length ?? 0} teams</span>
                </div>
                {cov != null && (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    <span className="tabular-nums text-foreground">{pctFmt(cov)}%</span> of all logged enforcement is in this window
                  </div>
                )}

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

                {isBlind && cov != null && (
                  <p className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
                    Only <span className="tabular-nums text-foreground">{pctFmt(cov)}%</span> of enforcement is logged
                    here — the lowest of any shift. Deploy a few teams and those catches become new data; the forecast
                    learns the true pattern and the gap closes.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {reallocation && (
        <Card className="mt-6 border-primary/40 bg-primary/[0.04]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="font-semibold">
                Reallocation nudge — shift {reallocation.n} team{reallocation.n > 1 ? "s" : ""} from{" "}
                {reallocation.srcLabel.toLowerCase()} to {reallocation.blindLabel.toLowerCase()}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {reallocation.srcLabel} is heavily covered
                (<span className="font-medium tabular-nums text-foreground">{fmt(reallocation.srcTotal)}</span> forecast
                catches); {reallocation.blindLabel.toLowerCase()} is the blind spot
                (<span className="font-medium tabular-nums text-foreground">{fmt(reallocation.blindTotal)}</span>). Moving
                the {reallocation.n} lowest-load {reallocation.srcLabel.toLowerCase()} team{reallocation.n > 1 ? "s" : ""}{" "}
                costs only <span className="font-medium tabular-nums text-foreground">~{fmt(reallocation.cost)}</span> catches
                ({reallocation.pct}% of that plan) — but those teams collect the {reallocation.blindLabel.toLowerCase()}{" "}
                data that teaches the forecast the true pattern, and starts closing the gap.
              </p>
            </div>
          </div>
        </Card>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Same team count, three windows — notice how the highest-impact corners shift through the day.
      </p>
    </div>
  );
}
