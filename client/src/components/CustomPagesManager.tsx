import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, RotateCw, Trash2, Pencil } from "lucide-react";

declare global {
  interface Window { CodeMirror: any; }
}

type CustomPage = { _id?: string; id?: string; slug: string; title: string; sourceUrl: string; htmlContent: string; seoTitle: string; seoDescription: string; seoKeywords: string[]; ogImage: string; active: boolean; };
type FormState = { sourceUrl: string; slug: string; title: string; htmlContent: string; seoTitle: string; seoDescription: string; seoKeywordsInput: string; ogImage: string; active: boolean; };

const emptyForm: FormState = { sourceUrl: "", slug: "", title: "", htmlContent: "", seoTitle: "", seoDescription: "", seoKeywordsInput: "", ogImage: "", active: true };
const slugifyEventName = (value: string) => String(value || "").toLowerCase().normalize("NFKD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9 ]+/g, "").trim().replace(/\s+/g, "-").substring(0, 60);

export default function CustomPagesManager() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("source");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [previewHtml, setPreviewHtml] = useState("");
  const htmlTextRef = useRef<HTMLTextAreaElement | null>(null);
  const cmRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || window.CodeMirror) return;
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/lib/codemirror.css";
    document.head.appendChild(style);

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/codemirror@5.65.0/lib/codemirror.js";
    script.async = true;
    script.onload = () => {
      ["xml", "css", "javascript", "htmlmixed"].forEach((mode) => {
        const m = document.createElement("script");
        m.src = `https://cdn.jsdelivr.net/npm/codemirror@5.65.0/mode/${mode}/${mode}.js`;
        m.async = true;
        document.head.appendChild(m);
      });
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!open || tab !== "html" || !htmlTextRef.current || !window.CodeMirror || cmRef.current) return;
    const editor = window.CodeMirror.fromTextArea(htmlTextRef.current, { mode: "htmlmixed", lineNumbers: true, lineWrapping: true, theme: "default" });
    editor.setSize("100%", 520);
    editor.on("change", (instance: any) => {
      const htmlContent = instance.getValue();
      setForm((p) => ({ ...p, htmlContent }));
      setPreviewHtml(htmlContent);
    });
    cmRef.current = editor;
    editor.setValue(form.htmlContent || "");
  }, [open, tab]);

  useEffect(() => {
    if (cmRef.current) {
      const current = cmRef.current.getValue();
      if (current !== form.htmlContent) cmRef.current.setValue(form.htmlContent || "");
    }
  }, [form.htmlContent]);

  const { data: pages = [], isLoading } = useQuery({ queryKey: ["/api/admin/custom-pages"], queryFn: () => apiRequest("/api/admin/custom-pages", "GET") });
  const scrapeMutation = useMutation({
    mutationFn: (sourceUrl: string) => apiRequest("/api/mirror-url", "POST", { url: sourceUrl }),
    onSuccess: (data: any) => {
      const html = String(data?.rawHtml || data?.content || "");
      const title = String(data?.title || "");
      setPreviewHtml(html);
      setForm((prev) => ({ ...prev, title: title || prev.title, slug: prev.slug || slugifyEventName(title || prev.title), htmlContent: html }));
      toast({ title: "Scrape complete" });
      setTab("html");
    }, onError: (err: any) => toast({ title: "Scrape failed", description: err.message, variant: "destructive" })
  });
  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { sourceUrl: form.sourceUrl, slug: slugifyEventName(form.slug), title: form.title, htmlContent: form.htmlContent, seoTitle: form.seoTitle, seoDescription: form.seoDescription, seoKeywords: form.seoKeywordsInput.split(",").map((k) => k.trim()).filter(Boolean), ogImage: form.ogImage, active: form.active };
      return editingId ? apiRequest(`/api/admin/custom-pages/${editingId}`, "PATCH", payload) : apiRequest("/api/admin/custom-pages", "POST", payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-pages"] }); toast({ title: editingId ? "Page updated" : "Page created" }); setOpen(false); setEditingId(null); setForm(emptyForm); setPreviewHtml(""); if (cmRef.current) { cmRef.current.toTextArea(); cmRef.current = null; } },
    onError: (err: any) => toast({ title: "Save failed", description: err.message, variant: "destructive" })
  });
  const remirrorMutation = useMutation({ mutationFn: (id: string) => apiRequest(`/api/admin/custom-pages/${id}`, "PATCH", { remirror: true }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-pages"] }); toast({ title: "Page re-mirrored" }); }, onError: (err: any) => toast({ title: "Re-mirror failed", description: err.message, variant: "destructive" }) });
  const deleteMutation = useMutation({ mutationFn: (id: string) => apiRequest(`/api/admin/custom-pages/${id}`, "DELETE"), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-pages"] }); toast({ title: "Page deleted" }); }, onError: (err: any) => toast({ title: "Delete failed", description: err.message, variant: "destructive" }) });

  const seoPreviewTitle = form.seoTitle || form.title || "Page title";
  const seoPreviewDescription = form.seoDescription || "SEO description preview";
  const seoKeywords = useMemo(() => form.seoKeywordsInput.split(",").map((k) => k.trim()).filter(Boolean), [form.seoKeywordsInput]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setPreviewHtml(""); setTab("source"); setOpen(true); };
  const openEdit = (page: CustomPage) => { setEditingId(String(page.id || page._id || "")); setForm({ sourceUrl: page.sourceUrl || "", slug: page.slug || "", title: page.title || "", htmlContent: page.htmlContent || "", seoTitle: page.seoTitle || "", seoDescription: page.seoDescription || "", seoKeywordsInput: (page.seoKeywords || []).join(", "), ogImage: page.ogImage || "", active: !!page.active }); setPreviewHtml(page.htmlContent || ""); setTab("source"); setOpen(true); };

  return <Card><CardHeader className="flex flex-row items-center justify-between"><CardTitle>Custom Pages</CardTitle><Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add New Page</Button></CardHeader><CardContent>{isLoading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading pages...</div> : <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Slug</TableHead><TableHead>Source URL</TableHead><TableHead>SEO</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{pages.map((page: CustomPage) => { const id = String(page.id || page._id || ""); return <TableRow key={id}><TableCell>{page.title || "Untitled"}</TableCell><TableCell><a className="text-blue-600 underline" href={`/pages/${page.slug}`} target="_blank" rel="noreferrer">/pages/{page.slug}</a></TableCell><TableCell className="max-w-[260px] truncate">{page.sourceUrl || "-"}</TableCell><TableCell>{page.seoTitle ? <Badge className="bg-green-600">Ready</Badge> : <Badge variant="secondary">Missing</Badge>}</TableCell><TableCell><Switch checked={!!page.active} onCheckedChange={(active) => apiRequest(`/api/admin/custom-pages/${id}`, "PATCH", { active }).then(() => queryClient.invalidateQueries({ queryKey: ["/api/admin/custom-pages"] }))} /></TableCell><TableCell className="space-x-2"><Button variant="outline" size="sm" onClick={() => openEdit(page)}><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="sm" onClick={() => { if (!window.confirm("Re-mirror this page now?")) return; remirrorMutation.mutate(id); }}><RotateCw className="h-4 w-4" /></Button><Button variant="destructive" size="sm" onClick={() => { if (!window.confirm("Delete this custom page?")) return; deleteMutation.mutate(id); }}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>; })}</TableBody></Table>}</CardContent>
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next && cmRef.current) { cmRef.current.toTextArea(); cmRef.current = null; } }}><DialogContent className="max-w-[95vw] lg:max-w-6xl max-h-[95vh] overflow-y-auto"><DialogHeader><DialogTitle>{editingId ? "Edit Custom Page" : "Create Custom Page"}</DialogTitle></DialogHeader><Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="source">Source</TabsTrigger><TabsTrigger value="html">HTML Editor</TabsTrigger><TabsTrigger value="seo">SEO</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger></TabsList>
      <TabsContent value="source" className="space-y-4 mt-4"><div className="grid md:grid-cols-2 gap-4"><div className="space-y-2"><Label>Source URL</Label><Input value={form.sourceUrl} onChange={(e) => setForm((p) => ({ ...p, sourceUrl: e.target.value }))} /></div><div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: slugifyEventName(e.target.value) }))} /></div></div><div className="flex gap-2"><Button disabled={!form.sourceUrl || scrapeMutation.isPending} onClick={() => scrapeMutation.mutate(form.sourceUrl)}>{scrapeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Scrape & Preview</Button><Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>Save Page</Button></div><Input placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value, slug: p.slug || slugifyEventName(e.target.value) }))} /><iframe title="source-preview" className="w-full h-[420px] border rounded" srcDoc={previewHtml || form.htmlContent || "<p>No preview yet</p>"} /></TabsContent>
      <TabsContent value="html" className="mt-4"><div className="grid lg:grid-cols-2 gap-4"><textarea ref={htmlTextRef} defaultValue={form.htmlContent} className="hidden" /><Textarea className="font-mono min-h-[520px] lg:hidden" value={form.htmlContent} onChange={(e) => { const htmlContent = e.target.value; setForm((p) => ({ ...p, htmlContent })); setPreviewHtml(htmlContent); }} /><iframe title="html-preview" className="w-full h-[520px] border rounded" srcDoc={previewHtml || form.htmlContent || ""} /></div></TabsContent>
      <TabsContent value="seo" className="space-y-4 mt-4"><div className="grid md:grid-cols-2 gap-4"><div className="space-y-2"><Label>SEO Title</Label><Input value={form.seoTitle} onChange={(e) => setForm((p) => ({ ...p, seoTitle: e.target.value }))} /></div><div className="space-y-2"><Label>OG Image URL</Label><Input value={form.ogImage} onChange={(e) => setForm((p) => ({ ...p, ogImage: e.target.value }))} /></div><div className="space-y-2 md:col-span-2"><Label>SEO Description</Label><Textarea value={form.seoDescription} onChange={(e) => setForm((p) => ({ ...p, seoDescription: e.target.value }))} /></div><div className="space-y-2 md:col-span-2"><Label>SEO Keywords (comma separated)</Label><Input value={form.seoKeywordsInput} onChange={(e) => setForm((p) => ({ ...p, seoKeywordsInput: e.target.value }))} /></div></div><div className="grid md:grid-cols-2 gap-4"><Card><CardHeader><CardTitle className="text-sm">Google Preview</CardTitle></CardHeader><CardContent><p className="text-blue-700 text-lg line-clamp-1">{seoPreviewTitle}</p><p className="text-green-700 text-sm">https://crossfire.wiki/pages/{form.slug || "custom-slug"}</p><p className="text-sm text-muted-foreground">{seoPreviewDescription}</p></CardContent></Card><Card><CardHeader><CardTitle className="text-sm">Social Share Preview</CardTitle></CardHeader><CardContent className="space-y-2">{form.ogImage ? <img src={form.ogImage} alt="OG" className="w-full h-32 object-cover rounded border" /> : <div className="h-32 border rounded bg-muted" />}<p className="font-medium">{seoPreviewTitle}</p><p className="text-sm text-muted-foreground">{seoPreviewDescription}</p><div className="flex flex-wrap gap-2">{seoKeywords.map((k) => <Badge key={k} variant="secondary">#{k}</Badge>)}</div></CardContent></Card></div></TabsContent>
      <TabsContent value="settings" className="space-y-4 mt-4"><div className="flex items-center gap-3"><Switch checked={form.active} onCheckedChange={(active) => setForm((p) => ({ ...p, active }))} /><span>{form.active ? "Active" : "Inactive"}</span></div>{editingId && <div className="flex gap-2"><Button variant="outline" onClick={() => { if (window.confirm("Re-mirror this page now?")) remirrorMutation.mutate(editingId); }}>Re-mirror</Button><Button variant="destructive" onClick={() => { if (window.confirm("Delete this custom page?")) { deleteMutation.mutate(editingId); setOpen(false); } }}>Delete Page</Button></div>}<Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>Save Page</Button></TabsContent>
    </Tabs></DialogContent></Dialog></Card>;
}
