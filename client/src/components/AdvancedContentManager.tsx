import { useState, useEffect, useMemo, useRef } from "react";
import { uploadImageToSupabase } from "@/lib/supabaseApi";
import DOMPurify from "isomorphic-dompurify";
import imageCompression from 'browser-image-compression';
import { RichTextEditor } from "@/components/RichTextEditor";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Copy, Trash2, Plus, Check, X, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SEOEditor } from "./SEOEditor";
 

interface ContentItem {
  id: string;
  name: string;
  type: "mercenary" | "post" | "event" | "news" | "seller";
  content: any;
  createdAt: string;
  savedLocally: boolean;
  synced?: boolean;
}

export function AdvancedContentManager() {
  

  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  

  const [items, setItems] = useState<ContentItem[]>(() => {
    const saved = localStorage.getItem("advancedContent");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState("mercenary");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false)

  // Seller form
  const [sellerForm, setSellerForm] = useState({
    name: "",
    description: "",
    email: "",
    website: "",
    images: [] as string[],
    imageUrl: "",
    featured: false,
    promotionText: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [] as string[],
    ogImage: ""
  });

  // Mercenary form
  const [mercForm, setMercForm] = useState({
    name: "",
    role: "",
    image: "",
    sounds: [] as string[],
    soundUrl: "",
  });

  // News form
  const [newsForm, setNewsForm] = useState({
    title: "",
    content: "",
    image: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [] as string[],
    ogImage: ""
  });

  // Event form
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    image: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [] as string[],
    ogImage: ""
  });

  // Post form
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    tags: "",
    image: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [] as string[],
    ogImage: ""
  });

  // Merge & Optimize state
  const [mergeLoading, setMergeLoading] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergePreview, setMergePreview] = useState<any>(null);

  // Upload enhancements
  const [uploadMethod, setUploadMethod] = useState<"server" | "catbox">("server");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string>("");
  const [lastUploadedMethod, setLastUploadedMethod] = useState<"server" | "catbox" | null>(null);
  const publicBase = typeof window !== "undefined" ? window.location.origin : "https://crossfire.wiki";
  const RECOMMENDED_MAX = { width: 1920, height: 1080 };

  

  async function getImageSize(file: File): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  }

  const saveToLocalStorage = (newItems: ContentItem[]) => {
    localStorage.setItem("advancedContent", JSON.stringify(newItems));
    setItems(newItems);
  };

  // Load items from backend
  const loadFromBackend = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/content-items", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        }
      });

      if (response.ok) {
        const backendItems = await response.json();
        // Merge with local items, backend takes precedence
        const merged = backendItems.map((item: any) => ({
          ...item,
          savedLocally: true,
          synced: true
        }));
        setItems(merged);
        saveToLocalStorage(merged);
        toast({ title: "Loaded from backend", description: `${merged.length} items loaded` });
      }
    } catch (err) {
      console.error("Failed to load from backend:", err);
      toast({ title: "Failed to load from backend", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Sync local items to backend
  const syncToBackend = async () => {
    try {
      setIsSyncing(true);
      const response = await fetch("/api/content-items/bulk-save", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ items })
      });

      if (response.ok) {
        const result = await response.json();
        toast({ title: "Synced to backend", description: `${result.savedCount} items saved` });
        setItems(items.map(item => ({ ...item, synced: true })));
      } else {
        const error = await response.json();
        toast({ title: "Sync failed", description: error.error, variant: "destructive" });
      }
    } catch (err) {
      console.error("Failed to sync:", err);
      toast({ title: "Sync error", description: String(err), variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  // Load on mount
  useEffect(() => {
    // Optionally auto-load from backend on open
  }, []);

  const addMercenary = () => {
    if (!mercForm.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (mercForm.sounds.length === 0) {
      toast({ title: "Add at least one sound URL", variant: "destructive" });
      return;
    }

    const item: ContentItem = {
      id: `merc-${Date.now()}`,
      name: mercForm.name,
      type: "mercenary",
      content: { ...mercForm },
      createdAt: new Date().toISOString(),
      savedLocally: true,
    };

    saveToLocalStorage([...items, item]);
    setMercForm({ name: "", role: "", image: "", sounds: [], soundUrl: "" });
    toast({ title: "Mercenary saved locally!" });
  };

  const addNews = () => {
    if (!newsForm.title.trim() || !newsForm.content.trim()) {
      toast({ title: "Title and content required", variant: "destructive" });
      return;
    }
    const normalizeImageUrl = (url: string) => {
      const src = String(url || '').trim();
      if (!src) return '';
      try {
        const base = (typeof window !== 'undefined') ? window.location.origin : 'https://crossfire.wiki';
        if (src.startsWith('/images/')) return `${base}${src}`;
        if (/^https?:\/\//i.test(src)) return src;
        return `${base}/${src.replace(/^\//, '')}`;
      } catch { return src; }
    };

    const item: ContentItem = {
      id: `news-${Date.now()}`,
      name: newsForm.title,
      type: "news",
      content: { ...newsForm, image: normalizeImageUrl(newsForm.image) },
      createdAt: new Date().toISOString(),
      savedLocally: true,
    };

    saveToLocalStorage([...items, item]);
    setNewsForm({ title: "", content: "", image: "", seoTitle: "", seoDescription: "", seoKeywords: [], ogImage: "" });
    toast({ title: "News saved locally!" });
  };

  const addEvent = () => {
    if (!eventForm.title.trim() || !eventForm.description.trim()) {
      toast({ title: "Title and description required", variant: "destructive" });
      return;
    }

    const item: ContentItem = {
      id: `event-${Date.now()}`,
      name: eventForm.title,
      type: "event",
      content: { ...eventForm },
      createdAt: new Date().toISOString(),
      savedLocally: true,
    };

    saveToLocalStorage([...items, item]);
    setEventForm({ title: "", description: "", startDate: "", endDate: "", image: "", seoTitle: "", seoDescription: "", seoKeywords: [], ogImage: "" });
    toast({ title: "Event saved locally!" });
  };

  const addPost = () => {
    if (!postForm.title.trim() || !postForm.content.trim()) {
      toast({ title: "Title and content required", variant: "destructive" });
      return;
    }

    const item: ContentItem = {
      id: `post-${Date.now()}`,
      name: postForm.title,
      type: "post",
      content: { ...postForm },
      createdAt: new Date().toISOString(),
      savedLocally: true,
    };

    saveToLocalStorage([...items, item]);
    setPostForm({ title: "", content: "", excerpt: "", tags: "", image: "", seoTitle: "", seoDescription: "", seoKeywords: [], ogImage: "" });
    toast({ title: "Post saved locally!" });
  };

  const addSeller = () => {
    if (!sellerForm.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    const item: ContentItem = {
      id: `seller-${Date.now()}`,
      name: sellerForm.name,
      type: "seller",
      content: { ...sellerForm },
      createdAt: new Date().toISOString(),
      savedLocally: true,
    };

    saveToLocalStorage([...items, item]);
    setSellerForm({
      name: "",
      description: "",
      email: "",
      website: "",
      images: [],
      imageUrl: "",
      featured: false,
      promotionText: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: [],
      ogImage: ""
    });
    toast({ title: "Seller saved locally!" });
  };

  const deleteItem = (id: string) => {
    saveToLocalStorage(items.filter((item) => item.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
    try {
      fetch('/api/admin/audit-ui', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` }, body: JSON.stringify({ action: 'delete_item', component: 'AdvancedContentManager', details: { id } }) });
    } catch { }
    toast({ title: "Item deleted" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard!" });
  };

  const exportItem = (item: ContentItem) => {
    const json = JSON.stringify(item.content, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.name}-${item.type}.json`;
    a.click();
  };

  const itemsByType = items.filter((item) => item.type === activeTab);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        📋 Advanced Content Manager
      </Button>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <script dangerouslySetInnerHTML={{ __html: `fetch('/api/admin/audit-ui',{method:'POST',headers:{'Content-Type':'application/json','Authorization': 'Bearer '+(localStorage.getItem('adminToken')||'')},body:JSON.stringify({action:'button_reenabled',component:'AdvancedContentManager'})});` }} />
        <DialogHeader>
          <div className="flex items-center justify-between w-full">
            <DialogTitle>Advanced Content Manager</DialogTitle>
            <div className="flex gap-2">
              <Button
                onClick={loadFromBackend}
                disabled={isLoading || isSyncing}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-1" />
                Load
              </Button>
              <Button
                onClick={syncToBackend}
                disabled={isSyncing || isLoading}
                size="sm"
              >
                <Upload className="w-4 h-4 mr-1" />
                Sync
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Upload File (Predictable URL)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={uploadMethod === "server" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUploadMethod("server")}
                  >
                    Server link
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  crossfire.wiki/images — SEO-friendly, hosted on your server
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={uploadMethod === "catbox" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUploadMethod("catbox")}
                  >
                    Catbox link
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  catbox.moe — legacy hosting method, external CDN
                </TooltipContent>
              </Tooltip>
              {lastUploadedUrl && (
                <Badge variant={lastUploadedMethod === "server" ? "default" : "secondary"}>
                  {lastUploadedMethod === "server" ? "Server" : "Catbox"}
                </Badge>
              )}
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              <Input id="elementName" placeholder="element_name (used in URL)" />
              <Input id="fileInput" type="file" />
              <Input id="urlInput" placeholder="or paste image/video URL or data:image..." />
              <Button id="uploadBtn" disabled={uploadLoading} onClick={async () => {
                const elName = (document.getElementById('elementName') as HTMLInputElement)?.value || '';
                const fileEl = (document.getElementById('fileInput') as HTMLInputElement);
                const file = fileEl?.files?.[0];
                const urlIn = (document.getElementById('urlInput') as HTMLInputElement)?.value || '';
                if (!elName || !file) { toast({ title: 'Name and file required', variant: 'destructive' }); return; }
                const dims = file.type.startsWith('image/') ? await getImageSize(file) : null;
                if (dims) {
                  if (dims.width > RECOMMENDED_MAX.width || dims.height > RECOMMENDED_MAX.height) {
                    toast({ title: 'Large image', description: `Uploaded image is ${dims.width}x${dims.height}. Recommended ≤ ${RECOMMENDED_MAX.width}x${RECOMMENDED_MAX.height}.`, variant: 'destructive' });
                  }
                }
                let fileToUpload: File | null = file || null;
                try {
                  if (!fileToUpload && urlIn) {
                    if (/^data:image\/(jpeg|png|gif);base64,/i.test(urlIn)) {
                      const arr = urlIn.split(',');
                      const mime = arr[0].match(/data:(.*?);base64/i)?.[1] || 'image/jpeg';
                      const bstr = atob(arr[1]);
                      let n = bstr.length; const u8arr = new Uint8Array(n);
                      while (n--) u8arr[n] = bstr.charCodeAt(n);
                      fileToUpload = new File([u8arr], `${elName}.${mime.includes('png') ? 'png' : mime.includes('gif') ? 'gif' : 'jpg'}`, { type: mime });
                    } else if (/^https?:\/\//i.test(urlIn)) {
                      const resp = await fetch(urlIn);
                      if (!resp.ok) throw new Error(`Failed to fetch URL: ${resp.status}`);
                      const ct = resp.headers.get('content-type') || '';
                      if (!/(image\/(jpeg|png|gif)|video\/mp4|application\/pdf)/i.test(ct)) throw new Error('Unsupported remote type');
                      const blob = await resp.blob();
                      const ext = ct.includes('png') ? 'png' : ct.includes('gif') ? 'gif' : ct.includes('mp4') ? 'mp4' : ct.includes('pdf') ? 'pdf' : 'jpg';
                      if (blob.size > (10 * 1024 * 1024)) throw new Error('File too large (>10MB)');
                      fileToUpload = new File([blob], `${elName}.${ext}`, { type: ct });
                    }
                  }
                } catch (e: any) {
                  toast({ title: 'URL processing failed', description: String(e.message || e), variant: 'destructive' });
                  return;
                }
                if (!fileToUpload) { toast({ title: 'No file or URL provided', variant: 'destructive' }); return; }
                const fd = new FormData();
                fd.append('public_id', elName);
                fd.append('file', fileToUpload);
                try {
                  setUploadLoading(true);
                  setUploadProgress(0);
                  if (uploadMethod === "server") {
                    const { uploadToSupabase } = await import("@/lib/uploadToSupabase");
                    const uploadedUrl = await uploadToSupabase(fileToUpload, "uploads");
                    if (!uploadedUrl) throw new Error('Upload failed — no URL returned');
                    setLastUploadedUrl(String(uploadedUrl));
                    setLastUploadedMethod("server");
                    toast({ title: 'Uploaded to Supabase Storage', description: String(uploadedUrl) });
                    navigator.clipboard.writeText(String(uploadedUrl));
                  } else {
                    const uploadedUrl = await uploadImageToSupabase(fileToUpload, 'uploads', 'content');
                    if (!uploadedUrl) throw new Error('Upload failed — no URL returned');
                    setLastUploadedUrl(String(uploadedUrl));
                    setLastUploadedMethod("catbox");
                    toast({ title: 'Uploaded', description: String(uploadedUrl) });
                    navigator.clipboard.writeText(String(uploadedUrl));
                  }
                } catch (e: any) {
                  toast({ title: 'Upload error', description: String(e.message || e), variant: 'destructive' });
                } finally {
                  setUploadLoading(false);
                  setUploadProgress(0);
                }
              }}>Upload</Button>
              {lastUploadedUrl && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(lastUploadedUrl)}>Copy</Button>
                  <Button variant="ghost" size="sm" onClick={async () => {
                    try {
                      if ((navigator as any).share) {
                        await (navigator as any).share({ url: lastUploadedUrl, title: 'Shared link' });
                      } else {
                        copyToClipboard(lastUploadedUrl);
                      }
                    } catch { }
                  }}>Share</Button>
                </div>
              )}
            </div>
            {uploadLoading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </div>
            )}
            {(lastUploadedUrl || (document.getElementById('urlInput') as HTMLInputElement)?.value) && (
              <div className="mt-2">
                <img
                  src={lastUploadedUrl || (document.getElementById('urlInput') as HTMLInputElement)?.value}
                  alt="Preview"
                  className="max-h-48 rounded border"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">URL format: {publicBase}/images/${'{element_name}.{extension}'}</p>
            <p className="text-xs text-muted-foreground">Tip: Server links are optimized for SEO and reliability. Catbox links are legacy and may change.</p>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="mercenary">
              Mercenaries ({items.filter((i) => i.type === "mercenary").length})
            </TabsTrigger>
            <TabsTrigger value="news">
              News ({items.filter((i) => i.type === "news").length})
            </TabsTrigger>
            <TabsTrigger value="event">
              Events ({items.filter((i) => i.type === "event").length})
            </TabsTrigger>
            <TabsTrigger value="post">
              Posts ({items.filter((i) => i.type === "post").length})
            </TabsTrigger>
            <TabsTrigger value="seller">
              Sellers ({items.filter((i) => i.type === "seller").length})
            </TabsTrigger>
          </TabsList>

          {/* MERCENARY TAB */}
          <TabsContent value="mercenary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Mercenary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Mercenary name"
                  value={mercForm.name}
                  onChange={(e) =>
                    setMercForm((s) => ({ ...s, name: e.target.value }))
                  }
                />
                <Input
                  placeholder="Role (e.g., Assault, Support)"
                  value={mercForm.role}
                  onChange={(e) =>
                    setMercForm((s) => ({ ...s, role: e.target.value }))
                  }
                />
                <Input
                  placeholder="Image URL"
                  value={mercForm.image}
                  onChange={(e) =>
                    setMercForm((s) => ({ ...s, image: e.target.value }))
                  }
                />

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Sound URL"
                      value={mercForm.soundUrl}
                      onChange={(e) =>
                        setMercForm((s) => ({ ...s, soundUrl: e.target.value }))
                      }
                    />
                    <Button
                      onClick={() => {
                        if (mercForm.soundUrl.trim()) {
                          setMercForm((s) => ({
                            ...s,
                            sounds: [...s.sounds, s.soundUrl],
                            soundUrl: "",
                          }));
                          toast({ title: "Sound added!" });
                        }
                      }}
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {mercForm.sounds.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Sounds:</p>
                      {mercForm.sounds.map((sound, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-gray-100 p-2 rounded text-sm"
                        >
                          <span className="truncate">{sound}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMercForm((s) => ({
                                ...s,
                                sounds: s.sounds.filter((_, idx) => idx !== i),
                              }));
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={addMercenary} className="w-full">
                  Save Mercenary
                </Button>
              </CardContent>
            </Card>

            {itemsByType.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Saved Mercenaries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {itemsByType.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.content.role && `Role: ${item.content.role} • `}
                          {item.content.sounds?.length} sounds
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportItem(item);
                          }}
                        >
                          📥
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(item.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* NEWS TAB */}
          <TabsContent value="news" className="space-y-4">
            {/* Merge & Optimize */}
            <Card>
              <CardHeader>
                <CardTitle>Merge & Optimize News</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={async () => {
                      try {
                        setSelectedItem(null);
                        setMergeLoading(true);
                        const res = await fetch('/api/admin/news/merge/preview', { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` } });
                        const data = await res.json();
                        setMergePreview(data);
                        setShowMergeDialog(true);
                      } catch (e: any) {
                        toast({ title: 'Preview failed', description: e?.message || 'Unknown error', variant: 'destructive' });
                      } finally {
                        setMergeLoading(false);
                      }
                    }}
                  >
                    {mergeLoading ? 'Loading…' : 'Preview Merge'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        setMergeLoading(true);
                        const res = await fetch('/api/admin/news/merge', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` }, body: JSON.stringify({ apply: true }) });
                        const data = await res.json();
                        setMergePreview(data);
                        toast({ title: 'Merge applied', description: `${data.updated || 0} items updated` });
                      } catch (e: any) {
                        toast({ title: 'Merge failed', description: e?.message || 'Unknown error', variant: 'destructive' });
                      } finally {
                        setMergeLoading(false);
                      }
                    }}
                  >
                    Apply Merge
                  </Button>
                </div>
                <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>Merge Preview</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[50vh] overflow-auto space-y-3 text-sm">
                      {mergePreview?.changes?.length ? mergePreview.changes.map((c: any) => (
                        <div key={c.id} className="border rounded-md p-2">
                          <div className="font-medium">{c.title}</div>
                          <div className="text-muted-foreground">ID: {c.id} • Slug: {c.news_slug}</div>
                          <ul className="list-disc pl-5 mt-1">
                            {Object.entries(c.changes).map(([k, v]: any) => (
                              <li key={k}>
                                {k}: {v?.preview ? 'content updated' : (typeof v === 'object' ? `${v.from} → ${v.to}` : String(v))}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )) : (
                        <div className="text-muted-foreground">No changes detected</div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowMergeDialog(false)}>Close</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
            {/* Migration (images & media) */}
            <Card>
              <CardHeader>
                <CardTitle>Migration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={async () => {
                      try {
                        setSelectedItem(null);
                        setMergeLoading(true);
                        const res = await fetch('/api/admin/images/process?dryRun=true', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` } });
                        const data = await res.json();
                        const newsCount = Array.isArray(data?.items) ? data.items.filter((i: any) => i.type === 'news').length : 0;
                        setMergePreview({ previewOnly: true, total: data?.processed || 0, newsCount });
                        toast({ title: 'Migration preview', description: `News items affected: ${newsCount}` });
                      } catch (e: any) {
                        toast({ title: 'Preview failed', description: e?.message || 'Unknown error', variant: 'destructive' });
                      } finally {
                        setMergeLoading(false);
                      }
                    }}
                  >
                    Preview Migration
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      let timer: any = null;
                      try {
                        setMergeLoading(true);
                        timer = setInterval(() => {
                          // indeterminate progress indicator via repeated toasts
                          toast({ title: 'Migrating…', description: 'Processing images and media links', duration: 1500 });
                        }, 1600);
                        const res = await fetch('/api/admin/images/process', { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` } });
                        const data = await res.json();
                        clearInterval(timer);
                        setMergePreview({ applied: true, processed: data?.processed || 0 });
                        const newsDone = Array.isArray(data?.items) ? data.items.filter((i: any) => i.type === 'news').length : 0;
                        toast({ title: 'Migration complete', description: `Processed ${data?.processed || 0} items • News: ${newsDone}` });
                      } catch (e: any) {
                        if (timer) clearInterval(timer);
                        toast({ title: 'Migration failed', description: e?.message || 'Unknown error', variant: 'destructive' });
                      } finally {
                        setMergeLoading(false);
                      }
                    }}
                  >
                    Run Migration
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Create News</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="News title"
                  value={newsForm.title}
                  onChange={(e) =>
                    setNewsForm((s) => ({ ...s, title: e.target.value }))
                  }
                />
                <Input
                  placeholder="Featured image URL"
                  value={newsForm.image}
                  onChange={(e) =>
                    setNewsForm((s) => ({ ...s, image: e.target.value }))
                  }
                />
                <SEOEditor
                  data={newsForm}
                  onChange={(data) => setNewsForm(s => ({ ...s, ...data }))}
                  autoFill={{ title: newsForm.title, description: newsForm.content.replace(/<[^>]*>/g, '').slice(0, 160), image: newsForm.image }}
                />
                <div className="bg-white text-black rounded-md overflow-hidden">
                  <RichTextEditor value={newsForm.content} onChange={(content) => setNewsForm((s) => ({ ...s, content }))} height={300} />
                </div>
                <Button onClick={addNews} className="w-full">
                  Save News
                </Button>
              </CardContent>
            </Card>

            {itemsByType.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Saved News</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {itemsByType.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600 line-clamp-1">
                          {item.content.content}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportItem(item);
                          }}
                        >
                          📥
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(item.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* EVENT TAB */}
          <TabsContent value="event" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Event title"
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm((s) => ({ ...s, title: e.target.value }))
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Start date (YYYY-MM-DD)"
                    type="date"
                    value={eventForm.startDate}
                    onChange={(e) =>
                      setEventForm((s) => ({ ...s, startDate: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="End date (YYYY-MM-DD)"
                    type="date"
                    value={eventForm.endDate}
                    onChange={(e) =>
                      setEventForm((s) => ({ ...s, endDate: e.target.value }))
                    }
                  />
                </div>
                <Input
                  placeholder="Featured image URL"
                  value={eventForm.image}
                  onChange={(e) =>
                    setEventForm((s) => ({ ...s, image: e.target.value }))
                  }
                />
                <SEOEditor
                  data={eventForm}
                  onChange={(data) => setEventForm(s => ({ ...s, ...data }))}
                  autoFill={{ title: eventForm.title, description: eventForm.description.replace(/<[^>]*>/g, '').slice(0, 160), image: eventForm.image }}
                />
                <div className="space-y-2">
                  <div className="bg-white text-black rounded-md overflow-hidden">
                    <RichTextEditor value={eventForm.description} onChange={(content) => setEventForm((s) => ({ ...s, description: content }))} height={300} />
                  </div>
                </div>
                <Button onClick={addEvent} className="w-full">
                  Save Event
                </Button>
              </CardContent>
            </Card>

            {itemsByType.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Saved Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {itemsByType.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.content.startDate} to {item.content.endDate}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportItem(item);
                          }}
                        >
                          📥
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(item.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* POST TAB */}
          <TabsContent value="post" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Post</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Post title"
                  value={postForm.title}
                  onChange={(e) =>
                    setPostForm((s) => ({ ...s, title: e.target.value }))
                  }
                />
                <Input
                  placeholder="Excerpt/Summary"
                  value={postForm.excerpt}
                  onChange={(e) =>
                    setPostForm((s) => ({ ...s, excerpt: e.target.value }))
                  }
                />
                <Input
                  placeholder="Tags (comma-separated)"
                  value={postForm.tags}
                  onChange={(e) =>
                    setPostForm((s) => ({ ...s, tags: e.target.value }))
                  }
                />
                <Input
                  placeholder="Featured image URL"
                  value={postForm.image}
                  onChange={(e) =>
                    setPostForm((s) => ({ ...s, image: e.target.value }))
                  }
                />
                <SEOEditor
                  data={postForm}
                  onChange={(data) => setPostForm(s => ({ ...s, ...data }))}
                  autoFill={{ title: postForm.title, description: (postForm.excerpt || postForm.content).replace(/<[^>]*>/g, '').slice(0, 160), image: postForm.image }}
                />
                <div className="space-y-2">
                  <div className="bg-white text-black rounded-md overflow-hidden">
                    <RichTextEditor value={postForm.content} onChange={(content) => setPostForm((s) => ({ ...s, content }))} height={400} />
                  </div>
                  <div className="rounded border p-3 mt-12">
                    <p className="text-sm font-medium mb-2">Preview</p>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(postForm.content) }} />
                  </div>
                </div>
                <Button onClick={addPost} className="w-full">
                  Save Post
                </Button>
              </CardContent>
            </Card>

            {itemsByType.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Saved Posts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {itemsByType.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {item.content.tags?.split(",").map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportItem(item);
                          }}
                        >
                          📥
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(item.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          {/* SELLER TAB */}
          <TabsContent value="seller" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create Seller</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Seller name"
                  value={sellerForm.name}
                  onChange={(e) =>
                    setSellerForm((s) => ({ ...s, name: e.target.value }))
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Email"
                    value={sellerForm.email}
                    onChange={(e) =>
                      setSellerForm((s) => ({ ...s, email: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Website"
                    value={sellerForm.website}
                    onChange={(e) =>
                      setSellerForm((s) => ({ ...s, website: e.target.value }))
                    }
                  />
                </div>
                <Input
                  placeholder="Promotion text"
                  value={sellerForm.promotionText}
                  onChange={(e) =>
                    setSellerForm((s) => ({ ...s, promotionText: e.target.value }))
                  }
                />
                <SEOEditor
                  data={sellerForm}
                  onChange={(data) => setSellerForm(s => ({ ...s, ...data }))}
                  autoFill={{ title: sellerForm.name, description: sellerForm.description.replace(/<[^>]*>/g, '').slice(0, 160), image: sellerForm.imageUrl }}
                />
                <div className="space-y-2">
                  <div className="bg-white text-black rounded-md overflow-hidden">
                    <RichTextEditor value={sellerForm.description} onChange={(content) => setSellerForm((s) => ({ ...s, description: content }))} height={300} />
                  </div>
                </div>
                <Button onClick={addSeller} className="w-full">
                  Save Seller
                </Button>
              </CardContent>
            </Card>

            {itemsByType.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Saved Sellers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {itemsByType.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.content.email} {item.content.website && `• ${item.content.website}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportItem(item);
                          }}
                        >
                          📥
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(item.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Item Detail View */}
        {selectedItem && (
          <Card className="mt-4 bg-blue-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{selectedItem.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItem(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-white p-3 rounded border border-blue-200">
                <pre className="text-xs overflow-auto max-h-48">
                  {JSON.stringify(selectedItem.content, null, 2)}
                </pre>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(JSON.stringify(selectedItem.content))}
                  className="flex-1"
                  variant="outline"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy JSON
                </Button>
                <Button
                  onClick={() => exportItem(selectedItem)}
                  className="flex-1"
                  variant="outline"
                >
                  📥 Export
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <DialogFooter className="mt-4">
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
