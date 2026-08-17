import { useState, useRef, useEffect, useCallback } from "react";
import { Send, RefreshCw, Sparkles, Zap } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SESSION_KEY = "cf-ai-session-v2";

const SUGGESTED_EN = [
  "Which weapons suit a beginner?",
  "How do I rank up fast?",
  "ZP vs GP — what's the difference?",
  "Compare AK-47 vs M4A1",
  "Which mercenary fits my playstyle?",
  "How does Black Market work?",
];

const SUGGESTED_AR = [
  "إيه الأسلحة المناسبة للمبتدئين؟",
  "إزاي أرفع رتبتي بسرعة؟",
  "الفرق بين ZP وGP؟",
  "قارن AK-47 مع M4A1",
  "أي مرتزق يناسب أسلوب لعبي؟",
  "إزاي بيشتغل الـ Black Market؟",
];

/* ── CrossFire Character SVG Avatars ─────────────────────────────────────── */
// Global Risk soldier silhouette (AI)
function GRSoldierIcon({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Helmet */}
      <ellipse cx="20" cy="10" rx="7" ry="6" fill="white" opacity="0.95"/>
      <rect x="13" y="13" width="14" height="4" rx="1" fill="white" opacity="0.9"/>
      {/* Visor */}
      <rect x="15" y="11" width="10" height="3" rx="1" fill="rgba(100,200,255,0.6)"/>
      {/* Body / armor */}
      <rect x="14" y="17" width="12" height="11" rx="2" fill="white" opacity="0.9"/>
      {/* Chest plate detail */}
      <rect x="17" y="19" width="6" height="4" rx="1" fill="rgba(100,200,255,0.4)"/>
      {/* Left arm */}
      <rect x="10" y="17" width="4" height="9" rx="2" fill="white" opacity="0.85"/>
      {/* Right arm */}
      <rect x="26" y="17" width="4" height="9" rx="2" fill="white" opacity="0.85"/>
      {/* Gun (right hand) */}
      <rect x="28" y="22" width="7" height="2.5" rx="1" fill="white" opacity="0.8"/>
      <rect x="30" y="24.5" width="2" height="2" rx="0.5" fill="white" opacity="0.7"/>
      {/* Legs */}
      <rect x="15" y="28" width="4.5" height="8" rx="2" fill="white" opacity="0.85"/>
      <rect x="20.5" y="28" width="4.5" height="8" rx="2" fill="white" opacity="0.85"/>
      {/* Boots */}
      <rect x="14.5" y="34" width="5.5" height="3" rx="1.5" fill="white" opacity="0.7"/>
      <rect x="20" y="34" width="5.5" height="3" rx="1.5" fill="white" opacity="0.7"/>
    </svg>
  );
}

// Black List soldier silhouette (User)
function BLSoldierIcon({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Skull mask / head */}
      <ellipse cx="20" cy="10" rx="6.5" ry="6" fill="white" opacity="0.9"/>
      {/* Skull details */}
      <ellipse cx="17.5" cy="10" rx="2" ry="2.5" fill="rgba(0,0,0,0.35)"/>
      <ellipse cx="22.5" cy="10" rx="2" ry="2.5" fill="rgba(0,0,0,0.35)"/>
      <rect x="18.5" y="13" width="3" height="1" rx="0.5" fill="rgba(0,0,0,0.3)"/>
      {/* Neck / balaclava */}
      <rect x="16" y="14.5" width="8" height="3" rx="1" fill="white" opacity="0.85"/>
      {/* Body / tactical vest */}
      <rect x="13" y="17" width="14" height="11" rx="2" fill="white" opacity="0.88"/>
      {/* Pouches */}
      <rect x="14" y="19" width="3.5" height="5" rx="1" fill="rgba(245,166,35,0.4)"/>
      <rect x="22.5" y="19" width="3.5" height="5" rx="1" fill="rgba(245,166,35,0.4)"/>
      {/* Left arm */}
      <rect x="9" y="17" width="4" height="10" rx="2" fill="white" opacity="0.85"/>
      {/* Right arm */}
      <rect x="27" y="17" width="4" height="10" rx="2" fill="white" opacity="0.85"/>
      {/* Knife (left hand) */}
      <rect x="5" y="23" width="5" height="1.5" rx="0.5" fill="white" opacity="0.75"/>
      <polygon points="4,23 5,22 5,25" fill="white" opacity="0.7"/>
      {/* Pistol (right hand) */}
      <rect x="31" y="22.5" width="5" height="3" rx="1" fill="white" opacity="0.75"/>
      <rect x="32.5" y="25.5" width="2" height="2" rx="0.5" fill="white" opacity="0.65"/>
      {/* Legs */}
      <rect x="14" y="28" width="5" height="8" rx="2" fill="white" opacity="0.85"/>
      <rect x="21" y="28" width="5" height="8" rx="2" fill="white" opacity="0.85"/>
      {/* Boots */}
      <rect x="13" y="34" width="6.5" height="3" rx="1.5" fill="rgba(245,166,35,0.6)"/>
      <rect x="20.5" y="34" width="6.5" height="3" rx="1.5" fill="rgba(245,166,35,0.6)"/>
    </svg>
  );
}

