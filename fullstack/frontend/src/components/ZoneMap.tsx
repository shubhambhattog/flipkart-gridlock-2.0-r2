"use client";
import { useMemo } from "react";
import { DeckGL, ScatterplotLayer, TextLayer } from "deck.gl";
import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { impactColor, type Zone, type Deployment } from "@/lib/api";

const BASEMAP = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export type MapZone = Zone & { size?: number };

/** Reusable deck.gl map: zone bubbles (sized by violations or a custom `size`),
 *  optionally overlaid with patrol-team pins + labels. Wrap in a position:relative box. */
export default function ZoneMap({
  zones, plan = [], center, zoom = 10.6, pitch = 40, useSize = false,
}: {
  zones: MapZone[];
  plan?: Deployment[];
  center?: { lat: number; lon: number };
  zoom?: number;
  pitch?: number;
  useSize?: boolean;
}) {
  const layers = useMemo(() => {
    const zoneLayer = new ScatterplotLayer<MapZone>({
      id: "zones",
      data: zones,
      getPosition: (d) => [d.lon, d.lat],
      getRadius: (d) => {
        const v = useSize ? d.size ?? 0 : d.violations;
        return Math.min(900, Math.max(45, Math.sqrt(Math.max(0, v)) * (useSize ? 26 : 7)));
      },
      getFillColor: (d) => {
        const [r, g, b] = impactColor(d.impact_score);
        return [r, g, b, plan.length ? 110 : 175];
      },
      stroked: true,
      getLineColor: [255, 255, 255, 50],
      lineWidthMinPixels: 0.5,
      pickable: true,
    });
    const planLayers = plan.length
      ? [
          new ScatterplotLayer<Deployment>({
            id: "halo", data: plan, getPosition: (d) => [d.lon, d.lat],
            getRadius: 420, getFillColor: [76, 139, 245, 55],
          }),
          new ScatterplotLayer<Deployment>({
            id: "pin", data: plan, getPosition: (d) => [d.lon, d.lat],
            getRadius: 120, getFillColor: [76, 139, 245], stroked: true,
            getLineColor: [255, 255, 255], lineWidthMinPixels: 2, pickable: true,
          }),
          new TextLayer<Deployment>({
            id: "tlabel", data: plan, getPosition: (d) => [d.lon, d.lat],
            getText: (d) => d.team, getSize: 12, getColor: [255, 255, 255],
            getPixelOffset: [0, -20], getAlignmentBaseline: "bottom" as const,
          }),
        ]
      : [];
    return [zoneLayer, ...planLayers];
  }, [zones, plan, useSize]);

  const c = center ?? (plan.length ? { lat: plan[0].lat, lon: plan[0].lon } : { lat: 12.9716, lon: 77.5946 });

  return (
    <DeckGL
      initialViewState={{ longitude: c.lon, latitude: c.lat, zoom, pitch, bearing: 0 }}
      controller
      layers={layers}
      style={{ position: "absolute", inset: "0" }}
      getTooltip={({ object }) => {
        if (!object) return null;
        const o = object as Partial<Deployment & MapZone>;
        return {
          html: o.team
            ? `<b>${o.team} → ${o.label}</b><br/>Exp. catches: ${o.pred_load}`
            : `<b>${o.label}</b><br/>Violations: ${o.violations}<br/>Impact: ${o.impact_score}`,
          style: { backgroundColor: "#161B26", color: "#E6E9EF", fontSize: "12px" },
        };
      }}
    >
      <Map mapStyle={BASEMAP} />
    </DeckGL>
  );
}
