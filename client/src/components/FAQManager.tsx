import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, HelpCircle, FolderPlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import RichTextEditor from "@/components/RichTextEditor";

const STATIC_FAQ_DATA = [
  {
    id: "announcements",
    name: "Announcements",
    nameAr: "الإعلانات",
    articles: [
      {
        id: "1",
        title: "CrossFire: IGN and Clan name change - new policy!",
        titleAr: "CrossFire: سياسة جديدة لتغيير اسم اللاعب والكلان!",
        body: "Attention Mercenaries, With the newest patch we will update our IGN and Clan name change policy...",
        bodyAr: "انتبه يا مرتزق! مع آخر تحديث، اتغيرت السياسة بتاعة تغيير الاسم في اللعبة والكلان...",
      },
    ],
  },
  {
    id: "game-mechanics",
    name: "Game Mechanics",
    nameAr: "ميكانيكا اللعبة",
    articles: [
      { id: "2", title: "Redeem Code FAQs", titleAr: "أسئلة عن كودات الاسترداد", body: "...", bodyAr: "..." },
      { id: "3", title: "How can I buy items in CrossFire?", titleAr: "إزاي أشتري أيتمات في CrossFire؟", body: "...", bodyAr: "..." },
    ],
  },
];

type FaqArticle = {
  id: string;
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
};

type FaqCategory = {
  id: string;
  name: string;
  nameAr: string;
  articles: FaqArticle[];
};

type FormMode = "none" | "add-category" | "edit-category" | "add-article" | "edit-article";

