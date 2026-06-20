"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPinned, Siren, Target, RotateCcw, Bot, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/explorer", label: "Hotspot Explorer", icon: MapPinned },
  { href: "/forecast", label: "Forecast & Patrol", icon: Siren },
  { href: "/day", label: "Full-day Planner", icon: CalendarClock },
  { href: "/coverage", label: "Coverage & ROI", icon: Target },
  { href: "/offenders", label: "Repeat Offenders", icon: RotateCcw },
  { href: "/ask", label: "Ask ParkPulse", icon: Bot },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="flex h-full w-60 shrink-0 flex-col gap-0.5 border-r border-border bg-sidebar p-3">
      <div className="mb-5 flex items-center gap-2.5 px-2 py-1">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
          <Siren className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">ParkPulse</div>
          <div className="text-[11px] text-muted-foreground">Enforcement Intelligence</div>
        </div>
      </div>
      {LINKS.map((l) => {
        const active = path === l.href;
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/12 font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className={cn("h-4 w-4", active && "text-primary")} />
            <span>{l.label}</span>
          </Link>
        );
      })}
      <div className="mt-auto px-3 pt-4 text-[10px] leading-relaxed text-muted-foreground/70">
        Gridlock Hackathon 2.0
        <br />
        Bengaluru Traffic Police
      </div>
    </nav>
  );
}
