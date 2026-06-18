"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { api, DOW, type Zone, type ExplorerResp } from "@/lib/api";
import { Card, Kpi, Spinner } from "@/components/ui";

const ZoneMap = dynamic(() => import("@/components/ZoneMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center text-[var(--muted-foreground)]">Loading map…</div>
  ),
});

type Facets = { types: string[]; stations: string[]; dows: string[] };

const fmt = (n: number) => n.toLocaleString("en-IN");
const hourLabel = (h: number) => {
  const ap = h < 12 ? "AM" : "PM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${ap}`;
};

/** Local chip-toggle multiselect used for weekdays / types / stations. */
function MultiSelect({
  options,
  selected,
  onToggle,
  onAll,
  onNone,
  allLabel = "All",
  noneLabel = "Clear",
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  onAll: () => void;
  onNone: () => void;
  allLabel?: string;
  noneLabel?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              aria-pressed={on}
              className={`rounded-full px-3 py-1 text-xs transition-colors ${
                on
                  ? "bg-[var(--primary)] text-white"
                  : "bg-white/5 text-[var(--muted-foreground)] hover:bg-white/10"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-3 text-[11px] text-[var(--muted-foreground)]">
        <button type="button" onClick={onAll} className="hover:text-[var(--text)]">
          {allLabel}
        </button>
        <span className="opacity-40">·</span>
        <button type="button" onClick={onNone} className="hover:text-[var(--text)]">
          {noneLabel}
        </button>
      </div>
    </div>
  );
}

export default function ExplorerPage() {
  const [facets, setFacets] = useState<Facets | null>(null);
  const [facetsErr, setFacetsErr] = useState(false);

  const [dows, setDows] = useState<string[]>([...DOW]);
  const [h0, setH0] = useState(6);
  const [h1, setH1] = useState(13);
  const [types, setTypes] = useState<string[]>([]);
  const [stations, setStations] = useState<string[]>([]);
  // typesReady guards the initial default-all selection until facets arrive.
  const [typesReady, setTypesReady] = useState(false);

  const [res, setRes] = useState<ExplorerResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  // Load filter options; default every violation type to selected.
  useEffect(() => {
    api
      .facets()
      .then((f) => {
        setFacets(f);
        setTypes(f.types);
        setTypesReady(true);
      })
      .catch(() => setFacetsErr(true));
  }, []);

  // Re-query whenever any control changes (after facets/types are seeded).
  useEffect(() => {
    if (!typesReady) return;
    let alive = true;
    setLoading(true);
    setErr(false);
    const lo = Math.min(h0, h1);
    const hi = Math.max(h0, h1);
    api
      .explorer({ dows, h0: lo, h1: hi, types, stations })
      .then((r) => {
        if (alive) setRes(r);
      })
      .catch(() => {
        if (alive) setErr(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [dows, h0, h1, types, stations, typesReady]);

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const zones: Zone[] = res?.zones ?? [];
  const count = res?.count ?? 0;
  const topZones = useMemo(
    () => [...zones].sort((a, b) => b.impact_score - a.impact_score).slice(0, 15),
    [zones],
  );
  const maxImpact = useMemo(
    () => Math.max(...topZones.map((z) => z.impact_score), 1e-9),
    [topZones],
  );

  const stationLabel =
    stations.length === 0 ? "all stations" : `${stations.length} station${stations.length > 1 ? "s" : ""}`;

  if (facetsErr)
    return (
      <div className="p-8 text-red-300">
        Can&apos;t reach the API. Start the backend: <code>python fullstack/backend/main.py</code> (:8000).
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Hotspot Explorer</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Slice 298,000 violations by day, hour, type and police station — hotspots re-rank live as you
          filter.
        </p>
      </header>

      {!facets ? (
        <Spinner label="Loading filters…" />
      ) : (
        <>
          {/* Controls */}
          <Card className="mb-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Weekdays
                </div>
                <MultiSelect
                  options={DOW}
                  selected={dows}
                  onToggle={(v) => setDows((p) => toggle(p, v))}
                  onAll={() => setDows([...DOW])}
                  onNone={() => setDows([])}
                />
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Hour range
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    From
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={h0}
                      onChange={(e) =>
                        setH0(Math.max(0, Math.min(23, Number(e.target.value) || 0)))
                      }
                      className="w-16 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    To
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={h1}
                      onChange={(e) =>
                        setH1(Math.max(0, Math.min(23, Number(e.target.value) || 0)))
                      }
                      className="w-16 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 py-1.5 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]"
                    />
                  </label>
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {hourLabel(Math.min(h0, h1))} – {hourLabel(Math.max(h0, h1))}
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Violation types
                </div>
                <MultiSelect
                  options={facets.types}
                  selected={types}
                  onToggle={(v) => setTypes((p) => toggle(p, v))}
                  onAll={() => setTypes(facets.types)}
                  onNone={() => setTypes([])}
                />
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Police stations{" "}
                  <span className="font-normal normal-case text-[10px]">(none = all)</span>
                </div>
                <MultiSelect
                  options={facets.stations}
                  selected={stations}
                  onToggle={(v) => setStations((p) => toggle(p, v))}
                  onAll={() => setStations(facets.stations)}
                  onNone={() => setStations([])}
                  allLabel="Select all"
                  noneLabel="All (clear)"
                />
              </div>
            </div>
          </Card>

          {/* KPIs */}
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi label="Matching violations" value={fmt(count)} hint={`${stationLabel}`} />
            <Kpi
              label="Active zones"
              value={fmt(zones.length)}
              hint={dows.length ? `${dows.length} of 7 weekdays` : "no weekdays"}
            />
            <Kpi
              label="Window"
              value={`${hourLabel(Math.min(h0, h1))}–${hourLabel(Math.max(h0, h1))}`}
              hint={`${Math.abs(Math.max(h0, h1) - Math.min(h0, h1)) + 1} hour band`}
            />
            <Kpi
              label="Types selected"
              value={`${types.length}/${facets.types.length}`}
              hint="violation categories"
            />
          </div>

          {err ? (
            <Card className="text-red-300">
              Couldn&apos;t load matching hotspots. Adjust the filters or try again.
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-5">
              {/* Map */}
              <div className="lg:col-span-3">
                <div className="relative h-[460px] overflow-hidden rounded-2xl border border-[var(--border)]">
                  {loading && !res ? (
                    <div className="absolute inset-0 grid place-items-center text-[var(--muted-foreground)]">
                      Loading…
                    </div>
                  ) : zones.length === 0 ? (
                    <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-[var(--muted-foreground)]">
                      No violations match these filters. Widen the hour range or add weekdays / types.
                    </div>
                  ) : (
                    <ZoneMap zones={zones} />
                  )}
                  {loading && res && (
                    <div className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] text-[var(--muted-foreground)]">
                      Updating…
                    </div>
                  )}
                </div>
              </div>

              {/* Ranked table */}
              <div className="lg:col-span-2">
                <Card className="h-[460px] overflow-hidden">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-bold">Top zones</h3>
                    <span className="text-xs text-[var(--muted-foreground)]">by impact score</span>
                  </div>
                  {zones.length === 0 ? (
                    <p className="mt-6 text-sm text-[var(--muted-foreground)]">
                      No matching zones yet — relax a filter to surface hotspots.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: 372 }}>
                      {topZones.map((z, i) => (
                        <li key={z.gh6} className="flex items-center gap-3">
                          <span className="w-5 text-right text-sm text-[var(--muted-foreground)]">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm">{z.label}</div>
                            <div className="truncate text-[11px] text-[var(--muted-foreground)]">
                              {z.top_violation}
                            </div>
                          </div>
                          <span className="text-xs text-[var(--muted-foreground)]">{fmt(z.violations)}</span>
                          <div className="h-2 w-16 overflow-hidden rounded bg-[#222b3d]">
                            <div
                              className="h-full"
                              style={{
                                width: `${(z.impact_score / maxImpact) * 100}%`,
                                background: "var(--primary)",
                              }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-[var(--muted-foreground)]">
            Showing {fmt(zones.length)} zones · {fmt(count)} violations across{" "}
            {dows.length || "no"} weekday{dows.length === 1 ? "" : "s"} · hotspots re-rank live as you
            filter.
          </p>
        </>
      )}
    </div>
  );
}
