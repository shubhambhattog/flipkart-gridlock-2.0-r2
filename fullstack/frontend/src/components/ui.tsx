"use client";
import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-6 ${className}`}>{children}</div>;
}

export function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="glass rounded-2xl px-5 py-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-[var(--muted)]">{label}</div>
      {hint && <div className="mt-1 text-[10px] text-[var(--muted)]">{hint}</div>}
    </div>
  );
}

/** Simple, dependency-free vertical bar chart. */
export function Bars({
  data, height = 160, colorFor, labels,
}: {
  data: { key: string | number; value: number }[];
  height?: number;
  colorFor?: (d: { key: string | number; value: number }) => string;
  labels?: [string, string, string];
}) {
  const max = Math.max(...data.map((d) => d.value), 1e-9);
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d) => (
          <div
            key={d.key}
            title={`${d.key}: ${d.value}`}
            className="flex-1 rounded-t transition-all"
            style={{ height: `${(d.value / max) * 100}%`, background: colorFor ? colorFor(d) : "var(--accent)" }}
          />
        ))}
      </div>
      {labels && (
        <div className="mt-1 flex justify-between text-[10px] text-[var(--muted)]">
          <span>{labels[0]}</span><span>{labels[1]}</span><span>{labels[2]}</span>
        </div>
      )}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return <div className="grid place-items-center py-24 text-sm text-[var(--muted)]">{label}</div>;
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-[var(--muted)]">{children}</span>;
}
