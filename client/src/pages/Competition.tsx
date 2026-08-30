import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  Globe2,
  Image as ImageIcon,
  LockKeyhole,
  Phone,
  Pause,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
  Trophy,
  Users,
  Volume2,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { supabase } from "@/lib/supabase";
import { SEOHead } from "@/components/SEOHead";
import { ImageViewerOverlay } from "@/components/ImageViewer";
import { buildAuthPath, getCurrentAuthReturnPath } from "@/lib/authRedirect";

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
  preview_only?: boolean;
  preview_owner_username?: string | null;
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
  image_url?: string | null;
  weapon_id?: string | null;
  sort_order?: number;
}

interface CompetitionLeaderboardEntry {
  final_score: number | string;
  submitted_at?: string | null;
  status: string;
}

type Organizer = { name: string; role: string; image: string | null; href: string | null; verified: boolean };
type AnswerMap = Record<string, string>;
type QuestionOption = { value: string; label: string; accessibilityLabel: string; image_url?: string | null };

const organizers: Organizer[] = [
  { name: "CrossFire Wiki", role: "Host", image: "/logo-new.png", href: "/", verified: true },
  { name: "Zims", role: "Community partner", image: "/assets/competition/zims-mark.jpg", href: null, verified: true },
  { name: "Antifarming Clan", role: "Community partner", image: "/assets/competition/antifarming-clan-mark.png", href: "https://crossfire.z8games.com/clan/404003", verified: true },
  { name: "Diaasadek", role: "Community partner", image: "/assets/sellers/diaa-store-logo.png", href: "https://diaasadek.com", verified: true },
  { name: "Bemora", role: "Community partner", image: "/assets/competition/bemora-robot-card.jpg", href: null, verified: true },
];

function renderCompetitionTitle(title: string, isArabic: boolean) {
  const brandMatch = title.match(/crossfire\s*wiki/i);
  if (!brandMatch || brandMatch.index === undefined) return title;
  const before = title.slice(0, brandMatch.index).trim();
  const after = title.slice(brandMatch.index + brandMatch[0].length).trim();
  return (
    <>
      {before && <span className="competition-title-prefix">{before}</span>}
      <span className="competition-title-brand" dir="ltr">CrossFire Wiki</span>
      {after && <span className="competition-title-suffix" style={{ direction: isArabic ? "rtl" : "ltr" }}>{after}</span>}
    </>
  );
}

function questionOptions(question: CompetitionQuestion): QuestionOption[] {
  if (!Array.isArray(question.options)) return [];
  return question.options.flatMap((option) => {
    if (typeof option === "string") return [{ value: option, label: option, accessibilityLabel: option, image_url: null }];
    if (!option || typeof option !== "object") return [];
    const item = option as Record<string, unknown>;
    const value = typeof item.value === "string" ? item.value : typeof item.id === "string" ? item.id : "";
    const accessibilityLabel = typeof item.label_en === "string"
      ? item.label_en
      : typeof item.label_ar === "string" ? item.label_ar : value;
    const label = typeof item.display_label_en === "string" && item.display_label_en.trim()
      ? item.display_label_en
      : accessibilityLabel;
    const imageUrl = typeof item.image_url === "string" && item.image_url ? item.image_url : null;
    return value ? [{ value, label, accessibilityLabel, image_url: imageUrl }] : [];
  });
}

function questionTypeLabel(kind: CompetitionQuestion["kind"], isArabic: boolean) {
  const labels = {
    multiple_choice: isArabic ? "اختيار من متعدد" : "Multiple choice",
    audio: isArabic ? "سؤال صوتي" : "Audio question",
    weapon: isArabic ? "كتالوج الأسلحة" : "Weapon catalogue",
    scenario: isArabic ? "سيناريو تحليلي" : "Scenario",
    essay: isArabic ? "إجابة كتابية" : "Written answer",
  };
  return labels[kind];
}

function hasAnswer(question: CompetitionQuestion, answer: string) {
  return question.kind === "essay" || question.kind === "scenario" ? answer.trim().length > 0 : Boolean(answer);
}

