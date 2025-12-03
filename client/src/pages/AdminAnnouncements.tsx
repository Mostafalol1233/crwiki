import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

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
};

export default function AdminAnnouncements() {
  const { toast } = useToast();

  // Global announcement state
  const [gContentHtml, setGContentHtml] = useState("");
  const [gImageUrl, setGImageUrl] = useState("");
  const [gLinkUrl, setGLinkUrl] = useState("");
  const [gActive, setGActive] = useState(true);
  const [gDismissible, setGDismissible] = useState(true);
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
        const res = await fetch(`/api/announcements/global`);
        if (res.ok) {
          const json: Announcement & { dismissible?: boolean } = await res.json();
          setGContentHtml(json.contentHtml || "");
          setGImageUrl(json.imageUrl || "");
          setGLinkUrl(json.linkUrl || "");
          setGActive(Boolean(json.active ?? true));
          setGDismissible(Boolean(json.dismissible ?? true));
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

  const saveGlobal = async () => {
    try {
      setLoadingGlobal(true);
      const res = await fetch(`/api/announcements/global`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("adminToken") || ""}`, "x-csrf-token": localStorage.getItem('csrfToken') || "" },
        body: JSON.stringify({ contentHtml: gContentHtml, imageUrl: gImageUrl, linkUrl: gLinkUrl, active: gActive, dismissible: gDismissible }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Created", description: "New global announcement added" });
      try {
        const res2 = await fetch(`/api/admin/announcements/global`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` } });
        if (res2.ok) setGlobalList(await res2.json());
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
      if (!res.ok) throw new Error(await res.text());
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
      } else {
        // clear if none
        setSContentHtml(""); setSImageUrl(""); setSLinkUrl(""); setSActive(true);
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
        body: JSON.stringify({ contentHtml: sContentHtml, imageUrl: sImageUrl, linkUrl: sLinkUrl, active: sActive }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Saved", description: "Seller announcement updated" });
      try {
        const res2 = await fetch(`/api/admin/announcements/seller`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` } });
        if (res2.ok) setSellerAnnouncements(await res2.json());
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
      if (!res.ok) throw new Error(await res.text());
      setSellerAnnouncements((prev) => prev.filter((s) => s.sellerSlug !== sellerSlug));
      setSContentHtml(""); setSImageUrl(""); setSLinkUrl(""); setSActive(true);
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
      if (!res.ok) throw new Error(await res.text());
      setSellerReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast({ title: 'Review deleted' });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || '', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="max-w-5xl mx-auto px-4 md:px-8 grid gap-8">
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
  );
}
