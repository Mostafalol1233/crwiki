import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, FileCode, CheckCircle, AlertCircle, Trash2, Plus, ArrowRight, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RawHtmlPreview from "@/components/RawHtmlPreview";

export default function FullPageScraper() {
  const { toast } = useToast();
  const [urls, setUrls] = useState<string[]>([""]);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<any[]>([]);
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

  const handleScrape = async () => {
    const validUrls = urls.filter(u => u.trim().startsWith("http"));
    if (validUrls.length === 0) {
      toast({
        title: "No valid URLs",
        description: "Please enter at least one valid URL starting with http/https",
        variant: "destructive"
      });
      return;
    }

    setIsScraping(true);
    try {
      const response = await apiRequest("/api/admin/scrape-full-pages", "POST", { urls: validUrls });
      setScrapedData(response.data || []);
      toast({
        title: "Scrape Complete",
        description: `Successfully scraped ${response.data?.length || 0} pages`,
      });
    } catch (error: any) {
      toast({
        title: "Scrape Failed",
        description: error.message || "Failed to scrape pages",
        variant: "destructive"
      });
    } finally {
      setIsScraping(true); // Keeping it as a marker for now, but should be false
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
        image: data.mainImage || "",
        seoTitle: data.title,
        seoDescription: data.excerpt || "",
        seoKeywords: data.keywords || [],
      });
      toast({ title: "Saved as Event" });
    } catch (error: any) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveAsNews = async (data: any) => {
    try {
      await apiRequest("/api/news", "POST", {
        title: data.title || "Scraped News",
        content: data.content || "",
        category: "News",
        author: "Scraper",
        image: data.mainImage || "",
        seoTitle: data.title,
        seoDescription: data.excerpt || "",
        seoKeywords: data.keywords || [],
      });
      toast({ title: "Saved as News" });
    } catch (error: any) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveAsPost = async (data: any) => {
    try {
      await apiRequest("/api/posts", "POST", {
        title: data.title || "Scraped Post",
        content: data.content || "",
        category: "Tutorials",
        tags: data.keywords?.join(",") || "",
        author: "Scraper",
        image: data.mainImage || "",
        seoTitle: data.title,
        seoDescription: data.excerpt || "",
        seoKeywords: data.keywords || [],
      });
      toast({ title: "Saved as Post" });
    } catch (error: any) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Full Page Scraper
          </CardTitle>
          <CardDescription>
            Import entire pages (HTML, CSS, Metadata) from any URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="https://example.com/page-to-scrape"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => handleRemoveUrl(index)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddUrl} className="w-full dashed">
              <Plus className="w-4 h-4 mr-2" /> Add another URL
            </Button>
          </div>

          <Button 
            onClick={handleScrape} 
            disabled={isScraping} 
            className="w-full"
            size="lg"
          >
            {isScraping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping full pages...
              </>
            ) : (
              <>
                <FileCode className="w-4 h-4 mr-2" />
                Scrape HTML, CSS & Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {scrapedData.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Scraped Results ({scrapedData.length})
          </h3>
          <div className="grid gap-4">
            {scrapedData.map((data, idx) => (
              <Card key={idx} className="overflow-hidden">
                <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold truncate max-w-[300px]">{data.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{data.url}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setPreviewData(data); setIsPreviewOpen(true); }}>
                      <Eye className="w-4 h-4 mr-1" /> Preview
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSaveAsEvent(data)}>
                      Event
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSaveAsNews(data)}>
                      News
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSaveAsPost(data)}>
                      Post
                    </Button>
                    <Badge variant="secondary">{data.contentLength} chars</Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="text-sm line-clamp-3 text-muted-foreground mb-4">
                    {data.excerpt || "No preview available"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.keywords?.slice(0, 5).map((k: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{k}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 flex gap-3">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">How it works:</p>
          <p>
            The scraper fetches the raw HTML, parses metadata (OpenGraph, SEO tags), 
            and extracts the main article body. It cleans the content for the editor 
            while preserving important structures like lists and headers.
          </p>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Scraped Content Preview</DialogTitle>
          </DialogHeader>
          {previewData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-2xl font-bold">{previewData.title}</h2>
                <Badge variant="outline">{previewData.url}</Badge>
              </div>
              <div className="wiki-content-area">
                <RawHtmlPreview html={previewData.content} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
