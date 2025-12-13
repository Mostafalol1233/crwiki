import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

type Announcement = {
  contentHtml?: string;
  imageUrl?: string;
  linkUrl?: string;
  active?: boolean;
  dismissible?: boolean;
  direction?: 'auto' | 'ltr' | 'rtl';
};

export default function AdminAnnouncements() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Global announcement state
  const [gContentHtml, setGContentHtml] = useState("");
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
  const [sContentHtml, setSContentHtml] = useState("");
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

  // Load global on mount
  useEffect(() => {
    try { console.log("[AdminAnnouncements] mount"); } catch {}
    try {
      const u = new URL(window.location.href);
      const pre = u.searchParams.get("seller");
      if (pre) setSellerName(pre);
    } catch {}
    (async () => {
      try {
        setLoadingGlobal(true);
        try {
          const sres = await fetch(`/api/public/settings/announcements`);
          if (sres.ok) {
            const sj = await sres.json();
            setAnnouncementsEnabled(Boolean(sj?.enabled ?? true));
          }
        } catch {}
        const res = await fetch(`/api/announcements/global`);
        if (res.ok) {
          const json: Announcement & { dismissible?: boolean } = await res.json();
          setGContentHtml(json.contentHtml || "");
          setGImageUrl(json.imageUrl || "");
          setGLinkUrl(json.linkUrl || "");
          setGActive(Boolean(json.active ?? true));
          setGDismissible(Boolean(json.dismissible ?? true));
          setGDirection((json.direction as any) === 'rtl' ? 'rtl' : (json.direction as any) === 'ltr' ? 'ltr' : 'auto');
        }
      } catch {}
      finally { setLoadingGlobal(false); }
      try {
        const res2 = await fetch(`/api/admin/announcements/global`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` } });
        if (res2.ok) {
          const list = await res2.json();
          setGlobalList(Array.isArray(list) ? list : []);
        }
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
      const res = await fetch(`/api/announcements/global`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("adminToken") || ""}`, "x-csrf-token": localStorage.getItem('csrfToken') || "" },
        body: JSON.stringify({ contentHtml: gContentHtml, imageUrl: gImageUrl, linkUrl: gLinkUrl, active: gActive, dismissible: gDismissible, direction: gDirection }),
      });
      if (!res.ok) {
        let msg = await res.text();
        if (handleUnauthorized(res.status)) return;
        try { const j = JSON.parse(msg); if (j?.error) msg = String(j.error); } catch {}
        throw new Error(msg);
      }
      toast({ title: "Created", description: "New global announcement added" });
      try {
        const res2 = await fetch(`/api/admin/announcements/global`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` } });
        if (res2.ok) setGlobalList(await res2.json());
        else if (handleUnauthorized(res2.status)) return;
      } catch {}
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoadingGlobal(false);
    }
  };

  const deleteGlobal = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements/global/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`, 'x-csrf-token': localStorage.getItem('csrfToken') || '' }
      });
      if (!res.ok) {
        let msg = await res.text();
        if (handleUnauthorized(res.status)) return;
        try { const j = JSON.parse(msg); if (j?.error) msg = String(j.error); } catch {}
        throw new Error(msg);
      }
      setGlobalList((prev) => prev.filter((g) => g.id !== id));
      toast({ title: 'Deleted', description: 'Global announcement removed' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || '', variant: 'destructive' });
    }
  };

  const loadSeller = async () => {
    if (!sellerSlug) return;
    try {
      setLoadingSeller(true);
      const res = await fetch(`/api/announcements/seller/${encodeURIComponent(sellerSlug)}`);
      if (res.ok) {
        const json: Announcement = await res.json();
        setSContentHtml(json.contentHtml || "");
        setSImageUrl(json.imageUrl || "");
        setSLinkUrl(json.linkUrl || "");
        setSActive(Boolean(json.active ?? true));
        setSDirection((json.direction as any) === 'rtl' ? 'rtl' : (json.direction as any) === 'ltr' ? 'ltr' : 'auto');
      } else {
        // clear if none
        setSContentHtml(""); setSImageUrl(""); setSLinkUrl(""); setSActive(true); setSDirection('auto');
      }
      // Load seller announcement list
      try {
        const res2 = await fetch(`/api/admin/announcements/seller`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` } });
        if (res2.ok) setSellerAnnouncements(await res2.json());
      } catch {}
      // Load reviews for this seller slug
      try {
        const res3 = await fetch(`/api/reviews/seller/by-slug/${encodeURIComponent(sellerSlug)}`);
        if (res3.ok) {
          const data = await res3.json();
          setActiveSellerForReviews({ id: data?.seller?.id, name: data?.seller?.name });
          setSellerReviews(Array.isArray(data?.reviews) ? data.reviews : []);
        }
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
      const res = await fetch(`/api/announcements/seller/${encodeURIComponent(sellerSlug)}` ,{
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("adminToken") || ""}`, "x-csrf-token": localStorage.getItem('csrfToken') || "" },
        body: JSON.stringify({ contentHtml: sContentHtml, imageUrl: sImageUrl, linkUrl: sLinkUrl, active: sActive, direction: sDirection }),
      });
      if (!res.ok) {
        let msg = await res.text();
        if (handleUnauthorized(res.status)) return;
        try { const j = JSON.parse(msg); if (j?.error) msg = String(j.error); } catch {}
        throw new Error(msg);
      }
      toast({ title: "Saved", description: "Seller announcement updated" });
      try {
        const res2 = await fetch(`/api/admin/announcements/seller`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` } });
        if (res2.ok) setSellerAnnouncements(await res2.json());
        else if (handleUnauthorized(res2.status)) return;
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
      const res = await fetch(`/api/announcements/seller/${encodeURIComponent(sellerSlug)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`, 'x-csrf-token': localStorage.getItem('csrfToken') || '' }
      });
      if (!res.ok) {
        let msg = await res.text();
        if (handleUnauthorized(res.status)) return;
        try { const j = JSON.parse(msg); if (j?.error) msg = String(j.error); } catch {}
        throw new Error(msg);
      }
      setSellerAnnouncements((prev) => prev.filter((s) => s.sellerSlug !== sellerSlug));
      setSContentHtml(""); setSImageUrl(""); setSLinkUrl(""); setSActive(true); setSDirection('auto');
      toast({ title: 'Deleted', description: 'Seller announcement removed' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || '', variant: 'destructive' });
    }
  };

  const deleteSellerReview = async (reviewId: string) => {
    try {
      if (!activeSellerForReviews) return;
      const res = await fetch(`/api/sellers/${activeSellerForReviews.id}/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` }
      });
      if (!res.ok) {
        let msg = await res.text();
        if (handleUnauthorized(res.status)) return;
        try { const j = JSON.parse(msg); if (j?.error) msg = String(j.error); } catch {}
        throw new Error(msg);
      }
      setSellerReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast({ title: 'Review deleted' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || '', variant: 'destructive' });
    }
  };

  const saveAnnouncementsEnabled = async () => {
    try {
      setAnnSettingsLoading(true);
      const res = await fetch(`/api/settings/site`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`, 'x-csrf-token': localStorage.getItem('csrfToken') || '' },
        body: JSON.stringify({ announcementsEnabled }),
      });
      if (!res.ok) {
        let msg = await res.text();
        if (res.status === 401) {
          toast({ title: 'Session expired', description: 'Please login again', variant: 'destructive' });
          localStorage.removeItem('adminToken');
          setLocation('/admin/login');
          return;
        }
        if (res.status === 403) {
          toast({ title: 'Access denied', description: 'Insufficient permissions', variant: 'destructive' });
          return;
        }
        try {
          const parsed = JSON.parse(msg);
          if (parsed && parsed.error) msg = String(parsed.error);
        } catch {}
        throw new Error(msg);
      }
      toast({ title: 'Saved', description: 'Announcements setting updated' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || '', variant: 'destructive' });
    } finally {
      setAnnSettingsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-5xl mx-auto px-4 md:px-8 grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Announcements Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={announcementsEnabled} onCheckedChange={(v)=>setAnnouncementsEnabled(Boolean(v))} id="ann-enabled" />
              <label htmlFor="ann-enabled">Enable announcements sitewide</label>
            </div>
            <div>
              <Button onClick={saveAnnouncementsEnabled} disabled={annSettingsLoading}>Save</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Global Announcement</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label className="text-sm font-medium">Image URL</label>
            <Input value={gImageUrl} onChange={(e)=>setGImageUrl(e.target.value)} placeholder="https://..." />

            <label className="text-sm font-medium">Link URL</label>
            <Input value={gLinkUrl} onChange={(e)=>setGLinkUrl(e.target.value)} placeholder="https://..." />

            <label className="text-sm font-medium">Content (HTML allowed)</label>
            <Textarea value={gContentHtml} onChange={(e)=>setGContentHtml(e.target.value)} rows={8} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preview Direction</label>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seller Announcement</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <label className="text-sm font-medium">Seller Name</label>
            <Input value={sellerName} onChange={(e)=>setSellerName(e.target.value)} placeholder="Gamal Rafat" />
            <div className="text-xs text-muted-foreground">Slug: {sellerSlug || "(enter name)"}</div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={loadSeller} disabled={!sellerSlug || loadingSeller}>Load</Button>
            </div>

            <label className="text-sm font-medium">Image URL</label>
            <Input value={sImageUrl} onChange={(e)=>setSImageUrl(e.target.value)} placeholder="https://..." />

            <label className="text-sm font-medium">Link URL</label>
            <Input value={sLinkUrl} onChange={(e)=>setSLinkUrl(e.target.value)} placeholder="https://..." />

            <label className="text-sm font-medium">Content (HTML allowed)</label>
            <Textarea value={sContentHtml} onChange={(e)=>setSContentHtml(e.target.value)} rows={8} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preview Direction</label>
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

            {sellerAnnouncements.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-medium mb-2">Seller Announcements</div>
                <div className="space-y-2">
                  {sellerAnnouncements.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border rounded-md p-2">
                      <div className="text-xs truncate max-w-[50%]">{s.sellerSlug}</div>
                      <div className="text-xs truncate max-w-[30%]">{s.contentHtml || '(empty)'}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSellerName(s.sellerSlug)}>Load</Button>
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
          </CardContent>
        </Card>
      </div>
    </div>
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: any }>{
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: undefined };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    try { console.error("[AdminAnnouncements ErrorBoundary]", error, info); } catch {}
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="max-w-lg w-full p-6 border rounded-md">
            <h2 className="text-xl font-semibold mb-2">Announcements UI crashed</h2>
            <p className="text-sm mb-4">A runtime error occurred. Try reloading or navigating back.</p>
            <div className="flex gap-2">
              <Button onClick={() => { try { window.location.reload(); } catch {} }}>Reload</Button>
              <Button variant="outline" onClick={() => { try { history.back(); } catch {} }}>Go Back</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}
