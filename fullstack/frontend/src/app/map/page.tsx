"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api, type GridCell } from "@/lib/api";

// Full-viewport, headline-free version of the Command Center hero map — for clean PPT screenshots.
//   /map        → map + density legend + a small (croppable) back link
//   /map?bare   → just the map, nothing overlaid (a clean hero background)
const HotspotMap = dynamic(() => import("@/components/HotspotMap"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-muted-foreground">Loading map…</div>,
});

export default function FullMapPage() {
  const [grid, setGrid] = useState<GridCell[] | null>(null);
  const [err, setErr] = useState(false);
  const [bare, setBare] = useState(false);

  useEffect(() => {
    setBare(new URLSearchParams(window.location.search).has("bare"));
    api.grid().then(setGrid).catch(() => setErr(true));
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {err ? (
        <div className="grid h-full place-items-center p-8 text-center text-destructive">
          Can&apos;t reach the API. Start the backend: <code>python fullstack/backend/main.py</code> (:8000).
        </div>
      ) : (
        <>
          {grid && <HotspotMap grid={grid} />}

          {!bare && (
            <>
              {/* density legend (same as the hero) — drag the map under it, or crop it out */}
              <div className="glass pointer-events-none absolute right-4 top-4 w-52 rounded-xl px-4 py-3">
                <div className="text-xs font-semibold">Parking-violation density</div>
                <div
                  className="mt-2 h-2.5 w-full rounded-full"
                  style={{
                    background:
                      "linear-gradient(to right, rgb(46,134,222), rgb(92,160,180), rgb(245,205,90), rgb(245,158,65), rgb(238,110,55), rgb(226,53,43))",
                  }}
                />
                <div className="mt-1 flex justify-between text-[10px] text-foreground/70">
                  <span>Low</span>
                  <span>High</span>
                </div>
                <div className="mt-2.5 flex items-center gap-2 text-[10px] text-foreground/70">
                  <span className="flex items-end gap-0.5">
                    <span className="inline-block w-1.5 rounded-sm bg-foreground/40" style={{ height: 6 }} />
                    <span className="inline-block w-1.5 rounded-sm bg-foreground/60" style={{ height: 11 }} />
                    <span className="inline-block w-1.5 rounded-sm bg-foreground/80" style={{ height: 16 }} />
                  </span>
                  Taller hexagon = more violations
                </div>
              </div>

              {/* small back link — easy to crop out of a screenshot */}
              <Link
                href="/"
                className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Link>
            </>
          )}
        </>
      )}
    </div>
  );
}