export default function Competition() {
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const direction = isArabic ? "rtl" : "ltr";
  const [config, setConfig] = useState<CompetitionConfig | null>(null);
  const [prizes, setPrizes] = useState<CompetitionPrize[]>([]);
  const [questions, setQuestions] = useState<CompetitionQuestion[]>([]);
  const [leaderboard, setLeaderboard] = useState<CompetitionLeaderboardEntry[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminToken] = useState<string | null>(() => typeof window === "undefined" ? null : localStorage.getItem("adminToken"));
  const directPreviewMode = typeof window !== "undefined"
    && window.location.hostname.endsWith(".vercel.app")
    && new URLSearchParams(window.location.search).get("competition_test") === "1";
  const competitionApiPath = directPreviewMode
    ? "/api/content?type=competition&competition_test=1"
    : "/api/content?type=competition";
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [phone, setPhone] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [accessMode, setAccessMode] = useState<"new" | "returning">(directPreviewMode ? "returning" : "new");
  const [accessRequested, setAccessRequested] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [attemptToken, setAttemptToken] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofType, setProofType] = useState("other");
  const [proofNotice, setProofNotice] = useState("");
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [windowBlurred, setWindowBlurred] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const competitionHeaders: HeadersInit = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
        const [competitionResponse, sessionResult] = await Promise.all([
          fetch(competitionApiPath, { cache: "no-store", headers: competitionHeaders }),
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
          setIsAuthenticated(Boolean(session?.user && session?.access_token));
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
      setIsAuthenticated(Boolean(session?.user && session?.access_token));
    });
    return () => {
      cancelled = true;
      authState.data.subscription.unsubscribe();
    };
    }, [adminToken, competitionApiPath]);

  const previewMode = Boolean(config?.preview_only && !config.active && (adminToken || directPreviewMode));
  const canRegister = Boolean(config?.active || previewMode);
  const canRequestAccess = Boolean(config && !config.leaderboard_published);
  const showEntryForm = canRegister || canRequestAccess;
  const title = config ? (isArabic ? config.title_ar : config.title_en) : (isArabic ? "مسابقة CrossFire Wiki" : "CrossFire Wiki Competition");
  const intro = config ? (isArabic ? config.intro_ar : config.intro_en) : null;
  const rules = config ? (isArabic ? config.rules_ar : config.rules_en) : null;
  const activeQuestion = questions[activeQuestionIndex] || null;
  const answeredCount = questions.filter((question) => hasAnswer(question, answers[question.id] || "")).length;
  const examProtectionActive = Boolean(attemptId && submittedScore === null);

  useEffect(() => {
    if (!examProtectionActive) return;
    const blockedShortcutKeys = new Set(["c", "x", "s", "p", "u"]);
    const preventExamCopying = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const preventExamShortcuts = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (event.key === "PrintScreen" || ((event.ctrlKey || event.metaKey) && blockedShortcutKeys.has(key))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const events: Array<[keyof DocumentEventMap, EventListener]> = [
      ["contextmenu", preventExamCopying],
      ["copy", preventExamCopying],
      ["cut", preventExamCopying],
      ["selectstart", preventExamCopying],
      ["dragstart", preventExamCopying],
      ["keydown", preventExamShortcuts as EventListener],
    ];
    events.forEach(([name, handler]) => document.addEventListener(name, handler, true));
    return () => events.forEach(([name, handler]) => document.removeEventListener(name, handler, true));
  }, [examProtectionActive]);

  useEffect(() => {
    if (!examProtectionActive) {
      setWindowBlurred(false);
      return;
    }
    const onBlur = () => setWindowBlurred(true);
    const onFocus = () => setWindowBlurred(false);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [examProtectionActive]);

  const requirements = useMemo(() => isArabic ? [
    "إدخال رقم هاتف صالح مع موافقة واضحة على التواصل المتعلق بالمسابقة.",
    "إدخال كود الدعوة الذي يرسله المشرف، ولا يظهر الكود في الصفحة العامة.",
    "الاستماع إلى المقاطع الصوتية والإجابة عن أسئلة الأنماط والخرائط والأسلحة.",
    "إكمال السيناريوهات الكتابية؛ هذه الإجابات تُراجع يدويًا ولا تُحسب تلقائيًا.",
    "إرسال إثبات اختياري بعد النتيجة إذا أردت طلب نقاط إضافية للمراجعة.",
  ] : [
    "Provide a valid phone number and consent to competition-related contact.",
    "Enter the invitation code sent by an administrator; it is never exposed publicly.",
    "Listen to the audio clips and identify the referenced modes, locations, and weapons.",
    "Complete the written scenarios; these answers are reviewed manually and not auto-scored.",
    "Submit an optional proof after the result if you want a reviewable bonus request.",
  ], [isArabic]);

  const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    else if (adminToken) headers.Authorization = `Bearer ${adminToken}`;
    return headers;
  };

  const submitRegistration = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice("");
    if (accessMode === "new") {
      if (!phone.trim() || !consent) {
        setNotice(isArabic ? "أدخل رقم الهاتف ووافق على التواصل قبل إرسال الطلب." : "Enter your phone number and consent before sending the request.");
        return;
      }
      setSubmitting(true);
      try {
        const response = await fetch(competitionApiPath, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ action: "request_access", phone: phone.trim(), consent }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Access request failed");
        setAccessRequested(true);
        setNotice(isArabic ? "تم استلام رقمك. خلال بعض الوقت سيتم إرسال كود المشاركة لك." : "Your phone number was received. Your participation code will be sent shortly.");
      } catch (error) {
        setNotice(error instanceof Error ? error.message : (isArabic ? "تعذر إرسال الطلب." : "Could not send the request."));
      } finally {
        setSubmitting(false);
      }
      return;
    }
    if (!isAuthenticated && !previewMode && !directPreviewMode && !inviteCode.trim()) {
      setNotice(isArabic ? "أدخل كود المشاركة الذي وصلك." : "Enter the participation code you received.");
      return;
    }
    if (!phone.trim() || (config?.invite_required !== false && !directPreviewMode && !inviteCode.trim()) || !consent) {
      setNotice(isArabic ? "أكمل رقم الهاتف وكود الدعوة والموافقة قبل المتابعة." : "Complete the phone number, invitation code, and consent before continuing.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(competitionApiPath, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "start", accessMode: "returning", phone: phone.trim(), inviteCode: inviteCode.trim(), consent }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Registration failed");
      setAttemptId(typeof payload.attempt?.id === "string" ? payload.attempt.id : null);
      setAttemptToken(typeof payload.attemptToken === "string" ? payload.attemptToken : null);
      setQuestions(Array.isArray(payload.questions) ? payload.questions as CompetitionQuestion[] : []);
      setAnswers({});
      setActiveQuestionIndex(0);
      setReviewing(false);
      setNotice(isArabic ? "تم قبول التسجيل. ابدأ بالسؤال الأول ثم استخدم شريط التنقل للمراجعة." : "Registration accepted. Start with question one, then use the navigator to review.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : (isArabic ? "تعذر بدء المحاولة." : "Could not start the attempt."));
    } finally {
      setSubmitting(false);
    }
  };

  const submitQuiz = async () => {
    if (!attemptId || (!accessToken && !adminToken && !attemptToken && !directPreviewMode)) return;
    setSubmitting(true);
    setNotice("");
    try {
      const response = await fetch(competitionApiPath, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ action: "submit", attemptId, attemptToken, answers }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Submission failed");
      setSubmittedScore(Number(payload.objectiveScore || 0));
      setReviewing(false);
      setNotice(isArabic ? "تم إرسال الإجابات بنجاح. يمكنك الآن إرسال إثبات اختياري للمراجعة." : "Your answers were submitted successfully. You can now send an optional proof for review.");
      setProofNotice("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : (isArabic ? "تعذر إرسال الإجابات." : "Could not submit answers."));
    } finally {
      setSubmitting(false);
    }
  };

  const submitProof = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!attemptId || (!accessToken && !adminToken && !attemptToken && !directPreviewMode) || (!proofUrl.trim() && !proofFile)) return;
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
        if (attemptToken) formData.append("attemptToken", attemptToken);
        formData.append("proofType", proofType);
        const uploadToken = accessToken || adminToken;
        response = await fetch(directPreviewMode ? "/api/images/upload?competition_test=1" : "/api/images/upload", { method: "POST", headers: uploadToken ? { Authorization: `Bearer ${uploadToken}` } : {}, body: formData });
      } else {
        response = await fetch(competitionApiPath, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ action: "submit_proof", attemptId, attemptToken, proofType, fileUrl: proofUrl.trim() }),
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

  return (
    <>
      <SEOHead
        title={isArabic ? "مسابقة CrossFire Wiki بالعربية | اختبار معرفة كروس فاير" : "CrossFire Wiki Competition | CrossFire Knowledge Quiz"}
        description={isArabic ? "اختبار معرفة ثنائي اللغة عن CrossFire بأسئلة صوتية وموثقة ونظام نقاط ومراجعة إدارية." : "A bilingual CrossFire knowledge quiz with sourced audio questions, scoring, and administrator review."}
        canonicalUrl={`https://crossfire.wiki${isArabic ? "/ar/competition" : "/competition"}`}
        hreflangAlternates={[{ lang: "en", url: "https://crossfire.wiki/competition" }, { lang: "ar", url: "https://crossfire.wiki/ar/competition" }]}
        noindex={previewMode || !config?.active}
        schemaType="WebPage"
        schemaData={{ name: isArabic ? "مسابقة CrossFire Wiki" : "CrossFire Wiki Competition", description: isArabic ? "اختبار معرفة ثنائي اللغة عن CrossFire." : "A bilingual CrossFire knowledge quiz.", isPartOf: { "@type": "WebSite", name: "CrossFire Wiki", url: "https://crossfire.wiki" } }}
      />
      <main dir={direction} className={`competition-page ${examProtectionActive ? "competition-page--protected" : ""} ${windowBlurred ? "competition-page--window-blurred" : ""}`}>
        <section className="competition-hero">
          <div className="competition-container competition-hero-grid">
            <div className="competition-hero-copy">
              <div className="competition-eyebrows">
                <span className="competition-eyebrow"><Trophy size={14} />{isArabic ? "اختبار المعرفة · نسخة خاصة" : "Knowledge challenge · private preview"}</span>
                <span className="competition-eyebrow competition-eyebrow-muted">{isArabic ? "عربي وإنجليزي" : "Arabic and English"}</span>
              </div>
              <p className="competition-kicker">{isArabic ? "استمع · اختر · راجع · أرسل" : "Listen · choose · review · submit"}</p>
              <h1 className="competition-title">{renderCompetitionTitle(title, isArabic)}</h1>
              <p className="competition-intro">{intro || (isArabic ? "اختبار مجتمعي مبني على مقاطع صوتية وأسئلة موثقة من عالم CrossFire. صُممت كل خطوة لتكون واضحة على الهاتف والكمبيوتر." : "A community challenge built around sourced audio clips and CrossFire knowledge. Every step is designed to stay clear on phone and desktop.")}</p>
              <div className="competition-hero-stats">
                <div><strong>{previewMode ? (questions.length || 25) : config?.active ? (questions.length || "—") : "—"}</strong><span>{isArabic ? "سؤالًا" : "questions"}</span></div>
                <div><strong>{isArabic ? "صوت" : "Audio"}</strong><span>{isArabic ? "مقاطع أصلية" : "original clips"}</span></div>
                <div><strong>{isArabic ? "مراجعة" : "Review"}</strong><span>{isArabic ? "للسيناريو والإثبات" : "scenarios and proofs"}</span></div>
              </div>
            </div>
            <div className="competition-hero-card">
              <div className="competition-hero-card-mark"><img src="/logo-new.png" alt="CrossFire Wiki" /></div>
              <span className="competition-hero-card-label">{previewMode ? (isArabic ? "معاينة المشرف" : "Administrator preview") : (isArabic ? "تحدي CrossFire" : "CrossFire challenge")}</span>
              <strong>{isArabic ? "اختبار واحد، تجربة واضحة" : "One challenge, one clear flow"}</strong>
              <p>{isArabic ? "بطاقة سؤال واحدة في كل مرة، وبدائل كبيرة، ومراجعة قبل الإرسال." : "One question at a time, large answer cards, and a review step before submission."}</p>
              <div className="competition-hero-card-rule" />
              <span>{isArabic ? "لا توجد نتائج منشورة أثناء المعاينة" : "No public results during preview"}</span>
            </div>
          </div>
        </section>

        <section className="competition-container competition-partners-section">
          <div className="competition-section-heading"><div><span className="competition-overline">{isArabic ? "المجتمع" : "Community"}</span><h2>{isArabic ? "المنظمون والداعمون" : "Organizers and supporters"}</h2></div><p>{isArabic ? "الشركاء الظاهرون هنا جزء من تعريف تجربة المسابقة، بينما يظل القرار والنتائج تحت مراجعة CrossFire Wiki." : "These partners help define the challenge experience; decisions and results remain under CrossFire Wiki review."}</p></div>
          <div className="competition-organizer-grid">{organizers.map((organizer) => <OrganizerCard key={organizer.name} organizer={organizer} isArabic={isArabic} />)}</div>
        </section>

        <section className={`competition-container competition-workspace ${attemptId ? "competition-workspace--quiz" : ""}`}>
          <aside className="competition-info-panel">
            <div className="competition-panel-label"><CircleHelp size={15} />{isArabic ? "قبل أن تبدأ" : "Before you start"}</div>
            <h2>{isArabic ? "تدفق بسيط وواضح" : "A simple, focused flow"}</h2>
            <p>{loading ? (isArabic ? "جارٍ التحقق من حالة المسابقة..." : "Checking competition status...") : (isArabic ? "التسجيل خاص بالنسخة التجريبية للمشرف أو يفتح بعد نشر المسابقة من لوحة الإدارة." : "Registration is private to the administrator preview or opens after an administrator publishes the competition.")}</p>
            <div className="competition-requirements">{requirements.map((item, index) => <div className="competition-requirement" key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></div>)}</div>
            {rules && <div className="competition-rules"><strong>{isArabic ? "قواعد المسابقة" : "Competition rules"}</strong><p>{rules}</p></div>}
            <div className="competition-policy-note"><ShieldCheck size={16} /><span>{isArabic ? "الإثباتات اختيارية، ولا تضاف أي نقاط إضافية قبل مراجعة المشرف." : "Proofs are optional, and no bonus is added before administrator review."}</span></div>
          </aside>

          <section className="competition-action-panel" aria-live="polite">
            <div className="competition-action-heading"><div><span className="competition-overline">{submittedScore !== null ? (isArabic ? "اكتمل الاختبار" : "Challenge complete") : attemptId ? (isArabic ? "وضع الاختبار" : "Challenge mode") : (isArabic ? "بوابة الدخول" : "Entry gate")}</span><h2>{submittedScore !== null ? (isArabic ? "نتيجتك الأولية" : "Your initial result") : attemptId ? (isArabic ? "أجب على مهل" : "Answer at your pace") : (isArabic ? "ابدأ من هنا" : "Start here")}</h2></div><LockKeyhole size={18} /></div>
            {!showEntryForm ? <div className="competition-closed-box"><LockKeyhole size={18} /><div><strong>{isArabic ? "لا يمكن فتح بوابة المسابقة حاليًا" : "The competition gate is unavailable"}</strong><p>{isArabic ? "تعذر تحميل إعدادات المسابقة. حاول مرة أخرى لاحقًا." : "Competition settings could not be loaded. Please try again later."}</p></div></div> : submittedScore !== null ? <ResultPanel isArabic={isArabic} score={submittedScore} proofType={proofType} setProofType={setProofType} proofFile={proofFile} setProofFile={setProofFile} proofUrl={proofUrl} setProofUrl={setProofUrl} proofSubmitting={proofSubmitting} proofNotice={proofNotice} onSubmit={submitProof} /> : attemptId ? <QuizFlow questions={questions} answers={answers} activeQuestionIndex={activeQuestionIndex} reviewing={reviewing} submitting={submitting} isArabic={isArabic} notice={notice} onAnswer={(questionId, value) => setAnswers((current) => ({ ...current, [questionId]: value }))} onPrevious={() => setActiveQuestionIndex((current) => Math.max(0, current - 1))} onNext={() => setActiveQuestionIndex((current) => Math.min(questions.length - 1, current + 1))} onJump={(index) => { setActiveQuestionIndex(index); setReviewing(false); }} onReview={() => setReviewing(true)} onBackToQuestions={() => setReviewing(false)} onSubmit={submitQuiz} /> : <RegistrationForm isArabic={isArabic} previewMode={previewMode} canRegister={canRegister} phone={phone} setPhone={setPhone} inviteCode={inviteCode} setInviteCode={setInviteCode} inviteRequired={config?.invite_required !== false && !directPreviewMode} consent={consent} setConsent={setConsent} accessMode={accessMode} setAccessMode={setAccessMode} accessRequested={accessRequested} submitting={submitting} notice={notice} onSubmit={submitRegistration} />}
            {notice && !attemptId && <p className="competition-inline-notice">{notice}</p>}
          </section>
        </section>

        {config?.leaderboard_published && <section className="competition-container competition-lower-section"><div className="competition-section-heading"><div><span className="competition-overline">{isArabic ? "النتائج" : "Results"}</span><h2>{isArabic ? "الترتيب المنشور" : "Published leaderboard"}</h2></div><p>{isArabic ? "يعرض الترتيب النقاط فقط دون أسماء أو أرقام هواتف." : "Only scores are shown; names and phone numbers remain private."}</p></div>{leaderboard.length === 0 ? <div className="competition-closed-box">{isArabic ? "لم يتم نشر نتائج بعد." : "No published results yet."}</div> : <div className="competition-leaderboard">{leaderboard.map((entry, index) => <div className="competition-score-row" key={`${entry.submitted_at || "entry"}-${index}`}><span>{isArabic ? `المركز ${index + 1}` : `Rank ${index + 1}`}</span><strong>{entry.final_score} {isArabic ? "نقطة" : "points"}</strong></div>)}</div>}</section>}

        <section className="competition-container competition-lower-section"><div className="competition-section-heading"><div><span className="competition-overline">{isArabic ? "المكافآت" : "Rewards"}</span><h2>{isArabic ? "فئات الجوائز" : "Prize categories"}</h2></div><p>{isArabic ? "لا تظهر تفاصيل الجوائز إلا بعد إدخالها واعتمادها من لوحة الإدارة." : "Prize details appear only after they are entered and approved in the admin panel."}</p></div>{prizes.length === 0 ? <div className="competition-closed-box">{isArabic ? "لم يتم نشر فئات الجوائز بعد." : "Prize categories have not been published yet."}</div> : <div className="competition-prize-grid">{prizes.map((prize) => <article className="competition-prize-card" key={prize.id}><span>{prize.category}</span><h3>{isArabic ? (prize.title_ar || prize.title_en) : prize.title_en}</h3><p>{isArabic ? (prize.description_ar || prize.description_en) : (prize.description_en || prize.description_ar)}</p><small>{isArabic ? (prize.availability_note_ar || prize.availability_note_en) : (prize.availability_note_en || prize.availability_note_ar)}</small></article>)}</div>}</section>
      </main>
    </>
  );
}

