import type { Metadata } from "next";
import { ExternalLink, Radar, Gauge, LineChart, Siren, RotateCcw, Bot } from "lucide-react";
import { Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pitch Video — ParkPulse",
  description: "A 3-minute walkthrough of ParkPulse: how 298,000 parking tickets become targeted enforcement for the Bengaluru Traffic Police.",
};

const VIDEO_ID = "dsKGPK2QUkw";

// what a judge should look for in the video — mirrors the product's Detect → Score → Forecast → Deploy → Target spine
const HIGHLIGHTS = [
  { icon: Radar, title: "Detect", body: "298,000 challans collapse into a live hotspot map — where violations actually cluster, not where we guess." },
  { icon: Gauge, title: "Score", body: "Every zone gets a Congestion Impact Score, so a blocked arterial outranks a quiet lane with the same ticket count." },
  { icon: LineChart, title: "Forecast", body: "A Bayesian-shrunk model predicts demand by weekday × hour — validated on held-out weeks, not inflated in-sample." },
  { icon: Siren, title: "Deploy", body: "Greedy max-coverage allocation places patrol teams 600 m apart for the chosen window — no overlap, no blind spots." },
  { icon: RotateCcw, title: "Target", body: "Repeat-offender vehicles surface with a recommended action — owner notice, escalated penalty, or tow priority." },
  { icon: Bot, title: "Ask ParkPulse", body: "A Gemini co-pilot turns plain English — “plan six teams for Friday evening near KR Market” — into a deployable plan, and is honest when a window is a blind spot." },
];

export default function PitchPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-6">
        <div className="text-xs font-medium uppercase tracking-wide text-primary">Gridlock Hackathon 2.0 · Submission</div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">The 3-minute pitch</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The full ParkPulse story — the problem, the pipeline, and a live walkthrough of the dashboard you&apos;re looking at.
          Watch the video, then explore the tabs in the sidebar.
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
        <div className="relative aspect-video w-full bg-black">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0&modestbranding=1`}
            title="ParkPulse pitch video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Trouble with the embed? Open it directly on YouTube.</p>
        <a
          href={`https://www.youtube.com/watch?v=${VIDEO_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Watch on YouTube
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <Card className="mt-8">
        <h2 className="text-lg font-bold">What to watch for</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          ParkPulse runs one spine end to end — each step maps to a tab in the sidebar.
        </p>
        <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">{title}</div>
                <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
