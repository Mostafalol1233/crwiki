import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, ExternalLink, Globe2, LockKeyhole, Phone, ShieldCheck, Trophy, Users, Volume2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { supabase } from "@/lib/supabase";

interface CompetitionConfig {
  title_en: string;
  title_ar: string;
  intro_en?: string | null;
  intro_ar?: string | null;
  rules_en?: string | null;
  rules_ar?: string | null;
  active: boolean;
  invite_required: boolean;
  leaderboard_published: boolean;
}

interface CompetitionPrize {
  id: string;
  category: string;
  title_en: string;
  title_ar?: string | null;
  description_en?: string | null;
  description_ar?: string | null;
  availability_note_en?: string | null;
  availability_note_ar?: string | null;
}

interface CompetitionQuestion {
  id: string;
  kind: "multiple_choice" | "audio" | "weapon" | "scenario" | "essay";
  question_en: string;
  question_ar?: string | null;
  options?: unknown;
  points?: number | string | null;
  audio_url?: string | null;
  weapon_id?: string | null;
  sort_order?: number;
}

interface CompetitionLeaderboardEntry {
  final_score: number | string;
  submitted_at?: string | null;
  status: string;
}

const organizers = [
  { name: "CrossFire Wiki", role: "Host", image: "/logo-new.png", href: "/", verified: true, accent: "var(--primary)" },
  { name: "Zims", role: "Community partner", image: "/assets/competition/zims-mark.jpg", href: null, verified: true, accent: "var(--destructive)" },
  { name: "Antifarming Clan", role: "Community partner", image: "/assets/competition/antifarming-clan-mark.png", href: "https://crossfire.z8games.com/clan/404003", verified: true, accent: "var(--chart-1)" },
  { name: "Diaasadek", role: "Community partner", image: "/assets/sellers/diaa-store-logo.png", href: "https://diaasadek.com", verified: true, accent: "var(--chart-2)" },
  { name: "Bemora", role: "Community partner", image: "/assets/competition/bemora-robot-card.jpg", href: null, verified: true, accent: "var(--chart-3)" },
] as const;

function questionOptions(question: CompetitionQuestion, isArabic: boolean): Array<{ value: string; label: string }> {
  if (!Array.isArray(question.options)) return [];
  return question.options.flatMap((option) => {
    if (typeof option === "string") return [{ value: option, label: option }];
    if (!option || typeof option !== "object") return [];
    const item = option as Record<string, unknown>;
    const value = typeof item.value === "string" ? item.value : typeof item.id === "string" ? item.id : "";
    const label = isArabic
      ? (typeof item.label_ar === "string" ? item.label_ar : typeof item.label_en === "string" ? item.label_en : value)
      : (typeof item.label_en === "string" ? item.label_en : typeof item.label_ar === "string" ? item.label_ar : value);
    return value ? [{ value, label }] : [];
  });
}