function RegistrationForm({ isArabic, previewMode, canRegister, phone, setPhone, inviteCode, setInviteCode, inviteRequired, consent, setConsent, accessMode, setAccessMode, accessRequested, submitting, notice, onSubmit }: { isArabic: boolean; previewMode: boolean; canRegister: boolean; phone: string; setPhone: (value: string) => void; inviteCode: string; setInviteCode: (value: string) => void; inviteRequired: boolean; consent: boolean; setConsent: (value: boolean) => void; accessMode: "new" | "returning"; setAccessMode: (value: "new" | "returning") => void; accessRequested: boolean; submitting: boolean; notice: string; onSubmit: (event: React.FormEvent) => void }) {
  const isNew = accessMode === "new";
  return <form className="competition-registration-form" onSubmit={onSubmit}>
    <div className="competition-form-intro"><span className="competition-step-number">01</span><div><strong>{previewMode ? (isArabic ? "اختبار المشرف الخاص" : "Private administrator test") : (isArabic ? "بوابة المشاركة" : "Participation gate")}</strong><p>{previewMode ? (isArabic ? "هذه البوابة مخصصة لاختبار المشرف على نسخة Preview." : "This gate is for administrator testing on the Preview deployment.") : (isArabic ? "اختر طريقة الدخول المناسبة لك." : "Choose the entry option that fits you.")}</p></div></div>
    <div className="competition-access-choice" role="group" aria-label={isArabic ? "نوع المشاركة" : "Participation type"}><button type="button" className={isNew ? "is-selected" : ""} onClick={() => setAccessMode("new")}>{isArabic ? "أول مرة؟ اطلب كودًا" : "First time? Request a code"}</button><button type="button" className={!isNew ? "is-selected" : ""} onClick={() => setAccessMode("returning")}>{isArabic ? "لدي كود مشاركة" : "I have a participation code"}</button></div>
    <p className="competition-access-help">{isNew ? (isArabic ? "أدخل رقم هاتفك فقط. سيظهر طلبك للمشرف، وسيتم إرسال كود المشاركة لك خلال بعض الوقت." : "Enter your phone number only. The administrator will receive your request and send your code shortly.") : (isArabic ? "أدخل رقم الهاتف الذي سجلت به وكود المشاركة المرسل لك." : "Enter the phone number you registered with and the code you received.")}</p>
    <label className="competition-field"><span><Phone size={14} />{isArabic ? "رقم الهاتف للتواصل" : "Contact phone"}</span><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={isArabic ? "+20..." : "+1..."} inputMode="tel" autoComplete="tel" required /></label>
    {!isNew && <label className="competition-field"><span>{isArabic ? "كود المشاركة" : "Participation code"}</span><input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder={isArabic ? "أدخل الكود الذي وصلك" : "Enter the code you received"} autoComplete="off" required={inviteRequired} /></label>}
    <label className="competition-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{isArabic ? "أوافق على استخدام رقم الهاتف للتواصل المتعلق بالمسابقة فقط." : "I consent to using my phone number for competition-related contact only."}</span></label>
    <button className="competition-primary-button" type="submit" disabled={submitting || (isNew && accessRequested) || (!isNew && !canRegister && !previewMode)}>{submitting ? (isArabic ? "جارٍ إرسال الطلب..." : "Sending request...") : isNew ? (accessRequested ? (isArabic ? "تم إرسال الطلب" : "Request sent") : (isArabic ? "إرسال طلب المشاركة" : "Request participation code")) : (isArabic ? "دخول بال code" : "Enter with code")}<ChevronLeft size={17} /></button>
    {notice && <p className="competition-form-notice">{notice}</p>}
  </form>;
}

