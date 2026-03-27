import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, Eye, Wand2, Globe, Swords, Map } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import RawHtmlPreview from "@/components/RawHtmlPreview";

const WIKI_BASE = "https://crossfire.fandom.com/wiki/";

function hasWikiMarkup(text: string): boolean {
  if (!text) return false;
  const patterns = [
    /\bthumb\b/,
    /\|\s*thumb/,
    /\*CF\s+(China|West|Brazil|Russia|Korea|Japan|Vietnam|Philippines)/,
    /\|-\|/,
    /\[\[File:/,
    /\[\[Category:/,
    /={2,}/,
    /\{\{[A-Z]/,
    /Media\s+Page\s+\d+=/,
  ];
  return patterns.some(p => p.test(text));
}

function titleToWikiUrl(title: string): string {
  return WIKI_BASE + title.replace(/\s+/g, '_');
}

interface ContentItem {
  _id: string;
  id?: string;
  title: string;
  content?: string;
  description?: string;
  htmlContent?: string;
  image?: string;
  createdAt?: string;
}

type ContentType = "events" | "news" | "posts";

export default function WikiRescraper() {
  const { toast } = useToast();
  const [tab, setTab] = useState<ContentType>("events");
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRebuildingMercs, setIsRebuildingMercs] = useState(false);
  const [isRebuildingWiki, setIsRebuildingWiki] = useState(false);

  // Per-item state
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [rescraping, setRescraping] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});

  // Preview
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string>("");
  const [previewItemId, setPreviewItemId] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);

  const handleRebuildWikiPosts = async () => {
    if (!confirm("هيحذف كل المقالات الموجودة وينشئ مقالات جديدة عن الخرائط والشخصيات والأحداث من فاندوم ويكي — متأكد؟")) return;
    setIsRebuildingWiki(true);
    try {
      const result = await apiRequest("/api/admin/rebuild-wiki-posts", "POST", {});
      toast({
        title: "تم بناء مقالات الويكي",
        description: `حذف ${result.deletedCount} مقال قديم — أنشأ ${result.created} جديد — فشل ${result.failed}`,
      });
      if (tab === "posts") fetchItems("posts");
    } catch (e: any) {
      toast({ title: "فشل البناء", description: e.message, variant: "destructive" });
    } finally {
      setIsRebuildingWiki(false);
    }
  };

  const handleRebuildMercenaryPosts = async () => {
    if (!confirm("هيحذف كل المقالات الموجودة وينشئ مقالات جديدة عن المرتزقة من فاندوم ويكي — متأكد؟")) return;
    setIsRebuildingMercs(true);
    try {
      const result = await apiRequest("/api/admin/rebuild-mercenary-posts", "POST", {});
      toast({
        title: "تم بناء مقالات المرتزقة",
        description: `حذف ${result.deletedCount} مقال قديم — أنشأ ${result.created} جديد — فشل ${result.failed}`,
      });
      if (tab === "posts") fetchItems("posts");
    } catch (e: any) {
      toast({ title: "فشل البناء", description: e.message, variant: "destructive" });
    } finally {
      setIsRebuildingMercs(false);
    }
  };

  const fetchItems = async (type: ContentType) => {
    setIsLoading(true);
    setItems([]);
    setUrlInputs({});
    setDone({});
    try {
      const data = await apiRequest(`/api/${type}?limit=1000`, "GET");
      const list: ContentItem[] = Array.isArray(data) ? data : (data?.data || data?.items || data?.events || data?.news || data?.posts || []);
      setItems(list);

      // Auto-suggest fandom wiki URLs based on title
      const auto: Record<string, string> = {};
      list.forEach(item => {
        const id = item._id || item.id || '';
        auto[id] = titleToWikiUrl(item.title || '');
      });
      setUrlInputs(auto);
    } catch (e: any) {
      toast({ title: "فشل جلب المحتوى", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(tab);
  }, [tab]);

  const getContent = (item: ContentItem) =>
    item.content || item.description || item.htmlContent || "";

  const isBad = (item: ContentItem) => hasWikiMarkup(getContent(item));

  const handleRescrape = async (item: ContentItem) => {
    const id = item._id || item.id || '';
    const url = (urlInputs[id] || '').trim();
    if (!url.startsWith('http')) {
      toast({ title: "رابط غير صالح", description: "أدخل رابط صحيح يبدأ بـ http", variant: "destructive" });
      return;
    }
    setRescraping(prev => ({ ...prev, [id]: true }));
    try {
      const result = await apiRequest("/api/admin/rescrape-item", "POST", { type: tab, id, url });
      if (result.success) {
        setDone(prev => ({ ...prev, [id]: true }));
        setItems(prev => prev.map(i => (i._id === id || i.id === id)
          ? { ...i, title: result.scraped.title || i.title, content: 'updated', description: 'updated', image: result.scraped.image }
          : i
        ));
        toast({ title: "تم التحديث بنجاح", description: `${result.scraped.title} — ${result.scraped.contentLength.toLocaleString()} حرف` });
      }
    } catch (e: any) {
      toast({ title: "فشل إعادة السكراب", description: e.message, variant: "destructive" });
    } finally {
      setRescraping(prev => ({ ...prev, [id]: false }));
    }
  };

  const handlePreviewScrape = async (item: ContentItem) => {
    const id = item._id || item.id || '';
    const url = (urlInputs[id] || '').trim();
    if (!url.startsWith('http')) {
      toast({ title: "رابط غير صالح", variant: "destructive" });
      return;
    }
    setRescraping(prev => ({ ...prev, [id + '_preview']: true }));
    try {
      const result = await apiRequest("/api/scrape/single-url", "POST", { url });
      setPreviewHtml(result.content || '');
      setPreviewTitle(result.title || item.title);
      setPreviewImage(result.image || result.mainImage || '');
      setPreviewItemId(id);
      setIsPreviewOpen(true);
    } catch (e: any) {
      toast({ title: "فشل المعاينة", description: e.message, variant: "destructive" });
    } finally {
      setRescraping(prev => ({ ...prev, [id + '_preview']: false }));
    }
  };

  const handleSavePreviewImageToItem = async () => {
    if (!previewImage || !previewItemId) return;
    setIsSavingImage(true);
    try {
      const endpoint = tab === 'events' ? `/api/events/${previewItemId}`
        : tab === 'news' ? `/api/news/${previewItemId}`
        : `/api/posts/${previewItemId}`;
      const method = tab === 'posts' ? 'PATCH' : 'PATCH';
      await apiRequest(endpoint, method, { image: previewImage });
      setItems(prev => prev.map(i => (i._id === previewItemId || i.id === previewItemId) ? { ...i, image: previewImage } : i));
      toast({ title: "تم حفظ الصورة", description: "تم تعيين صورة الإيفينت تلقائياً" });
      setIsPreviewOpen(false);
    } catch (e: any) {
      toast({ title: "فشل حفظ الصورة", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleBulkRescrapeAll = async () => {
    const badItems = items.filter(isBad);
    if (badItems.length === 0) {
      toast({ title: "لا يوجد محتوى يحتاج إصلاح" });
      return;
    }
    toast({ title: `جاري إصلاح ${badItems.length} عنصر...`, description: "هيأخذ بعض الوقت" });
    for (const item of badItems) {
      const id = item._id || item.id || '';
      const url = (urlInputs[id] || '').trim();
      if (!url.startsWith('http')) continue;
      await handleRescrape(item);
      await new Promise(r => setTimeout(r, 800));
    }
    toast({ title: "تم إصلاح المحتوى القديم", description: "تم إعادة سكراب كل العناصر" });
  };

  const badCount = items.filter(isBad).length;

  return (
    <div className="space-y-6">

      {/* Rebuild Maps/Characters/Events Posts */}
      <Card className="border-blue-700/50 bg-blue-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-300">
            <Map className="w-5 h-5" />
            بناء مقالات الخرائط والشخصيات والأحداث من فاندوم ويكي
          </CardTitle>
          <CardDescription className="text-blue-200/70">
            يحذف كل المقالات (Posts) الموجودة وينشئ مقالات جديدة عن الخرائط والشخصيات والأحداث من CrossFire Fandom Wiki
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleRebuildWikiPosts}
            disabled={isRebuildingWiki}
            className="bg-blue-700 hover:bg-blue-600 text-white"
          >
            {isRebuildingWiki ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />جاري البناء... (قد يأخذ 3-5 دقائق)</>
            ) : (
              <><Map className="w-4 h-4 mr-2" />احذف القديم وابنِ مقالات الخرائط والشخصيات والأحداث</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Rebuild Mercenary Posts */}
      <Card className="border-orange-700/50 bg-orange-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-300">
            <Swords className="w-5 h-5" />
            بناء مقالات المرتزقة من الفاندوم ويكي
          </CardTitle>
          <CardDescription className="text-orange-200/70">
            يحذف كل المقالات (Posts) الموجودة ويبني مقالات جديدة عن مرتزقة CrossFire من الفاندوم ويكي — Wolf, Viper, Sisterhood, Black Mamba, Desperado, Ronin, Dean, Saber, Brimstone, Arch Honorary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleRebuildMercenaryPosts}
            disabled={isRebuildingMercs}
            className="bg-orange-700 hover:bg-orange-600 text-white"
          >
            {isRebuildingMercs ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />جاري البناء... (قد يأخذ 2-3 دقائق)</>
            ) : (
              <><Swords className="w-4 h-4 mr-2" />احذف القديم وابنِ مقالات المرتزقة</>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            إعادة سكراب وإصلاح المحتوى القديم
          </CardTitle>
          <CardDescription>
            يعرض كل المحتوى الموجود ويكتشف اللي بيحتوي على raw wiki markup — تقدر تستبدله بمحتوى نضيف من الفاندوم ويكي أو أي رابط
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={v => setTab(v as ContentType)}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="events" className="flex-1">Events</TabsTrigger>
              <TabsTrigger value="news" className="flex-1">News</TabsTrigger>
              <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
            </TabsList>

            {(["events", "news", "posts"] as ContentType[]).map(type => (
              <TabsContent key={type} value={type} className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا يوجد محتوى</p>
                ) : (
                  <>
                    {badCount > 0 && (
                      <div className="flex items-center justify-between p-3 bg-amber-950/40 border border-amber-700/50 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-400 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>تم اكتشاف <strong>{badCount}</strong> عنصر بمحتوى wiki markup قديم يحتاج إصلاح</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-600 text-amber-400 hover:bg-amber-900/30"
                          onClick={handleBulkRescrapeAll}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          إصلاح الكل
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {items.map(item => {
                        const id = item._id || item.id || '';
                        const bad = isBad(item);
                        const isDone = done[id];
                        const isRescraping = rescraping[id];
                        const isPreviewLoading = rescraping[id + '_preview'];

                        return (
                          <Card key={id} className={`${bad && !isDone ? 'border-amber-700/50 bg-amber-950/10' : isDone ? 'border-green-700/50 bg-green-950/10' : ''}`}>
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    {isDone ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    ) : bad ? (
                                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                    ) : null}
                                    <span className="font-medium text-sm truncate">{item.title}</span>
                                    {bad && !isDone && <Badge variant="outline" className="border-amber-600 text-amber-400 text-[10px] shrink-0">محتاج إصلاح</Badge>}
                                    {isDone && <Badge variant="outline" className="border-green-600 text-green-400 text-[10px] shrink-0">تم الإصلاح</Badge>}
                                  </div>
                                  <div className="flex gap-2">
                                    <Input
                                      value={urlInputs[id] || ''}
                                      onChange={e => setUrlInputs(prev => ({ ...prev, [id]: e.target.value }))}
                                      placeholder="https://crossfire.fandom.com/wiki/..."
                                      className="text-xs h-8 flex-1"
                                      dir="ltr"
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-2 text-xs"
                                      onClick={() => handlePreviewScrape(item)}
                                      disabled={isPreviewLoading || isRescraping}
                                    >
                                      {isPreviewLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-8 px-3 text-xs"
                                      onClick={() => handleRescrape(item)}
                                      disabled={isRescraping || isPreviewLoading}
                                    >
                                      {isRescraping ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <><RefreshCw className="w-3 h-3 mr-1" />استبدال</>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <div className="bg-blue-950/40 border border-blue-800/50 rounded-lg p-4 text-sm flex gap-3">
        <Globe className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" />
        <div className="text-blue-300/80 space-y-1">
          <p className="font-semibold text-blue-200">كيف يعمل الإصلاح:</p>
          <p>• يكتشف المحتوى اللي بيحتوي على wiki markup قديم (thumb، *CF، |-|، إلخ)</p>
          <p>• يقترح تلقائيًا رابط فاندوم ويكي بناءً على العنوان</p>
          <p>• اضغط "استبدال" لجلب المحتوى الجديد النضيف واستبداله في قاعدة البيانات</p>
          <p>• تقدر تعاين قبل الاستبدال بزر المعاين (العين)</p>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="border rounded-lg p-3 bg-muted/30 flex items-center gap-4">
              <img src={previewImage} alt="Preview" className="h-24 w-40 object-cover rounded border shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1 truncate" dir="ltr">{previewImage}</p>
                <button
                  onClick={handleSavePreviewImageToItem}
                  disabled={isSavingImage}
                  className="text-sm px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSavingImage ? "جاري الحفظ..." : "✓ استخدم هذه الصورة كصورة خارجية"}
                </button>
              </div>
            </div>
          )}
          <div className="border rounded-lg p-4 bg-background">
            <RawHtmlPreview html={previewHtml} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