export default function Competition() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const [config, setConfig] = useState<CompetitionConfig | null>(null);
  const [prizes, setPrizes] = useState<CompetitionPrize[]>([]);
  const [questions, setQuestions] = useState<CompetitionQuestion[]>([]);
  const [leaderboard, setLeaderboard] = useState<CompetitionLeaderboardEntry[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofType, setProofType] = useState("other");
  const [proofNotice, setProofNotice] = useState("");
  const [proofSubmitting, setProofSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [competitionResponse, sessionResult] = await Promise.all([
          fetch("/api/content?type=competition", { cache: "no-store" }),
          supabase.auth.getSession(),
        ]);
        const payload = competitionResponse.ok ? await competitionResponse.json() : { config: null, prizes: [], questions: [] };
        const session = sessionResult.data?.session;
        if (!cancelled) {
          setConfig((payload.config || null) as CompetitionConfig | null);
          setPrizes(Array.isArray(payload.prizes) ? payload.prizes as CompetitionPrize[] : []);
          setQuestions(Array.isArray(payload.questions) ? payload.questions as CompetitionQuestion[] : []);
          setLeaderboard(Array.isArray(payload.leaderboard) ? payload.leaderboard as CompetitionLeaderboardEntry[] : []);
          setEmail(session?.user?.email || null);
          setAccessToken(session?.access_token || null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    const authState = supabase.auth.onAuthStateChange((_event: string, session: { user?: { email?: string | null } | null; access_token?: string } | null) => {
      setEmail(session?.user?.email || null);
      setAccessToken(session?.access_token || null);
    });
    return () => {
      cancelled = true;
      authState.data.subscription.unsubscribe();
    };
  }, []);

  const title = config ? (isArabic ? config.title_ar : config.title_en) : (isArabic ? "مسابقة CrossFire Wiki" : "CrossFire Wiki Competition");
  const intro = config ? (isArabic ? config.intro_ar : config.intro_en) : null;
  const rules = config ? (isArabic ? config.rules_ar : config.rules_en) : null;
  const direction = isArabic ? "rtl" : "ltr";

  const requirements = useMemo(() => isArabic ? [
    "تسجيل الدخول بحساب الموقع قبل بدء المحاولة.",
    "إدخال كود الدعوة الذي ينشئه المشرف، ولا يظهر الكود في الصفحة العامة.",
    "إدخال رقم هاتف صحيح مع موافقة واضحة على استخدامه للتواصل الخاص بالمسابقة.",
    "الإجابة عن أسئلة الاختيار من متعدد والأسئلة الصوتية والأسئلة التحليلية عند نشرها.",
    "إمكانية إرسال إثباتات اختيارية بعد الاختبار لطلب نقاط إضافية قابلة للمراجعة.",
  ] : [
    "Sign in with an existing website account before starting an attempt.",
    "Enter the invitation code generated by an administrator; codes are never exposed in public UI.",
    "Provide a valid phone number and consent to competition-related contact.",
    "Answer the multiple-choice, audio, and reviewed scenario questions published by the administrator.",
    "Submit optional proofs after the exam for reviewable bonus points.",
  ], [isArabic]);

  const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  };

  const submitRegistration = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice("");
    if (!email || !accessToken) {
      setNotice(isArabic ? "سجّل الدخول أولًا للانضمام إلى المسابقة." : "Please sign in before joining the competition.");
      return;
    }
    if (!phone.trim() || (config?.invite_required !== false && !inviteCode.trim()) || !consent) {
      setNotice(isArabic ? "أكمل رقم الهاتف وكود الدعوة والموافقة قبل المتابعة." : "Complete the phone number, invitation code, and consent before continuing.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/content?type=competition", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "start", phone, inviteCode, consent }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Registration failed");
      setAttemptId(typeof payload.attempt?.id === "string" ? payload.attempt.id : null);
      setQuestions(Array.isArray(payload.questions) ? payload.questions as CompetitionQuestion[] : []);
      setNotice(isArabic ? "تم قبول التسجيل. أجب عن الأسئلة ثم أرسل المحاولة." : "Registration accepted. Answer the questions and submit your attempt.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : (isArabic ? "تعذر بدء المحاولة." : "Could not start the attempt."));
    } finally {
      setSubmitting(false);
    }
  };

  const submitProof = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!attemptId || !accessToken || (!proofUrl.trim() && !proofFile)) return;
    if (proofFile && proofFile.size > 10 * 1024 * 1024) {
      setProofNotice(isArabic ? "حجم الصورة يجب ألا يتجاوز 10 ميجابايت." : "The image must be 10 MB or smaller.");
      return;
    }
    setProofSubmitting(true);
    setProofNotice("");
    try {
      let response: Response;
      if (proofFile) {
        const formData = new FormData();
        formData.append("file", proofFile);
        formData.append("attemptId", attemptId);
        formData.append("proofType", proofType);
        response = await fetch("/api/images/upload", { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: formData });
      } else {
        response = await fetch("/api/content?type=competition", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ action: "submit_proof", attemptId, proofType, fileUrl: proofUrl.trim() }),
        });
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Proof submission failed");
      setProofUrl("");
      setProofFile(null);
      setProofNotice(isArabic ? "تم إرسال الإثبات للمراجعة." : "The proof was submitted for review.");
    } catch (error) {
      setProofNotice(error instanceof Error ? error.message : (isArabic ? "تعذر إرسال الإثبات." : "Could not submit proof."));
    } finally {
      setProofSubmitting(false);
    }
  };

  const submitQuiz = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!attemptId || !accessToken) return;
    setSubmitting(true);
    setNotice("");
    try {
      const response = await fetch("/api/content?type=competition", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "submit", attemptId, answers }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Submission failed");
      setSubmittedScore(Number(payload.objectiveScore || 0));
      setNotice(isArabic ? "تم إرسال الإجابات بنجاح." : "Your answers were submitted successfully.");
      setProofNotice("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : (isArabic ? "تعذر إرسال الإجابات." : "Could not submit answers."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main dir={direction} className="min-h-screen bg-background" style={{ color: "hsl(var(--foreground))", paddingBottom: 72 }}>
      <section style={heroSection}>
        <div aria-hidden="true" style={heroGlow} />
        <div aria-hidden="true" style={heroGrid} />
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 24px 34px", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 28 }}>
            <span style={eyebrow}><Trophy size={13} />{isArabic ? "الموسم الأول · بإدارة المشرفين" : "Season one · administrator managed"}</span>
            <span style={{ ...eyebrow, color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--primary) / 0.35)", background: "hsl(var(--background) / 0.55)" }}>{isArabic ? "إنجليزي وعربي" : "English and Arabic"}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 34, alignItems: "center" }}>
            <div>
              <div style={heroKicker}><span style={heroKickerLine} />{isArabic ? "اختبر معرفتك · ارفع ترتيبك · مثّل مجتمعك" : "Test your knowledge · climb the board · represent your community"}</div>
              <h1 style={{ fontSize: "clamp(42px, 7vw, 88px)", lineHeight: 0.94, letterSpacing: "-0.065em", maxWidth: 850, margin: 0, color: "hsl(var(--foreground))" }}>{title}</h1>
              <p style={{ maxWidth: 720, color: "hsl(var(--muted-foreground))", fontSize: 18, lineHeight: 1.8, marginTop: 26 }}>{intro || (isArabic ? "مسابقة مجتمعية لتقييم معرفة اللاعبين بعالم CrossFire، مع أسئلة عادلة ونظام نقاط قابل للمراجعة." : "A community competition for CrossFire knowledge, with fair questions and an administrator-reviewed scoring policy.")}</p>
              <div style={heroStats}>
                <div><strong>{isArabic ? "ثنائي اللغة" : "Bilingual"}</strong><span>{isArabic ? "عربي وإنجليزي" : "Arabic and English"}</span></div>
                <div><strong>{isArabic ? "مراجعة" : "Reviewed"}</strong><span>{isArabic ? "درجات وإثباتات" : "Scores and proofs"}</span></div>
                <div><strong>{isArabic ? "مجتمعي" : "Community"}</strong><span>{isArabic ? "بإدارة CrossFire Wiki" : "By CrossFire Wiki"}</span></div>
              </div>
            </div>
            <div style={heroSeal}>
              <div style={heroSealRing}><div style={heroSealInner}><img src="/logo-new.png" alt="CrossFire Wiki" style={{ width: 92, height: 92, objectFit: "contain" }} /></div></div>
              <span style={heroSealLabel}>{isArabic ? "مسابقة المعرفة" : "Knowledge competition"}</span>
              <strong style={heroSealTitle}>CROSSFIRE<br />WIKI</strong>
              <span style={heroSealNote}>{isArabic ? "نظام عادل · محتوى موثّق · مجتمع واحد" : "Fair play · verified content · one community"}</span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 24px 0" }}>
        <div style={sectionHeadingRow}><div><span style={sectionOverline}>{isArabic ? "الهوية والشراكة" : "Identity and partnership"}</span><h2 style={heading}>{isArabic ? "المنظمون والداعمون" : "Organizers and partners"}</h2></div><p style={{ ...muted, maxWidth: 420, margin: 0 }}>{isArabic ? "وجوه ومجتمعات شاركت في بناء تجربة المسابقة. الصور الموثقة فقط تُعرض كشعارات رسمية." : "Communities supporting the competition experience. Only verified images are presented as official marks."}</p></div>
        <div style={organizerGrid}>{organizers.map((organizer) => <OrganizerCard key={organizer.name} organizer={organizer} isArabic={isArabic} />)}</div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 24px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <Feature accent="hsl(var(--chart-3))" icon={<Trophy size={20} />} title={isArabic ? "نظام نقاط واضح" : "Clear scoring"} text={isArabic ? "النقاط وسياسة التعادل يحددها المشرف قبل النشر." : "Points and tie-break rules are configured before publication."} />
        <Feature accent="hsl(var(--chart-1))" icon={<Volume2 size={20} />} title={isArabic ? "أسئلة صوتية" : "Audio questions"} text={isArabic ? "مقاطع قصيرة عن الخرائط والأنماط عند اعتمادها." : "Short map and mode identification clips when approved."} />
        <Feature accent="hsl(var(--chart-2))" icon={<ShieldCheck size={20} />} title={isArabic ? "مراجعة عادلة" : "Reviewed fairly"} text={isArabic ? "الإثباتات والأسئلة المقالية تمر بمراجعة إدارية." : "Proofs and scenario answers go through administrator review."} />
        <Feature accent="hsl(var(--primary))" icon={<Users size={20} />} title={isArabic ? "مجتمع CrossFire" : "CrossFire community"} text={isArabic ? "تنظيم CrossFire Wiki وداعموه المذكورون أعلاه." : "Organized by CrossFire Wiki and the supporters listed above."} />
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 24px 0", display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, .85fr)", gap: 24 }}>
        <div style={panel}>
          <h2 style={heading}>{isArabic ? "كيف تنضم؟" : "How to join"}</h2>
          <p style={muted}>{loading ? (isArabic ? "جارٍ التحقق..." : "Checking status...") : (isArabic ? "لا يُعرض كود الدعوة أو بيانات المشاركين في الواجهة العامة." : "Invitation codes and participant data are never exposed in the public interface.")}</p>
          <div style={{ display: "grid", gap: 12, marginTop: 24 }}>{requirements.map((item, index) => <div key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}><span style={number}>{index + 1}</span><span style={{ color: "hsl(var(--muted-foreground))", lineHeight: 1.6 }}>{item}</span></div>)}</div>
          {rules && <div style={{ marginTop: 28, padding: 16, border: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.35)", borderRadius: "var(--radius)" }}><strong style={{ color: "hsl(var(--foreground))" }}>{isArabic ? "القواعد" : "Rules"}</strong><p style={{ ...muted, marginBottom: 0, whiteSpace: "pre-wrap" }}>{rules}</p></div>}
          <div style={{ marginTop: 28, padding: 16, border: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.35)", borderRadius: "var(--radius)" }}><strong style={{ color: "hsl(var(--foreground))" }}>{isArabic ? "ملاحظات مهمة" : "Important notes"}</strong><p style={{ ...muted, marginBottom: 0 }}>{isArabic ? "الإثباتات اختيارية وليست شرطًا لدخول الاختبار. أي مكافأة أو نقاط إضافية لا تُحتسب إلا بعد موافقة المشرف." : "Proofs are optional, not a prerequisite for the exam. Any bonus is counted only after administrator approval."}</p></div>
        </div>

        <div style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}><div><h2 style={heading}>{submittedScore !== null ? (isArabic ? "النتيجة" : "Result") : attemptId ? (isArabic ? "الاختبار" : "Quiz") : (isArabic ? "التسجيل" : "Registration")}</h2><p style={muted}>{loading ? (isArabic ? "جارٍ التحقق..." : "Checking status...") : config?.active ? (isArabic ? "المسابقة مفتوحة حسب إعدادات المشرف." : "The competition is open according to administrator settings.") : (isArabic ? "المسابقة غير منشورة حاليًا." : "The competition is not published yet.")}</p></div><LockKeyhole size={20} color="hsl(var(--muted-foreground))" /></div>
          {!config?.active ? <div style={closedBox}>{isArabic ? "سيظهر التسجيل بعد تفعيل المسابقة من لوحة الإدارة." : "Registration will appear after an administrator activates the competition."}</div> : submittedScore !== null ? <div style={{ display: "grid", gap: 14, marginTop: 18 }}><div style={scoreBox}><CheckCircle2 size={20} /><strong>{isArabic ? `النقاط الموضوعية: ${submittedScore}` : `Objective score: ${submittedScore}`}</strong></div><p style={muted}>{isArabic ? "يمكنك إرسال صورة إثبات اختيارية بعد الاختبار، أو رابط HTTPS إذا كانت الصورة مستضافة بالفعل. لا تُضاف أي نقاط تلقائيًا قبل مراجعة المشرف." : "You may submit an optional proof image after the quiz, or an HTTPS link if the image is already hosted. No bonus is added automatically before administrator review."}</p><form onSubmit={submitProof} style={{ display: "grid", gap: 10 }}><label style={label}>{isArabic ? "نوع الإثبات" : "Proof type"}<select value={proofType} onChange={(event) => setProofType(event.target.value)} style={input}><option value="other">{isArabic ? "إثبات آخر" : "Other proof"}</option><option value="subscription">{isArabic ? "اشتراك" : "Subscription"}</option><option value="purchase_receipt">{isArabic ? "إيصال شراء" : "Purchase receipt"}</option></select></label><label style={label}>{isArabic ? "رفع صورة الإثبات" : "Proof image"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setProofFile(event.target.files?.[0] || null)} style={input} />{proofFile && <small style={{ color: "hsl(var(--muted-foreground))" }}>{proofFile.name} · {(proofFile.size / 1024 / 1024).toFixed(2)} MB</small>}</label><label style={label}>{isArabic ? "أو رابط إثبات HTTPS" : "Or HTTPS proof link"}<input value={proofUrl} onChange={(event) => setProofUrl(event.target.value)} placeholder="https://..." style={input} inputMode="url" /></label><button type="submit" style={button} disabled={proofSubmitting || (!proofFile && !proofUrl.trim())}>{proofSubmitting ? (isArabic ? "جارٍ الإرسال..." : "Sending...") : (isArabic ? "إرسال للمراجعة" : "Submit for review")}</button>{proofNotice && <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{proofNotice}</p>}</form></div> : attemptId ? <form onSubmit={submitQuiz} style={{ display: "grid", gap: 18, marginTop: 18 }}><div style={quizList}>{questions.length === 0 ? <div style={closedBox}>{isArabic ? "لا توجد أسئلة منشورة بعد." : "No published questions are available yet."}</div> : questions.map((question, index) => <QuestionCard key={question.id} question={question} index={index} isArabic={isArabic} answer={answers[question.id] || ""} onAnswer={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} />)}</div>{questions.length > 0 && <button type="submit" style={button} disabled={submitting}>{submitting ? (isArabic ? "جارٍ الإرسال..." : "Submitting...") : (isArabic ? "إرسال الإجابات" : "Submit answers")}</button>}{notice && <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{notice}</p>}</form> : <form onSubmit={submitRegistration} style={{ display: "grid", gap: 12, marginTop: 18 }}><label style={label}><span><Phone size={14} style={{ verticalAlign: "-2px", marginInlineEnd: 6 }} />{isArabic ? "رقم الهاتف للتواصل" : "Contact phone"}</span><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={isArabic ? "+20..." : "+1..."} style={input} inputMode="tel" /></label>{config.invite_required !== false && <label style={label}>{isArabic ? "كود الدعوة" : "Invitation code"}<input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder={isArabic ? "أدخل الكود الذي وصلك" : "Enter the code you received"} style={input} autoComplete="off" /></label>}<label style={{ display: "flex", gap: 9, alignItems: "flex-start", color: "hsl(var(--muted-foreground))", fontSize: 13, lineHeight: 1.5 }}><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />{isArabic ? "أوافق على استخدام رقم الهاتف للتواصل المتعلق بالمسابقة فقط." : "I consent to using my phone number for competition-related contact only."}</label><button type="submit" style={button} disabled={submitting}>{submitting ? (isArabic ? "جارٍ التحقق..." : "Checking...") : email ? (isArabic ? "متابعة التسجيل" : "Continue registration") : (isArabic ? "سجّل الدخول أولًا" : "Sign in first")}</button>{notice && <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{notice}</p>}</form>}
          {!email && !attemptId && <Link href="/login" style={{ display: "inline-block", marginTop: 18, color: "hsl(var(--muted-foreground))", textDecoration: "underline" }}>{isArabic ? "الانتقال إلى تسجيل الدخول" : "Go to sign in"}</Link>}
        </div>
      </section>

      {config?.leaderboard_published && <section style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 24px 0" }}><h2 style={heading}>{isArabic ? "الترتيب المنشور" : "Published leaderboard"}</h2><p style={muted}>{isArabic ? "يعرض الترتيب النقاط فقط دون أسماء أو أرقام هواتف حفاظًا على الخصوصية." : "Only scores are shown; names and phone numbers remain private."}</p>{leaderboard.length === 0 ? <div style={closedBox}>{isArabic ? "لم يتم نشر نتائج بعد." : "No published results yet."}</div> : <div style={{ display: "grid", gap: 8, marginTop: 18 }}>{leaderboard.map((entry, index) => <div key={`${entry.submitted_at || "entry"}-${index}`} style={{ ...scoreBox, justifyContent: "space-between" }}><span>{isArabic ? `المركز ${index + 1}` : `Rank ${index + 1}`}</span><strong>{entry.final_score} {isArabic ? "نقطة" : "points"}</strong></div>)}</div>}</section>}

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "56px 24px 0" }}><h2 style={heading}>{isArabic ? "فئات الجوائز" : "Prize categories"}</h2><p style={muted}>{isArabic ? "لا تظهر أي جائزة أو كمية إلا بعد إدخالها واعتمادها من لوحة الإدارة." : "No prize quantity or final allocation is shown until it is entered and published by an administrator."}</p>{prizes.length === 0 ? <div style={closedBox}>{isArabic ? "لم يتم نشر فئات الجوائز بعد." : "Prize categories have not been published yet."}</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginTop: 20 }}>{prizes.map((prize) => <article key={prize.id} style={card}><span style={chip}>{prize.category}</span><h3 style={{ color: "hsl(var(--foreground))", margin: "14px 0 8px", fontSize: 18 }}>{isArabic ? (prize.title_ar || prize.title_en) : prize.title_en}</h3><p style={muted}>{isArabic ? (prize.description_ar || prize.description_en) : (prize.description_en || prize.description_ar)}</p><small style={{ color: "hsl(var(--muted-foreground))" }}>{isArabic ? (prize.availability_note_ar || prize.availability_note_en) : (prize.availability_note_en || prize.availability_note_ar)}</small></article>)}</div>}</section>
    </main>
  );
}

