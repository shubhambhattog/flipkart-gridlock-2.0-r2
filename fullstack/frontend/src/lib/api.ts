// Typed client for the ParkPulse FastAPI backend. Single source of truth for data + types.
// Base URL from NEXT_PUBLIC_API_URL (set in .env.local → http://localhost:8000).

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}`);
  return r.json();
}
async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`POST ${path} → ${r.status}`);
  return r.json();
}

// ---------------------------------------------------------------- types
export type Zone = {
  gh6: string; lat: number; lon: number; label: string; violations: number;
  impact_score: number; avg_severity: number; junction_frac: number;
  main_road_frac: number; top_violation: string;
};
export type GridCell = { lat: number; lon: number; n: number };
export type CoverageRow = { hour: number; violations: number; share: number };
export type RoiRow = { teams: number; optimal: number; even: number; ratio: number; marginal: number };
export type Offender = { vehicle: string; violations: number };
export type Deployment = {
  team: string; gh6: string; lat: number; lon: number; label: string;
  pred_load: number; impact_score: number; avg_severity: number; top_violation: string;
};
export type Meta = {
  totals: { violations: number; zones: number; days: number; junctions: number };
  coverage: { hour: number; share: number }[];
  coverage_summary: { before_1pm: number; evening_5_9: number };
  repeat: { unique: number; repeat_vehicles: number; share_pct: number; worst: number };
  backtest: { pearson_r: number; mae: number; cells: number; cutoff: string };
  top_hotspots: { label: string; violations: number; impact_score: number }[];
  dow_names: string[];
};
export type PatrolReq = { weekday: string; start_hour: number; end_hour: number; teams: number; area?: string };
export type PatrolResp = { weekday: string; window: string; teams: number; plan: Deployment[] };
export type ExplorerResp = { count: number; zones: Zone[] };

export const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ---------------------------------------------------------------- client
export const api = {
  meta: () => get<Meta>("/meta"),
  zones: () => get<Zone[]>("/zones"),
  grid: () => get<GridCell[]>("/grid"),
  coverage: () => get<CoverageRow[]>("/coverage"),
  offenders: () => get<Offender[]>("/offenders"),
  facets: () => get<{ types: string[]; stations: string[]; dows: string[] }>("/facets"),
  forecast: (dow: number, hours: number[]) =>
    get<{ gh6: string; pred_load: number }[]>(`/forecast?dow=${dow}&hours=${hours.join(",")}`),
  roi: (dow: number, start: number, end: number) =>
    get<RoiRow[]>(`/roi?dow=${dow}&start=${start}&end=${end}`),
  explorer: (p: { dows: string[]; h0: number; h1: number; types: string[]; stations: string[] }) =>
    get<ExplorerResp>(
      `/explorer?dows=${p.dows.join(",")}&h0=${p.h0}&h1=${p.h1}` +
        `&types=${encodeURIComponent(p.types.join("|"))}&stations=${encodeURIComponent(p.stations.join("|"))}`),
  patrol: (b: PatrolReq) => post<PatrolResp>("/patrol", b),
  copilot: (message: string) => post<{ answer: string; plan: Deployment[] | null }>("/copilot", { message }),
  assistant: (message: string) => post<{ answer: string; plan: Deployment[] | null }>("/assistant", { message }),
};

// blue → amber → red ramp for an impact score (0–100)
export function impactColor(score: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = [
    [0, [46, 134, 222]], [45, [245, 205, 90]], [70, [245, 158, 65]], [100, [226, 53, 43]],
  ];
  const s = Math.max(0, Math.min(100, score));
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i], [b, cb] = stops[i + 1];
    if (s <= b) {
      const t = b === a ? 0 : (s - a) / (b - a);
      return [0, 1, 2].map((j) => Math.round(ca[j] + (cb[j] - ca[j]) * t)) as [number, number, number];
    }
  }
  return stops[stops.length - 1][1];
}
