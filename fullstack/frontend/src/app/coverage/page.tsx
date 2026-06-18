"use client";
import { useEffect, useMemo, useState } from "react";
import { api, DOW, type Meta, type RoiRow, type CoverageRow } from "@/lib/api";
import { Card, Kpi, Bars, Spinner } from "@/components/ui";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const fmt = (n: number) => n.toLocaleString("en-IN");

/** Inline SVG: optimal-targeting curve (green) vs the even-spread baseline (muted). */
function RoiChart({ rows, teams }: { rows: RoiRow[]; teams: number }) {
  const W = 560, H = 220, PAD = { l: 40, r: 16, t: 16, b: 28 };
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const minT = rows[0].teams, maxT = rows[rows.length - 1].teams;
  const x = (t: number) => PAD.l + (maxT === minT ? 0 : (t - minT) / (maxT - minT)) * iw;
  const y = (v: number) => PAD.t + (1 - Math.max(0, Math.min(1, v))) * ih;
  const path = (key: "optimal" | "even") =>
    rows.map((r, i) => `${i === 0 ? "M" : "L"} ${x(r.teams).toFixed(1)} ${y(r[key]).toFixed(1)}`).join(" ");
  const sel = rows.find((r) => r.teams === teams) ?? rows[rows.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Coverage vs number of teams">
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <g key={g}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} className="stroke-border" strokeWidth={1} />
          <text x={PAD.l - 8} y={y(g) + 3} textAnchor="end" fontSize={9} className="fill-muted-foreground">
            {Math.round(g * 100)}%
          </text>
        </g>
      ))}
      <line x1={PAD.l} x2={W - PAD.r} y1={y(0.5)} y2={y(0.5)} className="stroke-muted-foreground/50" strokeWidth={1} strokeDasharray="3 4" />
      <path d={path("even")} fill="none" className="stroke-muted-foreground" strokeWidth={2} strokeDasharray="5 4" />
      <path d={path("optimal")} fill="none" className="stroke-chart-2" strokeWidth={2.5} />
      <line x1={x(sel.teams)} x2={x(sel.teams)} y1={PAD.t} y2={PAD.t + ih} className="stroke-chart-2/40" strokeWidth={1} />
      <circle cx={x(sel.teams)} cy={y(sel.optimal)} r={4.5} className="fill-chart-2 stroke-background" strokeWidth={2} />
      {rows
        .filter((_, i) => i % Math.ceil(rows.length / 8) === 0 || i === rows.length - 1)
        .map((r) => (
          <text key={r.teams} x={x(r.teams)} y={H - 8} textAnchor="middle" fontSize={9} className="fill-muted-foreground">
            {r.teams}
          </text>
        ))}
    </svg>
  );
}