function QuestionCard({ question, index, isArabic, answer, onAnswer }: { question: CompetitionQuestion; index: number; isArabic: boolean; answer: string; onAnswer: (value: string) => void }) {
  const options = questionOptions(question, isArabic);
  const prompt = isArabic ? (question.question_ar || question.question_en) : question.question_en;
  return <article style={{ border: "1px solid hsl(var(--border))", padding: 16, background: "hsl(var(--card))", borderRadius: "var(--radius)", display: "grid", gap: 12 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "hsl(var(--foreground))" }}><strong>{index + 1}. {prompt}</strong><small style={{ color: "hsl(var(--muted-foreground))", whiteSpace: "nowrap" }}>{question.points ?? 0} {isArabic ? "نقطة" : "points"}</small></div>{question.audio_url && <audio controls preload="none" src={question.audio_url} style={{ width: "100%" }} />}{options.length > 0 ? <div style={{ display: "grid", gap: 8 }}>{options.map((option) => <label key={option.value} style={{ display: "flex", gap: 9, alignItems: "flex-start", border: "1px solid hsl(var(--border))", padding: "9px 10px", borderRadius: "calc(var(--radius) * 0.75)", color: "hsl(var(--muted-foreground))", cursor: "pointer" }}><input type="radio" name={`question-${question.id}`} checked={answer === option.value} onChange={() => onAnswer(option.value)} />{option.label}</label>)}</div> : <textarea value={answer} onChange={(event) => onAnswer(event.target.value)} placeholder={isArabic ? "اكتب إجابتك للمراجعة الإدارية" : "Write your answer for administrator review"} style={{ ...input, minHeight: 100, resize: "vertical" }} />}</article>;
}