function QuizFlow({ questions, answers, activeQuestionIndex, reviewing, submitting, isArabic, notice, onAnswer, onPrevious, onNext, onJump, onReview, onBackToQuestions, onSubmit }: { questions: CompetitionQuestion[]; answers: AnswerMap; activeQuestionIndex: number; reviewing: boolean; submitting: boolean; isArabic: boolean; notice: string; onAnswer: (questionId: string, value: string) => void; onPrevious: () => void; onNext: () => void; onJump: (index: number) => void; onReview: () => void; onBackToQuestions: () => void; onSubmit: () => void }) {
  const activeQuestion = questions[activeQuestionIndex] || null;
  const answeredCount = questions.filter((question) => hasAnswer(question, answers[question.id] || "")).length;
  const positionPercent = questions.length ? Math.round(((activeQuestionIndex + 1) / questions.length) * 100) : 0;
  const answeredPercent = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  if (!activeQuestion) return <div className="competition-closed-box">{isArabic ? "لا توجد أسئلة منشورة." : "No published questions are available."}</div>;

  return <div className="quiz-flow">
    <div className="quiz-flow-topbar"><div><span className="quiz-flow-label">{isArabic ? "التقدم" : "Progress"}</span><strong>{isArabic ? `السؤال ${activeQuestionIndex + 1} من ${questions.length}` : `Question ${activeQuestionIndex + 1} of ${questions.length}`}</strong></div><div className="quiz-flow-progress-copy"><span>{answeredCount}/{questions.length} {isArabic ? "مجاب" : "answered"}</span><span>{positionPercent}%</span></div></div>
    <div className="quiz-flow-track" aria-label={isArabic ? "تقدم السؤال" : "Question progress"}><span style={{ width: `${positionPercent}%` }} /></div>
    <div className="quiz-flow-layout">
      <div className="quiz-main-card">
        {reviewing ? <ReviewPanel questions={questions} answers={answers} isArabic={isArabic} onJump={onJump} onBack={onBackToQuestions} onSubmit={onSubmit} submitting={submitting} /> : <>
          <div className="quiz-question-index"><span>{String(activeQuestionIndex + 1).padStart(2, "0")}</span><span>{questionTypeLabel(activeQuestion.kind, isArabic)}</span><strong>{activeQuestion.points ?? 0} {isArabic ? "نقطة" : "points"}</strong></div>
          <QuestionCard question={activeQuestion} isArabic={isArabic} answer={answers[activeQuestion.id] || ""} onAnswer={(value) => onAnswer(activeQuestion.id, value)} />
          <div className="quiz-navigation"><button className="quiz-secondary-button" type="button" onClick={onPrevious} disabled={activeQuestionIndex === 0}><ChevronRight size={17} />{isArabic ? "السابق" : "Previous"}</button>{activeQuestionIndex < questions.length - 1 ? <button className="competition-primary-button" type="button" onClick={onNext}>{isArabic ? "التالي" : "Next"}<ChevronLeft size={17} /></button> : <button className="competition-primary-button" type="button" onClick={onReview}>{isArabic ? "مراجعة الإجابات" : "Review answers"}<CheckCircle2 size={17} /></button>}</div>
        </>}
      </div>
      <aside className="quiz-question-rail"><div className="quiz-rail-heading"><span>{isArabic ? "خريطة الأسئلة" : "Question map"}</span><strong>{answeredPercent}%</strong></div><div className="quiz-question-chips">{questions.map((question, index) => <button type="button" key={question.id} className={`quiz-question-chip ${index === activeQuestionIndex ? "is-current" : ""} ${hasAnswer(question, answers[question.id] || "") ? "is-answered" : ""}`} onClick={() => onJump(index)} aria-label={`${isArabic ? "السؤال" : "Question"} ${index + 1}`}><span>{index + 1}</span>{hasAnswer(question, answers[question.id] || "") && <Check size={12} />}</button>)}</div><p>{isArabic ? "يمكنك التنقل بين الأسئلة وتعديل إجاباتك قبل الإرسال." : "Move between questions and edit answers before submitting."}</p></aside>
    </div>
    {notice && <p className="competition-form-notice">{notice}</p>}
  </div>;
}

