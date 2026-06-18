"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { api, type Deployment } from "@/lib/api";
import { Spinner } from "@/components/ui";

const ZoneMap = dynamic(() => import("@/components/ZoneMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 grid place-items-center text-[var(--muted)]">Loading map…</div>
  ),
});

type Msg = { role: "user" | "assistant"; text: string; plan?: Deployment[] | null };

const EXAMPLES = [
  "Where should I send 6 teams on Friday evening?",
  "Plan 8 teams for Saturday morning around KR Market",
  "What are the 5 worst hotspots?",
];

const GREETING: Msg = {
  role: "assistant",
  text:
    "Hi — I'm the ParkPulse co-pilot. Ask me to plan patrols, surface hotspots, or read the forecast. " +
    "Try one of the examples below to get started.",
  plan: null,
};

const fmt = (n: number) => n.toLocaleString("en-IN");

export default function AskPage() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the conversation pinned to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function send(raw: string) {
    const message = raw.trim();
    if (!message || thinking) return;
    setMessages((m) => [...m, { role: "user", text: message }]);
    setInput("");
    setThinking(true);
    try {
      const resp = await api.copilot(message);
      setMessages((m) => [...m, { role: "assistant", text: resp.answer, plan: resp.plan }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Sorry — I couldn't reach the planning engine. Make sure the backend is running and try again.",
          plan: null,
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function fillExample(text: string) {
    setInput(text);
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-[var(--border)] px-6 py-5">
        <h1 className="text-2xl font-bold">Ask ParkPulse 🤖</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Your AI co-pilot for enforcement planning — ask in plain English, Hindi or Kannada.
        </p>
      </header>

      {/* Scrollable conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[var(--accent)] px-4 py-2.5 text-sm text-white">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-sm">
                    🤖
                  </div>
                  <div className="card max-w-[80%] px-4 py-3 text-sm leading-relaxed">{m.text}</div>
                </div>

                {m.plan && m.plan.length > 0 && (
                  <div className="ml-11 flex flex-col gap-4">
                    {/* Deployment table */}
                    <div className="card overflow-hidden p-0">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted)]">
                            <th className="px-4 py-2.5 font-medium">Team</th>
                            <th className="px-4 py-2.5 font-medium">Zone</th>
                            <th className="px-4 py-2.5 text-right font-medium">Exp. catches</th>
                            <th className="px-4 py-2.5 text-right font-medium">Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.plan.map((d) => (
                            <tr key={d.team} className="border-b border-[var(--border)] last:border-0">
                              <td className="px-4 py-2.5 font-medium">{d.team}</td>
                              <td className="px-4 py-2.5">
                                <div className="truncate">{d.label}</div>
                                <div className="text-[11px] text-[var(--muted)]">{d.top_violation}</div>
                              </td>
                              <td className="px-4 py-2.5 text-right tabular-nums">{fmt(d.pred_load)}</td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="ml-auto flex w-24 items-center gap-2">
                                  <div className="h-1.5 flex-1 overflow-hidden rounded bg-[#222b3d]">
                                    <div
                                      className="h-full"
                                      style={{
                                        width: `${Math.min(100, d.impact_score)}%`,
                                        background: "var(--accent)",
                                      }}
                                    />
                                  </div>
                                  <span className="w-7 text-right tabular-nums text-xs text-[var(--muted)]">
                                    {Math.round(d.impact_score)}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Map of the suggested deployment */}
                    <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-[var(--border)]">
                      <ZoneMap zones={[]} plan={m.plan} zoom={11.2} />
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      {m.plan.length} {m.plan.length === 1 ? "team" : "teams"} placed at the highest-impact zones
                      for this window — pins show where to stand.
                    </p>
                  </div>
                )}
              </div>
            ),
          )}

          {thinking && (
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/5 text-sm">🤖</div>
              <div className="card px-4 py-3">
                <Spinner label="thinking…" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer pinned to the bottom */}
      <div className="shrink-0 border-t border-[var(--border)] px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => fillExample(ex)}
                className="rounded-full border border-[var(--border)] bg-white/5 px-3 py-1.5 text-xs text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)]"
              >
                {ex}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask in plain English, Hindi or Kannada…"
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={thinking || !input.trim()}
              className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