function OrganizerCard({ organizer, isArabic }: { organizer: (typeof organizers)[number]; isArabic: boolean }) {
  const cardStyle: React.CSSProperties = { ...organizerCard, borderColor: `hsl(${organizer.accent} / 0.42)`, background: `linear-gradient(145deg, hsl(var(--card)), hsl(${organizer.accent} / 0.09))` };
  const imageFrameStyle: React.CSSProperties = { ...organizerImageFrame, borderColor: `hsl(${organizer.accent} / 0.36)`, background: `linear-gradient(135deg, hsl(var(--secondary) / 0.92), hsl(${organizer.accent} / 0.18) 48%, hsl(var(--background) / 0.72))` };
  const content = <>
    <div style={imageFrameStyle}>
      {organizer.image ? <img src={organizer.image} alt={`${organizer.name} ${isArabic ? "شعار المنظم" : "organizer mark"}`} loading="lazy" style={{ ...organizerImage, objectFit: "contain", filter: organizer.name === "Antifarming Clan" ? "invert(1) drop-shadow(0 12px 24px hsl(var(--background) / 0.65))" : organizerImage.filter }} /> : <div style={organizerFallback}><span>{organizer.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 3)}</span><small>{isArabic ? "الصورة الرسمية غير متاحة" : "Official image unavailable"}</small></div>}
      <span style={organizerStatus}>{organizer.verified ? (isArabic ? "موثق" : "Verified") : (isArabic ? "بانتظار الشعار" : "Awaiting mark")}</span>
    </div>
    <div style={{ display: "grid", gap: 7 }}><strong style={organizerName}>{organizer.name}</strong><span style={organizerRole}>{isArabic ? (organizer.role === "Host" ? "الجهة المستضيفة" : "شريك مجتمعي") : organizer.role}</span>{organizer.href ? <span style={organizerSite}><Globe2 size={12} />{isArabic ? "فتح الموقع أو الملف" : "Open website or profile"}<ExternalLink size={11} /></span> : <span style={organizerSiteMuted}>{isArabic ? "الرابط يضاف من لوحة الإدارة" : "Website link managed in admin"}</span>}</div>
  </>;
  if (organizer.href?.startsWith("http")) return <a href={organizer.href} target="_blank" rel="noreferrer" style={cardStyle}>{content}</a>;
  if (organizer.href) return <Link href={organizer.href} style={cardStyle}>{content}</Link>;
  return <article style={cardStyle}>{content}</article>;
}

