"use client";
import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-card p-6 ${className}`}>{children}</div>;
}

export function Kpi({
  label, value, hint, icon,
}: {
  label: string; value: ReactNode; hint?: string; icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        {icon && <div className="text-muted-foreground/70">{icon}</div>}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>}
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
            style={{ height: `${(d.value / max) * 100}%`, background: colorFor ? colorFor(d) : "var(--primary)" }}
          />
        ))}
      </div>
      {labels && (
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{labels[0]}</span><span>{labels[1]}</span><span>{labels[2]}</span>
        </div>
      )}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return <div className="grid place-items-center py-24 text-sm text-muted-foreground">{label}</div>;
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}
