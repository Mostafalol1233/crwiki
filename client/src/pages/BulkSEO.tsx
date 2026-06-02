import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, RefreshCw, Search, Wand2, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ContentItem {
  id: string;
  title: string;
  type: 'news' | 'post' | 'event' | 'seller';
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  ogImage?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  image?: string;
  content?: string;
  description?: string;
  summary?: string;
  displayTitle?: string;
}

export default function BulkSEO() {
  const { toast } = useToast();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [edits, setEdits] = useState<Record<string, Partial<ContentItem>>>({});
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  const selectedItem = items.find(i => i.id === selectedItemId) ?? null;

  const previewValue = (field: keyof ContentItem): any => {
    if (!selectedItem) return '';
    return edits[selectedItem.id]?.[field] ?? (selectedItem as any)[field] ?? '';
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/api/admin/seo/bulk", "GET");
      const nextItems = Array.isArray(data) ? data : [];
      setItems(nextItems);
      if (nextItems[0]?.id) setSelectedItemId(nextItems[0].id);
      setSelectedIds(new Set()); // Reset selection on refresh
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string, field: keyof ContentItem, value: any) => {
    setEdits(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value
      }
    }));
  };

  const getDisplayValue = (item: ContentItem, field: keyof ContentItem) => {
    if (edits[item.id] && edits[item.id][field] !== undefined) {
      return edits[item.id][field];
    }
    return item[field];
  };

  const handleAutoGenerate = (item: ContentItem) => {
    const baseText = item.description || item.summary || item.content || "";
    const cleanText = baseText.replace(/<[^>]*>/g, '').slice(0, 160);
    
    setEdits(prev => ({
      ...prev,
      [item.id]: {
        ...(prev[item.id] || {}),
        seoTitle: item.displayTitle || item.title,
        seoDescription: cleanText,
        // Don't auto-set keywords as they are specific
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const itemsToSave = Object.keys(edits).map(id => {
        const item = items.find(i => i.id === id);
        return {
          id,
          type: item?.type,
          ...edits[id]
        };
      });

      if (itemsToSave.length === 0) return;

      await apiRequest("/api/admin/seo/bulk", "POST", { items: itemsToSave });

      toast({ title: "Success", description: "SEO settings updated successfully" });
      setEdits({});
      fetchItems();
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = (item.displayTitle || item.title || "").toLowerCase().includes(filter.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesFilter && matchesType;
  });

  const getPublicPath = (item: ContentItem) => {
    if (item.type === "post") return `/article/${item.slug || item.id}`;
    if (item.type === "event") return `/events/${item.slug || item.id}`;
    if (item.type === "news") return `/news/${item.slug || item.id}`;
    if (item.type === "seller") return `/sellers/${item.slug || item.id}`;
    return "/";
  };

  const getGooglePreview = (item: ContentItem) => {
    const title = String(getDisplayValue(item, "seoTitle") || item.displayTitle || item.title || "Untitled").slice(0, 60);
    const description = String(getDisplayValue(item, "seoDescription") || item.summary || item.description || "").slice(0, 160);
    const envBase = (import.meta as any).env?.VITE_PUBLIC_BASE_URL || "https://crossfire.wiki";
    const base = String(envBase).replace(/\/$/, "");
    const path = getPublicPath(item);
    return {
      title,
      description,
      url: `${base}${path}`,
    };
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: "var(--background)" }}>
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <a className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider hover:opacity-80" style={{ color: "#555" }}>
                <ArrowLeft className="h-3 w-3" /> Admin
              </a>
            </Link>
            <span style={{ color: "#333" }}>/</span>
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" style={{ color: "#f5a623" }} />
              <h1 className="text-xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>Bulk SEO Editor</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchItems}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all hover:opacity-80 disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#888", borderRadius: "2px" }}
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleSave}
              disabled={saving || Object.keys(edits).length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all hover:brightness-110 disabled:opacity-50"
              style={{ background: "#f5a623", color: "#000", borderRadius: "2px" }}
            >
              <Save className="h-3 w-3" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="flex gap-3 items-center p-3" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "3px" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "#555" }} />
            <Input
              placeholder="Filter by title..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 h-9 text-sm"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>
          <select
            className="h-9 px-3 text-xs font-bold outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--foreground)", borderRadius: "2px" }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="post">Posts</option>
            <option value="news">News</option>
            <option value="event">Events</option>
            <option value="seller">Sellers</option>
          </select>
        </div>

        <div style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Content</TableHead>
                <TableHead>SEO Title</TableHead>
                <TableHead>Meta Description</TableHead>
                <TableHead>Main Image URL</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading content...</TableCell>
                </TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">No content found</TableCell>
                </TableRow>
              ) : (
                filteredItems.map(item => (
                    <TableRow key={item.id} className={selectedItemId === item.id ? "bg-primary/5" : ""}>
                      <TableCell>
                        <div className="font-medium">{item.displayTitle || item.title}</div>
                        <Badge variant="outline" className="mt-1 capitalize">{item.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Input 
                        value={getDisplayValue(item, 'seoTitle') || ""} 
                        onChange={(e) => handleEdit(item.id, 'seoTitle', e.target.value)}
                        placeholder="SEO Title"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {(getDisplayValue(item, 'seoTitle') || "").length} / 60 chars
                      </div>
                    </TableCell>
                    <TableCell>
                      <Textarea 
                        value={getDisplayValue(item, 'seoDescription') || ""} 
                        onChange={(e) => handleEdit(item.id, 'seoDescription', e.target.value)}
                        placeholder="Meta Description"
                        className="h-20"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {(getDisplayValue(item, 'seoDescription') || "").length} / 160 chars
                      </div>
                      <div className="mt-2 rounded-md border border-border/70 p-2 bg-muted/20">
                        <div className="text-[11px] text-emerald-700 truncate">{getGooglePreview(item).url}</div>
                        <div className="text-sm text-blue-700 font-medium truncate">{getGooglePreview(item).title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{getGooglePreview(item).description || "No meta description yet."}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={getDisplayValue(item, 'image') || ""}
                        onChange={(e) => handleEdit(item.id, 'image', e.target.value)}
                        placeholder="Main image URL"
                      />
                      <div className="mt-2 rounded-md border p-2">
                        {String(getDisplayValue(item, "image") || "").trim() ? (
                          <img
                            src={String(getDisplayValue(item, "image") || "")}
                            alt={item.title}
                            className="h-16 w-full object-cover rounded"
                            loading="lazy"
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground">No main image set.</p>
                        )}
                      </div>
                    </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleAutoGenerate(item)}
                            title="Auto-generate from content"
                          >
                            <Wand2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setSelectedItemId(item.id)}>
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {selectedItem && (
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-5 space-y-3" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
              <h3 className="font-black text-xs uppercase tracking-wider mb-3" style={{ color: "var(--foreground)" }}>Detailed SEO Editor</h3>
              <div className="space-y-3">
                <Input value={String(previewValue("title"))} onChange={(e) => handleEdit(selectedItem.id, "title", e.target.value)} placeholder="Public title" />
                <Input value={String(previewValue("seoTitle"))} onChange={(e) => handleEdit(selectedItem.id, "seoTitle", e.target.value)} placeholder="SEO title" />
                <Textarea value={String(previewValue("seoDescription"))} onChange={(e) => handleEdit(selectedItem.id, "seoDescription", e.target.value)} placeholder="SEO description" className="h-24" />
                <Input value={Array.isArray(previewValue("seoKeywords")) ? (previewValue("seoKeywords") as string[]).join(", ") : String(previewValue("seoKeywords") || "")} onChange={(e) => handleEdit(selectedItem.id, "seoKeywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="keyword1, keyword2" />
                <Input value={String(previewValue("image"))} onChange={(e) => handleEdit(selectedItem.id, "image", e.target.value)} placeholder="Main image URL" />
                <Input value={String(previewValue("ogImage"))} onChange={(e) => handleEdit(selectedItem.id, "ogImage", e.target.value)} placeholder="Open Graph image URL" />
                <Input value={String(previewValue("twitterImage"))} onChange={(e) => handleEdit(selectedItem.id, "twitterImage", e.target.value)} placeholder="Twitter / large image URL" />
                <Input value={String(previewValue("canonicalUrl"))} onChange={(e) => handleEdit(selectedItem.id, "canonicalUrl", e.target.value)} placeholder="Canonical URL" />
                <Textarea value={String(previewValue("summary"))} onChange={(e) => handleEdit(selectedItem.id, "summary", e.target.value)} placeholder="Summary / short excerpt" className="h-24" />
                <Textarea value={String(previewValue("content"))} onChange={(e) => handleEdit(selectedItem.id, "content", e.target.value)} placeholder={selectedItem.type === "event" ? "Event description / content" : "Main content"} className="min-h-[220px]" />
              </div>
            </div>

            <div className="p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
              <h3 className="font-black text-xs uppercase tracking-wider mb-3" style={{ color: "var(--foreground)" }}>Live Preview</h3>
              <div className="overflow-hidden" style={{ borderRadius: "3px", border: "1px solid rgba(255,255,255,0.06)" }}>
                {String(previewValue("ogImage") || previewValue("image")) ? (
                  <img src={String(previewValue("ogImage") || previewValue("image"))} alt="Preview" className="w-full aspect-[1200/630] object-cover" />
                ) : (
                  <div className="aspect-[1200/630] flex items-center justify-center text-xs" style={{ background: "rgba(255,255,255,0.03)", color: "#555" }}>No preview image</div>
                )}
              </div>
              <div className="space-y-2 p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "3px" }}>
                <span className="inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-widest" style={{ background: "rgba(245,166,35,0.15)", color: "#f5a623", borderRadius: "2px" }}>{selectedItem.type}</span>
                <h3 className="text-lg font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>{String(previewValue("seoTitle") || previewValue("title") || selectedItem.title)}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#666" }}>{String(previewValue("seoDescription") || previewValue("summary") || "").slice(0, 220)}</p>
                <div className="text-[10px] break-all" style={{ color: "#444" }}>
                  Canonical: {String(previewValue("canonicalUrl") || `/preview/${selectedItem.type}/${selectedItem.slug || selectedItem.id}`)}
                </div>
                <div className="p-3 text-xs whitespace-pre-wrap max-h-48 overflow-auto" style={{ background: "rgba(255,255,255,0.03)", borderRadius: "2px", color: "#666" }}>
                  {String(previewValue("content") || previewValue("summary") || "No body preview yet.")}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
