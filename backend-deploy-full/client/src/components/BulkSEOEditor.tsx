import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Save, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SEOItem {
  id: string;
  _id?: string;
  type: 'news' | 'post' | 'event' | 'seller';
  displayTitle: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[] | string;
  canonicalUrl?: string;
  ogImage?: string;
}

export function BulkSEOEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: items = [], isLoading } = useQuery<SEOItem[]>({
    queryKey: ["/api/admin/seo/bulk"],
    queryFn: async () => {
      return await apiRequest("/api/admin/seo/bulk", "GET");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, type, updates }: { id: string, type: string, updates: any }) => {
      return await apiRequest(`/api/admin/seo/bulk`, "POST", { id, type, updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seo/bulk"] });
      toast({ title: "SEO updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = item.displayTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleUpdate = (item: SEOItem, field: string, value: any) => {
    const updates = { [field]: value };
    updateMutation.mutate({ id: item.id || item._id!, type: item.type, updates });
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" /> Bulk SEO Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input 
              placeholder="Search by title..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <div className="flex gap-2">
              {["all", "post", "news", "event", "seller"].map(type => (
                <Button 
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredItems.map(item => (
              <Card key={`${item.type}-${item.id || item._id}`} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{item.type}</Badge>
                      <h3 className="font-bold text-lg">{item.displayTitle}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" asChild>
                        <a href={`/${item.type === 'post' ? 'article' : item.type}/${item.id}`} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" /> View
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">SEO Title</label>
                        <div className="flex gap-2">
                          <Input 
                            defaultValue={item.seoTitle}
                            onBlur={(e) => {
                              if (e.target.value !== item.seoTitle) {
                                handleUpdate(item, "seoTitle", e.target.value);
                              }
                            }}
                            className="h-8 text-sm"
                          />
                          <div className={`text-[10px] self-center ${(item.seoTitle?.length || 0) > 60 ? "text-red-500" : "text-muted-foreground"}`}>
                            {item.seoTitle?.length || 0}/60
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Canonical URL</label>
                        <Input 
                          defaultValue={item.canonicalUrl}
                          onBlur={(e) => {
                            if (e.target.value !== item.canonicalUrl) {
                              handleUpdate(item, "canonicalUrl", e.target.value);
                            }
                          }}
                          className="h-8 text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Meta Description</label>
                        <div className="flex flex-col gap-1">
                          <Textarea 
                            defaultValue={item.seoDescription}
                            onBlur={(e) => {
                              if (e.target.value !== item.seoDescription) {
                                handleUpdate(item, "seoDescription", e.target.value);
                              }
                            }}
                            className="text-xs h-20 resize-none"
                          />
                          <div className={`text-[10px] self-end ${(item.seoDescription?.length || 0) > 160 ? "text-red-500" : "text-muted-foreground"}`}>
                            {item.seoDescription?.length || 0}/160
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
