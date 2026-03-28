import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, HelpCircle, FolderPlus, ArrowLeft, Save, X, ChevronRight } from "lucide-react";
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

type ViewMode =
  | { type: "list" }
  | { type: "add-category" }
  | { type: "edit-category"; cat: FaqCategory }
  | { type: "add-article"; cat: FaqCategory }
  | { type: "edit-article"; cat: FaqCategory; art: FaqArticle };

export default function FAQManager() {
  const { toast } = useToast();
  const [view, setView] = useState<ViewMode>({ type: "list" });
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
      const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
      const res = await fetch("/api/faq-categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save FAQ data");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/faq-categories"] });
      toast({ title: "Saved!" });
      setView({ type: "list" });
    },
    onError: (err: any) => {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
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

  const handleEditCategory = (cat: FaqCategory) => {
    if (!catForm.name.trim()) return;
    const updated = faqData.map((c) =>
      c.id === cat.id ? { ...c, name: catForm.name.trim(), nameAr: catForm.nameAr.trim() || catForm.name.trim() } : c
    );
    saveMutation.mutate(updated);
  };

  const handleDeleteCategory = (catId: string) => {
    saveMutation.mutate(faqData.filter((c) => c.id !== catId));
  };

  const handleAddArticle = (cat: FaqCategory) => {
    if (!artForm.title.trim() || !artForm.body.trim()) {
      toast({ title: "Please fill in the question and English answer", variant: "destructive" });
      return;
    }
    const newArt: FaqArticle = {
      id: Date.now().toString(),
      title: artForm.title.trim(),
      titleAr: artForm.titleAr.trim() || artForm.title.trim(),
      body: artForm.body.trim(),
      bodyAr: artForm.bodyAr.trim() || artForm.body.trim(),
    };
    const updated = faqData.map((c) =>
      c.id === cat.id ? { ...c, articles: [...c.articles, newArt] } : c
    );
    saveMutation.mutate(updated);
  };

  const handleEditArticle = (cat: FaqCategory, art: FaqArticle) => {
    if (!artForm.title.trim()) return;
    const updated = faqData.map((c) =>
      c.id === cat.id
        ? {
            ...c,
            articles: c.articles.map((a) =>
              a.id === art.id
                ? { ...a, title: artForm.title.trim(), titleAr: artForm.titleAr.trim() || artForm.title.trim(), body: artForm.body.trim(), bodyAr: artForm.bodyAr.trim() || artForm.body.trim() }
                : a
            ),
          }
        : c
    );
    saveMutation.mutate(updated);
  };

  const handleDeleteArticle = (catId: string, artId: string) => {
    const updated = faqData.map((c) =>
      c.id === catId ? { ...c, articles: c.articles.filter((a) => a.id !== artId) } : c
    );
    saveMutation.mutate(updated);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "category") handleDeleteCategory(deleteTarget.id);
    else if (deleteTarget.type === "article" && deleteTarget.categoryId) handleDeleteArticle(deleteTarget.categoryId, deleteTarget.id);
    setDeleteTarget(null);
  };

  if (view.type === "add-category" || view.type === "edit-category") {
    const isEdit = view.type === "edit-category";
    const cat = isEdit ? view.cat : null;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView({ type: "list" })} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to FAQ List
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{isEdit ? "Edit Category" : "Add New Category"}</CardTitle>
            <CardDescription>Categories group related questions together. Give it a clear name in both languages.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Category Name (English) *</label>
                <Input
                  value={catForm.name}
                  onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Game Mechanics"
                  className="text-base"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">اسم التصنيف (عربي)</label>
                <Input
                  value={catForm.nameAr}
                  onChange={(e) => setCatForm((f) => ({ ...f, nameAr: e.target.value }))}
                  placeholder="مثلاً: ميكانيكا اللعبة"
                  dir="rtl"
                  className="text-base"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => isEdit && cat ? handleEditCategory(cat) : handleAddCategory()}
                disabled={saveMutation.isPending || !catForm.name.trim()}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Category"}
              </Button>
              <Button variant="outline" onClick={() => setView({ type: "list" })} className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view.type === "add-article" || view.type === "edit-article") {
    const isEdit = view.type === "edit-article";
    const cat = view.cat;
    const art = isEdit ? view.art : null;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView({ type: "list" })} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to FAQ List
          </Button>
          <span className="text-muted-foreground text-sm">
            <ChevronRight className="inline h-3.5 w-3.5" />
            {cat.name}
            <ChevronRight className="inline h-3.5 w-3.5 ml-1" />
            {isEdit ? "Edit Question" : "New Question"}
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {isEdit ? "Edit Question" : "Add New Question"}
              <span className="text-muted-foreground font-normal text-base ml-2">— {cat.name}</span>
            </CardTitle>
            <CardDescription>
              Write the question and a detailed answer. Both English and Arabic are shown to users based on their language setting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Question (English) *</label>
                <Input
                  value={artForm.title}
                  onChange={(e) => setArtForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. How do I redeem a code?"
                  className="text-base"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">السؤال (عربي)</label>
                <Input
                  value={artForm.titleAr}
                  onChange={(e) => setArtForm((f) => ({ ...f, titleAr: e.target.value }))}
                  placeholder="مثلاً: إزاي أسترد كود؟"
                  dir="rtl"
                  className="text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Answer (English) *</label>
              <p className="text-xs text-muted-foreground">Use the toolbar to add bold, images, or YouTube embeds.</p>
              <RichTextEditor
                value={artForm.body}
                onChange={(val) => setArtForm((f) => ({ ...f, body: val }))}
                placeholder="Detailed answer in English..."
                direction="ltr"
                height={300}
                resizingBar={true}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">الإجابة (عربي)</label>
              <p className="text-xs text-muted-foreground" dir="rtl">استخدم شريط الأدوات لإضافة تنسيق أو صور أو فيديوهات.</p>
              <RichTextEditor
                value={artForm.bodyAr}
                onChange={(val) => setArtForm((f) => ({ ...f, bodyAr: val }))}
                placeholder="الإجابة التفصيلية بالعربي..."
                direction="rtl"
                height={300}
                resizingBar={true}
              />
            </div>

            <div className="flex gap-3 pt-2 border-t">
              <Button
                onClick={() => isEdit && art ? handleEditArticle(cat, art) : handleAddArticle(cat)}
                disabled={saveMutation.isPending || !artForm.title.trim()}
                className="gap-2"
                size="lg"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Question"}
              </Button>
              <Button variant="outline" onClick={() => setView({ type: "list" })} className="gap-2" size="lg">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">FAQ Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            All categories and questions are shown below. Click a question to edit it on its own page.
          </p>
        </div>
        <Button
          onClick={() => { setCatForm({ name: "", nameAr: "" }); setView({ type: "add-category" }); }}
          className="gap-2"
        >
          <FolderPlus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading FAQ data...</div>
      ) : faqData.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <HelpCircle className="h-14 w-14 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold">No FAQ categories yet</p>
          <p className="text-sm mb-4">Start by creating your first category, then add questions to it.</p>
          <Button onClick={() => { setCatForm({ name: "", nameAr: "" }); setView({ type: "add-category" }); }} className="gap-2">
            <FolderPlus className="h-4 w-4" />
            Add First Category
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {faqData.map((cat) => (
            <Card key={cat.id} className="overflow-hidden">
              <CardHeader className="py-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-bold text-base">{cat.name}</span>
                      {cat.nameAr && cat.nameAr !== cat.name && (
                        <span className="text-muted-foreground text-sm mx-2">·</span>
                      )}
                      {cat.nameAr && cat.nameAr !== cat.name && (
                        <span className="text-muted-foreground text-sm" dir="rtl" style={{ unicodeBidi: "embed" }}>{cat.nameAr}</span>
                      )}
                    </div>
                    <Badge variant="secondary">{cat.articles.length} question{cat.articles.length !== 1 ? "s" : ""}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        setArtForm({ title: "", titleAr: "", body: "", bodyAr: "" });
                        setView({ type: "add-article", cat });
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Question
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setCatForm({ name: cat.name, nameAr: cat.nameAr }); setView({ type: "edit-category", cat }); }}
                      title="Edit category name"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget({ type: "category", id: cat.id })}
                      title="Delete category"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-0">
                {cat.articles.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground text-sm">
                    No questions in this category yet.{" "}
                    <button
                      className="text-primary hover:underline font-medium"
                      onClick={() => {
                        setArtForm({ title: "", titleAr: "", body: "", bodyAr: "" });
                        setView({ type: "add-article", cat });
                      }}
                    >
                      Add the first question
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {cat.articles.map((art, idx) => (
                      <div key={art.id} className="flex items-start justify-between py-3.5 px-1 hover:bg-muted/20 transition-colors group">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0 mr-2">
                          <span className="text-xs font-bold text-muted-foreground mt-0.5 flex-shrink-0 w-5 text-center">{idx + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">{art.title}</p>
                            {art.titleAr && art.titleAr !== art.title && (
                              <p className="text-xs text-muted-foreground mt-1 leading-snug" dir="rtl" style={{ textAlign: "right", fontFamily: "inherit" }}>{art.titleAr}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setArtForm({ title: art.title, titleAr: art.titleAr, body: art.body, bodyAr: art.bodyAr });
                              setView({ type: "edit-article", cat, art });
                            }}
                            title="Edit this question"
                            className="h-7 px-2 gap-1 text-xs"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget({ type: "article", id: art.id, categoryId: cat.id })}
                            title="Delete question"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
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
