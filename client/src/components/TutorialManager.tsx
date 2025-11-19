import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Tutorial } from "@shared/mongodb-schema";

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

export default function TutorialManager() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const { data: tutorials = [], isLoading, isError } = useQuery<Tutorial[]>({
    queryKey: ["/api/tutorials"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; youtubeUrl: string; youtubeId: string }) => {
      return await apiRequest("/api/tutorials", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutorials"] });
      toast({
        title: "Tutorial Created",
        description: "The tutorial has been added successfully",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tutorial",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest(`/api/tutorials/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutorials"] });
      toast({
        title: "Tutorial Updated",
        description: "The tutorial has been updated successfully",
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tutorial",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/tutorials/${id}`, "DELETE", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tutorials"] });
      toast({
        title: "Tutorial Deleted",
        description: "The tutorial has been removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete tutorial",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (tutorial?: Tutorial) => {
    if (tutorial) {
      setEditingTutorial(tutorial);
      setTitle(tutorial.title);
      setDescription(tutorial.description || "");
      setYoutubeUrl(tutorial.youtubeUrl);
    } else {
      setEditingTutorial(null);
      setTitle("");
      setDescription("");
      setYoutubeUrl("");
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTutorial(null);
    setTitle("");
    setDescription("");
    setYoutubeUrl("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !youtubeUrl.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and YouTube URL are required",
        variant: "destructive",
      });
      return;
    }

    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      toast({
        title: "Invalid URL",
        description: "Please provide a valid YouTube video URL",
        variant: "destructive",
      });
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim(),
      youtubeUrl: youtubeUrl.trim(),
      youtubeId,
    };

    if (editingTutorial) {
      updateMutation.mutate({ id: editingTutorial.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this tutorial?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <Card data-testid="card-tutorial-manager">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Tutorial Manager</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage video tutorials for CrossFire players
              </p>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              data-testid="button-add-tutorial"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Tutorial
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="text-center py-12 text-red-500">
              Failed to load tutorials
            </div>
          ) : tutorials.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Thumbnail</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-20">Likes</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tutorials.map((tutorial) => (
                    <TableRow key={tutorial.id} data-testid={`row-tutorial-${tutorial.id}`}>
                      <TableCell>
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted">
                          <img
                            src={`https://img.youtube.com/vi/${tutorial.youtubeId}/default.jpg`}
                            alt={tutorial.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium" data-testid="text-tutorial-title">
                            {tutorial.title}
                          </div>
                          {tutorial.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {tutorial.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell data-testid="text-tutorial-likes">
                        {tutorial.likes || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(`/tutorials/${tutorial.id}`, "_blank")}
                            data-testid="button-view"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(tutorial)}
                            data-testid="button-edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(tutorial.id)}
                            data-testid="button-delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No tutorials yet. Click "Add Tutorial" to create your first tutorial.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTutorial ? "Edit Tutorial" : "Add New Tutorial"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter tutorial title"
                data-testid="input-title"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">YouTube URL *</label>
              <Input
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                data-testid="input-youtube-url"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter a valid YouTube video URL (watch, embed, or short link)
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter tutorial description (optional)"
                rows={4}
                data-testid="textarea-description"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingTutorial ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{editingTutorial ? "Update Tutorial" : "Create Tutorial"}</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

