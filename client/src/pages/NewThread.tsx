import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, ArrowLeft, Send, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";
import { getForumCategories, createForumThread, createForumPost } from "@/lib/supabaseApi";
import { supabase } from "@/lib/supabase";
import { buildAuthPath } from "@/lib/authRedirect";

const ACCENT = "#f5a623";

interface Category {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  color: string;
}

export default function NewThread({ params }: { params: { categorySlug: string } }) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [, setLocation] = useLocation();
  const categorySlug = params?.categorySlug || "";

  const [category, setCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<any>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then((result: any) => {
      const data = result?.data;
      setUserSession(data?.session);
      if (data?.session?.user) {
        const meta = data.session.user.user_metadata;
        setAuthorName(meta?.username || data.session.user.email?.split("@")[0] || "");
      }
    }).finally(() => setSessionChecked(true));
    getForumCategories().then((cats: any[]) => {
      const cat = cats.find(c => c.slug === categorySlug);
      if (cat) setCategory(cat);
      else setLocation("/forum");
    }).catch(() => setLocation("/forum"));
  }, [categorySlug]);

  const submit = async () => {
    const t = title.trim();
    const b = body.trim();
    const n = authorName.trim() || (isAr ? "مجهول" : "Anonymous");
    if (!t || !b) {
      setError(isAr ? "العنوان والمحتوى مطلوبان" : "Title and content are required");
      return;
    }
    if (!category) return;
    if (!userSession) {
      setError(isAr ? "يجب تسجيل الدخول للنشر في المنتدى" : "You must sign in to post in the forum");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const user = session.data.session?.user;
      // Create thread
      const thread = await createForumThread({
        categoryId: category.id,
        title: t,
        body: b,
        authorName: n,
        authorId: user?.id,
        authorAvatar: user?.user_metadata?.avatar || "",
      });
      // Create the OP post
      await createForumPost({
        threadId: thread.id,
        body: b,
        authorName: n,
        authorId: user?.id,
        authorAvatar: user?.user_metadata?.avatar || "",
        isOp: true,
      });
      setLocation(`/forum/${categorySlug}/${thread.id}`);
    } catch (err: any) {
      setError(err.message || (isAr ? "فشل إنشاء الموضوع" : "Failed to create thread"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!category || !sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="animate-spin h-6 w-6 border-2 rounded-full" style={{ borderColor: ACCENT, borderTopColor: "transparent" }} />
      </div>
    );
  }

  const catName = isAr && category.nameAr ? category.nameAr : category.name;
  if (!userSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
        <div className="max-w-md w-full p-8 text-center rounded-lg" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h1 className="text-xl font-black mb-3" style={{ color: "var(--foreground)" }}>{isAr ? "سجّل الدخول للنشر" : "Sign in to post"}</h1>
          <p className="text-sm mb-5" style={{ color: "#777" }}>{isAr ? "أصبح تسجيل الدخول مطلوبًا لحماية المنتدى من الرسائل المزعجة وانتحال الهوية." : "Sign-in is required to protect the forum from spam and impersonation."}</p>
          <Link href={buildAuthPath("login")} className="inline-flex items-center justify-center px-5 py-2.5 rounded text-sm font-bold" style={{ background: ACCENT, color: "#000", textDecoration: "none" }}>
            {isAr ? "تسجيل الدخول" : "Sign in"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title={isAr ? `موضوع جديد في ${catName}` : `New Thread in ${catName}`}
        description={isAr ? `اكتب موضوعاً جديداً في قسم ${catName}.` : `Start a new discussion in the ${catName} forum.`}
        canonicalPath={`/forum/${categorySlug}/new`}
        noindex
      />

      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <div className="py-8" style={{ background: "var(--card)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="container mx-auto px-4 max-w-2xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs mb-4 flex-wrap" style={{ color: "#555" }}>
              <Link href="/forum" style={{ color: "#555", textDecoration: "none" }}>
                {isAr ? "المنتدى" : "Forum"}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/forum/${categorySlug}`} style={{ color: "#555", textDecoration: "none" }}>
                {catName}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span style={{ color: "var(--foreground)" }}>{isAr ? "موضوع جديد" : "New Thread"}</span>
            </div>
            <h1 className="text-2xl font-black" style={{ color: "var(--foreground)" }}>
              {category.icon} {isAr ? `موضوع جديد في ${catName}` : `New Thread in ${catName}`}
            </h1>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="p-6 rounded-lg" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="mb-5 text-xs" style={{ color: "#777" }}>
              {isAr ? "سيظهر اسم حسابك الموثق مع الموضوع." : "Your verified account name will appear with this topic."}
            </div>

            {/* Thread title */}
            <div className="mb-4">
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#555" }}>
                {isAr ? "عنوان الموضوع *" : "Thread Title *"}
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={isAr ? "اكتب عنواناً واضحاً ومفيداً..." : "Write a clear, descriptive title..."}
                dir={isAr ? "rtl" : "ltr"}
                maxLength={120}
                className="w-full text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "var(--foreground)", padding: "10px 14px" }}
              />
              <div className="text-[10px] mt-1 text-right" style={{ color: "#444" }}>{title.length}/120</div>
            </div>

            {/* Thread body */}
            <div className="mb-5">
              <label className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: "#555" }}>
                {isAr ? "المحتوى *" : "Content *"}
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={isAr ? "اكتب موضوعك هنا. كن واضحاً ومفيداً..." : "Write your post here. Be clear and helpful..."}
                dir={isAr ? "rtl" : "ltr"}
                rows={10}
                disabled={submitting}
                className="w-full text-sm resize-y focus:outline-none"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "var(--foreground)", padding: "10px 14px", minHeight: 180 }}
              />
            </div>

            {error && (
              <p className="text-xs mb-4" style={{ color: "#ef4444" }}>{error}</p>
            )}

            <div className="flex items-center justify-between">
              <Link href={`/forum/${categorySlug}`} className="flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: "#555", textDecoration: "none" }}>
                <ArrowLeft className="h-3.5 w-3.5" />
                {isAr ? "إلغاء" : "Cancel"}
              </Link>

              <button
                onClick={submit}
                disabled={!title.trim() || !body.trim() || submitting}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded transition-all hover:brightness-110 disabled:opacity-40"
                style={{ background: ACCENT, color: "#000", border: "none", cursor: "pointer" }}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isAr ? "نشر الموضوع" : "Post Thread"}
              </button>
            </div>
          </div>

          <p className="text-xs mt-4 text-center" style={{ color: "#444" }}>
            {isAr ? "تسجيل الدخول مطلوب للنشر، والجميع مرحب به للقراءة والمشاركة." : "Sign-in is required to post; everyone is welcome to read and participate."}
          </p>
        </div>
      </div>
    </>
  );
}