/* ── Markdown renderer ────────────────────────────────────────────────────── */
const mdComponents: any = {
  p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed text-[13px]">{children}</p>,
  strong: ({ children }: any) => <strong style={{ color: "#f5d97a", fontWeight: 700 }}>{children}</strong>,
  em: ({ children }: any) => <em style={{ color: "#ccc", fontStyle: "italic" }}>{children}</em>,
  h1: ({ children }: any) => <h1 className="text-sm font-black mb-2 mt-3 first:mt-0" style={{ color: "#f5a623" }}>{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-sm font-bold mb-1.5 mt-3 first:mt-0" style={{ color: "#f5a623" }}>{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-xs font-bold mb-1 mt-2 first:mt-0" style={{ color: "#e0c87a" }}>{children}</h3>,
  ul: ({ children }: any) => <ul className="mb-2 space-y-1 pl-4" style={{ listStyleType: "disc" }}>{children}</ul>,
  ol: ({ children }: any) => <ol className="mb-2 space-y-1 pl-4" style={{ listStyleType: "decimal" }}>{children}</ol>,
  li: ({ children }: any) => <li className="text-[13px] leading-relaxed">{children}</li>,
  code: ({ inline, children }: any) =>
    inline ? (
      <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "rgba(245,166,35,0.15)", color: "#f5d97a" }}>{children}</code>
    ) : (
      <pre className="rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono" style={{ background: "rgba(0,0,0,0.5)", color: "#ccc", border: "1px solid rgba(255,255,255,0.06)" }}>
        <code>{children}</code>
      </pre>
    ),
  blockquote: ({ children }: any) => (
    <blockquote className="pl-3 my-2 text-xs italic" style={{ borderLeft: "2px solid rgba(245,166,35,0.5)", color: "#999" }}>{children}</blockquote>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-3 rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => <thead style={{ background: "rgba(245,166,35,0.12)" }}>{children}</thead>,
  tbody: ({ children }: any) => <tbody>{children}</tbody>,
  tr: ({ children }: any) => <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{children}</tr>,
  th: ({ children }: any) => (
    <th className="px-3 py-2 text-left font-bold text-xs" style={{ color: "#f5a623", borderRight: "1px solid rgba(255,255,255,0.05)" }}>{children}</th>
  ),
  td: ({ children }: any) => (
    <td className="px-3 py-2 text-xs" style={{ borderRight: "1px solid rgba(255,255,255,0.05)", opacity: 0.85 }}>{children}</td>
  ),
  img: ({ src, alt }: any) =>
    src ? <img src={src} alt={alt || ""} className="rounded-lg my-2 max-w-full" style={{ maxHeight: 260, border: "1px solid rgba(255,255,255,0.08)" }} /> : null,
  a: ({ href, children }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#f5a623", textDecoration: "underline" }}>{children}</a>
  ),
  hr: () => <hr className="my-3" style={{ borderColor: "rgba(255,255,255,0.07)" }} />,
};

