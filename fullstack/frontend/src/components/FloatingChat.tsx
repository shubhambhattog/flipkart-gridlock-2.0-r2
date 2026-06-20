"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, X, Send, ArrowUpRight, Sparkles, RotateCcw } from "lucide-react";
import { api, type Deployment, type ChatTurn } from "@/lib/api";
import { ThinkingDots } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Msg = { role: "user" | "assistant"; text: string; plan?: Deployment[] | null };

const NAV = [
  { href: "/", label: "Command Center" },
  { href: "/explorer", label: "Hotspot Explorer" },
  { href: "/forecast", label: "Forecast & Patrol" },
  { href: "/day", label: "Full-day Planner" },
  { href: "/coverage", label: "Coverage & ROI" },
  { href: "/offenders", label: "Repeat Offenders" },
  { href: "/ask", label: "Ask ParkPulse" },
];

const GREETING: Msg = {
  role: "assistant",
  text:
    "Hi! I'm your ParkPulse guide. Ask what a feature does, where to find something, or to plan patrols — " +
    "or jump straight there with a shortcut below.",
  plan: null,
};

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, open]);

  async function send(raw: string) {
    const message = raw.trim();
    if (!message || thinking) return;
    const history: ChatTurn[] = messages.slice(1).map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    setThinking(true);
    try {
      const resp = await api.assistant(message, history);
      setMessages((m) => [...m, { role: "assistant", text: resp.answer, plan: resp.plan }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "I couldn't reach the assistant — make sure the backend is running.", plan: null },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function newChat() {
    setMessages([GREETING]);
    setInput("");
    setThinking(false);
    inputRef.current?.focus();
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open ParkPulse assistant"}
        className="fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-1 ring-black/10 transition-transform hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[560px] max-h-[78vh] w-[min(380px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold leading-tight">ParkPulse Assistant</div>
              <div className="text-[11px] text-muted-foreground">Navigation + help · guardrailed</div>
            </div>
            <button onClick={newChat} aria-label="New chat" title="New chat" className="text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button onClick={() => setOpen(false)} aria-label="Close" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 border-b border-border px-3 py-2.5">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {n.label} <ArrowUpRight className="h-3 w-3" />
              </Link>
            ))}
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-[13px] text-primary-foreground">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex flex-col gap-2">
                  <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-border bg-secondary/40 px-3 py-2 text-[13px] leading-relaxed">
                    {m.text}
                  </div>
                  {m.plan && m.plan.length > 0 && (
                    <div className="rounded-lg border border-border text-xs">
                      {m.plan.slice(0, 8).map((d) => (
                        <div key={d.team} className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-1.5 last:border-0">
                          <span className="font-medium">{d.team}</span>
                          <span className="flex-1 truncate text-muted-foreground">{d.label}</span>
                          <span className="tabular-nums">{Math.round(d.pred_load)}</span>
                        </div>
                      ))}
                      <Link href="/forecast" onClick={() => setOpen(false)} className="block px-3 py-1.5 text-[11px] text-primary hover:underline">
                        Open Forecast &amp; Patrol →
                      </Link>
                    </div>
                  )}
                </div>
              ),
            )}
            {thinking && <div className="px-1"><ThinkingDots /></div>}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 border-t border-border p-3">
            <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask or navigate…" className="flex-1" />
            <Button type="submit" size="icon" disabled={thinking || !input.trim()} aria-label="Send">
              <Send />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