function ReviewPanel({ questions, answers, isArabic, onJump, onBack, onSubmit, submitting }: { questions: CompetitionQuestion[]; answers: AnswerMap; isArabic: boolean; onJump: (index: number) => void; onBack: () => void; onSubmit: () => void; submitting: boolean }) {
  const unanswered = questions.filter((question) => !hasAnswer(question, answers[question.id] || "")).length;
  return <div className="quiz-review-panel"><div className="quiz-review-icon"><CheckCircle2 size={24} /></div><h3>{isArabic ? "راجع قبل الإرسال" : "Review before submitting"}</h3><p>{unanswered > 0 ? (isArabic ? `لديك ${unanswered} سؤال غير مجاب. يمكنك الإرسال الآن أو العودة لإكماله.` : `${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered. You can submit now or go back and complete them.`) : (isArabic ? "أكملت كل الأسئلة. راجع اختيارك الأخير ثم أرسل المحاولة." : "Every question has an answer. Review your last choices, then submit the attempt.")}</p><div className="quiz-review-list">{questions.map((question, index) => <button type="button" key={question.id} className={hasAnswer(question, answers[question.id] || "") ? "is-complete" : "is-missing"} onClick={() => onJump(index)}><span>{index + 1}</span><strong>{hasAnswer(question, answers[question.id] || "") ? (isArabic ? "تمت الإجابة" : "Answered") : (isArabic ? "بدون إجابة" : "Not answered")}</strong><ChevronLeft size={15} /></button>)}</div><div className="quiz-navigation"><button className="quiz-secondary-button" type="button" onClick={onBack}><RotateCcw size={16} />{isArabic ? "العودة للاختبار" : "Back to quiz"}</button><button className="competition-primary-button" type="button" onClick={onSubmit} disabled={submitting}>{submitting ? (isArabic ? "جارٍ الإرسال..." : "Submitting...") : (isArabic ? "إرسال نهائي" : "Submit attempt")}<Send size={16} /></button></div></div>;
}

