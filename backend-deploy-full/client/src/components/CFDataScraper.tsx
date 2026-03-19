import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Eye, Image as ImageIcon, Shield, Gamepad2, Swords } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ScrapedRank {
  id: string;
  name: string;
  image: string;
  description?: string;
}

interface ScrapedMode {
  id: string;
  name: string;
  image: string;
  description?: string;
}

interface ScrapedWeapon {
  id: string;
  name: string;
  image: string;
  category?: string;
  description?: string;
  stats?: Record<string, any>;
}

export default function CFDataScraper() {
  const { toast } = useToast();
  const [isScrapingRanks, setIsScrapingRanks] = useState(false);
  const [isScrapingModes, setIsScrapingModes] = useState(false);
  const [isScrapingWeapons, setIsScrapingWeapons] = useState(false);
  const [ranks, setRanks] = useState<ScrapedRank[]>([]);
  const [modes, setModes] = useState<ScrapedMode[]>([]);
  const [weapons, setWeapons] = useState<ScrapedWeapon[]>([]);
  const [selectedWeaponIds, setSelectedWeaponIds] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editablePreview, setEditablePreview] = useState<any>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleScrapeRanks = async () => {
    setIsScrapingRanks(true);
    try {
      const data = await apiRequest("/api/scrape/ranks", "GET");
      setRanks(data || []);
      toast({
        title: "Ranks Scraped Successfully",
        description: `Found ${data?.length || 0} ranks`,
      });
    } catch (error: any) {
      toast({
        title: "Error Scraping Ranks",
        description: error.message || "Failed to scrape ranks",
        variant: "destructive",
      });
    } finally {
      setIsScrapingRanks(false);
    }
  };

  const handleScrapeModes = async () => {
    setIsScrapingModes(true);
    try {
      const data = await apiRequest("/api/scrape/modes", "GET");
      setModes(data || []);
      toast({
        title: "Modes Scraped Successfully",
        description: `Found ${data?.length || 0} modes`,
      });
    } catch (error: any) {
      toast({
        title: "Error Scraping Modes",
        description: error.message || "Failed to scrape modes",
        variant: "destructive",
      });
    } finally {
      setIsScrapingModes(false);
    }
  };

  const handleScrapeWeapons = async () => {
    setIsScrapingWeapons(true);
    try {
      const data = await apiRequest("/api/scrape/weapons", "GET");
      setWeapons(data || []);
      toast({
        title: "Weapons Scraped Successfully",
        description: `Found ${data?.length || 0} weapons`,
      });
    } catch (error: any) {
      toast({
        title: "Error Scraping Weapons",
        description: error.message || "Failed to scrape weapons",
        variant: "destructive",
      });
    } finally {
      setIsScrapingWeapons(false);
    }
  };

  const toggleSelectWeapon = (id: string) => {
    setSelectedWeaponIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllWeapons = () => {
    setSelectedWeaponIds(new Set(weapons.map((w) => w.id)));
  };

  const clearSelection = () => {
    setSelectedWeaponIds(new Set());
  };

  const handlePushSelectedWeapons = async () => {
    if (selectedWeaponIds.size === 0) {
      toast({ title: 'No weapons selected', description: 'Please select weapons to push', variant: 'destructive' });
      return;
    }

    const selected = weapons.filter((w) => selectedWeaponIds.has(w.id));

    // Prepare payload and normalize image URLs (make absolute if starts with '/')
    const payload = selected.map((w) => {
      let img = w.image || '';
      try {
        if (img && img.startsWith('/')) {
          img = `${window.location.origin}${img}`;
        }
      } catch (e) {
        // window may be undefined in SSR, leave as-is
      }

      return {
        name: w.name || 'Unknown',
        image: img,
        category: w.category || undefined,
        description: w.description || undefined,
        stats: w.stats || undefined,
      };
    });

    // Filter items without an image, since server expects a URL
    const withoutImage = payload.filter((p) => !p.image || p.image.length === 0);
    if (withoutImage.length > 0) {
      toast({ title: 'Some items missing images', description: `Skipping ${withoutImage.length} items without images. Place images in /attached_assets and reload if you want to push them.`, variant: 'destructive' });
    }

    const toSend = payload.filter((p) => !!p.image && p.image.length > 0);

    if (toSend.length === 0) {
      toast({ title: 'Nothing to push', description: 'No valid weapons with images to push', variant: 'destructive' });
      return;
    }

    try {
      const res = await apiRequest('/api/weapons/bulk-create', 'POST', { weapons: toSend });
      toast({ title: 'Pushed weapons', description: `Created ${res?.count || 0} weapons` });
      clearSelection();
    } catch (err: any) {
      toast({ title: 'Error pushing weapons', description: err?.message || 'Failed to push weapons', variant: 'destructive' });
    }
  };

  const handlePreview = (item: any) => {
    // create a shallow editable copy so admin can review/edit before pushing
    setPreviewItem(item);
    setEditablePreview({ ...item });
    setIsPreviewOpen(true);
  };

  const handleEditableChange = (field: string, value: any) => {
    setEditablePreview((prev: any) => ({ ...(prev || {}), [field]: value }));
  };

  const uploadImageFile = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file);

      const resp = await fetch('/api/upload-image', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Upload failed');
      }

      const imageUrl = (await resp.text()).trim();
      handleEditableChange('image', imageUrl);
      toast({ title: 'Image uploaded', description: 'Image uploaded successfully' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message || 'Failed to upload image', variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const saveEditedPreview = () => {
    if (!editablePreview) return;

    // update the list state depending on type
    if (weapons && Array.isArray(weapons)) {
      setWeapons((prev) => prev.map((w) => (w.id === editablePreview.id ? { ...w, ...editablePreview } : w)));
    }

    if (modes && Array.isArray(modes)) {
      setModes((prev) => prev.map((m) => (m.id === editablePreview.id ? { ...m, ...editablePreview } : m)));
    }

    if (ranks && Array.isArray(ranks)) {
      setRanks((prev) => prev.map((r) => (r.id === editablePreview.id ? { ...r, ...editablePreview } : r)));
    }

    // add edited item to selection if weapon
    if (editablePreview?.id) {
      setSelectedWeaponIds((prev) => new Set(prev).add(editablePreview.id));
    }

    setPreviewItem(editablePreview);
    toast({ title: 'Saved changes', description: 'Edits saved locally. You can now push selected items.' });
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-cf-data-scraper">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl">CrossFire Data Scraper</CardTitle>
              <p className="text-sm text-muted-foreground">
                Scrape ranks, modes, and weapons from the official CrossFire website
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleScrapeRanks}
              disabled={isScrapingRanks}
              className="gap-2"
              variant="outline"
            >
              {isScrapingRanks ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Scrape Ranks
                </>
              )}
            </Button>
            <Button
              onClick={handleScrapeModes}
              disabled={isScrapingModes}
              className="gap-2"
              variant="outline"
            >
              {isScrapingModes ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Gamepad2 className="h-4 w-4" />
                  Scrape Modes
                </>
              )}
            </Button>
            <Button
              onClick={handleScrapeWeapons}
              disabled={isScrapingWeapons}
              className="gap-2"
              variant="outline"
            >
              {isScrapingWeapons ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Swords className="h-4 w-4" />
                  Scrape Weapons
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {ranks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scraped Ranks ({ranks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranks.map((rank) => (
                    <TableRow key={rank.id}>
                      <TableCell>
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                          {rank.image ? (
                            <img
                              src={rank.image}
                              alt={rank.name}
                              className="w-full h-full object-contain"
                              width="64"
                              height="64"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{rank.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{rank.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreview(rank)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {modes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scraped Modes ({modes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modes.map((mode) => (
                    <TableRow key={mode.id}>
                      <TableCell>
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                          {mode.image ? (
                            <img
                              src={mode.image}
                              alt={mode.name}
                              className="w-full h-full object-contain"
                              width="64"
                              height="64"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{mode.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{mode.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreview(mode)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {weapons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scraped Weapons ({weapons.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weapons.map((weapon) => (
                    <TableRow key={weapon.id}>
                      <TableCell className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedWeaponIds.has(weapon.id)}
                          onChange={() => toggleSelectWeapon(weapon.id)}
                          aria-label={`Select ${weapon.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                          {weapon.image ? (
                            <img
                              src={weapon.image}
                              alt={weapon.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{weapon.name}</TableCell>
                      <TableCell>
                        {weapon.category && (
                          <Badge variant="outline">{weapon.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{weapon.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreview(weapon)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 p-4">
            <Button variant="outline" onClick={selectAllWeapons} className="gap-2">Select all</Button>
            <Button variant="ghost" onClick={clearSelection} className="gap-2">Clear</Button>
            <Button onClick={handlePushSelectedWeapons} className="gap-2">
              <Download className="h-4 w-4" />
              Push selected to site
            </Button>
          </div>
        </Card>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Item</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Image</Label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-48 h-28 rounded-md overflow-hidden bg-muted/30 flex items-center justify-center">
                    {editablePreview?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editablePreview.image} alt={editablePreview.name} className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input value={editablePreview?.image || ''} onChange={(e) => handleEditableChange('image', e.target.value)} placeholder="Image URL or /assets/filename.jpg" />
                    <div className="flex items-center gap-2">
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImageFile(file);
                        }}
                      />
                      {isUploadingImage && <span className="text-sm text-muted-foreground">Uploading...</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Name</Label>
                <Input value={editablePreview?.name || ''} onChange={(e) => handleEditableChange('name', e.target.value)} />
              </div>

              <div>
                <Label className="text-sm font-medium">Category</Label>
                <Input value={editablePreview?.category || ''} onChange={(e) => handleEditableChange('category', e.target.value)} />
              </div>

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <textarea
                  className="w-full p-2 border rounded-md text-sm"
                  rows={4}
                  value={editablePreview?.description || ''}
                  onChange={(e) => handleEditableChange('description', e.target.value)}
                />
              </div>

              {previewItem.stats && Object.keys(previewItem.stats).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Stats (read-only)</Label>
                  <div className="mt-2 space-y-1">
                    {Object.entries(previewItem.stats).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setEditablePreview({ ...previewItem }); toast({ title: 'Reverted', description: 'Reverted to original scraped values' }); }}>Revert</Button>
                <Button onClick={() => { saveEditedPreview(); setIsPreviewOpen(false); }}>Save changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