export default function CoveragePage() {
  const [dow, setDow] = useState(0);
  const [start, setStart] = useState(9);
  const [end, setEnd] = useState(13);
  const [teams, setTeams] = useState(8);

  const [roi, setRoi] = useState<RoiRow[] | null>(null);
  const [roiErr, setRoiErr] = useState(false);
  const [roiLoading, setRoiLoading] = useState(true);

  const [coverage, setCoverage] = useState<CoverageRow[] | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [staticErr, setStaticErr] = useState(false);

  useEffect(() => {
    api.coverage().then(setCoverage).catch(() => setStaticErr(true));
    api.meta().then(setMeta).catch(() => setStaticErr(true));
  }, []);

  useEffect(() => {
    setRoiLoading(true);
    setRoiErr(false);
    api.roi(dow, Math.min(start, end), Math.max(start, end))
      .then((rows) => setRoi(rows.slice().sort((a, b) => a.teams - b.teams)))
      .catch(() => setRoiErr(true))
      .finally(() => setRoiLoading(false));
  }, [dow, start, end]);

  const derived = useMemo(() => {
    if (!roi || roi.length === 0) return null;
    const clampTeams = Math.max(roi[0].teams, Math.min(roi[roi.length - 1].teams, teams));
    const row = roi.find((r) => r.teams === clampTeams) ?? roi[roi.length - 1];
    const k50 = roi.find((r) => r.optimal >= 0.5)?.teams ?? null;
    const sweet = roi.find((r) => r.teams >= 3 && r.marginal < 0.01)?.teams ?? null;
    return { row, k50, sweet };
  }, [roi, teams]);

  const hours = Array.from({ length: 24 }, (_, h) => h);
  const hh = (h: number) => `${h.toString().padStart(2, "0")}:00`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Coverage &amp; ROI</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          How much of the problem a handful of well-placed teams can mop up — and the hours enforcement keeps missing.
        </p>
      </header>

      {/* SECTION 1 — STAFFING ROI */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Staffing ROI — targeted vs even</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Concentrate teams on the worst zones for a shift, and see how fast coverage climbs.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Weekday</Label>
              <Select value={String(dow)} onValueChange={(v) => setDow(Number(v))}>
                <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                <SelectContent>{DOW.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Shift start</Label>
              <Select value={String(start)} onValueChange={(v) => setStart(Number(v))}>
                <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                <SelectContent>{hours.map((h) => <SelectItem key={h} value={String(h)}>{hh(h)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Shift end</Label>
              <Select value={String(end)} onValueChange={(v) => setEnd(Number(v))}>
                <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                <SelectContent>{hours.map((h) => <SelectItem key={h} value={String(h)}>{hh(h)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-40 space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] text-muted-foreground">Teams</Label>
                <span className="text-xs font-semibold tabular-nums">{teams}</span>
              </div>
              <Slider min={3} max={20} step={1} value={[teams]} onValueChange={(v) => setTeams(Array.isArray(v) ? v[0] : v)} className="py-2" />
            </div>
          </div>
        </div>

        {roiErr ? (
          <div className="mt-6 text-sm text-destructive">Couldn&apos;t load ROI for this window. Try another shift or weekday.</div>
        ) : roiLoading || !roi || !derived ? (
          <Spinner label="Crunching coverage…" />
        ) : (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Kpi label={`Covered by ${teams} teams`} value={`${Math.round(derived.row.optimal * 100)}%`}
                hint={`vs ${Math.round(derived.row.even * 100)}% if spread evenly (${derived.row.ratio.toFixed(1)}× better)`} />
              <Kpi label="Half the violations sit in" value={derived.k50 != null ? `${derived.k50} zones` : "—"}
                hint={derived.k50 != null ? "smallest team count reaching 50% coverage" : "50% not reached in range"} />
              <Kpi label="Staffing sweet spot" value={derived.sweet != null ? `~${derived.sweet} teams` : "—"}
                hint="beyond here each extra team adds <1%" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <div className="mb-2 flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 bg-chart-2" /> Targeted</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-5 border-t border-dashed border-muted-foreground" /> Even spread</span>
                  <span className="ml-auto">{DOW[dow]} · {hh(Math.min(start, end))}–{hh(Math.max(start, end))}</span>
                </div>
                <RoiChart rows={roi} teams={teams} />
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teams</TableHead>
                      <TableHead className="text-right">Targeted</TableHead>
                      <TableHead className="text-right">Even</TableHead>
                      <TableHead className="text-right">+/team</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roi.filter((r) => r.teams % 2 === 1 || r.teams === teams).map((r) => {
                      const active = r.teams === teams;
                      return (
                        <TableRow key={r.teams} className={cn(active && "bg-accent/60")}>
                          <TableCell className="font-medium">{r.teams}</TableCell>
                          <TableCell className={cn("text-right tabular-nums", active && "font-semibold")}>{Math.round(r.optimal * 100)}%</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{Math.round(r.even * 100)}%</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{(r.marginal * 100).toFixed(1)}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              {derived.k50 != null ? (
                <>Just <span className="font-medium text-foreground">{derived.k50} teams</span> on the right corners cover half of all{" "}
                {DOW[dow]} violations — the same headcount spread evenly clears only{" "}
                {Math.round((roi.find((r) => r.teams === derived.k50)?.even ?? 0) * 100)}%. Targeting pays.</>
              ) : (<>Targeting consistently out-covers an even spread at every team count.</>)}
            </p>
          </>
        )}
      </Card>

      {/* SECTION 2 — COVERAGE BLIND SPOTS */}
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">Coverage blind spots</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Share of enforcement activity by hour of day — when officers actually write tickets.
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" /> Morning (&lt;1 PM)</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-destructive" /> Evening peak (5–9 PM)</span>
          </div>
        </div>

        {staticErr ? (
          <div className="mt-6 text-sm text-destructive">Couldn&apos;t load coverage data right now.</div>
        ) : !coverage || !meta ? (
          <Spinner label="Loading coverage…" />
        ) : (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Kpi label="Tickets written before 1 PM" value={`${meta.coverage_summary.before_1pm}%`} hint="enforcement front-loads the morning" />
              <Kpi label="Written in the 5–9 PM peak" value={`${meta.coverage_summary.evening_5_9}%`} hint="when congestion is actually worst" />
              <Kpi label="Busiest single hour"
                value={hh(coverage.reduce((a, b) => (b.share > a.share ? b : a)).hour)}
                hint={`${fmt(coverage.reduce((a, b) => (b.share > a.share ? b : a)).violations)} violations logged`} />
            </div>

            <div className="mt-6">
              <Bars
                data={coverage.map((c) => ({ key: c.hour, value: c.share }))}
                height={180}
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

            <p className="mt-4 text-sm text-muted-foreground">
              Targeting pays, but timing leaks: {meta.coverage_summary.before_1pm}% of tickets land before 1 PM while only{" "}
              {meta.coverage_summary.evening_5_9}% hit the 5–9 PM rush. Evenings are the blind spot.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
