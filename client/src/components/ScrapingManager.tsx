import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Eye, CheckCircle, Calendar, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import DOMPurify from 'isomorphic-dompurify';
import type { ScrapedEvent } from "@shared/types";

const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'strike', 's', 'del',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span',
      'hr'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title',
      'style', 'class',
      'width', 'height',
      'target', 'rel'
    ],
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true
  });
};

export default function ScrapingManager() {
  const { toast } = useToast();
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedEvents, setScrapedEvents] = useState<ScrapedEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [previewEvent, setPreviewEvent] = useState<ScrapedEvent | null>(null);
  const [editedEvent, setEditedEvent] = useState<ScrapedEvent | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [createAsNews, setCreateAsNews] = useState(true);

  const handleFetchEvents = async () => {
    setIsScraping(true);
    
    try {
      const response = await apiRequest("/api/admin/scrape-and-create-events", "POST", {});
      
      toast({
        title: "Events Created Successfully",
        description: `✅ Created ${response.events?.length || 0} events from forum announcements`,
      });
      
      setScrapedEvents([]);
    } catch (error: any) {
      toast({
        title: "Error Creating Events",
        description: error.message || "Failed to scrape and create events",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  // Simple admin scraping (no API key needed, just JWT)
  const handleAdminQuickScrape = async () => {
    setIsScraping(true);
    
    try {
      const response = await apiRequest("/api/admin/scrape-and-create-events", "POST", {});
      
      toast({
        title: "Events Created Successfully",
        description: `✅ Created ${response.events?.length || 0} events from forum announcements`,
      });
      
      // Refresh events display if needed
      setScrapedEvents([]);
    } catch (error: any) {
      toast({
        title: "Error Creating Events",
        description: error.message || "Failed to scrape and create events",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const toggleEventSelection = (url: string) => {
    const newSelected = new Set(selectedEvents);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedEvents(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEvents.size === scrapedEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(scrapedEvents.map(e => e.url)));
    }
  };

  const handlePreview = (event: ScrapedEvent) => {
    setPreviewEvent(event);
    setEditedEvent({ ...event });
    setIsPreviewOpen(true);
  };

  const handleSaveEdit = () => {
    if (editedEvent) {
      setScrapedEvents(prev =>
        prev.map(e => e.url === editedEvent.url ? editedEvent : e)
      );
      setPreviewEvent(editedEvent);
      toast({
        title: "Changes Saved",
        description: "Event details updated in preview",
      });
    }
  };

  const cleanEventHtml = (html: string): string => {
    if (typeof window === 'undefined') return html;
    const container = document.createElement('div');
    container.innerHTML = html;

    const shouldRemove = (text: string) => {
      const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
      if (!normalized) return false;
      const patterns = [/^place\b/, /^location\b/, /^venue\b/, /^where\b/];
      return patterns.some((pattern) => pattern.test(normalized));
    };

    container.querySelectorAll('p, li, span, strong').forEach((node) => {
      if (shouldRemove(node.textContent || '')) {
        node.remove();
      }
    });

    container.querySelectorAll('p').forEach((node) => {
      const text = (node.textContent || '').trim();
      const hasChildElements = node.children.length > 0;
      if (!text && !hasChildElements) {
        node.remove();
      }
    });

    return container.innerHTML;
  };

  const handleCleanContent = () => {
    if (!editedEvent) return;
    const cleaned = cleanEventHtml(editedEvent.content || '');
    setEditedEvent({ ...editedEvent, content: cleaned });
    toast({
      title: 'Content cleaned',
      description: 'Removed common location/place placeholders from the event body.',
    });
  };

  const handlePublishSelected = async () => {
    if (selectedEvents.size === 0) {
      toast({
        title: "No Events Selected",
        description: "Please select at least one event to publish",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    
    try {
      const eventsToPublish = scrapedEvents.filter(e => selectedEvents.has(e.url));
      
      const response = await apiRequest("/api/events/bulk-create", "POST", {
        events: eventsToPublish,
        createAsNews: createAsNews,
      });

      toast({
        title: "Events Published Successfully",
        description: `Published ${response.count} event(s)${createAsNews ? ` and ${response.newsCount || 0} news item(s)` : ''} to database`,
      });
      
      setScrapedEvents(prev => prev.filter(e => !selectedEvents.has(e.url)));
      setSelectedEvents(new Set());
    } catch (error: any) {
      toast({
        title: "Error Publishing Events",
        description: error.message || "Failed to publish events to database",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const navigatePreview = (direction: 'prev' | 'next') => {
    if (!previewEvent) return;
    
    const currentIndex = scrapedEvents.findIndex(e => e.url === previewEvent.url);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex < 0) newIndex = scrapedEvents.length - 1;
    if (newIndex >= scrapedEvents.length) newIndex = 0;
    
    const newEvent = scrapedEvents[newIndex];
    setPreviewEvent(newEvent);
    setEditedEvent({ ...newEvent });
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-scraping-header">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl">CrossFire Events Scraper</CardTitle>
              <p className="text-sm text-muted-foreground">
                Fetch events and news from Z8Games forum announcements
              </p>
            </div>
            <Button
              onClick={handleFetchEvents}
              disabled={isScraping}
              data-testid="button-fetch-events"
              className="gap-2"
            >
              {isScraping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching Events...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Fetch Events from Forum
                </>
              )}
            </Button>
            <Button
              onClick={handleAdminQuickScrape}
              disabled={isScraping}
              variant="secondary"
              className="gap-2"
            >
              {isScraping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Events...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Quick Scrape & Create
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {scrapedEvents.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>Scraped Events ({scrapedEvents.length})</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select events to preview and publish
                  </p>
                </div>
                {selectedEvents.size > 0 && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="create-as-news"
                        checked={createAsNews}
                        onCheckedChange={(checked) => setCreateAsNews(checked === true)}
                      />
                      <Label htmlFor="create-as-news" className="text-sm font-normal cursor-pointer">
                        Also create as News
                      </Label>
                    </div>
                    <Badge variant="secondary" data-testid="badge-selected-count">
                      {selectedEvents.size} selected
                    </Badge>
                    <Button
                      onClick={handlePublishSelected}
                      disabled={isPublishing}
                      data-testid="button-publish-selected"
                      className="gap-2"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Publish Selected
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedEvents.size === scrapedEvents.length}
                          onCheckedChange={toggleSelectAll}
                          data-testid="checkbox-select-all"
                        />
                      </TableHead>
                      <TableHead className="w-20">Image</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-32">Date</TableHead>
                      <TableHead className="w-28">Category</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scrapedEvents.map((event) => (
                      <TableRow
                        key={event.url}
                        className="hover-elevate cursor-pointer"
                        onClick={() => toggleEventSelection(event.url)}
                        data-testid={`row-event-${event.url}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedEvents.has(event.url)}
                            onCheckedChange={() => toggleEventSelection(event.url)}
                            data-testid={`checkbox-event-${event.url}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                            {event.image ? (
                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover"
                                data-testid="img-event-thumbnail"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium" data-testid="text-event-title">
                          {event.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {event.date}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid="badge-category">
                            {event.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(event);
                            }}
                            data-testid="button-preview"
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview & Edit Event</DialogTitle>
          </DialogHeader>

          {editedEvent && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Event Image</label>
                  <div className="w-full aspect-video rounded-md overflow-hidden bg-muted">
                    {editedEvent.image ? (
                      <img
                        src={editedEvent.image}
                        alt={editedEvent.title}
                        className="w-full h-full object-cover"
                        data-testid="img-preview"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <Input
                    value={editedEvent.image}
                    onChange={(e) => setEditedEvent({ ...editedEvent, image: e.target.value })}
                    placeholder="Image URL"
                    className="mt-2"
                    data-testid="input-image-url"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    value={editedEvent.title}
                    onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
                    data-testid="input-title"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <Input
                    value={editedEvent.date}
                    onChange={(e) => setEditedEvent({ ...editedEvent, date: e.target.value })}
                    data-testid="input-date"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Input
                    value={editedEvent.category}
                    onChange={(e) => setEditedEvent({ ...editedEvent, category: e.target.value })}
                    data-testid="input-category"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Content HTML</label>
                  <Textarea
                    value={editedEvent?.content || ''}
                    onChange={(e) => setEditedEvent({ ...editedEvent, content: e.target.value })}
                    rows={8}
                    className="font-mono text-xs"
                    data-testid="textarea-content"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    HTML formatting will be preserved (bold, colors, images, etc.)
                  </p>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleCleanContent}
                      disabled={!editedEvent?.content}
                    >
                      Remove place/location lines
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Preview</label>
                  <div 
                    className="p-4 rounded-md border bg-muted/50 prose prose-sm dark:prose-invert max-w-none overflow-auto max-h-64"
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(editedEvent?.content || '') }}
                    data-testid="div-content-preview"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigatePreview('prev')}
                data-testid="button-prev"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => navigatePreview('next')}
                data-testid="button-next"
              >
                Next
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPreviewOpen(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                onClick={handleSaveEdit}
                data-testid="button-save-changes"
              >
                Save Changes
              </Button>
              <Button
                onClick={() => {
                  if (editedEvent) {
                    setSelectedEvents(new Set([editedEvent.url]));
                    setIsPreviewOpen(false);
                    setTimeout(() => handlePublishSelected(), 100);
                  }
                }}
                data-testid="button-publish-this"
              >
                Publish This Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

