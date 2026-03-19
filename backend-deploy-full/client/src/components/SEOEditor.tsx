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
  ogImage?: string;
}

interface SEOEditorProps {
  data: SEOData;
  onChange: (data: SEOData) => void;
  autoFill?: { title: string; description: string; image?: string };
}

export function SEOEditor({ data, onChange, autoFill }: SEOEditorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const update = (field: keyof SEOData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleAutoFill = () => {
    if (!autoFill) return;
    onChange({
      ...data,
      seoTitle: data.seoTitle || autoFill.title,
      seoDescription: data.seoDescription || autoFill.description,
      ogImage: data.ogImage || autoFill.image
    });
  };

  return (
    <Card className="border-dashed my-2">
      <div 
        className="p-3 flex items-center justify-between cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="font-medium text-sm flex items-center gap-2">
          <span>🔍 SEO Settings</span>
          {data.seoTitle && <span className="text-xs text-green-600 font-normal">(Configured)</span>}
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </div>
      
      {isOpen && (
        <CardContent className="pt-0 pb-4 space-y-4 border-t bg-muted/10">
          {autoFill && (
            <div className="flex justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={handleAutoFill} className="h-6 text-xs">
                Auto-fill from content
              </Button>
            </div>
          )}
          
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
            <Label className="text-xs">Social Image URL (OG:Image)</Label>
            <Input 
              value={data.ogImage || ""} 
              onChange={(e) => update("ogImage", e.target.value)}
              placeholder={autoFill?.image || "https://..."}
              className="h-8"
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
