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

  // Seller announcement state
  const [sellerName, setSellerName] = useState("");
  const sellerSlug = useMemo(() => slugify(sellerName), [sellerName]);
  const [sContentHtml, setSContentHtml] = useState("");
  const [sImageUrl, setSImageUrl] = useState("");
  const [sLinkUrl, setSLinkUrl] = useState("");
  const [sActive, setSActive] = useState(true);
  const [loadingSeller, setLoadingSeller] = useState(false);

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
    })();
  }, []);

  const saveGlobal = async () => {
    try {
      setLoadingGlobal(true);
      const res = await fetch(`/api/announcements/global`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("auth_token") || ""}` },
        body: JSON.stringify({ contentHtml: gContentHtml, imageUrl: gImageUrl, linkUrl: gLinkUrl, active: gActive, dismissible: gDismissible }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Saved", description: "Global announcement updated" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoadingGlobal(false);
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
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("auth_token") || ""}` },
        body: JSON.stringify({ contentHtml: sContentHtml, imageUrl: sImageUrl, linkUrl: sLinkUrl, active: sActive }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Saved", description: "Seller announcement updated" });
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setLoadingSeller(false);
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
