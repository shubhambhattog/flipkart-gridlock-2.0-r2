"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { api, DOW, type Zone, type PatrolResp } from "@/lib/api";
import { Card, Kpi, Spinner, Pill } from "@/components/ui";

const ZoneMap = dynamic(() => import("@/components/ZoneMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center text-[var(--muted)]">Loading map…</div>
  ),
});

const clampHour = (n: number) => Math.max(0, Math.min(23, Math.round(n)));
const fmt = (n: number) => n.toLocaleString("en-IN");

export default function ForecastPage() {
  // base zones (faint backdrop) — fetched once
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [zonesErr, setZonesErr] = useState(false);

  // controls
  const [dow, setDow] = useState(5); // Sat
  const [start, setStart] = useState(9);
  const [end, setEnd] = useState(13);
  const [teams, setTeams] = useState(8);
  const [area, setArea] = useState("");

  // patrol response
  const [resp, setResp] = useState<PatrolResp | null>(null);
  const [planErr, setPlanErr] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .zones()
      .then(setZones)
      .catch(() => setZonesErr(true));
  }, []);

  // normalise the window so start is always the earlier hour
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  const trimmedArea = area.trim();

  // refetch the plan whenever any control settles (debounced so typing feels smooth)
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setPlanErr(false);
    const t = setTimeout(() => {
      api
        .patrol({
          weekday: DOW[dow],
          start_hour: lo,
          end_hour: hi,
          teams,
          area: trimmedArea || undefined,
        })
        .then((r) => {
          if (alive) {
            setResp(r);
            setLoading(false);
          }
        })
        .catch(() => {
          if (alive) {
            setPlanErr(true);
            setLoading(false);
          }
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [dow, lo, hi, teams, trimmedArea]);

  const plan = resp?.plan ?? [];
  const totalCatches = useMemo(
    () => plan.reduce((s, d) => s + d.pred_load, 0),
    [plan],
  );

  function downloadCsv() {
    if (!resp || plan.length === 0) return;
    const header = ["Team", "Deploy to", "Cell", "Lat", "Lon", "Exp catches", "Impact", "Avg severity", "Top violation"];
    const rows = plan.map((d) =>
      [
        d.team,
        d.label,
        d.gh6,
        d.lat,
        d.lon,
        d.pred_load,
        d.impact_score,
        d.avg_severity,
        d.top_violation,
      ]
        .map((v) => {
          const s = String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    );
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
      <div className="p-8 text-red-300">
        Can&apos;t reach the API. Start the backend: <code>python fullstack/backend/main.py</code> (:8000).
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold leading-tight">
          Forecast &amp; <span className="text-[var(--accent)]">Patrol Planner</span>
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Pick a day and a shift window. We forecast where violations will cluster and place every
          team where congestion will build — before it does.
        </p>
      </header>

      {/* controls */}
      <Card className="mb-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--muted)]">Weekday</span>
            <select
              value={dow}
              onChange={(e) => setDow(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--border)] bg-[#0d111a] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            >
              {DOW.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--muted)]">Shift start (hour)</span>
            <input
              type="number"
              min={0}
              max={23}
              value={start}
              onChange={(e) => setStart(clampHour(Number(e.target.value)))}
              className="w-full rounded-lg border border-[var(--border)] bg-[#0d111a] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--muted)]">Shift end (hour)</span>
            <input
              type="number"
              min={0}
              max={23}
              value={end}
              onChange={(e) => setEnd(clampHour(Number(e.target.value)))}
              className="w-full rounded-lg border border-[var(--border)] bg-[#0d111a] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--muted)]">
              Teams <span className="text-[var(--accent)]">{teams}</span>
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={3}
                max={20}
                value={teams}
                onChange={(e) => setTeams(Number(e.target.value))}
                className="h-2 flex-1 accent-[var(--accent)]"
              />
              <input
                type="number"
                min={3}
                max={20}
                value={teams}
                onChange={(e) =>
                  setTeams(Math.max(3, Math.min(20, Math.round(Number(e.target.value) || 3))))
                }
                className="w-16 rounded-lg border border-[var(--border)] bg-[#0d111a] px-2 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--muted)]">Area (optional)</span>
            <input
              type="text"
              value={area}
              placeholder="e.g. Koramangala"
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[#0d111a] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>
      </Card>

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Teams placed" value={resp ? fmt(resp.teams) : "—"} />
        <Kpi label="Shift window" value={resp ? resp.window : "—"} hint={DOW[dow]} />
        <Kpi
          label="Forecast catches"
          value={resp ? fmt(Math.round(totalCatches)) : "—"}
          hint="summed predicted load"
        />
        <Kpi
          label="Focus area"
          value={trimmedArea || "All Bengaluru"}
          hint={trimmedArea ? "filtered" : "city-wide"}
        />
      </div>

      {/* map */}
      <Card className="mb-6 overflow-hidden p-0">
        <div className="relative h-[480px] w-full">
          {zones ? (
            <ZoneMap zones={zones} plan={plan} />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-[var(--muted)]">
              Loading map…
            </div>
          )}
          <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
            <Pill>Faint bubbles = forecast hotspots</Pill>
            <Pill>Blue pins = your {plan.length || teams} teams</Pill>
          </div>
        </div>
      </Card>

      {/* deployment table */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">Deployment plan</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {resp
                ? `${DOW[dow]}, ${resp.window} — ${plan.length} ${plan.length === 1 ? "team" : "teams"}`
                : "Building plan…"}
            </p>
          </div>
          <button
            onClick={downloadCsv}
            disabled={!resp || plan.length === 0}
            className="rounded-lg border border-[var(--border)] bg-[#0d111a] px-4 py-2 text-sm font-medium transition-colors hover:border-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            ⬇ Download CSV
          </button>
        </div>

        {loading ? (
          <Spinner label="Forecasting hotspots…" />
        ) : planErr ? (
          <div className="py-10 text-center text-sm text-red-300">
            Couldn&apos;t build a plan for that window. Try a different day, window, or area.
          </div>
        ) : plan.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--muted)]">
            No forecast hotspots matched these filters. Widen the window or clear the area.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted)]">
                  <th className="px-3 py-2 font-medium">Team</th>
                  <th className="px-3 py-2 font-medium">Deploy to</th>
                  <th className="px-3 py-2 font-medium">Top violation</th>
                  <th className="px-3 py-2 text-right font-medium">Exp. catches</th>
                  <th className="px-3 py-2 font-medium">Impact</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((d) => (
                  <tr
                    key={d.team}
                    className="border-b border-[var(--border)]/60 transition-colors hover:bg-white/5"
                  >
                    <td className="px-3 py-2.5 font-semibold text-[var(--accent)]">{d.team}</td>
                    <td className="px-3 py-2.5">
                      <div className="truncate font-medium">{d.label}</div>
                      <div className="text-[11px] text-[var(--muted)]">{d.gh6}</div>
                    </td>
                    <td className="px-3 py-2.5 text-[var(--muted)]">{d.top_violation}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                      {fmt(d.pred_load)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded bg-[#222b3d]">
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.max(0, Math.min(100, d.impact_score))}%`,
                              background: "var(--accent)",
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs tabular-nums text-[var(--muted)]">
                          {Math.round(d.impact_score)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-[var(--muted)]">
          Every team starts where congestion will build, before it does.
        </p>
      </Card>
    </div>
  );
}
