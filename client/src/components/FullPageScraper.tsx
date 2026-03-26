import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Globe, FileCode, CheckCircle, AlertCircle, Trash2, Plus, Eye, ExternalLink, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RawHtmlPreview from "@/components/RawHtmlPreview";

export default function FullPageScraper() {
  const { toast } = useToast();

  // Multi-URL mode
  const [urls, setUrls] = useState<string[]>([""]);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<any[]>([]);

  // Single URL mode
  const [singleUrl, setSingleUrl] = useState("");
  const [isSingleScraping, setIsSingleScraping] = useState(false);
  const [singleResult, setSingleResult] = useState<any | null>(null);

  // Preview
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleAddUrl = () => setUrls([...urls, ""]);
  const handleRemoveUrl = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index);
    setUrls(newUrls.length ? newUrls : [""]);
  };
  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  // Single URL scrape
  const handleSingleScrape = async () => {
    if (!singleUrl.trim().startsWith("http")) {
      toast({ title: "رابط غير صالح", description: "الرابط لازم يبدأ بـ http أو https", variant: "destructive" });
      return;
    }
    setIsSingleScraping(true);
    setSingleResult(null);
    try {
      const response = await apiRequest("/api/scrape/single-url", "POST", { url: singleUrl.trim() });
      setSingleResult(response);
      toast({ title: "تم السكراب بنجاح", description: `تم جلب: ${response.title || singleUrl}` });
    } catch (error: any) {
      toast({ title: "السكراب فشل", description: error.message || "فشل في جلب الصفحة", variant: "destructive" });
      setSingleResult({ status: "failed", error: error.message, url: singleUrl });
    } finally {
      setIsSingleScraping(false);
    }
  };

  // Multi-URL scrape
  const handleScrape = async () => {
    const validUrls = urls.filter(u => u.trim().startsWith("http"));
    if (validUrls.length === 0) {
      toast({ title: "لا توجد روابط صالحة", description: "أدخل رابط واحد على الأقل", variant: "destructive" });
      return;
    }
    setIsScraping(true);
    setScrapedData([]);
    try {
      const results: any[] = [];
      for (const url of validUrls) {
        try {
          const r = await apiRequest("/api/scrape/single-url", "POST", { url });
          results.push(r);
        } catch (e: any) {
          results.push({ status: "failed", error: e.message, url, title: url });
        }
      }
      setScrapedData(results);
      toast({ title: "اكتمل السكراب", description: `تم جلب ${results.filter(r => r.status !== 'failed').length} صفحة بنجاح` });
    } catch (error: any) {
      toast({ title: "السكراب فشل", description: error.message, variant: "destructive" });
    } finally {
      setIsScraping(false);
    }
  };

  const handleSaveAsEvent = async (data: any) => {
    try {
      await apiRequest("/api/events", "POST", {
        title: data.title || "Scraped Event",
        description: data.content || "",
        date: new Date().toLocaleDateString(),
        type: "upcoming",
        image: data.mainImage || data.image || "",
        seoTitle: data.seoTitle || data.title,
        seoDescription: data.seoDescription || data.excerpt || "",
        seoKeywords: data.keywords || [],
        sourceUrl: data.sourceUrl || data.url || "",
        fullLayout: false,
      });
      toast({ title: "تم الحفظ كـ Event" });
    } catch (error: any) {
      toast({ title: "فشل الحفظ", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveAsNews = async (data: any) => {
    try {
      await apiRequest("/api/news", "POST", {
        title: data.title || "Scraped News",
        content: data.content || "",
        htmlContent: data.content || "",
        category: "News",
        author: "Scraper",
        image: data.mainImage || data.image || "",
        seoTitle: data.seoTitle || data.title,
        seoDescription: data.seoDescription || data.excerpt || "",
        seoKeywords: data.keywords || [],
        sourceUrl: data.sourceUrl || data.url || "",
        fullLayout: false,
      });
      toast({ title: "تم الحفظ كـ News" });
    } catch (error: any) {
      toast({ title: "فشل الحفظ", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveAsPost = async (data: any) => {
    try {
      await apiRequest("/api/posts", "POST", {
        title: data.title || "Scraped Post",
        content: data.content || "",
        category: "Tutorials",
        tags: (data.keywords || []).join(","),
        author: "Scraper",
        image: data.mainImage || data.image || "",
        seoTitle: data.seoTitle || data.title,
        seoDescription: data.seoDescription || data.excerpt || "",
        seoKeywords: data.keywords || [],
        sourceUrl: data.sourceUrl || data.url || "",
      });
      toast({ title: "تم الحفظ كـ Post" });
    } catch (error: any) {
      toast({ title: "فشل الحفظ", description: error.message, variant: "destructive" });
    }
  };

  const ResultCard = ({ data }: { data: any }) => (
    <Card className={`overflow-hidden ${data.status === "failed" ? "border-destructive/50" : ""}`}>
      <div className={`p-4 border-b flex items-start justify-between gap-3 ${data.status === "failed" ? "bg-destructive/5" : "bg-muted/30"}`}>
        <div className="flex-1 min-w-0">
          {data.status !== "failed" ? (
            <a
              href={data.url || data.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-base hover:underline hover:text-primary flex items-center gap-1 group truncate"
              onClick={e => e.stopPropagation()}
            >
              <span className="truncate">{data.title || "بدون عنوان"}</span>
              <ExternalLink className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
            </a>
          ) : (
            <h4 className="font-bold text-destructive">فشل السكراب</h4>
          )}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {data.isWiki && <Badge variant="secondary" className="text-[10px]">Fandom Wiki</Badge>}
            {data.tabSections > 0 && <Badge variant="outline" className="text-[10px]">{data.tabSections} Tabs</Badge>}
            {data.contentLength && <Badge variant="outline" className="text-[10px]">{data.contentLength.toLocaleString()} chars</Badge>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
          {data.status !== "failed" ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => { setPreviewData(data); setIsPreviewOpen(true); }}>
                <Eye className="w-4 h-4 mr-1" /> Preview
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleSaveAsEvent(data)}>Event</Button>
              <Button size="sm" variant="outline" onClick={() => handleSaveAsNews(data)}>News</Button>
              <Button size="sm" variant="outline" onClick={() => handleSaveAsPost(data)}>Post</Button>
            </>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Error
            </Badge>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        {data.status === "failed" ? (
          <div className="text-sm text-destructive font-medium p-2 bg-destructive/10 rounded border border-destructive/20">
            {data.error || "حدث خطأ غير معروف أثناء السكراب"}
          </div>
        ) : (
          <div className="flex gap-4">
            {(data.mainImage || data.image) && (
              <img
                src={data.mainImage || data.image}
                alt={data.title}
                className="w-24 h-16 object-cover rounded border flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <p className="text-sm text-muted-foreground line-clamp-3">
              {data.excerpt || data.seoDescription || "لا يوجد معاينة"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="single">
        <TabsList className="w-full">
          <TabsTrigger value="single" className="flex-1">
            <Zap className="w-4 h-4 mr-2" />
            سكراب برابط واحد
          </TabsTrigger>
          <TabsTrigger value="multi" className="flex-1">
            <FileCode className="w-4 h-4 mr-2" />
            سكراب روابط متعددة
          </TabsTrigger>
        </TabsList>

        {/* Single URL Tab */}
        <TabsContent value="single" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                سكراب مقال بالرابط المباشر
              </CardTitle>
              <CardDescription>
                أدخل رابط المقال من فاندوم ويكي أو أي موقع آخر وسيتم جلب المحتوى كاملاً مع التابز والصور
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="https://crossfire.fandom.com/wiki/AK-47"
                  value={singleUrl}
                  onChange={e => setSingleUrl(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSingleScrape(); }}
                  className="flex-1"
                  dir="ltr"
                />
                <Button onClick={handleSingleScrape} disabled={isSingleScraping} className="min-w-[130px]">
                  {isSingleScraping ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />جاري الجلب...</>
                  ) : (
                    <><Globe className="w-4 h-4 mr-2" />جلب المحتوى</>
                  )}
                </Button>
              </div>

              {singleResult && (
                <div className="mt-4">
                  <ResultCard data={singleResult} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi URL Tab */}
        <TabsContent value="multi" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                سكراب صفحات متعددة
              </CardTitle>
              <CardDescription>
                أدخل عدة روابط لجلب محتواها دفعة واحدة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {urls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="https://crossfire.fandom.com/wiki/..."
                      value={url}
                      onChange={e => handleUrlChange(index, e.target.value)}
                      className="flex-1"
                      dir="ltr"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveUrl(index)} className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={handleAddUrl} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> إضافة رابط آخر
                </Button>
              </div>

              <Button onClick={handleScrape} disabled={isScraping} className="w-full" size="lg">
                {isScraping ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />جاري السكراب...</>
                ) : (
                  <><FileCode className="w-4 h-4 mr-2" />جلب كل الصفحات</>
                )}
              </Button>
            </CardContent>
          </Card>

          {scrapedData.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                النتائج ({scrapedData.length})
              </h3>
              <div className="grid gap-4">
                {scrapedData.map((data, idx) => (
                  <ResultCard key={idx} data={data} />
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="bg-blue-950/40 border border-blue-800/50 rounded-lg p-4 text-sm text-blue-300 flex gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" />
        <div>
          <p className="font-semibold mb-1 text-blue-200">كيف يعمل السكرابر:</p>
          <ul className="space-y-1 list-disc list-inside text-blue-300/80">
            <li>للفاندوم ويكي: يجلب المقال كاملاً بما فيه التابز والإنفوبوكسات</li>
            <li>لأي موقع آخر: يجلب المحتوى الرئيسي مع الصور والروابط</li>
            <li>يحفظ رابط المصدر الأصلي مع كل محتوى مستورد</li>
            <li>الصور يتم تحويل روابطها للروابط الكاملة تلقائياً</li>
          </ul>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>معاينة المحتوى المسكراب</DialogTitle>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b pb-4 gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">{previewData.title}</h2>
                  <a
                    href={previewData.sourceUrl || previewData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline"
                  >
                    <Link2 className="w-3 h-3" />
                    المصدر الأصلي
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => handleSaveAsEvent(previewData)}>Event</Button>
                  <Button size="sm" onClick={() => handleSaveAsNews(previewData)}>News</Button>
                  <Button size="sm" onClick={() => handleSaveAsPost(previewData)}>Post</Button>
                </div>
              </div>
              {(previewData.mainImage || previewData.image) && (
                <img
                  src={previewData.mainImage || previewData.image}
                  alt={previewData.title}
                  className="w-full max-h-64 object-cover rounded-lg"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className="wiki-content-area border rounded-lg p-4 bg-background">
                <RawHtmlPreview html={previewData.content} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
