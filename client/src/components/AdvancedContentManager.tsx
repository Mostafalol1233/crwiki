import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Trash2, Plus, Check, X, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContentItem {
  id: string;
  name: string;
  type: "mercenary" | "post" | "event" | "news";
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
  });

  // Event form
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    image: "",
  });

  // Post form
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    tags: "",
    image: "",
  });

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

    const item: ContentItem = {
      id: `news-${Date.now()}`,
      name: newsForm.title,
      type: "news",
      content: { ...newsForm },
      createdAt: new Date().toISOString(),
      savedLocally: true,
    };

    saveToLocalStorage([...items, item]);
    setNewsForm({ title: "", content: "", image: "" });
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
    setEventForm({ title: "", description: "", startDate: "", endDate: "", image: "" });
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
    setPostForm({ title: "", content: "", excerpt: "", tags: "", image: "" });
    toast({ title: "Post saved locally!" });
  };

  const deleteItem = (id: string) => {
    saveToLocalStorage(items.filter((item) => item.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
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
                <Textarea
                  placeholder="News content"
                  value={newsForm.content}
                  onChange={(e) =>
                    setNewsForm((s) => ({ ...s, content: e.target.value }))
                  }
                  rows={8}
                  className="font-mono text-sm"
                />
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
                <Textarea
                  placeholder="Event description"
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm((s) => ({ ...s, description: e.target.value }))
                  }
                  rows={6}
                  className="font-mono text-sm"
                />
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
                <Textarea
                  placeholder="Post content"
                  value={postForm.content}
                  onChange={(e) =>
                    setPostForm((s) => ({ ...s, content: e.target.value }))
                  }
                  rows={8}
                  className="font-mono text-sm"
                />
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
