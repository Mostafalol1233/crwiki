import { useState, useEffect, useCallback } from 'react';
import { supabaseService } from '@/lib/supabaseAdmin';
import { toast } from 'sonner';
import { RefreshCw, RefreshCcw, Search, Sparkles } from 'lucide-react';

type ContentType = 'news' | 'events' | 'posts';

interface RescrapeItem {
  id: string;
  title: string;
  source_url: string;
  updated_at?: string;
  status?: 'idle' | 'scraping' | 'done' | 'error';
}

interface DeepScrapeResult {
  title?: string;
  sourceUrl?: string;
  text?: string;
  contentLength?: number;
  mediaCounts?: { images?: number; videos?: number; links?: number; sections?: number };
  note?: string;
}

interface DiscoveredPage {
  title: string;
  url: string;
}

export default function WikiRescraper() {
  const [type, setType] = useState<ContentType>('news');
  const [items, setItems] = useState<RescrapeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState<Record<string, boolean>>({});
  const [log, setLog] = useState<string[]>([]);
  const [customUrl, setCustomUrl] = useState('');
  const [category, setCategory] = useState('Weapons');
  const [customBusy, setCustomBusy] = useState<'page' | 'discover' | 'crawl' | 'save' | ''>('');
  const [deepResult, setDeepResult] = useState<DeepScrapeResult | null>(null);
  const [discoveredPages, setDiscoveredPages] = useState<DiscoveredPage[]>([]);
  const client = supabaseService;

  const loadItems = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const table = type === 'posts' ? 'posts' : type;
    const { data, error } = await client.from(table).select('id, title, source_url, updated_at').neq('source_url', '').order('updated_at', { ascending: true });
    if (error) {
      setItems([]);
      toast.error(error.message || 'تعذر تحميل المصادر');
      setLoading(false);
      return;
    }
    setItems((data || []).filter((r: any) => typeof r?.source_url === 'string' && r.source_url.trim()).map((r: any) => ({ id: String(r.id), title: String(r.title || ''), source_url: String(r.source_url || ''), updated_at: r.updated_at })));
    setLoading(false);
  }, [client, type]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const adminHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
  });

  const rescrapeOne = async (item: RescrapeItem) => {
    setScraping((p) => ({ ...p, [item.id]: true }));
    setLog((l) => [`جارٍ تحديث: ${item.title}…`, ...l]);
    try {
      const res = await globalThis.fetch('/api/admin/scraper', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ url: item.source_url, type }),
      });
      if (!res.ok) throw new Error('فشل تحديث المصدر');
      setLog((l) => [`اكتمل: ${item.title}`, ...l]);
      toast.success(`تم تحديث ${item.title}`);
    } catch (e: any) {
      setLog((l) => [`خطأ: ${item.title} — ${e.message}`, ...l]);
      toast.error(`تعذر تحديث ${item.title}`);
    } finally {
      setScraping((p) => ({ ...p, [item.id]: false }));
    }
  };

  const rescrapeAll = async () => {
    for (const item of items.slice(0, 50)) await rescrapeOne(item);
    toast.success(items.length > 50 ? 'اكتمل أول 50 مصدرًا؛ شغّل الدفعة التالية لاحقًا' : 'اكتمل تحديث المصادر');
  };

  const runDeepPage = async () => {
    if (!customUrl.trim()) return toast.error('أدخل رابط المصدر أولًا');
    setCustomBusy('page');
    setDeepResult(null);
    try {
      const res = await globalThis.fetch('/api/scrape/fandom-page', { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ url: customUrl.trim() }) });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'تعذر قراءة الصفحة');
      setDeepResult(payload);
      setLog((l) => [`تمت معاينة الصفحة العميقة: ${payload.title || customUrl}`, ...l]);
      toast.success('اكتملت المعاينة؛ لم يتم نشر أي محتوى');
    } catch (e: any) {
      toast.error(e.message || 'فشل جمع الصفحة');
      setLog((l) => [`خطأ في المعاينة: ${e.message}`, ...l]);
    } finally {
      setCustomBusy('');
    }
  };

  const saveDraft = async () => {
    if (!customUrl.trim() || !deepResult) return toast.error('نفّذ المعاينة أولًا');
    setCustomBusy('save');
    try {
      const res = await globalThis.fetch('/api/scrape/fandom-draft-save', { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ url: customUrl.trim() }) });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'تعذر حفظ المسودة');
      setLog((l) => [`حُفظت مسودة موثقة: ${payload.title || customUrl}`, ...l]);
      toast.success('تم حفظ المسودة؛ راجعها في إدارة الصفحات قبل النشر');
    } catch (e: any) {
      toast.error(e.message || 'فشل حفظ المسودة');
    } finally {
      setCustomBusy('');
    }
  };

  const discoverCategory = async () => {
    if (!customUrl.trim() || !category.trim()) return toast.error('أدخل رابط ويكي وفئة أولًا');
    setCustomBusy('discover');
    setDiscoveredPages([]);
    try {
      const res = await globalThis.fetch('/api/scrape/fandom-discover', { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ url: customUrl.trim(), category: category.trim(), limit: 100 }) });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'تعذر اكتشاف الصفحات');
      setDiscoveredPages(Array.isArray(payload.pages) ? payload.pages : []);
      setLog((l) => [`تم اكتشاف ${Array.isArray(payload.pages) ? payload.pages.length : 0} صفحة من فئة ${category}`, ...l]);
      toast.success('تم اكتشاف الصفحات دون استيرادها');
    } catch (e: any) {
      toast.error(e.message || 'فشل اكتشاف الصفحات');
    } finally {
      setCustomBusy('');
    }
  };

  const startCrawl = async () => {
    if (!customUrl.trim()) return toast.error('أدخل رابط بداية الـcrawl أولًا');
    setCustomBusy('crawl');
    try {
      const res = await globalThis.fetch('/api/scrape/fandom-crawl-start', { method: 'POST', headers: adminHeaders(), body: JSON.stringify({ url: customUrl.trim(), limit: 25, depth: 1 }) });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'تعذر بدء crawl');
      setLog((l) => [`بدأت مهمة جمع محدودة: ${payload.id || 'بدون معرّف'}`, ...l]);
      toast.success('بدأت المهمة؛ راجع النتائج قبل أي استيراد');
    } catch (e: any) {
      toast.error(e.message || 'فشل بدء crawl');
    } finally {
      setCustomBusy('');
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', fontSize: 13, border: '1px solid',
    borderColor: active ? '#d4a017' : '#27272a',
    background: active ? 'rgba(212,160,23,0.1)' : 'transparent',
    color: active ? '#d4a017' : '#a1a1aa', cursor: 'pointer', borderRadius: 4,
  });

  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fafafa', margin: 0 }}>إعادة جمع محتوى الويكي</h1>
          <p style={{ fontSize: 12, color: '#71717a', margin: '6px 0 0' }}>المعاينة تجمع النص والوسائط والروابط، ولا تنشر أي نتيجة تلقائيًا.</p>
        </div>
        <button type="button" onClick={rescrapeAll} disabled={loading || items.length === 0 || Object.values(scraping).some(Boolean)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: '#e4e4e7', cursor: 'pointer', fontSize: 13 }}>
          <RefreshCcw size={13} />تحديث أول {Math.min(items.length, 50)} مصدرًا
        </button>
      </div>

      <section style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><Sparkles size={16} color="#d4a017" /><strong style={{ color: '#fafafa', fontSize: 14 }}>جمع عميق من رابط مخصص</strong></div>
        <p style={{ color: '#a1a1aa', fontSize: 12, lineHeight: 1.7, marginTop: 0 }}>استخدم رابط صفحة Fandom بصيغة /wiki/… للقراءة عبر MediaWiki، أو رابطًا عامًا من النطاقات المسموحة. يتم تنظيف HTML وإزالة السكربتات والعناصر التنفيذية، وتبقى النتيجة معاينة حتى يراجعها المدير.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 180px', gap: 8 }}>
          <input value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="رابط صفحة Fandom أو المصدر المسموح" dir="ltr"
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', background: '#09090b', color: '#f4f4f5', border: '1px solid #3f3f46', borderRadius: 5, fontSize: 12 }} />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="اسم الفئة" dir="ltr"
            style={{ width: '100%', boxSizing: 'border-box', padding: '9px 10px', background: '#09090b', color: '#f4f4f5', border: '1px solid #3f3f46', borderRadius: 5, fontSize: 12 }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <button type="button" onClick={runDeepPage} disabled={Boolean(customBusy)} style={{ ...tabStyle(false), display: 'inline-flex', alignItems: 'center', gap: 6 }}><Search size={13} />{customBusy === 'page' ? 'جارٍ الجمع…' : 'معاينة الصفحة كاملة'}</button>
          <button type="button" onClick={discoverCategory} disabled={Boolean(customBusy)} style={{ ...tabStyle(false), display: 'inline-flex', alignItems: 'center', gap: 6 }}>{customBusy === 'discover' ? 'جارٍ الاكتشاف…' : 'اكتشاف صفحات الفئة'}</button>
          <button type="button" onClick={startCrawl} disabled={Boolean(customBusy)} style={{ ...tabStyle(false), display: 'inline-flex', alignItems: 'center', gap: 6 }}>{customBusy === 'crawl' ? 'جارٍ البدء…' : 'بدء جمع محدود'}</button>
          {deepResult && <button type="button" onClick={saveDraft} disabled={Boolean(customBusy)} style={{ ...tabStyle(true), display: 'inline-flex', alignItems: 'center', gap: 6 }}>{customBusy === 'save' ? 'جارٍ الحفظ…' : 'حفظ كمسودة'}</button>}
        </div>
        {deepResult && (
          <div style={{ marginTop: 14, padding: 12, background: '#09090b', border: '1px solid #3f3f46', borderRadius: 6 }}>
            <div style={{ color: '#fafafa', fontSize: 14, fontWeight: 600 }}>{deepResult.title || 'صفحة بلا عنوان'}</div>
            <div dir="ltr" style={{ color: '#71717a', fontSize: 11, marginTop: 4, overflowWrap: 'anywhere' }}>{deepResult.sourceUrl}</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', color: '#a1a1aa', fontSize: 12, marginTop: 10 }}>
              <span>النص: {deepResult.contentLength || 0} محرف</span><span>الصور: {deepResult.mediaCounts?.images || 0}</span><span>الفيديوهات: {deepResult.mediaCounts?.videos || 0}</span><span>الروابط: {deepResult.mediaCounts?.links || 0}</span><span>الأقسام: {deepResult.mediaCounts?.sections || 0}</span>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: 12, lineHeight: 1.7, marginBottom: 0 }}>{deepResult.text || 'لم يُرجع المصدر نصًا قابلًا للعرض.'}</p>
          </div>
        )}
        {discoveredPages.length > 0 && (
          <div style={{ marginTop: 14, maxHeight: 220, overflow: 'auto', borderTop: '1px solid #27272a', paddingTop: 10 }}>
            {discoveredPages.map((page) => <div key={page.url} style={{ padding: '6px 0', borderBottom: '1px solid #1f1f22' }}><div style={{ color: '#e4e4e7', fontSize: 12 }}>{page.title}</div><div dir="ltr" style={{ color: '#71717a', fontSize: 10, overflowWrap: 'anywhere' }}>{page.url}</div></div>)}
          </div>
        )}
      </section>

      <div style={{ display: 'flex', gap: 6 }}>
        {(['news', 'events', 'posts'] as ContentType[]).map((t) => <button key={t} type="button" onClick={() => setType(t)} style={tabStyle(type === t)}>{t === 'news' ? 'الأخبار' : t === 'events' ? 'الأحداث' : 'المنشورات'}</button>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 6, overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#71717a' }}>جارٍ التحميل…</div> : items.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#71717a' }}>لا توجد عناصر مرتبطة بمصادر</div> : items.map((item, i) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: i < items.length - 1 ? '1px solid #1f1f22' : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, color: '#fafafa', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div><div dir="ltr" style={{ fontSize: 11, color: '#52525b', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.source_url}</div></div>
              <span style={{ fontSize: 11, color: '#71717a', flexShrink: 0 }}>{item.updated_at ? new Date(item.updated_at).toLocaleDateString('ar-EG') : '—'}</span>
              <button type="button" onClick={() => rescrapeOne(item)} disabled={scraping[item.id]} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 4, color: scraping[item.id] ? '#52525b' : '#e4e4e7', cursor: scraping[item.id] ? 'wait' : 'pointer', fontSize: 12, flexShrink: 0 }}><RefreshCw size={11} style={{ animation: scraping[item.id] ? 'spin 1s linear infinite' : 'none' }} />{scraping[item.id] ? 'جارٍ التحديث…' : 'تحديث'}</button>
            </div>
          ))}
        </div>

        <div style={{ background: '#09090b', border: '1px solid #27272a', borderRadius: 6, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#71717a', marginBottom: 10 }}>سجل النشاط</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 400, overflowY: 'auto' }}>{log.length === 0 ? <span style={{ fontSize: 12, color: '#52525b' }}>لا يوجد نشاط بعد</span> : log.map((line, i) => <div key={i} style={{ fontSize: 12, color: line.startsWith('خطأ') ? '#ef4444' : line.startsWith('اكتمل') || line.startsWith('تم') ? '#22c55e' : '#a1a1aa', lineHeight: 1.4 }}>{line}</div>)}</div>
        </div>
      </div>
    </div>
  );
}