export default function FAQManager() {
  const { toast } = useToast();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode>("none");
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<FaqArticle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "article"; id: string; categoryId?: string } | null>(null);

  const [catForm, setCatForm] = useState({ name: "", nameAr: "" });
  const [artForm, setArtForm] = useState({ title: "", titleAr: "", body: "", bodyAr: "" });

  const { data: serverFaq, isLoading } = useQuery<FaqCategory[]>({
    queryKey: ["/api/faq-categories"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/faq-categories");
        if (!res.ok) return STATIC_FAQ_DATA as FaqCategory[];
        const data = await res.json();
        return Array.isArray(data) && data.length > 0 ? data : (STATIC_FAQ_DATA as FaqCategory[]);
      } catch {
        return STATIC_FAQ_DATA as FaqCategory[];
      }
    },
  });

  const faqData: FaqCategory[] = serverFaq || (STATIC_FAQ_DATA as FaqCategory[]);

  const saveMutation = useMutation({
    mutationFn: async (data: FaqCategory[]) => {
      const res = await fetch("/api/faq-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save FAQ data");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faq-categories"] });
      toast({ title: "FAQ saved successfully!" });
      setFormMode("none");
      setSelectedCategory(null);
      setSelectedArticle(null);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const generateId = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now();

  const handleAddCategory = () => {
    if (!catForm.name.trim()) return;
    const newCat: FaqCategory = {
      id: generateId(catForm.name),
      name: catForm.name.trim(),
      nameAr: catForm.nameAr.trim() || catForm.name.trim(),
      articles: [],
    };
    saveMutation.mutate([...faqData, newCat]);
  };

  const handleEditCategory = () => {
    if (!selectedCategory || !catForm.name.trim()) return;
    const updated = faqData.map((cat) =>
      cat.id === selectedCategory.id
        ? { ...cat, name: catForm.name.trim(), nameAr: catForm.nameAr.trim() || catForm.name.trim() }
        : cat
    );
    saveMutation.mutate(updated);
  };

  const handleDeleteCategory = (catId: string) => {
    saveMutation.mutate(faqData.filter((cat) => cat.id !== catId));
  };

  const handleAddArticle = () => {
    if (!selectedCategory || !artForm.title.trim() || !artForm.body.trim()) return;
    const newArt: FaqArticle = {
      id: Date.now().toString(),
      title: artForm.title.trim(),
      titleAr: artForm.titleAr.trim() || artForm.title.trim(),
      body: artForm.body.trim(),
      bodyAr: artForm.bodyAr.trim() || artForm.body.trim(),
    };
    const updated = faqData.map((cat) =>
      cat.id === selectedCategory.id ? { ...cat, articles: [...cat.articles, newArt] } : cat
    );
    saveMutation.mutate(updated);
  };

  const handleEditArticle = () => {
    if (!selectedCategory || !selectedArticle || !artForm.title.trim()) return;
    const updated = faqData.map((cat) =>
      cat.id === selectedCategory.id
        ? {
            ...cat,
            articles: cat.articles.map((a) =>
              a.id === selectedArticle.id
                ? {
                    ...a,
                    title: artForm.title.trim(),
                    titleAr: artForm.titleAr.trim() || artForm.title.trim(),
                    body: artForm.body.trim(),
                    bodyAr: artForm.bodyAr.trim() || artForm.body.trim(),
                  }
                : a
            ),
          }
        : cat
    );
    saveMutation.mutate(updated);
  };

  const handleDeleteArticle = (catId: string, artId: string) => {
    const updated = faqData.map((cat) =>
      cat.id === catId ? { ...cat, articles: cat.articles.filter((a) => a.id !== artId) } : cat
    );
    saveMutation.mutate(updated);
  };

  const openAddCategory = () => {
    setCatForm({ name: "", nameAr: "" });
    setFormMode("add-category");
  };

  const openEditCategory = (cat: FaqCategory) => {
    setSelectedCategory(cat);
    setCatForm({ name: cat.name, nameAr: cat.nameAr });
    setFormMode("edit-category");
  };

  const openAddArticle = (cat: FaqCategory) => {
    setSelectedCategory(cat);
    setArtForm({ title: "", titleAr: "", body: "", bodyAr: "" });
    setFormMode("add-article");
  };

  const openEditArticle = (cat: FaqCategory, art: FaqArticle) => {
    setSelectedCategory(cat);
    setSelectedArticle(art);
    setArtForm({ title: art.title, titleAr: art.titleAr, body: art.body, bodyAr: art.bodyAr });
    setFormMode("edit-article");
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "category") {
      handleDeleteCategory(deleteTarget.id);
    } else if (deleteTarget.type === "article" && deleteTarget.categoryId) {
      handleDeleteArticle(deleteTarget.categoryId, deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">FAQ Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage FAQ categories and questions. Changes are reflected immediately on the FAQ page.
          </p>
        </div>
        <Button onClick={openAddCategory} className="gap-2">
          <FolderPlus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {(formMode === "add-category" || formMode === "edit-category") && (
        <Card>
          <CardHeader>
            <CardTitle>{formMode === "add-category" ? "Add New Category" : "Edit Category"}</CardTitle>
            <CardDescription>Provide the category name in both English and Arabic.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Category Name (English)</label>
                <Input
                  value={catForm.name}
                  onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Game Mechanics"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Category Name (Arabic — Egyptian)</label>
                <Input
                  value={catForm.nameAr}
                  onChange={(e) => setCatForm((f) => ({ ...f, nameAr: e.target.value }))}
                  placeholder="مثلاً: ميكانيكا اللعبة"
                  dir="rtl"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={formMode === "add-category" ? handleAddCategory : handleEditCategory}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : formMode === "add-category" ? "Create Category" : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setFormMode("none")}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(formMode === "add-article" || formMode === "edit-article") && (
        <Card>
          <CardHeader>
            <CardTitle>
              {formMode === "add-article" ? "Add Question" : "Edit Question"}
              {selectedCategory && <span className="text-muted-foreground font-normal"> — {selectedCategory.name}</span>}
            </CardTitle>
            <CardDescription>
              Provide the question and answer in both English and Arabic. You can insert images and YouTube videos in the editor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Question (English)</label>
                <Input
                  value={artForm.title}
                  onChange={(e) => setArtForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. How do I report a hacker?"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Question (Arabic — Egyptian)</label>
                <Input
                  value={artForm.titleAr}
                  onChange={(e) => setArtForm((f) => ({ ...f, titleAr: e.target.value }))}
                  placeholder="مثلاً: إزاي أبلغ عن هاكر؟"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Answer (English)</label>
              <p className="text-xs text-muted-foreground">Use the toolbar to add formatting, images, or YouTube videos.</p>
              <RichTextEditor
                value={artForm.body}
                onChange={(val) => setArtForm((f) => ({ ...f, body: val }))}
                placeholder="Detailed answer in English..."
                direction="ltr"
                height={250}
                resizingBar={true}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Answer (Arabic — Egyptian)</label>
              <p className="text-xs text-muted-foreground" dir="rtl">استخدم شريط الأدوات لإضافة تنسيق أو صور أو فيديوهات يوتيوب.</p>
              <RichTextEditor
                value={artForm.bodyAr}
                onChange={(val) => setArtForm((f) => ({ ...f, bodyAr: val }))}
                placeholder="الإجابة التفصيلية بالعربي المصري..."
                direction="rtl"
                height={250}
                resizingBar={true}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={formMode === "add-article" ? handleAddArticle : handleEditArticle}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : formMode === "add-article" ? "Add Question" : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => { setFormMode("none"); setSelectedArticle(null); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading FAQ data...</div>
      ) : (
        <div className="space-y-4">
          {faqData.map((cat) => (
            <Card key={cat.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <button
                    className="flex items-center gap-2 text-left flex-1"
                    onClick={() => setExpandedCategory(expandedCategory === cat.id ? null : cat.id)}
                  >
                    {expandedCategory === cat.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <span className="font-semibold">{cat.name}</span>
                      <span className="text-muted-foreground text-sm mr-2 ml-2">·</span>
                      <span className="text-muted-foreground text-sm" dir="rtl">{cat.nameAr}</span>
                    </div>
                    <Badge variant="secondary" className="ml-2">{cat.articles.length} Q&A</Badge>
                  </button>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAddArticle(cat)}
                      title="Add question"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditCategory(cat)}
                      title="Edit category"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget({ type: "category", id: cat.id })}
                      title="Delete category"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedCategory === cat.id && (
                <CardContent className="pt-0">
                  {cat.articles.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No questions yet.{" "}
                      <button
                        className="text-primary hover:underline"
                        onClick={() => openAddArticle(cat)}
                      >
                        Add the first question
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cat.articles.map((art) => (
                        <div
                          key={art.id}
                          className="flex items-start justify-between p-3 bg-muted/30 rounded-lg border border-border"
                        >
                          <div className="flex-1 mr-2">
                            <div className="flex items-start gap-2">
                              <HelpCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium">{art.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">{art.titleAr}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditArticle(cat, art)}
                              title="Edit question"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget({ type: "article", id: art.id, categoryId: cat.id })}
                              title="Delete question"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full gap-2"
                    onClick={() => openAddArticle(cat)}
                  >
                    <Plus className="h-4 w-4" />
                    Add Question to "{cat.name}"
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}

          {faqData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No FAQ categories yet.</p>
              <Button onClick={openAddCategory} className="mt-4 gap-2">
                <FolderPlus className="h-4 w-4" />
                Add First Category
              </Button>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "category"
                ? "This will permanently delete this category and ALL its questions. This cannot be undone."
                : "This will permanently delete this question. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
