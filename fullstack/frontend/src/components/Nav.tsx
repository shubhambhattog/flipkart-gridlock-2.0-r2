"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPinned, Siren, Target, RotateCcw, Bot, CalendarClock, PlayCircle, Menu, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; icon: LucideIcon; badge?: string };

const LINKS: NavLink[] = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/explorer", label: "Hotspot Explorer", icon: MapPinned },
  { href: "/forecast", label: "Forecast & Patrol", icon: Siren },
  { href: "/day", label: "Full-day Planner", icon: CalendarClock },
  { href: "/coverage", label: "Coverage & ROI", icon: Target },
  { href: "/offenders", label: "Repeat Offenders", icon: RotateCcw },
  { href: "/ask", label: "Ask ParkPulse", icon: Bot },
  { href: "/pitch", label: "Pitch Video", icon: PlayCircle, badge: "New" },
];

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
        <Siren className="h-4 w-4" />
      </div>
      <div>
        <div className="text-sm font-semibold leading-tight">ParkPulse</div>
        <div className="text-[11px] text-muted-foreground">Enforcement Intelligence</div>
      </div>
    </div>
  );
}

function NavLinks({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return (
    <>
      {LINKS.map((l) => {
        const active = path === l.href;
        const Icon = l.icon;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-primary/12 font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className={cn("h-4 w-4", active && "text-primary")} />
            <span>{l.label}</span>
            {l.badge && (
              <span className="relative ml-auto inline-flex">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50" />
                <span className="relative rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wide text-primary-foreground">
                  {l.badge}
                </span>
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}

const FOOTER = (
  <div className="mt-auto px-3 pt-4 text-[10px] leading-relaxed text-muted-foreground/70">
    Gridlock Hackathon 2.0
    <br />
    Bengaluru Traffic Police
  </div>
);

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* mobile top bar (hidden on md+) */}
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-sidebar px-4 py-2.5 md:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Brand />
      </header>

      {/* desktop sidebar — unchanged at md+ */}
      <nav className="hidden h-full w-60 shrink-0 flex-col gap-0.5 border-r border-border bg-sidebar p-3 md:flex">
        <div className="mb-5 px-2 py-1">
          <Brand />
        </div>
        <NavLinks path={path} />
        {FOOTER}
      </nav>

      {/* mobile slide-in drawer */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <nav className="absolute left-0 top-0 flex h-full w-64 max-w-[80vw] flex-col gap-0.5 border-r border-border bg-sidebar p-3">
            <div className="mb-3 flex items-center justify-between px-2 py-1">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavLinks path={path} onNavigate={() => setOpen(false)} />
            {FOOTER}
          </nav>
        </div>
      )}
    </>
  );
}