function Feature({ accent, icon, title, text }: { accent: string; icon: React.ReactNode; title: string; text: string }) { return <article style={{ ...card, display: "grid", gap: 12, borderTop: `2px solid ${accent}`, background: "linear-gradient(145deg, hsl(var(--card)), hsl(var(--primary) / 0.06))" }}><div style={{ color: accent }}>{icon}</div><strong style={{ color: "hsl(var(--foreground))" }}>{title}</strong><p style={{ ...muted, margin: 0 }}>{text}</p></article>; }

const heroSection: React.CSSProperties = { position: "relative", overflow: "hidden", borderBottom: "1px solid hsl(var(--border))", background: "radial-gradient(circle at 75% 12%, hsl(var(--primary) / 0.16), transparent 30%), linear-gradient(135deg, hsl(var(--background)), hsl(var(--content-bg)) 52%, hsl(var(--background)))" };
const heroGlow: React.CSSProperties = { position: "absolute", width: 520, height: 520, borderRadius: "50%", insetInlineEnd: "-180px", top: "-260px", border: "1px solid hsl(var(--primary) / 0.18)", boxShadow: "0 0 0 30px hsl(var(--primary) / 0.04), 0 0 0 60px hsl(var(--primary) / 0.025)" };
const heroGrid: React.CSSProperties = { position: "absolute", inset: 0, opacity: 0.32, backgroundImage: "linear-gradient(hsl(var(--border) / 0.32) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.32) 1px, transparent 1px)", backgroundSize: "44px 44px", maskImage: "linear-gradient(to bottom, black, transparent 80%)" };
const heroKicker: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, color: "hsl(var(--primary))", fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 18 };
const heroKickerLine: React.CSSProperties = { width: 34, height: 2, background: "hsl(var(--primary))", boxShadow: "0 0 16px hsl(var(--primary) / 0.7)" };
const heroStats: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", maxWidth: 640, marginTop: 34, borderTop: "1px solid hsl(var(--border))", borderBottom: "1px solid hsl(var(--border))", padding: "16px 0", gap: 18 };
const heroSeal: React.CSSProperties = { minHeight: 330, display: "grid", placeItems: "center", alignContent: "center", gap: 10, border: "1px solid hsl(var(--primary) / 0.35)", borderRadius: "calc(var(--radius) * 1.5)", background: "linear-gradient(145deg, hsl(var(--card) / 0.88), hsl(var(--primary) / 0.08))", boxShadow: "0 22px 60px hsl(var(--background) / 0.45), inset 0 1px 0 hsl(var(--foreground) / 0.08)", position: "relative" };
const heroSealRing: React.CSSProperties = { width: 190, height: 190, display: "grid", placeItems: "center", borderRadius: "50%", border: "1px solid hsl(var(--primary) / 0.6)", boxShadow: "0 0 0 10px hsl(var(--primary) / 0.06), 0 0 0 22px hsl(var(--primary) / 0.035), 0 0 50px hsl(var(--primary) / 0.22)" };
const heroSealInner: React.CSSProperties = { width: 156, height: 156, display: "grid", placeItems: "center", borderRadius: "50%", background: "hsl(var(--background) / 0.76)", border: "1px solid hsl(var(--border))" };
const heroSealLabel: React.CSSProperties = { color: "hsl(var(--primary))", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" };
const heroSealTitle: React.CSSProperties = { color: "hsl(var(--foreground))", textAlign: "center", fontSize: 22, letterSpacing: "0.18em", lineHeight: 1.05 };
const heroSealNote: React.CSSProperties = { color: "hsl(var(--muted-foreground))", fontSize: 12, textAlign: "center" };
const sectionHeadingRow: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "end", gap: 24, marginBottom: 20 };
const sectionOverline: React.CSSProperties = { display: "block", color: "hsl(var(--primary))", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 };
const organizerGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 };
const organizerCard: React.CSSProperties = { display: "grid", gap: 12, minHeight: 220, padding: 12, color: "inherit", textDecoration: "none", background: "linear-gradient(145deg, hsl(var(--card)), hsl(var(--muted) / 0.25))", border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) * 1.15)", boxShadow: "var(--shadow-sm)", transition: "transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease" };
const organizerImageFrame: React.CSSProperties = { minHeight: 142, position: "relative", display: "grid", placeItems: "center", overflow: "hidden", borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))", background: "linear-gradient(135deg, hsl(var(--secondary) / 0.95), hsl(var(--primary) / 0.13) 48%, hsl(var(--chart-1) / 0.08))" };
const organizerImage: React.CSSProperties = { width: "100%", height: 142, objectFit: "contain", padding: 18, filter: "drop-shadow(0 12px 24px hsl(var(--background) / 0.65))" };
const organizerFallback: React.CSSProperties = { display: "grid", placeItems: "center", gap: 8, width: "100%", height: 142, color: "hsl(var(--muted-foreground))", textAlign: "center" };
const organizerStatus: React.CSSProperties = { position: "absolute", insetInlineStart: 8, top: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--background) / 0.82)", color: "hsl(var(--primary))", borderRadius: 999, padding: "4px 7px", fontSize: 9, fontWeight: 800, letterSpacing: "0.06em" };
const organizerName: React.CSSProperties = { color: "hsl(var(--foreground))", fontSize: 15 };
const organizerRole: React.CSSProperties = { color: "hsl(var(--muted-foreground))", fontSize: 11 };
const organizerSite: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, color: "hsl(var(--primary))", fontSize: 10, fontWeight: 700 };
const organizerSiteMuted: React.CSSProperties = { color: "hsl(var(--muted-foreground) / 0.72)", fontSize: 10 };