/* ── Main component ───────────────────────────────────────────────────────── */
export default function AIAssistant() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Scroll to top on mount so the chat header is visible, not the footer
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) return JSON.parse(saved) as Message[];
    } catch { /* ignore */ }
    return [];
  });

  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Persist messages across tab navigation
  useEffect(() => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages)); } catch { /* ignore */ }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 || loading || streamingContent !== null) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent, loading]);

  const send = useCallback(async (text: string) => {
    const userMsg = text.trim();
    if (!userMsg || loading) return;
    setInput("");
    setError(null);
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);
    setStreamingContent("");

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.slice(-6) }),
        signal: ctrl.signal,
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null) as { error?: string; detail?: string } | null;
        throw new Error(data?.error || data?.detail || `AI request failed (${resp.status})`);
      }

      if (!resp.body) throw new Error(isAr ? "لم يصل اتصال الدردشة من الخادم." : "The chat connection returned no response body.");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const chunk = JSON.parse(jsonStr);
            if (chunk.error) throw new Error(chunk.error);
            if (chunk.delta) { fullContent += chunk.delta; setStreamingContent(fullContent); }
          } catch (e: any) {
            if (e.message && !e.message.includes("JSON")) throw e;
          }
        }
      }

      if (fullContent) {
        setMessages(prev => [...prev, { role: "assistant", content: fullContent }]);
      } else {
        setError(isAr ? "لم يصل ردٌّ من الذكاء الاصطناعي — حاول مرة أخرى." : "No response from AI — please try again.");
      }
      setStreamingContent(null);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setStreamingContent(null);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
      setStreamingContent(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, loading]);

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setInput("");
    setStreamingContent(null);
    setLoading(false);
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  };

  const suggested = isAr ? SUGGESTED_AR : SUGGESTED_EN;
  const hasMessages = messages.length > 0 || loading;

  return (
    <>
      <style>{`
        @keyframes aiDot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1.1);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .ai-msg-enter { animation: fadeSlideUp 0.3s ease forwards; }
      `}</style>

      <PageSEO
        title={isAr ? "مساعد الذكاء الاصطناعي — CrossFire Wiki" : "AI Assistant — CrossFire Wiki"}
        description={isAr ? "مساعد تفاعلي يساعدك في العثور على معلومات CrossFire وشرح صفحات الويكي." : "An interactive helper for finding and explaining CrossFire Wiki information."}
        canonicalPath="/ai"
        noindex
      />

      <div style={{ background: "var(--background)", minHeight: "100%" }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, #080808 0%, #140e00 50%, #080808 100%)",
          borderBottom: "1px solid rgba(245,166,35,0.15)",
          position: "relative",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          {/* Grid bg */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(245,166,35,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(245,166,35,0.02) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
          {/* Glow */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 100% at 50% 0%, rgba(245,166,35,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: 760, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
            {/* AI Character avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(245,166,35,0.28) 0%, rgba(100,180,255,0.18) 100%)",
                border: "2px solid rgba(245,166,35,0.55)",
                boxShadow: "0 0 20px rgba(245,166,35,0.25), inset 0 0 12px rgba(245,166,35,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <GRSoldierIcon size={36} />
              </div>
              <span style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: "#22c55e", border: "2.5px solid #080808", boxShadow: "0 0 6px rgba(34,197,94,0.5)" }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }} dir={isAr ? "rtl" : "ltr"}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <Zap style={{ width: 10, height: 10, color: "#f5a623" }} />
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase", color: "#f5a623", opacity: 0.8 }}>
                  {isAr ? "Global Risk • ذكاء اصطناعي" : "Global Risk • AI Powered"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
                <span style={{ fontSize: 19, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "var(--foreground)", lineHeight: 1 }}>CrossFire</span>
                <span style={{ fontSize: 19, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#f5a623", lineHeight: 1 }}>
                  {isAr ? "مساعد" : "AI"}
                </span>
              </div>
              <p style={{ fontSize: 11, color: "#444", marginTop: 2 }}>
                {isAr ? "اسألني أي حاجة عن اللعبة — بردّ على طول" : "Ask anything about CrossFire — I answer instantly"}
              </p>
            </div>

            {hasMessages && (
              <button
                onClick={reset}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#666", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "7px 11px", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,166,35,0.3)"; (e.currentTarget as HTMLButtonElement).style.color = "#f5a623"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "#666"; }}
              >
                <RefreshCw style={{ width: 11, height: 11 }} />
                {isAr ? "محادثة جديدة" : "New chat"}
              </button>
            )}
          </div>
        </div>

        {/* ── Chat body ───────────────────────────────────────────────── */}
        <div>
          <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 16px" }}>

            {/* Empty state */}
            {!hasMessages && (
              <div style={{ textAlign: "center", padding: "52px 16px 28px" }}>
                <div style={{
                  width: 76, height: 76, margin: "0 auto 16px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(245,166,35,0.25) 0%, rgba(100,180,255,0.14) 100%)",
                  border: "2px solid rgba(245,166,35,0.45)",
                  boxShadow: "0 0 32px rgba(245,166,35,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <GRSoldierIcon size={52} />
                </div>
                <p style={{ fontWeight: 800, fontSize: 15, color: "var(--foreground)", marginBottom: 6 }}>
                  {isAr ? "مرحبًا! أنا مساعد CrossFire" : "Hey! I'm the CrossFire Wiki AI"}
                </p>
                <p style={{ fontSize: 11, color: "#444", marginBottom: 28 }}>
                  {isAr ? "اسألني عن الأسلحة، الرتب، المرتزقة، الأحداث وأكتر" : "Ask me about weapons, ranks, mercenaries, events and more"}
                </p>

                {/* Faction badges */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(100,180,255,0.05)", border: "1px solid rgba(100,180,255,0.2)", borderRadius: 20, padding: "4px 12px" }}>
                    <GRSoldierIcon size={18} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(100,200,255,0.8)", letterSpacing: "0.15em" }}>GLOBAL RISK</span>
                  </div>
                  <span style={{ color: "#333", fontSize: 12 }}>vs</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 20, padding: "4px 12px" }}>
                    <BLSoldierIcon size={18} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(245,166,35,0.8)", letterSpacing: "0.15em" }}>BLACK LIST</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 500, margin: "0 auto" }}>
                  {suggested.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s)}
                      dir={isAr ? "rtl" : "ltr"}
                      style={{
                        fontSize: 11, padding: "8px 14px",
                        background: "rgba(245,166,35,0.05)",
                        border: "1px solid rgba(245,166,35,0.18)",
                        borderRadius: 20, color: "#c89b30", cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,166,35,0.12)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,166,35,0.35)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,166,35,0.05)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,166,35,0.18)"; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div style={{ paddingTop: hasMessages ? 16 : 0 }}>
              {messages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} isAr={isAr} mdComponents={mdComponents} index={i} />
              ))}

              {/* Streaming AI message */}
              {(loading || streamingContent !== null) && (
                <AssistantBubble isAr={isAr} mdComponents={mdComponents} streaming streamingContent={streamingContent} />
              )}

              {error && (
                <div style={{ textAlign: "center", padding: "8px 0 16px" }} className="ai-msg-enter">
                  <span style={{ fontSize: 12, padding: "6px 16px", borderRadius: 20, background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.18)" }}>
                    Error: {error}
                  </span>
                </div>
              )}

              <div ref={bottomRef} style={{ height: 16 }} />
            </div>

            {/* ── Input bar ──────────────────────────────────────────── */}
            <div style={{ position: "sticky", bottom: 0, paddingBottom: 16, paddingTop: 10, background: "linear-gradient(to top, var(--background) 78%, transparent 100%)" }}>

              {/* Divider line above input */}
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(245,166,35,0.12), transparent)", marginBottom: 10 }} />

              <div style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 10,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(245,166,35,0.15)",
                borderRadius: 16,
                padding: "8px 8px 8px 12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,166,35,0.05)",
                transition: "border-color 0.2s",
              }}>
                {/* User character avatar */}
                <div style={{ flexShrink: 0, marginBottom: 2 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "rgba(245,166,35,0.08)",
                    border: "1.5px solid rgba(245,166,35,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <BLSoldierIcon size={22} />
                  </div>
                </div>

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  placeholder={isAr ? "اسأل عن CrossFire..." : "Ask about CrossFire..."}
                  dir={isAr ? "rtl" : "ltr"}
                  rows={1}
                  disabled={loading}
                  style={{ flex: 1, resize: "none", background: "transparent", border: "none", outline: "none", fontSize: 13, color: "var(--foreground)", lineHeight: "1.5", padding: "6px 0", maxHeight: 120, fontFamily: "inherit" }}
                  onInput={e => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = Math.min(t.scrollHeight, 120) + "px";
                  }}
                />

                <button
                  onClick={() => send(input)}
                  disabled={!input.trim() || loading}
                  style={{
                    flexShrink: 0, width: 36, height: 36,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: !input.trim() || loading
                      ? "rgba(245,166,35,0.08)"
                      : "linear-gradient(135deg, #f5a623 0%, #d4870a 100%)",
                    border: !input.trim() || loading ? "1px solid rgba(245,166,35,0.15)" : "none",
                    borderRadius: 12,
                    cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                    opacity: !input.trim() || loading ? 0.4 : 1,
                    transition: "all 0.15s",
                    boxShadow: !input.trim() || loading ? "none" : "0 4px 12px rgba(245,166,35,0.35)",
                  }}
                >
                  <Send style={{ width: 15, height: 15, color: !input.trim() || loading ? "#f5a623" : "#000" }} />
                </button>
              </div>
              <p style={{ fontSize: 10, textAlign: "center", marginTop: 6, color: "#282828" }}>
                {isAr ? "Enter للإرسال • Shift+Enter لسطر جديد" : "Enter to send · Shift+Enter for new line"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── AI response bubble ──────────────────────────────────────────────────── */
function AssistantBubble({ isAr, mdComponents, streaming, streamingContent, content }: {
  isAr: boolean; mdComponents: any; streaming?: boolean; streamingContent?: string | null; content?: string;
}) {
  const text = streaming ? streamingContent : content;
  return (
    <div className="ai-msg-enter" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0" }} dir={isAr ? "rtl" : "ltr"}>
      {/* GR Soldier avatar */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(100,180,255,0.12) 0%, rgba(245,166,35,0.08) 100%)",
          border: "1.5px solid rgba(100,180,255,0.3)",
          boxShadow: "0 0 10px rgba(100,180,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <GRSoldierIcon size={24} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* AI label */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(100,200,255,0.7)" }}>Global Risk AI</span>
          <Sparkles style={{ width: 9, height: 9, color: "#f5a623", opacity: 0.6 }} />
        </div>

        {/* Response bubble */}
        <div dir="auto" style={{
          display: "inline-block",
          maxWidth: "92%",
          padding: "13px 16px",
          borderRadius: "4px 16px 16px 16px",
          background: "rgba(100,180,255,0.04)",
          border: "1px solid rgba(100,180,255,0.12)",
          backdropFilter: "blur(8px)",
          fontSize: 13,
          lineHeight: 1.65,
          color: "var(--foreground)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
        }}>
          {streaming && !text ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0" }}>
              <span style={{ display: "flex", gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#f5a623", display: "inline-block", animation: `aiDot 1.2s ${i * 0.22}s ease-in-out infinite` }} />
                ))}
              </span>
              <span style={{ fontSize: 11, color: "#444" }}>{isAr ? "بفكر..." : "Thinking..."}</span>
            </div>
          ) : text ? (
            <>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{text}</ReactMarkdown>
              {streaming && (
                <span style={{ display: "inline-block", width: 2, height: 13, marginLeft: 3, background: "#f5a623", borderRadius: 1, verticalAlign: "middle", animation: "pulse 0.8s infinite" }} />
              )}
            </>
          ) : (
            <span style={{ fontSize: 12, color: "#555", fontStyle: "italic" }}>
              {isAr ? "لم أتلقَّ ردًا — حاول مرة أخرى." : "No response received — please try again."}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── User question bubble ────────────────────────────────────────────────── */
function UserBubble({ msg, isAr }: { msg: Message; isAr: boolean }) {
  return (
    <div className="ai-msg-enter" style={{ display: "flex", alignItems: "flex-start", justifyContent: "flex-end", gap: 12, padding: "10px 0" }} dir={isAr ? "rtl" : "ltr"}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-end", minWidth: 0 }}>
        {/* User label */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(245,166,35,0.65)" }}>
            {isAr ? "Black List • أنت" : "Black List • You"}
          </span>
        </div>

        {/* Question bubble */}
        <div dir="auto" style={{
          maxWidth: "78%",
          padding: "12px 16px",
          borderRadius: "16px 4px 16px 16px",
          background: "linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(200,120,0,0.07) 100%)",
          border: "1px solid rgba(245,166,35,0.22)",
          fontSize: 13,
          lineHeight: 1.6,
          color: "#f0d88a",
          wordBreak: "break-word",
          boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
        }}>
          {msg.content}
        </div>
      </div>

      {/* BL Soldier avatar */}
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(245,166,35,0.08)",
          border: "1.5px solid rgba(245,166,35,0.28)",
          boxShadow: "0 0 10px rgba(245,166,35,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <BLSoldierIcon size={24} />
        </div>
      </div>
    </div>
  );
}

/* ── Thread separator between Q/A pairs ─────────────────────────────────── */
function QAPairDivider({ index }: { index: number }) {
  if (index === 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)" }} />
      <span style={{ fontSize: 9, color: "#222", fontWeight: 700, letterSpacing: "0.2em" }}>#{index + 1}</span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)" }} />
    </div>
  );
}

function ChatMessage({ msg, isAr, mdComponents, index }: { msg: Message; isAr: boolean; mdComponents: any; index: number }) {
  return (
    <>
      {msg.role === "user" && index > 0 && <QAPairDivider index={Math.floor(index / 2)} />}
      {msg.role === "user"
        ? <UserBubble msg={msg} isAr={isAr} />
        : <AssistantBubble isAr={isAr} mdComponents={mdComponents} content={msg.content} />
      }
    </>
  );
}
