import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SEOData {
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: string;
  ogUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterImageAlt?: string;
  schemaType?: string;
  schemaData?: string;
}

interface SEOEditorProps {
  data: SEOData;
  onChange: (data: SEOData) => void;
  autoFill?: { title: string; description: string; image?: string; slug?: string };
}

export function SEOEditor({ data, onChange, autoFill }: SEOEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "social" | "schema">("general");

  const update = (field: keyof SEOData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleAutoFill = () => {
    if (!autoFill) return;
    onChange({
      ...data,
      seoTitle: data.seoTitle || autoFill.title,
      seoDescription: data.seoDescription || autoFill.description,
      ogTitle: data.ogTitle || autoFill.title,
      ogDescription: data.ogDescription || autoFill.description,
      ogImage: data.ogImage || autoFill.image,
      twitterTitle: data.twitterTitle || autoFill.title,
      twitterDescription: data.twitterDescription || autoFill.description,
      twitterImage: data.twitterImage || autoFill.image,
      canonicalUrl: data.canonicalUrl || (autoFill.slug ? `https://crossfire.wiki/${autoFill.slug}` : "")
    });
  };

  return (
    <Card className="border-dashed my-2">
      <div 
        className="p-3 flex items-center justify-between cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="font-medium text-sm flex items-center gap-2">
          <span>🔍 SEO & Social Media Optimization</span>
          {data.seoTitle && <span className="text-xs text-green-600 font-normal">(Configured)</span>}
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>
      
      {isOpen && (
        <CardContent className="pt-0 pb-4 border-t bg-muted/10">
          <div className="flex items-center justify-between py-2 border-b mb-4">
            <div className="flex gap-2">
              <Button 
                variant={activeTab === "general" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setActiveTab("general")}
                className="h-7 text-xs"
              >
                General
              </Button>
              <Button 
                variant={activeTab === "social" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setActiveTab("social")}
                className="h-7 text-xs"
              >
                Social (OG/Twitter)
              </Button>
              <Button 
                variant={activeTab === "schema" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setActiveTab("schema")}
                className="h-7 text-xs"
              >
                Schema (JSON-LD)
              </Button>
            </div>
            {autoFill && (
              <Button variant="outline" size="sm" onClick={handleAutoFill} className="h-7 text-xs">
                Auto-fill all
              </Button>
            )}
          </div>

          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">SEO Title (Browser Tab & Google)</Label>
                <Input 
                  value={data.seoTitle || ""} 
                  onChange={(e) => update("seoTitle", e.target.value)}
                  placeholder={autoFill?.title || "Page Title"}
                  className="h-8"
                />
                <div className="text-[10px] text-muted-foreground flex justify-between">
                  <span>Recommended: 30-60 chars</span>
                  <span className={(data.seoTitle?.length || 0) > 60 ? "text-red-500" : ""}>
                    {data.seoTitle?.length || 0}/60
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Meta Description</Label>
                <Textarea 
                  value={data.seoDescription || ""} 
                  onChange={(e) => update("seoDescription", e.target.value)}
                  placeholder={autoFill?.description || "Summary of the content..."}
                  className="h-20 text-sm resize-none"
                />
                <div className="text-[10px] text-muted-foreground flex justify-between">
                  <span>Recommended: 50-160 chars</span>
                  <span className={(data.seoDescription?.length || 0) > 160 ? "text-red-500" : ""}>
                    {data.seoDescription?.length || 0}/160
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Keywords (comma separated)</Label>
                <Input 
                  value={data.seoKeywords?.join(", ") || ""} 
                  onChange={(e) => update("seoKeywords", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  placeholder="crossfire, fps, game..."
                  className="h-8"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Canonical URL</Label>
                <Input 
                  value={data.canonicalUrl || ""} 
                  onChange={(e) => update("canonicalUrl", e.target.value)}
                  placeholder="https://crossfire.wiki/..."
                  className="h-8"
                />
              </div>
            </div>
          )}

          {activeTab === "social" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">OG Title</Label>
                  <Input 
                    value={data.ogTitle || ""} 
                    onChange={(e) => update("ogTitle", e.target.value)}
                    placeholder="Social Media Title"
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Twitter Title</Label>
                  <Input 
                    value={data.twitterTitle || ""} 
                    onChange={(e) => update("twitterTitle", e.target.value)}
                    placeholder="Twitter Title"
                    className="h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">OG Description</Label>
                  <Textarea 
                    value={data.ogDescription || ""} 
                    onChange={(e) => update("ogDescription", e.target.value)}
                    placeholder="Social Media Description"
                    className="h-16 text-xs resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Twitter Description</Label>
                  <Textarea 
                    value={data.twitterDescription || ""} 
                    onChange={(e) => update("twitterDescription", e.target.value)}
                    placeholder="Twitter Description"
                    className="h-16 text-xs resize-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">OG Image URL</Label>
                  <Input 
                    value={data.ogImage || ""} 
                    onChange={(e) => update("ogImage", e.target.value)}
                    placeholder="https://..."
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Twitter Image URL</Label>
                  <Input 
                    value={data.twitterImage || ""} 
                    onChange={(e) => update("twitterImage", e.target.value)}
                    placeholder="https://..."
                    className="h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">OG Image Alt</Label>
                  <Input 
                    value={data.ogImageAlt || ""} 
                    onChange={(e) => update("ogImageAlt", e.target.value)}
                    placeholder="Image description"
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Twitter Image Alt</Label>
                  <Input 
                    value={data.twitterImageAlt || ""} 
                    onChange={(e) => update("twitterImageAlt", e.target.value)}
                    placeholder="Image description"
                    className="h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">OG Type</Label>
                  <Input 
                    value={data.ogType || ""} 
                    onChange={(e) => update("ogType", e.target.value)}
                    placeholder="article, website, etc."
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">OG URL</Label>
                  <Input 
                    value={data.ogUrl || ""} 
                    onChange={(e) => update("ogUrl", e.target.value)}
                    placeholder="https://..."
                    className="h-8"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "schema" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Schema Type</Label>
                <select 
                  value={data.schemaType || "Article"} 
                  onChange={(e) => update("schemaType", e.target.value)}
                  className="w-full h-8 text-xs border rounded bg-background px-2"
                >
                  <option value="Article">Article</option>
                  <option value="NewsArticle">NewsArticle</option>
                  <option value="Event">Event</option>
                  <option value="WebSite">WebSite</option>
                  <option value="Product">Product</option>
                  <option value="Review">Review</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Custom JSON-LD Data (optional)</Label>
                <Textarea 
                  value={data.schemaData || ""} 
                  onChange={(e) => update("schemaData", e.target.value)}
                  placeholder='{ "@context": "https://schema.org", "@type": "..." }'
                  className="h-40 text-xs font-mono"
                />
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
