"use client";
import { useMemo } from "react";
import { DeckGL, HexagonLayer } from "deck.gl";
import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GridCell } from "@/lib/api";

const COLOR_RANGE: [number, number, number][] = [
  [46, 134, 222], [92, 160, 180], [245, 205, 90], [245, 158, 65], [238, 110, 55], [226, 53, 43],
];
const BASEMAP = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function HotspotMap({
  grid,
  zoom = 10.4,
  pitch = 52,
  extruded = true,
  elevationScale = 18,
  coverage = 0.92,
  radius = 160,
  opacity = 1,
}: {
  grid: GridCell[];
  zoom?: number;
  pitch?: number;
  extruded?: boolean;
  elevationScale?: number;
  coverage?: number;
  radius?: number;
  opacity?: number;
}) {
  const layers = useMemo(
    () => [
      new HexagonLayer<GridCell>({
        id: "hex",
        data: grid,
        getPosition: (d) => [d.lon, d.lat],
        getElevationWeight: (d) => d.n,
        getColorWeight: (d) => d.n,
        elevationAggregation: "SUM",
        colorAggregation: "SUM",
        radius,
        elevationScale,
        elevationRange: [0, 2400],
        extruded,
        coverage,
        opacity,
        pickable: true,
        colorRange: COLOR_RANGE,
      }),
    ],
    [grid, extruded, elevationScale, coverage, radius, opacity],
  );

  return (
    // data-lenis-prevent: the map owns the wheel (deck.gl zoom/pan) — Lenis must
    // not also scroll the page when the cursor is over it. This wrapper is a
    // guaranteed ancestor of every wheel target inside the map (the canvas is a
    // child, so a selector-based check on the target alone would miss it).
    <div data-lenis-prevent style={{ position: "absolute", inset: 0 }}>
      <DeckGL
        initialViewState={{ longitude: 77.5946, latitude: 12.9716, zoom, pitch, bearing: 0 }}
        controller
        layers={layers}
        style={{ position: "absolute", inset: "0" }}
      >
        <Map mapStyle={BASEMAP} />
      </DeckGL>
    </div>
  );
}