function QuestionCard({ question, isArabic, answer, onAnswer }: { question: CompetitionQuestion; isArabic: boolean; answer: string; onAnswer: (value: string) => void }) {
  const options = questionOptions(question);
  const prompt = isArabic ? (question.question_ar || question.question_en) : question.question_en;
  const isWeaponQuestion = question.kind === "weapon";
  const [viewer, setViewer] = useState<{ src: string; alt: string } | null>(null);
  const openImage = (event: React.MouseEvent | React.KeyboardEvent, src: string, alt: string) => {
    event.preventDefault();
    event.stopPropagation();
    setViewer({ src, alt });
  };
  return <>
  <article className="quiz-question-card">
    <div className="quiz-question-prompt"><h3>{prompt}</h3><span>{options.length > 0 ? (isArabic ? "اختر الإجابة باللغة الإنجليزية" : "Choose one answer") : (isArabic ? "اكتب إجابة قصيرة للمراجعة" : "Write a short answer for review")}</span></div>
    {isWeaponQuestion && question.image_url && <figure className="quiz-question-media quiz-weapon-media"><img src={question.image_url} alt={isArabic ? "صورة السلاح المرتبط بالسؤال" : "Weapon image for this question"} loading="lazy" onClick={(event) => openImage(event, question.image_url as string, isArabic ? "صورة السلاح المرتبط بالسؤال" : "Weapon image for this question")} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && openImage(event, question.image_url as string, isArabic ? "صورة السلاح المرتبط بالسؤال" : "Weapon image for this question")} role="button" tabIndex={0} aria-label={isArabic ? "تكبير صورة السلاح" : "Zoom weapon image"} /><figcaption><ImageIcon size={13} />{isArabic ? "اضغط على الصورة لتكبيرها" : "Click the image to zoom"}</figcaption></figure>}
    {question.audio_url && <AudioPlayer src={question.audio_url} isArabic={isArabic} />}
    {options.length > 0 ? <div className="quiz-answer-grid" dir="ltr">{options.map((option, index) => { const selected = answer === option.value; return <button type="button" key={option.value} className={`quiz-answer-option ${option.image_url ? "is-weapon-option" : ""} ${selected ? "is-selected" : ""}`} onClick={() => onAnswer(option.value)} aria-pressed={selected} aria-label={isWeaponQuestion ? (isArabic ? `اختيار صورة ${String.fromCharCode(65 + index)}` : `Weapon image option ${String.fromCharCode(65 + index)}`) : option.accessibilityLabel}><span className="quiz-answer-letter">{String.fromCharCode(65 + index)}</span>{option.image_url && <img className="quiz-answer-image" src={option.image_url} alt={isWeaponQuestion ? (isArabic ? `صورة اختيار ${String.fromCharCode(65 + index)}` : `Weapon image option ${String.fromCharCode(65 + index)}`) : ""} loading="eager" decoding="async" onClick={(event) => openImage(event, option.image_url as string, isWeaponQuestion ? (isArabic ? `صورة اختيار ${String.fromCharCode(65 + index)}` : `Weapon image option ${String.fromCharCode(65 + index)}`) : option.accessibilityLabel)} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && openImage(event, option.image_url as string, isWeaponQuestion ? (isArabic ? `صورة اختيار ${String.fromCharCode(65 + index)}` : `Weapon image option ${String.fromCharCode(65 + index)}`) : option.accessibilityLabel)} role="button" tabIndex={0} aria-label={isArabic ? `تكبير صورة الاختيار ${String.fromCharCode(65 + index)}` : `Zoom option ${String.fromCharCode(65 + index)}`} />}<span className="quiz-answer-label" dir="ltr">{isWeaponQuestion ? `${isArabic ? "اختيار" : "Option"} ${String.fromCharCode(65 + index)}` : option.label}</span>{selected && <Check className="quiz-answer-check" size={17} />}</button>; })}</div> : <div className="quiz-written-answer"><label htmlFor={`answer-${question.id}`}>{isArabic ? "اكتب إجابتك للمراجعة الإدارية" : "Write your answer for administrator review"}</label><textarea id={`answer-${question.id}`} dir={isArabic ? "rtl" : "ltr"} value={answer} onChange={(event) => onAnswer(event.target.value)} placeholder={isArabic ? "اكتب إجابة عملية ومختصرة..." : "Write a practical, concise answer..."} maxLength={1200} /><span>{answer.length}/1200</span></div>}
  </article>
  {viewer && <ImageViewerOverlay src={viewer.src} alt={viewer.alt} open onClose={() => setViewer(null)} />}
  </>;
}

function formatAudioTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "00:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function AudioPlayer({ src, isArabic }: { src: string; isArabic: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    setAudioError(false);
    audioRef.current?.pause();
  }, [src]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || audioError) return;
    try {
      if (audio.paused) await audio.play();
      else audio.pause();
    } catch {
      setAudioError(true);
      setPlaying(false);
    }
  };

  const seek = (value: string) => {
    const nextTime = Number(value);
    if (!Number.isFinite(nextTime) || !audioRef.current) return;
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return <div className="quiz-audio-card">
    <audio
      ref={audioRef}
      className="quiz-audio-native"
      preload="metadata"
      src={src}
      onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
      onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => { setPlaying(false); setCurrentTime(0); }}
      onError={() => { setAudioError(true); setPlaying(false); }}
    />
    <div className="quiz-audio-topline">
      <button className="quiz-audio-play" type="button" onClick={() => void togglePlayback()} disabled={audioError} aria-label={playing ? (isArabic ? "إيقاف الصوت" : "Pause audio") : (isArabic ? "تشغيل الصوت" : "Play audio")}>
        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>
      <div className="quiz-audio-heading"><div><strong>{isArabic ? "استمع إلى المقطع" : "Listen to the clip"}</strong><span>{audioError ? (isArabic ? "تعذر تحميل المقطع." : "The clip could not be loaded.") : (isArabic ? "يمكنك إعادة التشغيل قبل اختيار الإجابة." : "Replay the clip before choosing an answer.")}</span></div></div>
      <span className="quiz-audio-time" aria-live="polite">{formatAudioTime(currentTime)} / {formatAudioTime(duration)}</span>
    </div>
    <input className="quiz-audio-seek" type="range" min="0" max={duration || 1} step="0.01" value={Math.min(currentTime, duration || 1)} onChange={(event) => seek(event.target.value)} disabled={!duration || audioError} aria-label={isArabic ? "موضع الصوت" : "Audio position"} />
    <div className="quiz-audio-footline"><span>{audioError ? (isArabic ? "تحقق من اتصالك ثم أعد المحاولة." : "Check your connection and try again.") : (isArabic ? "مقطع أصلي من حزمة المسابقة" : "Original clip from the competition pack")}</span><Volume2 size={15} /></div>
  </div>;
}

