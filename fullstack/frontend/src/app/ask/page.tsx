"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Bot, Send, Mic, Plus, Trash2, MessageSquare } from "lucide-react";
import { api, type Deployment, type ChatTurn } from "@/lib/api";
import { ThinkingDots } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const ZoneMap = dynamic(() => import("@/components/ZoneMap"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 grid place-items-center text-muted-foreground">Loading map…</div>,
});

type Msg = { role: "user" | "assistant"; text: string; plan?: Deployment[] | null };
type Conversation = { id: string; title: string; messages: Msg[]; createdAt: number; updatedAt: number };

const STORE_KEY = "parkpulse.conversations";
const MAX_CONVOS = 50;
const GROUPS = ["Today", "Yesterday", "Earlier"] as const;

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
const ts = () => Date.now();
const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const titleFrom = (s: string) => {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > 42 ? t.slice(0, 42) + "…" : t || "New chat";
};
function groupLabel(t: number): (typeof GROUPS)[number] {
  const d = new Date(t);
  const now = new Date();
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, now)) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (same(d, y)) return "Yesterday";
  return "Earlier";
}
/** apply fn to the conversation with `id`, stamp updatedAt, and float it to the top (most-recent-first). */
function touch(list: Conversation[], id: string, fn: (c: Conversation) => Conversation): Conversation[] {
  return list
    .map((c) => (c.id === id ? { ...fn(c), updatedAt: ts() } : c))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function BotAvatar() {
  return (
    <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground">
      <Bot className="h-4 w-4" />
    </div>
  );
}

export default function AskPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false); // becomes true only on the client, after reading localStorage
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // ---- load saved conversations once, client-side (avoids SSR hydration mismatch) ----
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      const list: Conversation[] = raw ? JSON.parse(raw) : [];
      if (Array.isArray(list) && list.length) {
        const sorted = list.sort((a, b) => b.updatedAt - a.updatedAt);
        setConversations(sorted);
        setActiveId(sorted[0].id);
      }
    } catch {
      /* corrupt storage → start fresh */
    }
    setLoaded(true);
  }, []);

  // ---- persist on any change, but only after the initial load (never overwrite with []) ----
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(conversations));
    } catch {
      /* quota / private mode → ignore */
    }
  }, [conversations, loaded]);

  // ---- voice support detection + cleanup ----
  useEffect(() => {
    const SR =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setVoiceSupported(!!SR);
    return () => recognitionRef.current?.stop?.();
  }, []);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );
  const messages: Msg[] = useMemo(() => [GREETING, ...(active?.messages ?? [])], [active]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function send(raw: string) {
    const message = raw.trim();
    if (!message || thinking) return;
    // conversation memory: the active chat's real turns become history for the co-pilot
    const history: ChatTurn[] = (active?.messages ?? []).map((m) => ({ role: m.role, text: m.text }));

    let convId = activeId;
    if (!convId || !conversations.some((c) => c.id === convId)) {
      convId = makeId();
      setActiveId(convId);
    }
    const id = convId;

    setConversations((prev) => {
      if (!prev.some((c) => c.id === id)) {
        const conv: Conversation = {
          id, title: titleFrom(message), messages: [{ role: "user", text: message }],
          createdAt: ts(), updatedAt: ts(),
        };
        return [conv, ...prev].slice(0, MAX_CONVOS);
      }
      return touch(prev, id, (c) => ({
        ...c,
        title: c.messages.length === 0 ? titleFrom(message) : c.title,
        messages: [...c.messages, { role: "user", text: message }],
      }));
    });

    setInput("");
    setThinking(true);
    try {
      const resp = await api.copilot(message, history);
      setConversations((prev) =>
        touch(prev, id, (c) => ({ ...c, messages: [...c.messages, { role: "assistant", text: resp.answer, plan: resp.plan }] })),
      );
    } catch {
      setConversations((prev) =>
        touch(prev, id, (c) => ({
          ...c,
          messages: [...c.messages, {
            role: "assistant",
            text: "Sorry — I couldn't reach the planning engine. Make sure the backend is running and try again.",
            plan: null,
          }],
        })),
      );
    } finally {
      setThinking(false);
    }
  }

  function newChat() {
    recognitionRef.current?.stop?.();
    setListening(false);
    setActiveId(null); // unsaved fresh chat — persists on first message
    setInput("");
    setThinking(false);
    inputRef.current?.focus();
  }

  function selectConversation(id: string) {
    recognitionRef.current?.stop?.();
    setListening(false);
    setActiveId(id);
    setInput("");
    inputRef.current?.focus();
  }

  function deleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = conversations.filter((c) => c.id !== id);
    setConversations(next);
    if (id === activeId) setActiveId(next[0]?.id ?? null);
  }

  function toggleVoice() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (listening) {
      recognitionRef.current?.stop?.();
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => setInput(Array.from(e.results).map((r: any) => r[0].transcript).join(""));
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }

  function fillExample(text: string) {
    setInput(text);
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-full">
      {/* ---- conversation rail ---- */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-sidebar/40">
        <div className="p-3">
          <Button onClick={newChat} variant="outline" className="w-full justify-start gap-2">
            <Plus className="h-4 w-4" /> New chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {!loaded ? null : conversations.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No saved chats yet. Your conversations will appear here.
            </p>
          ) : (
            GROUPS.map((g) => {
              const items = conversations.filter((c) => groupLabel(c.updatedAt) === g);
              if (!items.length) return null;
              return (
                <div key={g} className="mb-2">
                  <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">
                    {g}
                  </div>
                  {/* indentation = visual hierarchy under the date group */}
                  <div className="space-y-0.5 pl-1.5">
                    {items.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => selectConversation(c.id)}
                        className={cn(
                          "group flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                          c.id === activeId
                            ? "bg-primary/12 text-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        <span className="flex-1 truncate">{c.title}</span>
                        <button
                          onClick={(e) => deleteConversation(c.id, e)}
                          aria-label="Delete chat"
                          className="shrink-0 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ---- chat column ---- */}
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="truncate text-2xl font-bold leading-tight">{active ? active.title : "Ask ParkPulse"}</h1>
            <p className="text-sm text-muted-foreground">
              Your AI co-pilot — ask in plain English, Hindi or Kannada.
            </p>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <BotAvatar />
                    <div className="max-w-[80%] rounded-xl border border-border bg-card px-4 py-3 text-sm leading-relaxed">
                      {m.text}
                    </div>
                  </div>

                  {m.plan && m.plan.length > 0 && (
                    <div className="ml-11 flex flex-col gap-4">
                      <div className="overflow-hidden rounded-xl border border-border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Team</TableHead>
                              <TableHead>Zone</TableHead>
                              <TableHead className="text-right">Exp. catches</TableHead>
                              <TableHead className="w-[130px] text-right">Impact</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {m.plan.map((d) => (
                              <TableRow key={d.team}>
                                <TableCell className="font-medium">{d.team}</TableCell>
                                <TableCell>
                                  <div className="truncate">{d.label}</div>
                                  <div className="text-[11px] text-muted-foreground">{d.top_violation}</div>
                                </TableCell>
                                <TableCell className="text-right tabular-nums">{fmt(d.pred_load)}</TableCell>
                                <TableCell>
                                  <div className="ml-auto flex w-24 items-center gap-2">
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                      <div className="h-full bg-primary" style={{ width: `${Math.min(100, d.impact_score)}%` }} />
                                    </div>
                                    <span className="w-7 text-right text-xs tabular-nums text-muted-foreground">
                                      {Math.round(d.impact_score)}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="relative h-[360px] w-full overflow-hidden rounded-xl border border-border">
                        <ZoneMap zones={[]} plan={m.plan} zoom={11.2} />
                      </div>
                      <p className="text-xs text-muted-foreground">
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
                <BotAvatar />
                <div className="rounded-xl border border-border bg-card px-3 py-2.5">
                  <ThinkingDots />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-border px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => fillExample(ex)}
                  className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {ex}
                </button>
              ))}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2">
              <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? "Listening…" : "Ask in plain English, Hindi or Kannada…"} className="flex-1" />
              {voiceSupported && (
                <Button type="button" onClick={toggleVoice} size="icon"
                  variant={listening ? "default" : "outline"} className={listening ? "animate-pulse" : ""}
                  aria-label={listening ? "Stop voice input" : "Voice input"} title="Voice input">
                  <Mic />
                </Button>
              )}
              <Button type="submit" disabled={thinking || !input.trim()} size="icon" aria-label="Send">
                <Send />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
