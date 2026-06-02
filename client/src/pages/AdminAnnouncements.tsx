import { useEffect, useMemo, useState } from "react";
import imageCompression from 'browser-image-compression';
import { supabaseShim } from "@/lib/supabaseShim";
import { RichTextEditor } from "@/components/RichTextEditor";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useLanguage } from "@/components/LanguageProvider";
import RawHtmlPreview from "@/components/RawHtmlPreview";
 

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

type Announcement = {
  contentHtml?: string;
  contentHtmlEn?: string;
  contentHtmlAr?: string;
  imageUrl?: string;
  linkUrl?: string;
  active?: boolean;
  dismissible?: boolean;
  direction?: 'auto' | 'ltr' | 'rtl';
};

export default function AdminAnnouncements() {

  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  const [gPreviewLang, setGPreviewLang] = useState<"auto" | "en" | "ar">("auto");
  const [sPreviewLang, setSPreviewLang] = useState<"auto" | "en" | "ar">("auto");

 

  // Global announcement state
  const [gContentHtmlEn, setGContentHtmlEn] = useState("");
  const [gContentHtmlAr, setGContentHtmlAr] = useState("");
  const [gImageUrl, setGImageUrl] = useState("");
  const [gLinkUrl, setGLinkUrl] = useState("");
  const [gActive, setGActive] = useState(true);
  const [gDismissible, setGDismissible] = useState(true);
  const [gDirection, setGDirection] = useState<'auto'|'ltr'|'rtl'>("auto");
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [globalList, setGlobalList] = useState<any[]>([]);

  // Seller announcement state
  const [sellerName, setSellerName] = useState("");
  const sellerSlug = useMemo(() => slugify(sellerName), [sellerName]);
  const [sContentHtmlEn, setSContentHtmlEn] = useState("");
  const [sContentHtmlAr, setSContentHtmlAr] = useState("");
  const [sImageUrl, setSImageUrl] = useState("");
  const [sLinkUrl, setSLinkUrl] = useState("");
  const [sActive, setSActive] = useState(true);
  const [loadingSeller, setLoadingSeller] = useState(false);
  const [sellerAnnouncements, setSellerAnnouncements] = useState<any[]>([]);
  const [sellerReviews, setSellerReviews] = useState<any[]>([]);
  const [activeSellerForReviews, setActiveSellerForReviews] = useState<{ id: string; name: string } | null>(null);
  const [sDirection, setSDirection] = useState<'auto'|'ltr'|'rtl'>("auto");

  const [announcementsEnabled, setAnnouncementsEnabled] = useState(true);
  const [annSettingsLoading, setAnnSettingsLoading] = useState(false);

  const [gEnMode, setGEnMode] = useState<"rich" | "html">("rich");
  const [gArMode, setGArMode] = useState<"rich" | "html">("rich");
  const [sEnMode, setSEnMode] = useState<"rich" | "html">("rich");
  const [sArMode, setSArMode] = useState<"rich" | "html">("rich");


  const pickPrimaryContent = (en: string, ar: string) => {
    const normalize = (html: string) =>
      String(html || "")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim();
    const enNorm = normalize(en);
    const arNorm = normalize(ar);
    if (enNorm.length > 0) return en;
    if (arNorm.length > 0) return ar;
    return "";
  };


  // Load global on mount
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const pre = u.searchParams.get("seller");
      if (pre) setSellerName(pre);
    } catch {}
    (async () => {
      try {
        setLoadingGlobal(true);
        try {
          const sj = await supabaseShim('/api/public/settings/announcements', 'GET');
          setAnnouncementsEnabled(Boolean(sj?.enabled ?? true));
        } catch {}
        try {
          const json: Announcement & { dismissible?: boolean } = await supabaseShim('/api/announcements/global', 'GET');
          if (json) {
            setGContentHtmlEn(json.contentHtmlEn || json.contentHtml || "");
            setGContentHtmlAr(json.contentHtmlAr || "");
            setGImageUrl(json.imageUrl || "");
            setGLinkUrl(json.linkUrl || "");
            setGActive(Boolean(json.active ?? true));
            setGDismissible(Boolean(json.dismissible ?? true));
            setGDirection((json.direction as any) === 'rtl' ? 'rtl' : (json.direction as any) === 'ltr' ? 'ltr' : 'auto');
          }
        } catch {}
      } finally { setLoadingGlobal(false); }
      try {
        const list = await supabaseShim('/api/admin/announcements/global', 'GET');
        setGlobalList(Array.isArray(list) ? list : []);
      } catch {}
    })();
  }, []);

  const handleUnauthorized = (status: number) => {
    if (status === 401) {
      toast({ title: 'Session expired', description: 'Please login again', variant: 'destructive' });
      localStorage.removeItem('adminToken');
      setLocation('/admin/login');
      return true;
    }
    if (status === 403) {
      toast({ title: 'Access denied', description: 'Insufficient permissions', variant: 'destructive' });
      return true;
    }
    return false;
  };

  const saveGlobal = async () => {
    try {
      setLoadingGlobal(true);
      const primary = pickPrimaryContent(gContentHtmlEn, gContentHtmlAr);
      await supabaseShim('/api/announcements/global', 'POST', {
        contentHtml: primary,
        contentHtmlEn: gContentHtmlEn,
        contentHtmlAr: gContentHtmlAr,
        imageUrl: gImageUrl,
        linkUrl: gLinkUrl,
        active: gActive,
        dismissible: gDismissible,
        direction: gDirection,
      });
      toast({ title: "Created", description: "New global announcement added" });
      try {
        const list = await supabaseShim('/api/admin/announcements/global', 'GET');
        setGlobalList(Array.isArray(list) ? list : []);
      } catch {}
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoadingGlobal(false);
    }
  };

  const deleteGlobal = async (id: string) => {
    try {
      await supabaseShim(`/api/announcements/global/${encodeURIComponent(id)}`, 'DELETE');
      setGlobalList((prev) => prev.filter((g) => g.id !== id));
      toast({ title: 'Deleted', description: 'Global announcement removed' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || '', variant: 'destructive' });
    }
  };

  const loadSeller = async (slugOverride?: string) => {
    const targetSlug = (slugOverride || sellerSlug || "").trim();
    if (!targetSlug) return;
    try {
      setLoadingSeller(true);
      try {
        const json: Announcement = await supabaseShim(`/api/announcements/seller/${encodeURIComponent(targetSlug)}`, 'GET');
        if (json) {
          setSContentHtmlEn(json.contentHtmlEn || json.contentHtml || "");
          setSContentHtmlAr(json.contentHtmlAr || "");
          setSImageUrl(json.imageUrl || "");
          setSLinkUrl(json.linkUrl || "");
          setSActive(Boolean(json.active ?? true));
          setSDirection((json.direction as any) === 'rtl' ? 'rtl' : (json.direction as any) === 'ltr' ? 'ltr' : 'auto');
        } else {
          setSContentHtmlEn(""); setSContentHtmlAr(""); setSImageUrl(""); setSLinkUrl(""); setSActive(true); setSDirection('auto');
        }
      } catch {
        setSContentHtmlEn(""); setSContentHtmlAr(""); setSImageUrl(""); setSLinkUrl(""); setSActive(true); setSDirection('auto');
      }
      // Load seller announcement list
      try {
        const list = await supabaseShim('/api/admin/announcements/seller', 'GET');
        if (Array.isArray(list)) setSellerAnnouncements(list);
      } catch {}
      // Load reviews for this seller slug
      try {
        const reviews = await supabaseShim(`/api/reviews/seller/by-slug/${encodeURIComponent(targetSlug)}`, 'GET');
        setSellerReviews(Array.isArray(reviews) ? reviews : []);
      } catch {}
    } catch {}
    finally { setLoadingSeller(false); }
  };

  const saveSeller = async () => {
    if (!sellerSlug) {
      toast({ title: "Missing seller", description: "Enter seller name first", variant: "destructive" });
      return;
    }
    try {
      setLoadingSeller(true);
      const primary = pickPrimaryContent(sContentHtmlEn, sContentHtmlAr);
      await supabaseShim(`/api/announcements/seller/${encodeURIComponent(sellerSlug)}`, 'POST', {
        contentHtml: primary,
        contentHtmlEn: sContentHtmlEn,
        contentHtmlAr: sContentHtmlAr,
        imageUrl: sImageUrl,
        linkUrl: sLinkUrl,
        active: sActive,
        direction: sDirection,
      });
      toast({ title: "Saved", description: "Seller announcement updated" });
      try {
        const list = await supabaseShim('/api/admin/announcements/seller', 'GET');
        if (Array.isArray(list)) setSellerAnnouncements(list);
      } catch {}
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoadingSeller(false);
    }
  };

  const deleteSellerAnnouncement = async () => {
    if (!sellerSlug) return;
    try {
      await supabaseShim(`/api/announcements/seller/${encodeURIComponent(sellerSlug)}`, 'DELETE');
      setSellerAnnouncements((prev) => prev.filter((s) => s.sellerSlug !== sellerSlug));
      setSContentHtmlEn(""); setSContentHtmlAr(""); setSImageUrl(""); setSLinkUrl(""); setSActive(true); setSDirection('auto');
      toast({ title: 'Deleted', description: 'Seller announcement removed' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || '', variant: 'destructive' });
    }
  };

  const deleteSellerReview = async (reviewId: string) => {
    try {
      if (!activeSellerForReviews) return;
      await supabaseShim(`/api/sellers/${activeSellerForReviews.id}/reviews/${encodeURIComponent(reviewId)}`, 'DELETE');
      setSellerReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast({ title: 'Review deleted' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || '', variant: 'destructive' });
    }
  };

  const saveAnnouncementsEnabled = async () => {
    try {
      setAnnSettingsLoading(true);
      await supabaseShim('/api/settings/site', 'PUT', { announcementsEnabled });
      toast({ title: 'Saved', description: 'Announcements setting updated' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || '', variant: 'destructive' });
    } finally {
      setAnnSettingsLoading(false);
    }
  };

  const resolvePreviewLang = (mode: "auto" | "en" | "ar", hasEn: boolean, hasAr: boolean) => {
    if (mode === "en" && hasEn) return "en";
    if (mode === "ar" && hasAr) return "ar";
    if (language === "ar" && hasAr) return "ar";
    if (hasEn) return "en";
    if (hasAr) return "ar";
    return language === "ar" ? "ar" : "en";
  };

  const gHasEn = Boolean(gContentHtmlEn.trim());
  const gHasAr = Boolean(gContentHtmlAr.trim());
  const gResolvedLang = resolvePreviewLang(gPreviewLang, gHasEn, gHasAr);
  const gPreviewHtml = gResolvedLang === "ar" ? (gContentHtmlAr || gContentHtmlEn) : (gContentHtmlEn || gContentHtmlAr);
  const gPreviewDir = gDirection === "auto" ? (gResolvedLang === "ar" ? "rtl" : "ltr") : gDirection;

  const sHasEn = Boolean(sContentHtmlEn.trim());
  const sHasAr = Boolean(sContentHtmlAr.trim());
  const sResolvedLang = resolvePreviewLang(sPreviewLang, sHasEn, sHasAr);
  const sPreviewHtml = sResolvedLang === "ar" ? (sContentHtmlAr || sContentHtmlEn) : (sContentHtmlEn || sContentHtmlAr);
  const sPreviewDir = sDirection === "auto" ? (sResolvedLang === "ar" ? "rtl" : "ltr") : sDirection;

  const copyGlobalEnToAr = () => {
    setGContentHtmlAr(gContentHtmlEn);
    toast({ title: "Copied", description: "English content copied to Arabic editor." });
  };
  const copyGlobalArToEn = () => {
    setGContentHtmlEn(gContentHtmlAr);
    toast({ title: "Copied", description: "Arabic content copied to English editor." });
  };
  const copySellerEnToAr = () => {
    setSContentHtmlAr(sContentHtmlEn);
    toast({ title: "Copied", description: "English content copied to Arabic editor." });
  };
  const copySellerArToEn = () => {
    setSContentHtmlEn(sContentHtmlAr);
    toast({ title: "Copied", description: "Arabic content copied to English editor." });
  };

  return (
    <div className="min-h-screen py-10" style={{ background: "var(--background)" }}>
      <div className="max-w-5xl mx-auto px-4 md:px-8 grid gap-6">
        <div className="p-5" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
          <h3 className="font-black text-xs uppercase tracking-wider mb-4" style={{ color: "var(--foreground)" }}>Announcements Settings</h3>
          <div className="grid gap-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={announcementsEnabled} onCheckedChange={(v)=>setAnnouncementsEnabled(Boolean(v))} id="ann-enabled" />
              <label htmlFor="ann-enabled" className="text-sm" style={{ color: "#888" }}>Enable announcements sitewide</label>
            </div>
            <div>
              <Button onClick={saveAnnouncementsEnabled} disabled={annSettingsLoading}>Save</Button>
            </div>
          </div>
        </div>
        <div className="p-5" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
          <h3 className="font-black text-xs uppercase tracking-wider mb-4" style={{ color: "var(--foreground)" }}>Global Announcement</h3>
          <div className="grid gap-4">
            <label className="text-sm font-medium">Image URL</label>
            <Input value={gImageUrl} onChange={(e)=>setGImageUrl(e.target.value)} placeholder="https://..." />

            <label className="text-sm font-medium">Link URL</label>
            <Input value={gLinkUrl} onChange={(e)=>setGLinkUrl(e.target.value)} placeholder="https://..." />

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Button type="button" size="sm" variant="outline" onClick={copyGlobalEnToAr}>Copy EN → AR</Button>
              <Button type="button" size="sm" variant="outline" onClick={copyGlobalArToEn}>Copy AR → EN</Button>
              <span className="text-muted-foreground">Tip: Use Auto preview to follow global site language.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Content (English)</label>
                  <div className="flex gap-1 text-xs">
                    <Button type="button" size="sm" variant={gEnMode === "rich" ? "default" : "outline"} onClick={() => setGEnMode("rich")}>Rich</Button>
                    <Button type="button" size="sm" variant={gEnMode === "html" ? "default" : "outline"} onClick={() => setGEnMode("html")}>HTML</Button>
                  </div>
                </div>
                {gEnMode === "rich" ? (
                  <div className="rounded-md border overflow-hidden max-h-[420px]">
                    <RichTextEditor value={gContentHtmlEn} onChange={setGContentHtmlEn} direction="ltr" height={260} resizingBar={false} />
                  </div>
                ) : (
                  <Textarea
                    rows={8}
                    value={gContentHtmlEn}
                    onChange={(e) => setGContentHtmlEn(e.target.value)}
                    className="font-mono text-xs"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Content (Arabic)</label>
                  <div className="flex gap-1 text-xs">
                    <Button type="button" size="sm" variant={gArMode === "rich" ? "default" : "outline"} onClick={() => setGArMode("rich")}>Rich</Button>
                    <Button type="button" size="sm" variant={gArMode === "html" ? "default" : "outline"} onClick={() => setGArMode("html")}>HTML</Button>
                  </div>
                </div>
                {gArMode === "rich" ? (
                  <div className="rounded-md border overflow-hidden max-h-[420px]">
                    <RichTextEditor value={gContentHtmlAr} onChange={setGContentHtmlAr} direction="rtl" height={260} resizingBar={false} />
                  </div>
                ) : (
                  <Textarea
                    rows={8}
                    value={gContentHtmlAr}
                    onChange={(e) => setGContentHtmlAr(e.target.value)}
                    className="font-mono text-xs"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Direction</label>
                <div className="flex gap-2">
                  <Button variant={gDirection==='auto'?'default':'outline'} size="sm" onClick={()=>setGDirection('auto')}>Auto</Button>
                  <Button variant={gDirection==='ltr'?'default':'outline'} size="sm" onClick={()=>setGDirection('ltr')}>Left-to-Right</Button>
                  <Button variant={gDirection==='rtl'?'default':'outline'} size="sm" onClick={()=>setGDirection('rtl')}>Right-to-Left</Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={gActive} onCheckedChange={(v)=>setGActive(Boolean(v))} id="g-active" />
                <label htmlFor="g-active">Active</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={gDismissible} onCheckedChange={(v)=>setGDismissible(Boolean(v))} id="g-dismiss" />
                <label htmlFor="g-dismiss">Dismissible</label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={saveGlobal} disabled={loadingGlobal}>Save</Button>
            </div>

            <div className="rounded-lg border bg-card/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-sm font-semibold">Live Preview</div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant={gResolvedLang === "en" ? "default" : "outline"} onClick={() => setGPreviewLang("en")}>EN</Button>
                  <Button size="sm" variant={gResolvedLang === "ar" ? "default" : "outline"} onClick={() => setGPreviewLang("ar")}>AR</Button>
                  <Button size="sm" variant={gPreviewLang === "auto" ? "secondary" : "outline"} onClick={() => setGPreviewLang("auto")}>Auto</Button>
                </div>
              </div>
              <div dir={gPreviewDir} className={gPreviewDir === "rtl" ? "text-right" : "text-left"}>
                {gImageUrl && (
                  <img src={gImageUrl} alt="Global announcement preview" className="w-full max-h-56 object-cover rounded-md mb-3" />
                )}
                {gPreviewHtml ? (
                  <RawHtmlPreview html={gPreviewHtml} className="min-h-[120px] max-h-[380px] overflow-auto" />
                ) : (
                  <div className="text-sm text-muted-foreground">Add English or Arabic content to preview.</div>
                )}
              </div>
            </div>

            {globalList.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-medium mb-2">All Global Announcements</div>
                <div className="space-y-2">
                  {globalList.map((g) => (
                    <div key={g.id} className="flex items-center justify-between border rounded-md p-2">
                      <div className="text-xs truncate max-w-[70%]">{g.contentHtml || '(empty)'}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => deleteGlobal(g.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-5" style={{ background: "var(--card)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}>
          <h3 className="font-black text-xs uppercase tracking-wider mb-4" style={{ color: "var(--foreground)" }}>Seller Announcement</h3>
          <div className="grid gap-4">
            <label className="text-sm font-medium">Seller Name</label>
            <Input value={sellerName} onChange={(e)=>setSellerName(e.target.value)} placeholder="Gamal Rafat" />
            <div className="text-xs text-muted-foreground">Slug: {sellerSlug || "(enter name)"}</div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { void loadSeller(); }} disabled={!sellerSlug || loadingSeller}>Load</Button>
            </div>

            <label className="text-sm font-medium">Image URL</label>
            <Input value={sImageUrl} onChange={(e)=>setSImageUrl(e.target.value)} placeholder="https://..." />

            <label className="text-sm font-medium">Link URL</label>
            <Input value={sLinkUrl} onChange={(e)=>setSLinkUrl(e.target.value)} placeholder="https://..." />

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Button type="button" size="sm" variant="outline" onClick={copySellerEnToAr}>Copy EN → AR</Button>
              <Button type="button" size="sm" variant="outline" onClick={copySellerArToEn}>Copy AR → EN</Button>
              <span className="text-muted-foreground">Tip: Fill both editors for best bilingual announcement experience.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Content (English)</label>
                  <div className="flex gap-1 text-xs">
                    <Button type="button" size="sm" variant={sEnMode === "rich" ? "default" : "outline"} onClick={() => setSEnMode("rich")}>Rich</Button>
                    <Button type="button" size="sm" variant={sEnMode === "html" ? "default" : "outline"} onClick={() => setSEnMode("html")}>HTML</Button>
                  </div>
                </div>
                {sEnMode === "rich" ? (
                  <div className="rounded-md border overflow-hidden max-h-[420px]">
                    <RichTextEditor value={sContentHtmlEn} onChange={setSContentHtmlEn} direction="ltr" height={260} resizingBar={false} />
                  </div>
                ) : (
                  <Textarea
                    rows={8}
                    value={sContentHtmlEn}
                    onChange={(e) => setSContentHtmlEn(e.target.value)}
                    className="font-mono text-xs"
                  />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Content (Arabic)</label>
                  <div className="flex gap-1 text-xs">
                    <Button type="button" size="sm" variant={sArMode === "rich" ? "default" : "outline"} onClick={() => setSArMode("rich")}>Rich</Button>
                    <Button type="button" size="sm" variant={sArMode === "html" ? "default" : "outline"} onClick={() => setSArMode("html")}>HTML</Button>
                  </div>
                </div>
                {sArMode === "rich" ? (
                  <div className="rounded-md border overflow-hidden max-h-[420px]">
                    <RichTextEditor value={sContentHtmlAr} onChange={setSContentHtmlAr} direction="rtl" height={260} resizingBar={false} />
                  </div>
                ) : (
                  <Textarea
                    rows={8}
                    value={sContentHtmlAr}
                    onChange={(e) => setSContentHtmlAr(e.target.value)}
                    className="font-mono text-xs"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Direction</label>
                <div className="flex gap-2">
                  <Button variant={sDirection==='auto'?'default':'outline'} size="sm" onClick={()=>setSDirection('auto')}>Auto</Button>
                  <Button variant={sDirection==='ltr'?'default':'outline'} size="sm" onClick={()=>setSDirection('ltr')}>Left-to-Right</Button>
                  <Button variant={sDirection==='rtl'?'default':'outline'} size="sm" onClick={()=>setSDirection('rtl')}>Right-to-Left</Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox checked={sActive} onCheckedChange={(v)=>setSActive(Boolean(v))} id="s-active" />
              <label htmlFor="s-active">Active</label>
            </div>

            <div className="flex gap-3">
              <Button onClick={saveSeller} disabled={!sellerSlug || loadingSeller}>Save</Button>
              <Button variant="outline" onClick={deleteSellerAnnouncement} disabled={!sellerSlug || loadingSeller}>Delete</Button>
            </div>

            <div className="rounded-lg border bg-card/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-sm font-semibold">Seller Preview</div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant={sResolvedLang === "en" ? "default" : "outline"} onClick={() => setSPreviewLang("en")}>EN</Button>
                  <Button size="sm" variant={sResolvedLang === "ar" ? "default" : "outline"} onClick={() => setSPreviewLang("ar")}>AR</Button>
                  <Button size="sm" variant={sPreviewLang === "auto" ? "secondary" : "outline"} onClick={() => setSPreviewLang("auto")}>Auto</Button>
                </div>
              </div>
              <div dir={sPreviewDir} className={sPreviewDir === "rtl" ? "text-right" : "text-left"}>
                {sImageUrl && (
                  <img src={sImageUrl} alt="Seller announcement preview" className="w-full max-h-56 object-cover rounded-md mb-3" />
                )}
                {sPreviewHtml ? (
                  <RawHtmlPreview html={sPreviewHtml} className="min-h-[120px] max-h-[380px] overflow-auto" />
                ) : (
                  <div className="text-sm text-muted-foreground">Add English or Arabic content to preview.</div>
                )}
              </div>
            </div>

            {sellerAnnouncements.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-medium mb-2">Seller Announcements</div>
                <div className="space-y-2">
                  {sellerAnnouncements.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border rounded-md p-2">
                      <div className="text-xs truncate max-w-[50%]">{s.sellerSlug}</div>
                      <div className="text-xs truncate max-w-[30%]">{s.contentHtml || '(empty)'}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setSellerName(s.sellerSlug); void loadSeller(s.sellerSlug); }}>Load</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSellerForReviews && (
              <div className="mt-6">
                <div className="text-sm font-medium mb-2">Comments for {activeSellerForReviews.name}</div>
                <div className="space-y-2">
                  {sellerReviews.map((r) => (
                    <div key={r.id} className="flex items-center justify-between border rounded-md p-2">
                      <div className="text-xs truncate max-w-[70%]">{r.comment || ''}</div>
                      <Button variant="outline" size="sm" onClick={() => deleteSellerReview(r.id)}>Delete</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
