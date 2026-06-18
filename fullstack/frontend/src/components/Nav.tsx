"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Command Center", icon: "🚦" },
  { href: "/explorer", label: "Hotspot Explorer", icon: "🗺️" },
  { href: "/forecast", label: "Forecast & Patrol", icon: "🚓" },
  { href: "/coverage", label: "Coverage & ROI", icon: "🎯" },
  { href: "/offenders", label: "Repeat Offenders", icon: "🔁" },
  { href: "/ask", label: "Ask ParkPulse", icon: "🤖" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="flex h-full w-60 shrink-0 flex-col gap-1 border-r border-[var(--border)] bg-[#0b0f17] p-4">
      <div className="mb-4 px-2">
        <div className="text-lg font-bold">🚦 ParkPulse</div>
        <div className="text-[11px] text-[var(--muted)]">Enforcement Intelligence</div>
      </div>
      {LINKS.map((l) => {
        const active = path === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/5"
            style={{
              background: active ? "rgba(76,139,245,0.16)" : undefined,
              color: active ? "#fff" : "var(--muted)",
            }}
          >
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
