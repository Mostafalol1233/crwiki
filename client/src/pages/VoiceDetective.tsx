import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mic, Play, Send, Trophy, X, SkipForward } from "lucide-react";
import PageSEO from "@/components/PageSEO";
import { useLanguage } from "@/components/LanguageProvider";
import { getMercenaries } from "@/lib/supabaseApi";
import { supabase } from "@/lib/supabase";
import { signIn, signUp, getCurrentUser } from "@/lib/supabaseApi";

interface QuizClip {
  file: string;
  bank_index: number;
  line: string;
  duration: number;
}

const ACCENT = "#d4a017";

function AuthPopup({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [tab, setTab] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!email.trim() || password.length < 6) {
      setErr(ar ? "اكتب إيميل صحيح وباسورد 6 حروف على الأقل" : "Enter a valid email and a 6+ char password");
      return;
    }
    setBusy(true);
    try {
      if (tab === "login") await signIn(email.trim(), password);
      else await signUp(email.trim(), password, username.trim() ? { username: username.trim() } : undefined);
      onDone();
    } catch (e: any) {
      setErr(e?.message || (ar ? "حصلت مشكلة، حاول تاني" : "Something went wrong, try again"));
    } finally {
      setBusy(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8,
    color: "#fafafa", padding: "10px 12px", fontSize: 14, outline: "none",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 400, background: "#111114", border: "1px solid #27272a", borderRadius: 14, padding: 24, position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: "#71717a", cursor: "pointer" }}>
          <X size={18} />
        </button>
        <h3 style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 800, color: "#fafafa" }}>
          {ar ? "🎉 إجابتك اتسجلت!" : "🎉 Answer saved!"}
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#a1a1aa", lineHeight: 1.7 }}>
          {ar
            ? "سجل دخولك عشان لو إجابتك صح نعرف نتواصل معاك ونشكرك. حساب واحد بيكفي لكل المسابقات."
            : "Log in so we can reach you if your answer is right. One account works for everything."}
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["register", "login"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setErr(""); }}
              style={{ flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                background: tab === t ? ACCENT : "transparent", color: tab === t ? "#000" : "#a1a1aa",
                border: `1px solid ${tab === t ? ACCENT : "#27272a"}` }}>
              {t === "register" ? (ar ? "حساب جديد" : "Register") : (ar ? "دخول" : "Login")}
            </button>
          ))}
        </div>
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          {tab === "register" && (
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={ar ? "اسمك في اللعبة (اختياري)" : "In-game name (optional)"} style={inp} />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={ar ? "الإيميل" : "Email"} type="email" dir="ltr" style={inp} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={ar ? "الباسورد" : "Password"} type="password" autoComplete={tab === "login" ? "current-password" : "new-password"} style={inp} />
          {err && <div style={{ fontSize: 12, color: "#f87171" }}>{err}</div>}
          <button disabled={busy} style={{ padding: "11px 0", borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: "pointer", background: ACCENT, color: "#000", border: "none", opacity: busy ? 0.6 : 1 }}>
            {busy ? "..." : tab === "register" ? (ar ? "سجلني" : "Create account") : (ar ? "ادخل" : "Log in")}
          </button>
        </form>
        <button onClick={onClose} style={{ marginTop: 12, width: "100%", background: "none", border: "none", color: "#71717a", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <SkipForward size={13} /> {ar ? "يكمل كضيف" : "Continue as guest"}
        </button>
      </div>
    </div>
  );
}

export default function VoiceDetective() {
  const { language } = useLanguage();
  const ar = language === "ar";
  const [clips, setClips] = useState<QuizClip[]>([]);
  const [guesses, setGuesses] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [nick, setNick] = useState("");

  useEffect(() => {
    fetch("/quiz-voices/quiz-voices.json").then((r) => r.json()).then(setClips).catch(() => {});
    getCurrentUser().then(setUser).catch(() => {});
  }, []);

  const { data: mercs = [] } = useQuery<any[]>({ queryKey: ["/api/mercenaries-names"], queryFn: getMercenaries });
  const names = useMemo(() => (mercs || []).map((m: any) => String(m.name || "")).filter(Boolean).sort(), [mercs]);
  const answered = Object.keys(done).length;

  const submit = async (clip: QuizClip) => {
    const guess = (guesses[clip.file] || "").trim();
    if (!guess || done[clip.file] || sending) return;
    setSending(clip.file);
    try {
      const u = user || (await getCurrentUser().catch(() => null));
      if (u) setUser(u);
      await supabase.from("voice_guesses").insert([{
        clip: clip.file,
        guess_name: guess,
        user_id: u?.id || "",
        username: u?.user_metadata?.username || u?.email?.split("@")[0] || nick.trim() || "guest",
        contact: u?.email || "",
      }]);
      setDone((d) => ({ ...d, [clip.file]: true }));
      if (!u) setShowAuth(true);
    } catch {
      // table may not exist yet (migration not run) — still count locally
      setDone((d) => ({ ...d, [clip.file]: true }));
      if (!user) setShowAuth(true);
    } finally {
      setSending(null);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px 64px" }}>
      <PageSEO
        canonicalPath="/voice-detective"
        title={ar ? "محقق الأصوات | مسابقة التعرف على أصوات الشخصيات" : "Voice Detective | Guess the Character Voices"}
        description={ar ? "اسمع مقاطع صوتية حقيقية من ملفات اللعبة وخمن بتاعة أنهي شخصية وساعدنا نتعرف عليها" : "Listen to real voice clips from the game files and guess which character they belong to"}
      />
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", color: ACCENT, textTransform: "uppercase" }}>
          <Mic size={14} /> {ar ? "مسابقة المجتمع" : "Community contest"}
        </span>
        <h1 style={{ margin: "10px 0 6px", fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 900, color: "#fafafa" }}>
          {ar ? "محقق الأصوات 🎤" : "Voice Detective 🎤"}
        </h1>
        <p style={{ margin: "0 auto", maxWidth: 640, fontSize: 14, color: "#a1a1aa", lineHeight: 1.9 }}>
          {ar
            ? "ازيكو يا شباب! دي مقاطع صوتية حقيقية من ملفات لعبة كروس فاير الغرب ومش معروف بتاعة أنهي شخصية. اسمع كويس واكتب تخمينك — إجاباتكم هتساعدنا نركب كل صوت على شخصيته الصح في الويكي!"
            : "These are real voice clips from the CrossFire West game files with unknown owners. Listen carefully, guess the character, and help us map every voice to its rightful owner!"}
        </p>
        <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.35)", borderRadius: 999, padding: "7px 16px", fontSize: 13, fontWeight: 700, color: ACCENT }}>
          <Trophy size={14} /> {ar ? `جاوبت على ${answered} من ${clips.length}` : `${answered} / ${clips.length} answered`}
        </div>
      </div>

      {!user && (
        <div style={{ maxWidth: 560, margin: "18px auto 0", display: "flex", gap: 8 }}>
          <input value={nick} onChange={(e) => setNick(e.target.value)} placeholder={ar ? "اكتب اسمك (عشان نعرف إجاباتك)" : "Your nickname (so we know your answers)"}
            style={{ flex: 1, background: "#111114", border: "1px solid #27272a", borderRadius: 8, color: "#fafafa", padding: "10px 12px", fontSize: 13, outline: "none" }} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14, marginTop: 22 }}>
        {clips.map((c, i) => {
          const isDone = !!done[c.file];
          return (
            <div key={c.file} style={{ background: "#111114", border: `1px solid ${isDone ? "rgba(34,197,94,0.4)" : "#27272a"}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 30, height: 30, borderRadius: "50%", background: isDone ? "rgba(34,197,94,0.15)" : "rgba(212,160,23,0.12)", color: isDone ? "#4ade80" : ACCENT, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                  {isDone ? "✓" : i + 1}
                </span>
                <audio controls preload="none" src={c.file} style={{ flex: 1, minWidth: 0, height: 32 }}>
                  <Play size={14} />
                </audio>
              </div>
              {isDone ? (
                <div style={{ fontSize: 13, color: "#4ade80", fontWeight: 700 }}>
                  {ar ? `تخمينك: ${guesses[c.file]} — اتسجل ✅` : `Your guess: ${guesses[c.file]} — saved ✅`}
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={guesses[c.file] || ""} list="merc-names" disabled={sending === c.file}
                    onChange={(e) => setGuesses((g) => ({ ...g, [c.file]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") submit(c); }}
                    placeholder={ar ? "الصوت ده بتاع أنهي شخصية؟" : "Which character is this?"}
                    style={{ flex: 1, minWidth: 0, background: "#09090b", border: "1px solid #27272a", borderRadius: 8, color: "#fafafa", padding: "9px 12px", fontSize: 13, outline: "none" }}
                  />
                  <button onClick={() => submit(c)} disabled={!((guesses[c.file] || "").trim()) || sending === c.file}
                    aria-label={ar ? "ابعت التخمين" : "Submit guess"}
                    style={{ background: ACCENT, color: "#000", border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer", opacity: !((guesses[c.file] || "").trim()) ? 0.4 : 1 }}>
                    <Send size={15} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <datalist id="merc-names">
        {names.map((n) => <option key={n} value={n} />)}
      </datalist>

      {showAuth && (
        <AuthPopup onClose={() => setShowAuth(false)} onDone={() => { setShowAuth(false); getCurrentUser().then(setUser).catch(() => {}); }} />
      )}
    </div>
  );
}
