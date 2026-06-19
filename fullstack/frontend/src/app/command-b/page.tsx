"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LayoutDashboard } from "lucide-react";
import { api, type Meta, type GridCell } from "@/lib/api";
import { Card, Kpi, Spinner } from "@/components/ui";
import CommandInsights from "@/components/CommandInsights";

// PATH B — proper dashboard: title + KPIs in normal flow (fully readable),
// the map lives inside a framed Card (no page-bg seam), flat top-down hex heatmap.
const HotspotMap = dynamic(() => import("@/components/HotspotMap"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-muted-foreground">Loading map…</div>,
});

export default function CommandB() {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [grid, setGrid] = useState<GridCell[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api.meta().then(setMeta).catch(() => setErr(true));
    api.grid().then(setGrid).catch(() => setErr(true));
  }, []);

  const fmt = (n: number) => n.toLocaleString("en-IN");
  if (err) return <div className="p-8 text-destructive">Can&apos;t reach the API (:8000).</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6 flex items-start gap-3">
        <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight">Command Center</h1>
          <p className="mt-1.5 max-w-2xl text-muted-foreground">
            Turning <span className="font-semibold text-foreground">298,000</span> parking-violation records into
            targeted enforcement — where violations cluster, when they recur, and where to deploy.
          </p>
        </div>
      </header>

      {/* KPIs in normal flow — always readable */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {meta ? (
          <>
            <Kpi label="Violations logged" value={fmt(meta.totals.violations)} />
            <Kpi label="Hotspot zones" value={fmt(meta.totals.zones)} />
            <Kpi label="Named junctions" value={fmt(meta.totals.junctions)} />
            <Kpi label="Repeat-offender load" value={`${meta.repeat.share_pct}%`} />
          </>
        ) : (
          <>
            <Kpi label="Violations logged" value="—" />
            <Kpi label="Hotspot zones" value="—" />
            <Kpi label="Named junctions" value="—" />
            <Kpi label="Repeat-offender load" value="—" />
          </>
        )}
      </div>

      {/* Map as a framed panel — no bleed into the page bg */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="text-sm font-semibold">City-wide violation density</div>
          <div className="text-xs text-muted-foreground">geohash hex bins · brighter = more violations</div>
        </div>
        <div className="relative h-[440px] w-full">
          {grid ? (
            <HotspotMap grid={grid} extruded={false} pitch={0} coverage={1} radius={185} opacity={0.92} zoom={10.6} />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">Loading map…</div>
          )}
        </div>
      </Card>

      {meta ? <CommandInsights meta={meta} /> : <Spinner />}
    </div>
  );
}
