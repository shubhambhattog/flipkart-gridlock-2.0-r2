"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Download, Siren, MapPin } from "lucide-react";
import { api, DOW, type Zone, type PatrolResp } from "@/lib/api";
import { Card, Kpi, Spinner } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const ZoneMap = dynamic(() => import("@/components/ZoneMap"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-muted-foreground">Loading map…</div>,
});

const clampHour = (n: number) => Math.max(0, Math.min(23, Math.round(n)));
const fmt = (n: number) => n.toLocaleString("en-IN");

export default function ForecastPage() {
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [zonesErr, setZonesErr] = useState(false);

  const [dow, setDow] = useState(5); // Sat
  const [start, setStart] = useState(9);
  const [end, setEnd] = useState(13);
  const [teams, setTeams] = useState(8);
  const [area, setArea] = useState("");

  const [resp, setResp] = useState<PatrolResp | null>(null);
  const [planErr, setPlanErr] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.zones().then(setZones).catch(() => setZonesErr(true));
  }, []);

  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  const trimmedArea = area.trim();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setPlanErr(false);
    const t = setTimeout(() => {
      api
        .patrol({ weekday: DOW[dow], start_hour: lo, end_hour: hi, teams, area: trimmedArea || undefined })
        .then((r) => { if (alive) { setResp(r); setLoading(false); } })
        .catch(() => { if (alive) { setPlanErr(true); setLoading(false); } });
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [dow, lo, hi, teams, trimmedArea]);

  const plan = resp?.plan ?? [];
  const totalCatches = useMemo(() => plan.reduce((s, d) => s + d.pred_load, 0), [plan]);

  function downloadCsv() {
    if (!resp || plan.length === 0) return;
    const header = ["Team", "Deploy to", "Cell", "Lat", "Lon", "Exp catches", "Impact", "Avg severity", "Top violation"];
    const rows = plan.map((d) =>
      [d.team, d.label, d.gh6, d.lat, d.lon, d.pred_load, d.impact_score, d.avg_severity, d.top_violation]
        .map((v) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; })
        .join(","));
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `parkpulse-patrol-${DOW[dow]}-${lo}-${hi}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (zonesErr)
    return (
      <div className="p-8 text-destructive">
        Can&apos;t reach the API. Start the backend: <code>python fullstack/backend/main.py</code> (:8000).
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6 flex items-start gap-3">
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <Siren className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight">Forecast &amp; Patrol Planner</h1>
          <p className="mt-1.5 max-w-2xl text-muted-foreground">
            Pick a day and a shift window — we forecast where violations will cluster and place every team
            where congestion will build, before it does.
          </p>
        </div>
      </header>

      {/* controls */}
      <Card className="mb-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label>Weekday</Label>
            <Select value={String(dow)} onValueChange={(v) => setDow(Number(v))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DOW.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Shift start (hour)</Label>
            <Input type="number" min={0} max={23} value={start}
              onChange={(e) => setStart(clampHour(Number(e.target.value)))} />
          </div>
          <div className="space-y-1.5">
            <Label>Shift end (hour)</Label>
            <Input type="number" min={0} max={23} value={end}
              onChange={(e) => setEnd(clampHour(Number(e.target.value)))} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Teams</Label>
              <span className="text-sm font-semibold tabular-nums text-primary">{teams}</span>
            </div>
            <Slider min={1} max={20} step={1} value={[teams]}
              onValueChange={(v) => setTeams(Array.isArray(v) ? v[0] : v)} className="py-2.5" />
          </div>
          <div className="space-y-1.5">
            <Label>Area (optional)</Label>
            <Input type="text" value={area} placeholder="e.g. Koramangala"
              onChange={(e) => setArea(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Teams placed" value={resp ? fmt(resp.teams) : "—"} />
        <Kpi label="Shift window" value={resp ? resp.window : "—"} hint={DOW[dow]} />
        <Kpi label="Forecast catches" value={resp ? fmt(Math.round(totalCatches)) : "—"} hint="summed predicted load" />
        <Kpi label="Focus area" value={trimmedArea || "All Bengaluru"} hint={trimmedArea ? "filtered" : "city-wide"} />
      </div>

      {/* map */}
      <Card className="mb-6 overflow-hidden p-0">
        <div className="relative h-[480px] w-full">
          {zones ? <ZoneMap zones={zones} plan={plan} />
                 : <div className="absolute inset-0 grid place-items-center text-muted-foreground">Loading map…</div>}
          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" /> forecast hotspots</Badge>
            <Badge className="gap-1"><Siren className="h-3 w-3" /> {plan.length || teams} teams</Badge>
          </div>
        </div>
      </Card>

      {/* deployment table */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">Deployment plan</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {resp ? `${DOW[dow]}, ${resp.window} — ${plan.length} ${plan.length === 1 ? "team" : "teams"}` : "Building plan…"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadCsv} disabled={!resp || plan.length === 0}>
            <Download /> Download CSV
          </Button>
        </div>

        {loading ? (
          <Spinner label="Forecasting hotspots…" />
        ) : planErr ? (
          <div className="py-10 text-center text-sm text-destructive">
            Couldn&apos;t build a plan for that window. Try a different day, window, or area.
          </div>
        ) : plan.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No forecast hotspots matched these filters. Widen the window or clear the area.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Deploy to</TableHead>
                <TableHead>Top violation</TableHead>
                <TableHead className="text-right">Exp. catches</TableHead>
                <TableHead className="w-[160px]">Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.map((d) => (
                <TableRow key={d.team}>
                  <TableCell className="font-semibold text-primary">{d.team}</TableCell>
                  <TableCell>
                    <div className="truncate font-medium">{d.label}</div>
                    <div className="text-[11px] text-muted-foreground">{d.gh6}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.top_violation}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{fmt(d.pred_load)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full bg-primary"
                          style={{ width: `${Math.max(0, Math.min(100, d.impact_score))}%` }} />
                      </div>
                      <span className="w-7 text-right text-xs tabular-nums text-muted-foreground">
                        {Math.round(d.impact_score)}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Every team starts where congestion will build, before it does.
        </p>
      </Card>
    </div>
  );
}