const panel: React.CSSProperties = { background: "var(--content-bg)", border: "1px solid hsl(var(--border))", borderRadius: "calc(var(--radius) * 1.5)", padding: 24, boxShadow: "var(--shadow-sm)" };
const card: React.CSSProperties = { background: "hsl(var(--card))", border: "1px solid hsl(var(--card-border))", borderRadius: "var(--radius)", padding: 20, boxShadow: "var(--shadow-sm)" };
const heading: React.CSSProperties = { color: "hsl(var(--foreground))", fontSize: 28, margin: 0, letterSpacing: "-0.02em" };
const muted: React.CSSProperties = { color: "hsl(var(--muted-foreground))", lineHeight: 1.7, fontSize: 14 };
const eyebrow: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid hsl(var(--primary) / 0.35)", color: "hsl(var(--primary))", background: "hsl(var(--primary) / 0.08)", borderRadius: 999, padding: "6px 10px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" };
const chip: React.CSSProperties = { display: "inline-flex", width: "fit-content", border: "1px solid hsl(var(--border))", color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted) / 0.45)", borderRadius: 999, padding: "5px 9px", fontSize: 12 };
const number: React.CSSProperties = { width: 28, height: 28, display: "grid", placeItems: "center", border: "1px solid hsl(var(--primary) / 0.45)", color: "hsl(var(--primary))", background: "hsl(var(--primary) / 0.08)", borderRadius: "50%", flex: "0 0 auto", fontSize: 12, fontWeight: 700 };
const closedBox: React.CSSProperties = { marginTop: 18, border: "1px dashed hsl(var(--border))", color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted) / 0.25)", borderRadius: "var(--radius)", padding: 16, lineHeight: 1.6, fontSize: 13 };
const label: React.CSSProperties = { display: "grid", gap: 7, color: "hsl(var(--muted-foreground))", fontSize: 13 };
const input: React.CSSProperties = { background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: "calc(var(--radius) * 0.75)", padding: "11px 12px", outline: "none", width: "100%", boxSizing: "border-box" };
const button: React.CSSProperties = { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", border: "1px solid hsl(var(--primary) / 0.7)", borderRadius: "var(--radius)", padding: "12px 14px", cursor: "pointer", fontWeight: 700, boxShadow: "var(--shadow-sm)" };
const scoreBox: React.CSSProperties = { display: "flex", gap: 10, alignItems: "center", border: "1px solid hsl(var(--primary) / 0.35)", background: "hsl(var(--primary) / 0.08)", borderRadius: "var(--radius)", padding: 16, color: "hsl(var(--foreground))" };
const quizList: React.CSSProperties = { display: "grid", gap: 14, maxHeight: 650, overflowY: "auto", paddingInlineEnd: 4 };