function ResultPanel({ isArabic, score, proofType, setProofType, proofFile, setProofFile, proofUrl, setProofUrl, proofSubmitting, proofNotice, onSubmit }: { isArabic: boolean; score: number; proofType: string; setProofType: (value: string) => void; proofFile: File | null; setProofFile: (file: File | null) => void; proofUrl: string; setProofUrl: (value: string) => void; proofSubmitting: boolean; proofNotice: string; onSubmit: (event: React.FormEvent) => void }) {
  return <div className="competition-result-panel"><div className="competition-result-score"><CheckCircle2 size={24} /><div><span>{isArabic ? "النقاط الموضوعية" : "Objective score"}</span><strong>{score}</strong></div></div><div className="competition-result-copy"><h3>{isArabic ? "أحسنت، انتهى الجزء الآلي" : "The automatic part is complete"}</h3><p>{isArabic ? "الأسئلة السيناريو والمقالية لا تُحسب تلقائيًا. يمكنك رفع إثبات الاشتراك في يوتيوب أو ديسكورد أو أي شرط آخر، ثم يراجع المشرف الدرجة النهائية وأي نقاط إضافية." : "Scenario and written questions are not auto-scored. You can upload YouTube, Discord, or other requirement proof, then the administrator reviews the final score and any bonus."}</p></div><form className="competition-proof-form" onSubmit={onSubmit}><label className="competition-field"><span>{isArabic ? "نوع الإثبات" : "Proof type"}</span><select value={proofType} onChange={(event) => setProofType(event.target.value)}><option value="youtube_subscription">{isArabic ? "اشتراك قناة يوتيوب" : "YouTube subscription"}</option><option value="discord_membership">{isArabic ? "عضوية ديسكورد" : "Discord membership"}</option><option value="game_subscription">{isArabic ? "اشتراك أو متابعة داخل اللعبة" : "Game subscription or follow"}</option><option value="purchase_receipt">{isArabic ? "إيصال شراء" : "Purchase receipt"}</option><option value="other">{isArabic ? "إثبات آخر" : "Other proof"}</option></select></label><label className="competition-field"><span>{isArabic ? "رفع صورة الإثبات" : "Proof image"}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setProofFile(event.target.files?.[0] || null)} />{proofFile && <small>{proofFile.name} · {(proofFile.size / 1024 / 1024).toFixed(2)} MB</small>}</label><label className="competition-field"><span>{isArabic ? "أو رابط إثبات HTTPS" : "Or HTTPS proof link"}</span><input value={proofUrl} onChange={(event) => setProofUrl(event.target.value)} placeholder="https://..." inputMode="url" /></label><button className="competition-primary-button" type="submit" disabled={proofSubmitting || (!proofFile && !proofUrl.trim())}>{proofSubmitting ? (isArabic ? "جارٍ الإرسال..." : "Sending...") : (isArabic ? "إرسال للمراجعة" : "Send for review")}<Send size={16} /></button>{proofNotice && <p className="competition-form-notice">{proofNotice}</p>}</form></div>;
}

function OrganizerCard({ organizer, isArabic }: { organizer: Organizer; isArabic: boolean }) {
  const content = <><div className="competition-organizer-image">{organizer.image ? <img src={organizer.image} alt={`${organizer.name} ${isArabic ? "شعار المنظم" : "organizer mark"}`} loading="lazy" /> : <span>{organizer.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 3)}</span>}<em>{organizer.verified ? (isArabic ? "موثق" : "Verified") : (isArabic ? "بانتظار الصورة" : "Awaiting mark")}</em></div><div className="competition-organizer-copy"><strong>{organizer.name}</strong><span>{isArabic ? (organizer.role === "Host" ? "الجهة المستضيفة" : "شريك مجتمعي") : organizer.role}</span>{organizer.href ? <small><Globe2 size={12} />{isArabic ? "فتح الرابط" : "Open link"}<ExternalLink size={11} /></small> : <small>{isArabic ? "يُدار الرابط من لوحة الإدارة" : "Link managed in admin"}</small>}</div></>;
  if (organizer.href?.startsWith("http")) return <a href={organizer.href} target="_blank" rel="noreferrer" className="competition-organizer-card">{content}</a>;
  if (organizer.href) return <Link href={organizer.href} className="competition-organizer-card">{content}</Link>;
  return <article className="competition-organizer-card">{content}</article>;
}
