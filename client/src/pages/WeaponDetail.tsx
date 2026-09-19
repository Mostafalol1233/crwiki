import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getWeaponById, getWeapons } from "@/lib/supabaseApi";
import PageSEO from "@/components/PageSEO";
import { useLanguage } from "@/components/LanguageProvider";
import { useEffect, useState } from "react";

export default function WeaponDetail() {
  const params = useParams<{ slug?: string; id?: string }>();
  const slug = params.slug || params.id || "";
  const { language } = useLanguage();
  const arabic = language === "ar";
  const [weapon, setWeapon] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // Try by slug (name slug) or id
        const all = await getWeapons({ q: decodeURIComponent(slug).replace(/-/g, " "), pageSize: 1 });
        const found = all.items.find((w: any) => w.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug.toLowerCase() || w.id === slug);
        if (found && !cancelled) setWeapon(found);
        else if (!cancelled) setWeapon(null);
      } catch {
        if (!cancelled) setWeapon(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)", color: "#b7c0cb" }}>{arabic ? "جارٍ التحميل..." : "Loading..."}</div>;
  if (!weapon) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: "var(--background)" }}>
      <PageSEO title={arabic ? "السلاح غير موجود" : "Weapon not found"} description={arabic ? "السلاح غير موجود" : "Weapon not found"} canonicalPath={`/weapons/${slug}`} />
      <h1 className="text-2xl font-black mb-4" style={{ color: "#f87171" }}>{arabic ? "السلاح غير موجود" : "Weapon not found"}</h1>
      <Link href="/weapons" className="px-6 py-3 text-sm font-bold" style={{ background: "#f5a623", color: "#000" }}>{arabic ? "العودة للكتالوج" : "Back to catalogue"}</Link>
    </div>
  );

  const methods = Array.isArray(weapon.acquisitionMethods) ? weapon.acquisitionMethods : [];
  const isAvailable = methods.some((m: any) => m.status === 'available');
  const statusLabel = isAvailable ? (arabic ? 'متاح حاليًا' : 'Available now') : methods.some((m: any) => m.status === 'limited') ? (arabic ? 'محدود' : 'Limited') : (arabic ? 'مش متاح حاليًا' : 'Not available now');
  const statusColor = isAvailable ? '#22c55e' : methods.some((m: any) => m.status === 'limited') ? '#eab308' : '#ef4444';

  return (
    <>
      <PageSEO
        title={`${weapon.name} — ${arabic ? 'إزاي تجيبه، الإحصائيات والأنواع' : 'How to Get It, Stats & Variants'} | CrossFire Wiki`}
        description={arabic ? `اعرف إزاي تجيب ${weapon.name} في CrossFire، طرق الحصول عليه، السعر، الـ Events والـ Crates والمناطق اللي السلاح متاح فيها.` : `Learn how to get ${weapon.name} in CrossFire — acquisition methods, price, events, crates and regional availability.`}
        canonicalPath={`/weapons/${slug}`}
        image={weapon.image || weapon.imageUrl}
      />
      <div className="min-h-screen" style={{ background: "var(--background)", color: "#e8edf3" }}>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
          <div className="flex items-center gap-2 text-xs mb-6">
            <Link href="/" style={{ color: "#9ca3af" }}>{arabic ? "الرئيسية" : "Home"}</Link>
            <span style={{ color: "#4b5563" }}>/</span>
            <Link href="/weapons" style={{ color: "#9ca3af" }}>{arabic ? "الأسلحة" : "Weapons"}</Link>
            <span style={{ color: "#4b5563" }}>/</span>
            <span style={{ color: "#f5a623" }}>{weapon.name}</span>
          </div>

          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="w-full md:w-1/2 h-64 flex items-center justify-center p-4" style={{ background: "#0b0d10", border: "1px solid rgba(174,184,196,.2)" }}>
              <img src={weapon.image || weapon.imageUrl} alt={weapon.name} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black uppercase mb-2">{weapon.name}</h1>
              <p className="text-sm mb-3" style={{ color: "#9ca3af" }}>{weapon.category}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider mb-4" style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}40` }}>{statusLabel}</div>
              <p className="text-sm leading-7" style={{ color: "#b7c0cb" }}>{arabic ? (weapon.descriptionAr || weapon.description) : weapon.description}</p>
            </div>
          </div>

          <div className="p-4 border mb-6" style={{ borderColor: "rgba(174,184,196,.15)", background: "rgba(174,184,196,.03)" }}>
            <h2 className="text-sm font-black uppercase tracking-wider mb-3" style={{ color: "#f5a623" }}>{arabic ? 'أجيبه إزاي؟' : 'How to get it?'}</h2>
            {methods.length === 0 ? (
              <p className="text-sm leading-7" style={{ color: "#b7c0cb" }}>{arabic ? 'مفيش طريقة مؤكدة حاليًا للحصول على السلاح ده. تابع الإعلانات الرسمية.' : 'No verified acquisition method is currently documented.'}</p>
            ) : (
              <div className="space-y-3">
                {methods.map((m: any, idx: number) => (
                  <div key={idx} className="p-3 border" style={{ borderColor: m.verified ? "rgba(34,197,94,.25)" : "rgba(174,184,196,.15)", background: m.verified ? "rgba(34,197,94,.05)" : "rgba(174,184,196,.03)" }}>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-1" style={{ background: m.status === 'available' ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.12)", color: m.status === 'available' ? "#4ade80" : "#f87171", border: "1px solid currentColor" }}>{m.status === 'available' ? (arabic ? 'متاح حاليًا' : 'Available now') : (arabic ? 'قديم' : 'Historical')}</span>
                      <span className="text-xs font-bold" style={{ color: "#e8edf3" }}>{arabic ? (m.titleAr || m.title) : m.title}</span>
                      {m.region && <span className="text-[11px] px-1.5 py-0.5" style={{ background: "rgba(255,255,255,.06)", color: "#9ca3af" }}>{m.region}</span>}
                      {m.price && <span className="text-xs font-bold" style={{ color: "#f5a623" }}>{m.price} {m.currency}</span>}
                    </div>
                    <p className="text-xs leading-6" style={{ color: "#b7c0cb" }}>{arabic ? (m.descriptionAr || m.description) : (m.description || m.title)}</p>
                    {m.sourceUrl && <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="text-xs underline mt-1 inline-block" style={{ color: "#9ca3af" }}>{arabic ? 'المصدر' : 'Source'}</a>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs p-3 border" style={{ borderColor: "rgba(245,166,35,.15)", background: "rgba(245,166,35,.05)", color: "#f5a623" }}>
            {arabic ? 'CrossFire Wiki مشروع مستقل — لا يوحي بأي ارتباط رسمي بالناشر. كل طرق الحصول موثقة بمصدر.' : 'CrossFire Wiki is an independent fan project — no official publisher affiliation is implied. Every acquisition method is source-documented.'}
          </div>
        </div>
      </div>
    </>
  );
}
