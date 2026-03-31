import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataSeeder from "@/components/DataSeeder";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Eye,
  MessageSquare,
  FileText,
  Plus,
  Trash2,
  Edit,
  LogOut,
  Upload,
  Copy,
  CheckCircle,
  Users,
  Mail,
  Languages,
  Calendar,
  Newspaper,
  LayoutDashboard,
  LifeBuoy,
  Shield,
  Store,
  Star,
  User,
  RotateCw,
  Loader2,
  Search,
  ExternalLink,
  Edit2,
  AlertCircle,
  DollarSign,
  Gem,
  Globe,
} from "lucide-react";
import { useLocation } from "wouter";
import imageCompression from 'browser-image-compression';
import { RichTextEditor } from "@/components/RichTextEditor";

import ScrapingManager from "@/components/ScrapingManager";
import TutorialManager from "@/components/TutorialManager";
import CFDataScraper from "@/components/CFDataScraper";
import FullPageScraper from "@/components/FullPageScraper";
import WikiRescraper from "@/components/WikiRescraper";
import RestorationManager from "@/components/RestorationManager";
import { PasteFormatter } from "@/components/PasteFormatter";
import { ImageEditorModal, type ImageEditorConfig } from "@/components/ImageEditorModal";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import type { SiteSettings } from "@/types/site-settings";
import type { ScrapedEvent } from "@shared/types";
import AdminAnnouncements from "@/pages/AdminAnnouncements";
import MediaUpload from "@/pages/MediaUpload";
import CustomPagesManager from "@/components/CustomPagesManager";
import FAQManager from "@/components/FAQManager";

const GalleryUploader = ({
  images,
  onImagesChange,
  toast
}: {
  images: string[],
  onImagesChange: (newImages: string[]) => void,
  toast: any
}) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    setUploading(true);
    toast({ title: `Uploading ${files.length} images...` });

    const newUrls: string[] = [];
    for (const file of files) {
      try {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        let uploadFile = file;
        try { uploadFile = await imageCompression(file, options); } catch { }

        const fd = new FormData();
        fd.append('file', uploadFile);
        fd.append('folder', 'gallery');

        const tokRes = await fetch('/api/security/csrf-token');
        const tokJson = await tokRes.json();
        const token = tokJson?.csrfToken || '';

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/images/upload', true);
        xhr.setRequestHeader('X-CSRF-Token', token);

        const res: any = await new Promise((resolve, reject) => {
          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) resolve({ ok: xhr.status >= 200 && xhr.status < 300, json: async () => JSON.parse(xhr.responseText || '{}') });
          };
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(fd);
        });

        const data = await res.json();
        const url = data?.domainUrl || data?.domain_url || data?.secure_url || '';
        if (res.ok && url) {
          newUrls.push(url);
        }
      } catch (e) {
        console.error("Gallery upload failed", e);
      }
    }

    onImagesChange([...images, ...newUrls]);
    setUploading(false);
    toast({ title: 'Images added to gallery' });
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Gallery Images</Label>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-2">
        {images.map((url, idx) => (
          <div key={idx} className="relative group aspect-square border rounded overflow-hidden bg-muted">
            <img src={url} alt={`Gallery ${idx}`} className="object-cover w-full h-full" />
            <button
              type="button"
              onClick={() => onImagesChange(images.filter((_, i) => i !== idx))}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded aspect-square cursor-pointer hover:bg-muted transition-colors">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
    </div>
  );
};

export default function Admin() {
  const [postForm, setPostForm] = useState({
    title: "",
    post_slug: "",
    content: "",
    summary: "",
    image: "",
    images: [] as string[],
    category: "Tutorials",
    tags: "",
    author: "Bimora Team",
    featured: false,
    previewOnHome: true,
    readingTime: 5,
    language: "en",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    canonicalUrl: "",
    ogImage: "",
    twitterImage: "",
    schemaType: "Article",
    fullLayout: false,
    sourceUrl: "",
    isVerified: false,
    externalLinks: [] as { name: string; url: string }[],
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    date: "",
    type: "upcoming" as "upcoming" | "trending",
    image: "",
    images: [] as string[],
    event_name_slug: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    canonicalUrl: "",
    ogImage: "",
    twitterImage: "",
    schemaType: "Event",
    fullLayout: false,
    sourceUrl: "",
    isVerified: false,
    externalLinks: [] as { name: string; url: string }[],
  });

  const [newsForm, setNewsForm] = useState({
    title: "",
    news_slug: "",
    titleAr: "",
    dateRange: "",
    image: "",
    images: [] as string[],
    category: "News",
    content: "",
    contentAr: "",
    author: "Bimora Team",
    featured: false,
    previewOnHome: true,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    canonicalUrl: "",
    ogImage: "",
    twitterImage: "",
    schemaType: "NewsArticle",
    fullLayout: false,
    sourceUrl: "",
    isVerified: false,
    externalLinks: [] as { name: string; url: string }[],
  });

  const [sellerForm, setSellerForm] = useState({
    name: "",
    description: "",
    images: "",
    prices: "",
    priceItems: [] as { item: string; price: string }[],
    email: "",
    phone: "",
    whatsapp: "",
    discord: "",
    website: "",
    facebook: "",
    twitter: "",
    instagram: "",
    youtube: "",
    tiktok: "",
    telegram: "",
    featured: false,
    promotionText: "",
    rank: "",
  });

  const [adminForm, setAdminForm] = useState({
    username: "",
    password: "",
    role: "admin" as "admin" | "seller_admin" | "scraper_admin" | "super_admin",
    allowedSellerIds: [] as string[],
  });

  const [, setLocation] = useLocation();

  const normalizeSlugValue = (value: string) =>
    String(value || "")
      .toLowerCase()
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9 ]+/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 60);
  const validateEventForm = (form: typeof eventForm) => {
    const errors: string[] = [];
    const cleanTitle = String(form.title || "").trim();
    const cleanTitleAr = String(form.titleAr || "").trim();
    const cleanDescription = String(form.description || "").replace(/<[^>]*>/g, " ").trim();
    const cleanDescriptionAr = String(form.descriptionAr || "").replace(/<[^>]*>/g, " ").trim();
    const cleanDate = String(form.date || "").trim();

    if (!cleanTitle && !cleanTitleAr) errors.push("Add an English or Arabic title.");
    if (!cleanDescription && !cleanDescriptionAr) errors.push("Add event content in at least one language.");
    if (!cleanDate) errors.push("Choose or enter an event date.");
    if (cleanDate && Number.isNaN(Date.parse(cleanDate))) errors.push("Use a valid event date so countdowns and sorting work correctly.");

    return errors;
  };
  const { toast } = useToast();
  const [adminRole, setAdminRole] = useState<string>("");
  const [adminUsername, setAdminUsername] = useState<string>("");

  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventValidationErrors, setEventValidationErrors] = useState<string[]>([]);
  const [isCreatingNews, setIsCreatingNews] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [isCreatingSeller, setIsCreatingSeller] = useState(false);
  const [editingSeller, setEditingSeller] = useState<any>(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [isCreatingMerc, setIsCreatingMerc] = useState(false);
  const [isEditingMerc, setIsEditingMerc] = useState(false);
  const [editingMerc, setEditingMerc] = useState<any>(null);
  const [mercForm, setMercForm] = useState({
    name: "",
    role: "",
    image: "",
    description: "",
    voiceLines: [] as string[],
    order: ""
  });
  const [createMercForm, setCreateMercForm] = useState({
    name: "",
    image: "",
    role: "",
    description: "",
    voiceLines: [] as string[],
    order: ""
  });
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [uploadedAudioUrls, setUploadedAudioUrls] = useState<string[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<string>("");
  const [resetEmail, setResetEmail] = useState("");
  const [generatedResetCode, setGeneratedResetCode] = useState<string>("");
  async function generateResetCode() {
    try {
      const data = await apiRequest("/api/admin/users/reset-code", "POST", { email: resetEmail });
      setGeneratedResetCode(data.resetCode || "");
      toast({ title: "Reset code generated", description: "Code is ready to send", variant: "default" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message || String(e), variant: "destructive" });
    }
  }

  const [mercImageFile, setMercImageFile] = useState<File | null>(null);

  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState("");
  const [mediaUploading, setMediaUploading] = useState(false);
  const [serverMedia, setServerMedia] = useState<Array<{ public_id: string; secure_url: string; domain_url: string; type: string; size: number; created_at: string }>>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaQuery, setMediaQuery] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string>("");
  const [mediaSort, setMediaSort] = useState<'asc' | 'desc'>('desc');
  const [mediaLibrary, setMediaLibrary] = useState<Array<{ url: string; type: string; uploadedAt: number }>>(() => {
    try {
      const raw = localStorage.getItem("mediaLibrary") || "[]";
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  function addToLibrary(url: string, type: string) {
    const entry = { url, type, uploadedAt: Date.now() };
    const next = [entry, ...mediaLibrary].slice(0, 200);
    setMediaLibrary(next);
    try { localStorage.setItem("mediaLibrary", JSON.stringify(next)); } catch { }
  }
  function removeFromLibrary(url: string) {
    const next = mediaLibrary.filter((m) => m.url !== url);
    setMediaLibrary(next);
    try { localStorage.setItem("mediaLibrary", JSON.stringify(next)); } catch { }
  }

  async function loadServerMedia() {
    try {
      setMediaLoading(true);
      const params = new URLSearchParams();
      if (mediaQuery) params.set('q', mediaQuery);
      if (mediaTypeFilter) params.set('type', mediaTypeFilter);
      if (mediaSort) params.set('sort', mediaSort);
      const res = await fetch(`/api/admin/media?${params.toString()}`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` } });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setServerMedia(Array.isArray(json?.items) ? json.items : []);
    } catch (e: any) {
      setServerMedia([]);
      toast({ title: 'Failed to load media', description: e?.message || String(e), variant: 'destructive' });
    } finally {
      setMediaLoading(false);
    }
  }

  // Paste formatter state
  const [isPasteFormatterOpen, setIsPasteFormatterOpen] = useState(false);
  const [pastedContent, setPastedContent] = useState("");

  // Reviews management (super_admin only)
  const [reviewsDialogOpen, setReviewsDialogOpen] = useState(false);
  const [activeSellerForReviews, setActiveSellerForReviews] = useState<any | null>(null);
  const [sellerReviews, setSellerReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  // Image Editor State
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editingImageSrc, setEditingImageSrc] = useState("");
  const [imageEditorConfig, setImageEditorConfig] = useState<ImageEditorConfig | undefined>(undefined);

  const [editingSellerImageIndex, setEditingSellerImageIndex] = useState<number | null>(null);
  const [uploadingSellerImage, setUploadingSellerImage] = useState(false);
  const sellerLogoInputRef = useRef<HTMLInputElement>(null);
  const sellerGalleryInputRef = useRef<HTMLInputElement>(null);

  const [drafts, setDrafts] = useState<Record<string, any>>({});
  
  // Auto-save logic
  useEffect(() => {
    const timer = setInterval(() => {
      const currentDrafts = {
        post: postForm,
        event: eventForm,
        news: newsForm
      };
      localStorage.setItem("admin_drafts", JSON.stringify(currentDrafts));
    }, 30000); // every 30 seconds
    return () => clearInterval(timer);
  }, [postForm, eventForm, newsForm]);

  useEffect(() => {
    const saved = localStorage.getItem("admin_drafts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDrafts(parsed);
      } catch(e) {}
    }
  }, []);

  const restoreDraft = (type: 'post' | 'event' | 'news') => {
    if (drafts[type]) {
      if (type === 'post') setPostForm(drafts.post);
      if (type === 'event') setEventForm(drafts.event);
      if (type === 'news') setNewsForm(drafts.news);
      toast({ title: "Draft restored", description: `Restored your last saved ${type} content.` });
    }
  };

  const handleImageSave = (newSrc: string) => {
    if (editingSellerImageIndex !== null) {
      const currentList = sellerForm.images ? sellerForm.images.split(',').map(s => s.trim()).filter(Boolean) : [];
      if (editingSellerImageIndex === -1) {
        currentList.push(newSrc);
      } else if (editingSellerImageIndex >= 0) {
        if (editingSellerImageIndex < currentList.length) {
          currentList[editingSellerImageIndex] = newSrc;
        } else {
          currentList.push(newSrc);
        }
      }
      setSellerForm(prev => ({ ...prev, images: currentList.join(',') }));
      setEditingSellerImageIndex(null);
      setImageEditorOpen(false);
      return;
    }
    setImageEditorOpen(false);
  };

  const uploadSellerImageFile = async (file: File, slotIndex: number) => {
    if (!file) return;
    setUploadingSellerImage(true);
    try {
      let token = csrfToken || localStorage.getItem('csrfToken') || '';
      if (!token) {
        const tokRes = await fetch('/api/security/csrf-token');
        const tokJson = await tokRes.json();
        token = tokJson?.csrfToken || '';
        if (token) localStorage.setItem('csrfToken', token);
      }
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'sellers');
      const res = await fetch('/images/upload', {
        method: 'POST',
        headers: { 'X-CSRF-Token': token },
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      const url: string = data.domain_url || data.domainUrl || data.secure_url || data.url || data.src || data.path || '';
      if (!url) throw new Error('No URL returned from server');
      const currentList = sellerForm.images ? sellerForm.images.split(',').map(s => s.trim()).filter(Boolean) : [];
      if (slotIndex === -1) {
        currentList.push(url);
      } else {
        currentList[slotIndex] = url;
      }
      setSellerForm(prev => ({ ...prev, images: currentList.join(',') }));
      toast({ title: 'Image uploaded successfully!' });
    } catch (e: any) {
      toast({ title: 'Upload error', description: e.message, variant: 'destructive' });
    } finally {
      setUploadingSellerImage(false);
    }
  };

  const [migrationCounts, setMigrationCounts] = useState<{ events: number; posts: number; news: number } | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [activeTicketReplies, setActiveTicketReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [registrationClosed, setRegistrationClosed] = useState(false);
  const [seoSettings, setSeoSettings] = useState<{ base: string; og: string; bg: string; title: string; desc: string; keywords: string; robots: string }>({ base: "", og: "", bg: "", title: "", desc: "", keywords: "", robots: "index, follow" });

 

  const [bgSettings, setBgSettings] = useState({
    backgroundImageUrl: ""
  });

  const saveBgSettings = async () => {
    try {
      await apiRequest("/api/admin/settings/site", "POST", bgSettings);
      toast({ title: "Settings saved", description: "Background image updated." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await apiRequest("/api/public/settings/site", "GET");
        if (data) setBgSettings({ backgroundImageUrl: data.backgroundImageUrl || "" });
      } catch (e) {}
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const role = localStorage.getItem("adminRole");
    const username = localStorage.getItem("adminUsername");

    if (!token) {
      setLocation("/admin/login");
    } else {
      setAdminRole(role || "");
      setAdminUsername(username || "");
    }
  }, [setLocation]);

  useEffect(() => {
    (async () => {
      try {
        const base = (import.meta as any).env?.VITE_API_URL || '';
        const url = base ? `${base}/api/security/csrf-token` : `/api/security/csrf-token`;
        const res = await fetch(url, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          const token = data?.csrfToken || "";
          setCsrfToken(token);
          if (token) localStorage.setItem('csrfToken', token);
        }
      } catch { }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const d = await apiRequest('/api/public/settings/seo', 'GET');
        setSeoSettings({
          base: d.publicBaseUrl || '',
          title: d.seoTitle || '',
          desc: d.seoDescription || '',
          keywords: (d.seoKeywords || []).join(', '),
          og: d.seoOgImage || '',
          bg: d.backgroundImageUrl || '',
          robots: d.robots || 'index, follow',
        });
      } catch { }
    })();
  }, []);

  // Controlled active tab so we can provide a responsive selector on small screens
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [pagePreviewTarget, setPagePreviewTarget] = useState<string>("/");

  useEffect(() => { if (activeTab === 'media') loadServerMedia(); }, [activeTab, mediaQuery, mediaTypeFilter, mediaSort]);

  const isSuperAdmin = adminRole === "super_admin";
  const [adminPerms, setAdminPerms] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem("adminPermissions") || "{}";
      const parsed = JSON.parse(raw);
      setAdminPerms(parsed || {});
    } catch {
      setAdminPerms({});
    }
  }, [adminRole]);

  const canPosts = isSuperAdmin || !!adminPerms["posts:manage"];
  const canEventsNews = isSuperAdmin || !!adminPerms["events:add"] || !!adminPerms["events:scrape"] || !!adminPerms["news:add"] || !!adminPerms["news:scrape"];
  const canTutorials = isSuperAdmin || !!adminPerms["tutorials:manage"];
  const canSellers = isSuperAdmin || !!adminPerms["sellers:manage"];
  const canCFData = isSuperAdmin || !!adminPerms["weapons:manage"];
  const canRestoration = isSuperAdmin;
  const canTranslations = true;
  const canVerification = isSuperAdmin || !!adminPerms["settings:manage"];
  const canSiteSettings = isSuperAdmin || !!adminPerms["settings:manage"];
  const canAdmins = isSuperAdmin;
  const canUsers = isSuperAdmin;
  const canChat = isSuperAdmin;
  const canSubscribers = isSuperAdmin || !!adminPerms["subscribers:manage"];
  const canScraper = isSuperAdmin || !!adminPerms["events:scrape"] || !!adminPerms["news:scrape"] || !!adminPerms["scraper:run"];
  const canMercenaries = isSuperAdmin || !!adminPerms["mercenaries:manage"];
  const canTickets = isSuperAdmin || !!adminPerms["tickets:manage"];

  const canManagePosts = canPosts;
  const canManageEvents = isSuperAdmin || !!adminPerms["events:add"];
  const canManageNews = isSuperAdmin || !!adminPerms["news:add"];
  const canManageSellers = canSellers;
  const canManageCFData = canCFData;
  const canManageMercenaries = canMercenaries;
  const canManageSubscribers = canSubscribers;
  const canUseScraper = canScraper;
  const quickAccessTabs = [
    { key: "dashboard", label: "Dashboard", enabled: true },
    { key: "media", label: "Media", enabled: true },
    { key: "analytics", label: "Analytics", enabled: isSuperAdmin },
    { key: "posts", label: "Posts", enabled: canPosts },
    { key: "events-news", label: "Events & News", enabled: canEventsNews },
    { key: "tutorials", label: "Tutorials", enabled: canTutorials },
    { key: "sellers", label: "Sellers", enabled: canSellers },
    { key: "cf-data", label: "CF Data", enabled: canCFData },
    { key: "restoration", label: "Restoration", enabled: canRestoration },
    { key: "translations", label: "Translations", enabled: canTranslations },
    { key: "verification", label: "Verification", enabled: canVerification },
    { key: "appearance", label: "Appearance", enabled: isSuperAdmin },
    { key: "site-settings", label: "Site Settings", enabled: canSiteSettings },
    { key: "admins", label: "Admins", enabled: canAdmins },
    { key: "subscribers", label: "Subscribers", enabled: canSubscribers },
    { key: "scraper", label: "Scraper", enabled: canScraper },
    { key: "announcements", label: "Announcements", enabled: isSuperAdmin },
    { key: "mercenaries", label: "Mercenaries", enabled: canMercenaries },
    { key: "tickets", label: "Tickets", enabled: canTickets },
    { key: "faq", label: "FAQ", enabled: isSuperAdmin || !!adminPerms["tickets:manage"] },
    { key: "seller-reviews", label: "Seller Reviews", enabled: isSuperAdmin },
    { key: "reset-codes", label: "Reset Codes", enabled: isSuperAdmin },
    { key: "chat-settings", label: "Chat Settings", enabled: canChat },
    { key: "custom-pages", label: "Custom Pages", enabled: isSuperAdmin },
  ].filter((item) => item.enabled);

  useEffect(() => {
    const allowed = new Set<string>([
      "dashboard",
      ...(isSuperAdmin ? ["analytics"] : []),
      ...(canPosts ? ["posts"] : []),
      ...(canEventsNews ? ["events-news"] : []),
      ...(canTutorials ? ["tutorials"] : []),
      ...(canSellers ? ["sellers"] : []),
      ...(canCFData ? ["cf-data"] : []),
      ...(canRestoration ? ["restoration"] : []),
      ...(canTranslations ? ["translations"] : []),
      ...(canVerification ? ["verification"] : []),
      ...(canSiteSettings ? ["site-settings"] : []),
      ...(canAdmins ? ["admins"] : []),
      ...(canUsers ? ["users"] : []),
      ...(canChat ? ["chat-settings"] : []),
      ...(canSubscribers ? ["subscribers"] : []),
      ...(canScraper ? ["scraper"] : []),
      ...(canMercenaries ? ["mercenaries"] : []),
      ...(canTickets ? ["tickets"] : []),
      ...(isSuperAdmin ? ["seller-reviews"] : []),
      ...(canSiteSettings ? ["bulk-seo"] : []), // Add bulk-seo to allowed
    ]);

    if (!allowed.has(activeTab)) {
      setActiveTab("dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canPosts,
    canEventsNews,
    canTutorials,
    canSellers,
    canCFData,
    canRestoration,
    canTranslations,
    canVerification,
    canAdmins,
    canChat,
    canSubscribers,
    canScraper,
    canMercenaries,
    canTickets,
    isSuperAdmin,
  ]);

  // Users management
  useEffect(() => {
    if (!canUsers && !canChat) return;
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const data = await apiRequest("/api/admin/users", "GET");
        setUsers(Array.isArray(data) ? data : []);
        const reg = await apiRequest("/api/admin/registration", "GET");
        setRegistrationClosed(!!reg?.closed);
      } catch (e) {
        // ignore
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [canUsers, canChat]);

  async function generatePhoneCode(id: string) {
    const res = await apiRequest(`/api/admin/users/${id}/generate-phone-code`, "POST", {});
    toast({ title: "Phone code generated", description: `Code: ${res?.phoneCode} for ${res?.phone}` });
    const data = await apiRequest("/api/admin/users", "GET");
    setUsers(Array.isArray(data) ? data : []);
  }
  async function markVerified(id: string, type: "phone" | "email") {
    const body = type === "phone" ? { verifiedPhone: true } : { verifiedEmail: true };
    await apiRequest(`/api/admin/users/${id}/verify`, "PATCH", body);
    const data = await apiRequest("/api/admin/users", "GET");
    setUsers(Array.isArray(data) ? data : []);
  }
  async function kickUser(id: string) {
    await apiRequest(`/api/admin/users/${id}`, "DELETE");
    setUsers((u) => u.filter((x) => x.id !== id));
  }
  async function closeRegistration() { const r = await apiRequest("/api/admin/registration/close", "POST", {}); setRegistrationClosed(!!r?.closed); }
  async function openRegistration() { const r = await apiRequest("/api/admin/registration/open", "POST", {}); setRegistrationClosed(!!r?.closed); }
  const [adminPermissionsForm, setAdminPermissionsForm] = useState<Record<string, boolean>>({});

  const AVAILABLE_PERMISSIONS: { key: string; label: string }[] = [
    { key: "events:add", label: "Events - Add (manual)" },
    { key: "events:scrape", label: "Events - Scrape (import)" },
    { key: "news:add", label: "News - Add (manual)" },
    { key: "news:scrape", label: "News - Scrape (import)" },
    { key: "scraper:run", label: "Scraper - Run operations" },
    { key: "scraper:manage", label: "Scraper - Manage settings" },
    { key: "posts:manage", label: "Posts - Manage" },
    { key: "sellers:manage", label: "Sellers - Manage" },
    { key: "mercenaries:manage", label: "Mercenaries - Manage" },
    { key: "tickets:manage", label: "Tickets - Manage" },
    { key: "subscribers:manage", label: "Subscribers - Manage" },
    { key: "settings:manage", label: "Site Settings" },
    { key: "tutorials:manage", label: "Tutorials - Manage" },
  ];

  // CF Data forms
  const [weaponForm, setWeaponForm] = useState({
    name: "",
    image: "",
    category: "",
    description: "",
    stats: {} as Record<string, any>,
  });

  const [modeForm, setModeForm] = useState({
    name: "",
    image: "",
    description: "",
    type: "",
  });

  const [rankForm, setRankForm] = useState({
    name: "",
    image: "",
    description: "",
    requirements: "",
    bonus: "",
  });

  const [isCreatingWeapon, setIsCreatingWeapon] = useState(false);
  const [isCreatingMode, setIsCreatingMode] = useState(false);
  const [isCreatingRank, setIsCreatingRank] = useState(false);
  const [editingWeapon, setEditingWeapon] = useState<any>(null);
  const [editingMode, setEditingMode] = useState<any>(null);
  const [editingRank, setEditingRank] = useState<any>(null);
  const [weaponSearch, setWeaponSearch] = useState("");
  const [weaponPage, setWeaponPage] = useState(1);
  const WEAPON_PAGE_SIZE = 20;

  const [siteSettingsForm, setSiteSettingsForm] = useState({
    reviewVerificationEnabled: false,
    reviewVerificationVideoUrl: "",
    reviewVerificationPrompt: "",
    reviewVerificationPassphrase: "",
    reviewVerificationTimecode: "",
    reviewVerificationYouTubeChannelUrl: "",
    monetizationVerifiedSellersEnabled: true,
    monetizationVerifiedSellerFee: 30,
    monetizationBoostingEnabled: true,
    monetizationBoostingCommissionPct: 12,
    monetizationPremiumEnabled: true,
    monetizationPremiumMonthlyPrice: 2,
    monetizationAffiliateEnabled: true,
    monetizationAffiliateCommissionPct: 4,
    featuredWeapons: [] as string[],
  });

  const isVerificationReady = !siteSettingsForm.reviewVerificationEnabled || (
    siteSettingsForm.reviewVerificationVideoUrl.trim() !== "" &&
    siteSettingsForm.reviewVerificationPassphrase.trim() !== ""
  );

  const [postsPage, setPostsPage] = useState(1);
  const [eventsPage, setEventsPage] = useState(1);
  const [newsPage, setNewsPage] = useState(1);
  const limit = 20;
  const [postSearch, setPostSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [newsSearch, setNewsSearch] = useState("");

  const { data: stats } = useQuery<{
    totalPosts: number;
    totalComments: number;
    totalViews: number;
    recentPosts: any[];
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: postsData } = useQuery<{ items: any[], total: number }>({
    queryKey: ["/api/posts", { limit, offset: (postsPage - 1) * limit }],
    queryFn: () => apiRequest(`/api/posts?limit=${limit}&offset=${(postsPage - 1) * limit}`, "GET"),
  });
  const posts = postsData?.items || [];
  const totalPosts = postsData?.total || 0;

  const { data: eventsData, error: eventsError, isLoading: eventsLoading } = useQuery<{ items: any[], total: number }>({
    queryKey: ["/api/events", { limit, offset: (eventsPage - 1) * limit }],
    queryFn: () => apiRequest(`/api/events?limit=${limit}&offset=${(eventsPage - 1) * limit}`, "GET"),
  });
  const events = eventsData?.items || [];
  const totalEvents = eventsData?.total || 0;

  const { data: newsData, error: newsError, isLoading: newsLoading } = useQuery<{ items: any[], total: number }>({
    queryKey: ["/api/news", { limit, offset: (newsPage - 1) * limit }],
    queryFn: () => apiRequest(`/api/news?limit=${limit}&offset=${(newsPage - 1) * limit}`, "GET"),
  });
  const newsItems = newsData?.items || [];
  const totalNews = newsData?.total || 0;

  const filteredPosts = useMemo(() => {
    const q = postSearch.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((post) => [post.title, post.post_slug, post.author, post.category].some((value) => String(value || "").toLowerCase().includes(q)));
  }, [postSearch, posts]);

  const filteredEvents = useMemo(() => {
    const q = eventSearch.trim().toLowerCase();
    if (!q) return events;
    return events.filter((event) => [event.title, event.titleAr, event.event_name_slug, event.date, event.type].some((value) => String(value || "").toLowerCase().includes(q)));
  }, [eventSearch, events]);

  const filteredNews = useMemo(() => {
    const q = newsSearch.trim().toLowerCase();
    if (!q) return newsItems;
    return newsItems.filter((news) => [news.title, news.titleAr, news.news_slug, news.author, news.category, news.dateRange].some((value) => String(value || "").toLowerCase().includes(q)));
  }, [newsItems, newsSearch]);

  const renderPagination = (currentPage: number, totalItems: number, onPageChange: (page: number) => void) => {
    const totalPages = Math.ceil(totalItems / limit);
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => onPageChange(1)} className="cursor-pointer">1</PaginationLink>
              </PaginationItem>
              {startPage > 2 && <PaginationEllipsis />}
            </>
          )}

          {pages.map(page => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink onClick={() => onPageChange(totalPages)} className="cursor-pointer">{totalPages}</PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const { data: tickets } = useQuery<any[]>({
    queryKey: ["/api/tickets"],
    queryFn: () => apiRequest("/api/tickets", "GET"),
  });

  const { data: admins } = useQuery<any[]>({
    queryKey: ["/api/admin/admins"],
    queryFn: () => apiRequest("/api/admin/admins", "GET"),
    enabled: isSuperAdmin,
  });

  const { data: subscribers } = useQuery<any[]>({
    queryKey: ["/api/newsletter-subscribers"],
    queryFn: () => apiRequest("/api/newsletter-subscribers", "GET"),
    enabled: isSuperAdmin,
  });

  const { data: sellers } = useQuery<any[]>({
    queryKey: ["/api/sellers"],
    queryFn: () => apiRequest("/api/sellers", "GET"),
  });

  const { data: siteSettings } = useQuery<SiteSettings>({
    queryKey: ["/api/settings/site"],
    queryFn: () => apiRequest("/api/settings/site", "GET"),
    enabled: isSuperAdmin,
  });

  const { data: weapons } = useQuery<any[]>({
    queryKey: ["/api/weapons"],
    queryFn: () => apiRequest("/api/weapons", "GET"),
    enabled: isSuperAdmin,
  });

  const { data: modes } = useQuery<any[]>({
    queryKey: ["/api/modes"],
    queryFn: () => apiRequest("/api/modes", "GET"),
    enabled: isSuperAdmin,
  });

  const { data: ranks } = useQuery<any[]>({
    queryKey: ["/api/ranks"],
    queryFn: () => apiRequest("/api/ranks", "GET"),
    enabled: isSuperAdmin,
  });

  const { data: mercenaries } = useQuery<any[]>({
    queryKey: ["/api/mercenaries"],
    queryFn: () => apiRequest("/api/mercenaries", "GET"),
    enabled: isSuperAdmin,
  });

  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    const prev = new Date(d.getTime() - 7 * 24 * 3600 * 1000);
    return prev.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const { data: tutorialAnalytics } = useQuery<any>({
    queryKey: ["/api/admin/analytics/tutorials", fromDate, toDate],
    queryFn: () => apiRequest(`/api/admin/analytics/tutorials?from=${fromDate}&to=${toDate}`, "GET"),
    enabled: isSuperAdmin,
  });
  const { data: sellerAnalytics } = useQuery<any>({
    queryKey: ["/api/admin/analytics/sellers", fromDate, toDate],
    queryFn: () => apiRequest(`/api/admin/analytics/sellers?from=${fromDate}&to=${toDate}`, "GET"),
    enabled: isSuperAdmin,
  });

  useEffect(() => {
    if (siteSettings) {
      setSiteSettingsForm({
        reviewVerificationEnabled: siteSettings.reviewVerificationEnabled,
        reviewVerificationVideoUrl: siteSettings.reviewVerificationVideoUrl || "",
        reviewVerificationPrompt: siteSettings.reviewVerificationPrompt || "",
        reviewVerificationPassphrase: siteSettings.reviewVerificationPassphrase || "",
        reviewVerificationTimecode: siteSettings.reviewVerificationTimecode || "",
        reviewVerificationYouTubeChannelUrl: siteSettings.reviewVerificationYouTubeChannelUrl || "",
        monetizationVerifiedSellersEnabled: siteSettings.monetizationVerifiedSellersEnabled !== false,
        monetizationVerifiedSellerFee: siteSettings.monetizationVerifiedSellerFee ?? 30,
        monetizationBoostingEnabled: siteSettings.monetizationBoostingEnabled !== false,
        monetizationBoostingCommissionPct: siteSettings.monetizationBoostingCommissionPct ?? 12,
        monetizationPremiumEnabled: siteSettings.monetizationPremiumEnabled !== false,
        monetizationPremiumMonthlyPrice: siteSettings.monetizationPremiumMonthlyPrice ?? 2,
        monetizationAffiliateEnabled: siteSettings.monetizationAffiliateEnabled !== false,
        monetizationAffiliateCommissionPct: siteSettings.monetizationAffiliateCommissionPct ?? 4,
        featuredWeapons: Array.isArray((siteSettings as any).featuredWeapons) ? (siteSettings as any).featuredWeapons : [],
      });
    }
  }, [siteSettings]);

  const createPostMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/posts", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsCreatingPost(false);
      resetPostForm();
      toast({ title: "Post created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create post", variant: "destructive" });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/posts/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setEditingPost(null);
      setIsCreatingPost(false);
      resetPostForm();
      toast({ title: "Post updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update post", variant: "destructive" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/posts/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Post deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete post", variant: "destructive" });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/events", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsCreatingEvent(false);
      resetEventForm();
      setEventValidationErrors([]);
      toast({ title: "Event created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create event", description: error?.message || "Unknown error", variant: "destructive" });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/events/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setEditingEvent(null);
      setIsCreatingEvent(false);
      resetEventForm();
      setEventValidationErrors([]);
      toast({ title: "Event updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update event",
        description: error.message || "Unknown error",
        variant: "destructive"
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/events/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete event", variant: "destructive" });
    },
  });

  const createNewsMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/news", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setIsCreatingNews(false);
      resetNewsForm();
      toast({ title: "News item created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create news item", description: error?.message || "", variant: "destructive" });
    },
  });

  const updateNewsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/news/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setEditingNews(null);
      setIsCreatingNews(false);
      resetNewsForm();
      toast({ title: "News item updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update news item", description: error?.message || "", variant: "destructive" });
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/news/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "News item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete news item", variant: "destructive" });
    },
  });

  // Weapons mutations
  const createWeaponMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/weapons", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weapons"] });
      setIsCreatingWeapon(false);
      setWeaponForm({ name: "", image: "", category: "", description: "", stats: {} });
      toast({ title: "Weapon created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create weapon", variant: "destructive" });
    },
  });

  const updateWeaponMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/weapons/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weapons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weapons/search"] });
      setEditingWeapon(null);
      setIsCreatingWeapon(false);
      setWeaponForm({ name: "", image: "", category: "", description: "", stats: {} });
      toast({ title: "Weapon updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update weapon", variant: "destructive" });
    },
  });

  const deleteWeaponMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/weapons/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weapons"] });
      toast({ title: "Weapon deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete weapon", variant: "destructive" });
    },
  });

  // Modes mutations
  const createModeMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/modes", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modes"] });
      setIsCreatingMode(false);
      setModeForm({ name: "", image: "", description: "", type: "" });
      toast({ title: "Mode created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create mode", variant: "destructive" });
    },
  });

  const updateModeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/modes/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modes"] });
      setEditingMode(null);
      setIsCreatingMode(false);
      setModeForm({ name: "", image: "", description: "", type: "" });
      toast({ title: "Mode updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update mode", variant: "destructive" });
    },
  });

  const deleteModeMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/modes/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modes"] });
      toast({ title: "Mode deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete mode", variant: "destructive" });
    },
  });

  // Ranks mutations
  const createRankMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/ranks", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ranks"] });
      setIsCreatingRank(false);
      setRankForm({ name: "", image: "", description: "", requirements: "", bonus: "" });
      toast({ title: "Rank created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create rank", variant: "destructive" });
    },
  });

  const updateRankMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/ranks/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ranks"] });
      setEditingRank(null);
      setIsCreatingRank(false);
      setRankForm({ name: "", image: "", description: "", requirements: "", bonus: "" });
      toast({ title: "Rank updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update rank", variant: "destructive" });
    },
  });

  const deleteRankMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/ranks/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ranks"] });
      toast({ title: "Rank deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete rank", variant: "destructive" });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/admins", "POST", data),
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      // If permissions were set in the form, save them via the admin-permissions API
      try {
        const created = data;
        const adminId = created?.id || created?._id;
        if (adminId && Object.keys(adminPermissionsForm || {}).length > 0) {
          await apiRequest(`/api/admin-permissions/${adminId}`, "PUT", { permissions: adminPermissionsForm });
          queryClient.invalidateQueries({ queryKey: ["/api/admin-permissions"] });
        }
      } catch (err) {
        // swallow — still proceed but notify
        console.error('Failed to save admin permissions', err);
        toast({ title: 'Admin created, but failed to save permissions', variant: 'destructive' });
      }

      setIsCreatingAdmin(false);
      resetAdminForm();
      setAdminPermissionsForm({});
      toast({ title: "Admin created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create admin",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateAdminMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/admins/${id}`, "PATCH", data),
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      const adminId = data?.id || data?._id;
      try {
        if (adminId) {
          await apiRequest(`/api/admin-permissions/${adminId}`, "PUT", { permissions: adminPermissionsForm || {} });
          queryClient.invalidateQueries({ queryKey: ["/api/admin-permissions"] });
        }
      } catch (err) {
        console.error('Failed to update admin permissions', err);
        toast({ title: 'Admin updated, but failed to save permissions', variant: 'destructive' });
      }

      setEditingAdmin(null);
      setIsCreatingAdmin(false);
      resetAdminForm();
      setAdminPermissionsForm({});
      toast({ title: "Admin updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update admin", variant: "destructive" });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admins/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({ title: "Admin deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete admin", variant: "destructive" });
    },
  });

  const deleteSubscriberMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/newsletter-subscribers/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-subscribers"] });
      toast({ title: "Subscriber deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete subscriber", variant: "destructive" });
    },
  });

  const updateSiteSettingsMutation = useMutation({
    mutationFn: (data: typeof siteSettingsForm) => apiRequest("/api/settings/site", "PUT", data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/site"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/settings/site"] });
      setSiteSettingsForm(prev => ({
        ...prev,
        reviewVerificationEnabled: data.reviewVerificationEnabled ?? prev.reviewVerificationEnabled,
        reviewVerificationVideoUrl: data.reviewVerificationVideoUrl || prev.reviewVerificationVideoUrl || "",
        reviewVerificationPrompt: data.reviewVerificationPrompt || prev.reviewVerificationPrompt || "",
        reviewVerificationPassphrase: data.reviewVerificationPassphrase || prev.reviewVerificationPassphrase || "",
        reviewVerificationTimecode: data.reviewVerificationTimecode || prev.reviewVerificationTimecode || "",
        reviewVerificationYouTubeChannelUrl: data.reviewVerificationYouTubeChannelUrl || prev.reviewVerificationYouTubeChannelUrl || "",
        monetizationVerifiedSellersEnabled: data.monetizationVerifiedSellersEnabled !== false,
        monetizationVerifiedSellerFee: data.monetizationVerifiedSellerFee ?? 30,
        monetizationBoostingEnabled: data.monetizationBoostingEnabled !== false,
        monetizationBoostingCommissionPct: data.monetizationBoostingCommissionPct ?? 12,
        monetizationPremiumEnabled: data.monetizationPremiumEnabled !== false,
        monetizationPremiumMonthlyPrice: data.monetizationPremiumMonthlyPrice ?? 2,
        monetizationAffiliateEnabled: data.monetizationAffiliateEnabled !== false,
        monetizationAffiliateCommissionPct: data.monetizationAffiliateCommissionPct ?? 4,
        featuredWeapons: Array.isArray(data.featuredWeapons) ? data.featuredWeapons : prev.featuredWeapons,
      }));
      toast({ title: "Site settings updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update site settings",
        description: error.message || "Could not save settings",
        variant: "destructive",
      });
    },
  });

  const createSellerMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/sellers", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sellers"] });
      setIsCreatingSeller(false);
      resetSellerForm();
      toast({ title: "Seller created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create seller", variant: "destructive" });
    },
  });

  const updateSellerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/sellers/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sellers"] });
      setEditingSeller(null);
      setIsCreatingSeller(false);
      resetSellerForm();
      toast({ title: "Seller updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update seller", variant: "destructive" });
    },
  });

  const deleteSellerMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/sellers/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sellers"] });
      toast({ title: "Seller deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete seller", variant: "destructive" });
    },
  });

  const migrateSellerImagesMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/migrate-seller-images-to-cloudinary", "POST"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sellers"] });
      toast({
        title: "Migration complete",
        description: `Migrated: ${data.migrated}, Skipped (already Cloudinary): ${data.skipped}, Failed: ${data.failed}`,
      });
    },
    onError: (error: any) => {
      toast({ title: "Migration failed", description: error.message, variant: "destructive" });
    },
  });

  const createMercenaryMutation = useMutation({
    mutationFn: (data: any) => {
      // Ensure voiceLines is always an array
      const cleanData = {
        ...data,
        voiceLines: Array.isArray(data.voiceLines) ? data.voiceLines.filter((url: string) => url.trim() !== "") : [],
        audioUrl: data.audioUrl || "",
        stats: data.stats || { health: 0, speed: 0, attack: 0, defense: 0 }
      };
      return apiRequest("/api/mercenaries", "POST", cleanData);
    },
    onSuccess: (response) => {
      console.log("Mercenary created:", response);
      queryClient.invalidateQueries({ queryKey: ["/api/mercenaries"] });
      setIsCreatingMerc(false);
      setCreateMercForm({ name: "", image: "", role: "", description: "", voiceLines: [], order: "" });
      toast({ title: "Mercenary created successfully", description: `${response?.voiceLines?.length || 0} voice lines saved` });
    },
    onError: (error: any) => {
      console.error("Failed to create mercenary:", error);
      toast({ title: "Failed to create mercenary", description: error.message, variant: "destructive" });
    },
  });

  const updateMercenaryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      const cleanData = {
        ...data,
        voiceLines: Array.isArray(data.voiceLines) ? data.voiceLines.filter((url: string) => url.trim() !== "") : [],
      };
      return apiRequest(`/api/mercenaries/${id}`, "PATCH", cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mercenaries"] });
      setEditingMerc(null);
      setIsEditingMerc(false);
      setMercForm({ name: "", role: "", image: "", description: "", voiceLines: [], order: "" });
      toast({ title: "Mercenary updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update mercenary", variant: "destructive" });
    },
  });

  const deleteMercenaryMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/mercenaries/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mercenaries"] });
      toast({ title: "Mercenary deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete mercenary", variant: "destructive" });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/tickets/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Ticket updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update ticket", variant: "destructive" });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/tickets/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({ title: "Ticket deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete ticket", variant: "destructive" });
    },
  });

  const scrapeEventsMutation = useMutation({
    mutationFn: () => apiRequest("/api/scrape-events", "POST", { count: 5 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Events scraped and created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to scrape events", description: error.message, variant: "destructive" });
    },
  });

  const [fandomCategory, setFandomCategory] = useState("Weapons");
  const [fandomLimit, setFandomLimit] = useState(10);
  const [fandomImportAs, setFandomImportAs] = useState("weapon");
  const [fandomSingleArticle, setFandomSingleArticle] = useState("");
  const [fandomImportResult, setFandomImportResult] = useState<any>(null);
  const [showFandomDialog, setShowFandomDialog] = useState(false);

  const fandomImportMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/fandom-import", "POST", data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/weapons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setFandomImportResult(data);
      toast({ title: data.message || "Import complete" });
    },
    onError: (error: any) => {
      toast({ title: "Fandom import failed", description: error.message, variant: "destructive" });
    },
  });

  const fandomArticleMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/fandom-import-article", "POST", data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setFandomSingleArticle("");
      toast({ title: data.message || "Article imported" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to import article", description: error.message, variant: "destructive" });
    },
  });

  const migrateSlugsMutation = useMutation({
    mutationFn: () => apiRequest("/api/admin/migrate-slugs", "POST"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      setMigrationCounts({ events: data?.eventsUpdated || 0, posts: data?.postsUpdated || 0, news: data?.newsUpdated || 0 });
      toast({ title: "Slugs migrated", description: `Events: ${data?.eventsUpdated || 0}, Posts: ${data?.postsUpdated || 0}, News: ${data?.newsUpdated || 0}` });
    },
    onError: (error: any) => {
      toast({ title: "Failed to migrate slugs", description: error.message, variant: "destructive" });
    },
  });



  const resetPostForm = () => {
    setPostForm({
      title: "",
      post_slug: "",
      content: "",
      summary: "",
      image: "",
      images: [],
      category: "Tutorials",
      tags: "",
      author: "Bimora Team",
      featured: false,
      previewOnHome: true,
      readingTime: 5,
      language: "en",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      canonicalUrl: "",
      ogImage: "",
      twitterImage: "",
      schemaType: "Article",
      fullLayout: false,
      sourceUrl: "",
      isVerified: false,
      externalLinks: [],
    });
  };

  const resetEventForm = () => {
    setEventForm({
      title: "",
      titleAr: "",
      description: "",
      descriptionAr: "",
      date: "",
      type: "upcoming",
      image: "",
      images: [],
      event_name_slug: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      canonicalUrl: "",
      ogImage: "",
      twitterImage: "",
      schemaType: "Event",
      fullLayout: false,
      sourceUrl: "",
      isVerified: false,
      externalLinks: [],
    });
  };

  const resetNewsForm = () => {
    setNewsForm({
      title: "",
      news_slug: "",
      titleAr: "",
      dateRange: "",
      image: "",
      images: [],
      category: "News",
      content: "",
      contentAr: "",
      author: "Bimora Team",
      featured: false,
      previewOnHome: true,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      canonicalUrl: "",
      ogImage: "",
      twitterImage: "",
      schemaType: "NewsArticle",
      fullLayout: false,
      sourceUrl: "",
      isVerified: false,
      externalLinks: [],
    });
  };

  const resetSellerForm = () => {
    setSellerForm({
      name: "",
      description: "",
      images: "",
      prices: "",
      priceItems: [],
      email: "",
      phone: "",
      whatsapp: "",
      discord: "",
      website: "",
      facebook: "",
      twitter: "",
      instagram: "",
      youtube: "",
      tiktok: "",
      telegram: "",
      featured: false,
      promotionText: "",
      rank: "",
    });
  };

  const resetAdminForm = () => {
    setAdminForm({
      username: "",
      password: "",
      role: "admin",
      allowedSellerIds: [],
    });
  };



  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminUsername");
    setLocation("/");
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmId) return;
    const allowedForType: Record<string, boolean> = {
      post: canManagePosts,
      event: canManageEvents,
      news: canManageNews,
      seller: canManageSellers,
      admin: canAdmins,
      subscriber: canManageSubscribers,
      weapon: canManageCFData,
      mode: canManageCFData,
      rank: canManageCFData,
      ticket: canTickets,
      mercenary: canManageMercenaries,
    };
    if (!allowedForType[deleteType]) {
      toast({ title: "Not allowed", description: "You don't have permission for this action", variant: "destructive" });
      return;
    }

    switch (deleteType) {
      case "post":
        deletePostMutation.mutate(deleteConfirmId);
        break;
      case "event":
        deleteEventMutation.mutate(deleteConfirmId);
        break;
      case "news":
        deleteNewsMutation.mutate(deleteConfirmId);
        break;
      case "seller":
        deleteSellerMutation.mutate(deleteConfirmId);
        break;
      case "admin":
        deleteAdminMutation.mutate(deleteConfirmId);
        break;
      case "subscriber":
        deleteSubscriberMutation.mutate(deleteConfirmId);
        break;
      case "weapon":
        deleteWeaponMutation.mutate(deleteConfirmId);
        break;
      case "mode":
        deleteModeMutation.mutate(deleteConfirmId);
        break;
      case "rank":
        deleteRankMutation.mutate(deleteConfirmId);
        break;
      case "ticket":
        deleteTicketMutation.mutate(deleteConfirmId);
        break;
      case "mercenary":
        deleteMercenaryMutation.mutate(deleteConfirmId);
        break;
    }

    setDeleteConfirmId(null);
    setDeleteType("");
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" data-testid="badge-admin-username">
                {adminUsername}
              </Badge>
              <Badge
                variant={isSuperAdmin ? "default" : "secondary"}
                data-testid="badge-admin-role"
              >
                <Shield className="h-3 w-3 mr-1" />
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} defaultValue="dashboard" className="space-y-6" data-testid="tabs-admin">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-72 lg:shrink-0">
              {/* small screen: select picker */}
              <div className="block mb-3">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="dashboard">Dashboard</option>
                  <option value="media">Media Uploads</option>
                  {isSuperAdmin && <option value="analytics">Analytics</option>}
                  {canPosts && <option value="posts">Posts</option>}
                  {canEventsNews && <option value="events-news">Events & News</option>}
                  {canTutorials && <option value="tutorials">Tutorials</option>}
                  {canSellers && <option value="sellers">Sellers</option>}
                  {canCFData && <option value="cf-data">CF Data</option>}
                  {canRestoration && <option value="restoration">Restore Data</option>}
                  {canTranslations && <option value="translations">Translations</option>}
                  {canVerification && <option value="verification">Review Verification</option>}
                  {canSiteSettings && <option value="site-settings">Site Settings</option>}
                  {canAdmins && <option value="admins">Admins</option>}
                  {canSubscribers && <option value="subscribers">Subscribers</option>}
                  {canScraper && <option value="scraper">Scraper</option>}
                  {isSuperAdmin && <option value="announcements">Announcements</option>}
                  {canMercenaries && <option value="mercenaries">Mercenaries</option>}
                  {canTickets && <option value="tickets">Tickets</option>}
                  {(isSuperAdmin || !!adminPerms["tickets:manage"]) && <option value="faq">FAQ</option>}
                  {isSuperAdmin && <option value="reset-codes">Password Reset Codes</option>}
                  {isSuperAdmin && <option value="chat-settings">Chat Settings</option>}
                  {isSuperAdmin && <option value="custom-pages">Custom Pages</option>}
                </select>
              </div>

              {/* large screen: vertical tabs list */}
              <TabsList className="hidden">
                <TabsTrigger value="dashboard" className="justify-start" data-testid="tab-dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  <span className="truncate">Dashboard</span>
                </TabsTrigger>
                <TabsTrigger value="media" className="justify-start" data-testid="tab-media">
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="truncate">Media Uploads</span>
                </TabsTrigger>
                {isSuperAdmin && (
                  <TabsTrigger value="analytics" className="justify-start" data-testid="tab-analytics">
                    <Eye className="h-4 w-4 mr-2" />
                    <span className="truncate">Analytics</span>
                  </TabsTrigger>
                )}
                {canPosts && (
                  <TabsTrigger value="posts" className="justify-start" data-testid="tab-posts">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="truncate">Posts</span>
                  </TabsTrigger>
                )}
                {canEventsNews && (
                  <TabsTrigger value="events-news" className="justify-start" data-testid="tab-events-news">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="truncate">Events & News</span>
                  </TabsTrigger>
                )}
                {canTutorials && (
                  <TabsTrigger value="tutorials" className="justify-start" data-testid="tab-tutorials">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="truncate">Tutorials</span>
                  </TabsTrigger>
                )}
                {canSellers && (
                  <TabsTrigger value="sellers" className="justify-start" data-testid="tab-sellers">
                    <Store className="h-4 w-4 mr-2" />
                    <span className="truncate">Sellers</span>
                  </TabsTrigger>
                )}
                {canCFData && (
                  <TabsTrigger value="cf-data" className="justify-start" data-testid="tab-cf-data">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="truncate">CF Data</span>
                  </TabsTrigger>
                )}
                {canRestoration && (
                  <TabsTrigger value="restoration" className="justify-start" data-testid="tab-restoration">
                    <RotateCw className="h-4 w-4 mr-2" />
                    <span className="truncate">Restore Data</span>
                  </TabsTrigger>
                )}
                {canTranslations && (
                  <TabsTrigger value="translations" className="justify-start" data-testid="tab-translations">
                    <Languages className="h-4 w-4 mr-2" />
                    <span className="truncate">Translations</span>
                  </TabsTrigger>
                )}
                {canVerification && (
                  <TabsTrigger value="verification" className="justify-start" data-testid="tab-verification">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="truncate">Review Verification</span>
                  </TabsTrigger>
                )}
                {canSiteSettings && (
                  <TabsTrigger value="appearance" className="justify-start" data-testid="tab-appearance">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    <span className="truncate">Appearance</span>
                  </TabsTrigger>
                )}
                {canSiteSettings && (
                  <TabsTrigger value="site-settings" className="justify-start" data-testid="tab-site-settings">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="truncate">Site Settings</span>
                  </TabsTrigger>
                )}
                {canUsers && (
                  <TabsTrigger value="users" className="justify-start" data-testid="tab-users">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="truncate">Users</span>
                  </TabsTrigger>
                )}
                {canAdmins && (
                  <TabsTrigger value="admins" className="justify-start" data-testid="tab-admins">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="truncate">Admins</span>
                  </TabsTrigger>
                )}
                {canSubscribers && (
                  <TabsTrigger value="subscribers" className="justify-start" data-testid="tab-subscribers">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">Subscribers</span>
                  </TabsTrigger>
                )}
                {canScraper && (
                  <TabsTrigger value="scraper" className="justify-start" data-testid="tab-scraper">
                    <Upload className="h-4 w-4 mr-2" />
                    <span className="truncate">Scraper</span>
                  </TabsTrigger>
                )}
                {isSuperAdmin && (
                  <TabsTrigger value="announcements" className="justify-start" data-testid="tab-announcements">
                    <Newspaper className="h-4 w-4 mr-2" />
                    <span className="truncate">Announcements</span>
                  </TabsTrigger>
                )}
                {canMercenaries && (
                  <TabsTrigger value="mercenaries" className="justify-start" data-testid="tab-mercenaries">
                    <Star className="h-4 w-4 mr-2" />
                    <span className="truncate">Mercenaries</span>
                  </TabsTrigger>
                )}
                {canTickets && (
                  <TabsTrigger value="tickets" className="justify-start" data-testid="tab-tickets">
                    <LifeBuoy className="h-4 w-4 mr-2" />
                    <span className="truncate">Tickets</span>
                  </TabsTrigger>
                )}
                {false && isSuperAdmin && (
                  <TabsTrigger value="seller-reviews" className="justify-start" data-testid="tab-seller-reviews">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span className="truncate">Seller Review Verification</span>
                  </TabsTrigger>
                )}
                {isSuperAdmin && (
                  <TabsTrigger value="reset-codes" className="justify-start" data-testid="tab-reset-codes">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="truncate">Password Reset Codes</span>
                  </TabsTrigger>
                )}
                {isSuperAdmin && (
                  <TabsTrigger value="chat-settings" className="justify-start" data-testid="tab-chat-settings">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span className="truncate">Chat Settings</span>
                  </TabsTrigger>
                )}
                {isSuperAdmin && (
                  <TabsTrigger value="custom-pages" className="justify-start" data-testid="tab-custom-pages">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="truncate">Custom Pages</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <div className="flex-1">
              <TabsContent value="dashboard" className="space-y-6" data-testid="content-dashboard">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-posts">{stats?.totalPosts || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-comments">{stats?.totalComments || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="stat-total-views">{stats?.totalViews || 0}</div>
                    </CardContent>
                  </Card>

                  {canSiteSettings && (
                    <Card className="hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => setLocation("/admin/seo-bulk")}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Search className="h-5 w-5" />
                          Bulk SEO Editor
                        </CardTitle>
                        <CardDescription>Edit SEO tags for all content</CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Revenue Roadmap
                    </CardTitle>
                    <CardDescription>
                      Suggested ways to turn the current wiki into a cleaner revenue engine without relying only on intrusive ads.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          title: "Verified sellers",
                          text: "Use the existing seller pages, reviews, and rankings to sell featured placements and verified packages.",
                        },
                        {
                          title: "Boosting & coaching",
                          text: "Add request intake and admin assignment flow for rank boosting, scrim prep, or coaching services.",
                        },
                        {
                          title: "Premium membership",
                          text: "Package exclusive guides, calculators, and early event analysis into a low-cost recurring plan.",
                        },
                        {
                          title: "Affiliate offers",
                          text: "Place gaming gear, top-up, and creator-equipment recommendations on high-intent pages.",
                        },
                      ].map((item) => (
                        <div key={item.title} className="rounded-xl border bg-muted/30 p-4">
                          <div className="flex items-center gap-2 font-semibold">
                            <Gem className="h-4 w-4 text-primary" />
                            {item.title}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" onClick={() => setLocation("/pricing")}>
                        Open pricing page
                      </Button>
                      {canSellers && (
                        <Button variant="outline" onClick={() => setActiveTab("sellers")}>
                          Open sellers manager
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => setLocation("/contact")}>
                        Partnership contact page
                      </Button>
                    </div>

                    {canSiteSettings && (
                      <div className="space-y-4 rounded-xl border border-border/60 p-4">
                        <div>
                          <h3 className="font-semibold">Monetization Controls (Admin)</h3>
                          <p className="text-sm text-muted-foreground">
                            Control pricing and enable/disable each revenue stream from admin. These values are reused in planning pages.
                          </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2 rounded-lg border p-3">
                            <div className="flex items-center justify-between gap-2">
                              <Label htmlFor="mon-verified-enabled">Verified sellers</Label>
                              <Switch
                                id="mon-verified-enabled"
                                checked={siteSettingsForm.monetizationVerifiedSellersEnabled}
                                onCheckedChange={(checked) =>
                                  setSiteSettingsForm((prev) => ({ ...prev, monetizationVerifiedSellersEnabled: checked }))
                                }
                              />
                            </div>
                            <Label htmlFor="mon-verified-fee" className="text-xs text-muted-foreground">Monthly fee ($)</Label>
                            <Input
                              id="mon-verified-fee"
                              type="number"
                              min={0}
                              value={siteSettingsForm.monetizationVerifiedSellerFee}
                              onChange={(e) =>
                                setSiteSettingsForm((prev) => ({
                                  ...prev,
                                  monetizationVerifiedSellerFee: Math.max(0, Number(e.target.value) || 0),
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2 rounded-lg border p-3">
                            <div className="flex items-center justify-between gap-2">
                              <Label htmlFor="mon-boosting-enabled">Boosting & coaching</Label>
                              <Switch
                                id="mon-boosting-enabled"
                                checked={siteSettingsForm.monetizationBoostingEnabled}
                                onCheckedChange={(checked) =>
                                  setSiteSettingsForm((prev) => ({ ...prev, monetizationBoostingEnabled: checked }))
                                }
                              />
                            </div>
                            <Label htmlFor="mon-boosting-commission" className="text-xs text-muted-foreground">Commission (%)</Label>
                            <Input
                              id="mon-boosting-commission"
                              type="number"
                              min={0}
                              max={100}
                              value={siteSettingsForm.monetizationBoostingCommissionPct}
                              onChange={(e) =>
                                setSiteSettingsForm((prev) => ({
                                  ...prev,
                                  monetizationBoostingCommissionPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2 rounded-lg border p-3">
                            <div className="flex items-center justify-between gap-2">
                              <Label htmlFor="mon-premium-enabled">Premium membership</Label>
                              <Switch
                                id="mon-premium-enabled"
                                checked={siteSettingsForm.monetizationPremiumEnabled}
                                onCheckedChange={(checked) =>
                                  setSiteSettingsForm((prev) => ({ ...prev, monetizationPremiumEnabled: checked }))
                                }
                              />
                            </div>
                            <Label htmlFor="mon-premium-price" className="text-xs text-muted-foreground">Price / month ($)</Label>
                            <Input
                              id="mon-premium-price"
                              type="number"
                              min={0}
                              value={siteSettingsForm.monetizationPremiumMonthlyPrice}
                              onChange={(e) =>
                                setSiteSettingsForm((prev) => ({
                                  ...prev,
                                  monetizationPremiumMonthlyPrice: Math.max(0, Number(e.target.value) || 0),
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-2 rounded-lg border p-3">
                            <div className="flex items-center justify-between gap-2">
                              <Label htmlFor="mon-affiliate-enabled">Affiliate offers</Label>
                              <Switch
                                id="mon-affiliate-enabled"
                                checked={siteSettingsForm.monetizationAffiliateEnabled}
                                onCheckedChange={(checked) =>
                                  setSiteSettingsForm((prev) => ({ ...prev, monetizationAffiliateEnabled: checked }))
                                }
                              />
                            </div>
                            <Label htmlFor="mon-affiliate-commission" className="text-xs text-muted-foreground">Commission (%)</Label>
                            <Input
                              id="mon-affiliate-commission"
                              type="number"
                              min={0}
                              max={100}
                              value={siteSettingsForm.monetizationAffiliateCommissionPct}
                              onChange={(e) =>
                                setSiteSettingsForm((prev) => ({
                                  ...prev,
                                  monetizationAffiliateCommissionPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!siteSettings || updateSiteSettingsMutation.isPending}
                            onClick={() => {
                              if (!siteSettings) return;
                              setSiteSettingsForm((prev) => ({
                                ...prev,
                                monetizationVerifiedSellersEnabled: siteSettings.monetizationVerifiedSellersEnabled !== false,
                                monetizationVerifiedSellerFee: siteSettings.monetizationVerifiedSellerFee ?? 30,
                                monetizationBoostingEnabled: siteSettings.monetizationBoostingEnabled !== false,
                                monetizationBoostingCommissionPct: siteSettings.monetizationBoostingCommissionPct ?? 12,
                                monetizationPremiumEnabled: siteSettings.monetizationPremiumEnabled !== false,
                                monetizationPremiumMonthlyPrice: siteSettings.monetizationPremiumMonthlyPrice ?? 2,
                                monetizationAffiliateEnabled: siteSettings.monetizationAffiliateEnabled !== false,
                                monetizationAffiliateCommissionPct: siteSettings.monetizationAffiliateCommissionPct ?? 4,
                              }));
                            }}
                          >
                            Reset monetization
                          </Button>
                          <Button
                            type="button"
                            onClick={() => updateSiteSettingsMutation.mutate(siteSettingsForm)}
                            disabled={updateSiteSettingsMutation.isPending}
                          >
                            {updateSiteSettingsMutation.isPending ? "Saving..." : "Save monetization"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <span>🔫</span> Featured Weapons (Homepage)
                    </CardTitle>
                    <CardDescription>
                      Choose up to 4 weapons to feature on the homepage. Leave empty to automatically show the 4 most recently added weapons.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {siteSettingsForm.featuredWeapons.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Currently featured ({siteSettingsForm.featuredWeapons.length}/4):</p>
                        <div className="flex flex-wrap gap-2">
                          {siteSettingsForm.featuredWeapons.map((wid) => {
                            const w = (weapons || []).find((x: any) => String(x.id || x._id) === wid);
                            return (
                              <div key={wid} className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded px-2 py-1 text-sm">
                                {w?.imageUrl || w?.image ? (
                                  <img src={w.imageUrl || w.image} alt={w.name} className="w-6 h-6 object-contain" />
                                ) : null}
                                <span>{w?.name || wid}</span>
                                <button
                                  onClick={() => setSiteSettingsForm(prev => ({
                                    ...prev,
                                    featuredWeapons: prev.featuredWeapons.filter(id => id !== wid)
                                  }))}
                                  className="ml-1 text-destructive hover:text-destructive/80 font-bold"
                                >×</button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div>
                      <Input
                        placeholder="Search weapons to feature..."
                        value={weaponSearch}
                        onChange={(e) => setWeaponSearch(e.target.value)}
                        className="mb-2"
                      />
                      <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
                        {(weapons || [])
                          .filter((w: any) => {
                            if (!weaponSearch.trim()) return true;
                            return w.name?.toLowerCase().includes(weaponSearch.toLowerCase()) ||
                              w.category?.toLowerCase().includes(weaponSearch.toLowerCase());
                          })
                          .slice(0, 30)
                          .map((w: any) => {
                            const wid = String(w.id || w._id);
                            const isSelected = siteSettingsForm.featuredWeapons.includes(wid);
                            return (
                              <div
                                key={wid}
                                className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/10' : ''}`}
                                onClick={() => {
                                  if (isSelected) {
                                    setSiteSettingsForm(prev => ({
                                      ...prev,
                                      featuredWeapons: prev.featuredWeapons.filter(id => id !== wid)
                                    }));
                                  } else if (siteSettingsForm.featuredWeapons.length < 4) {
                                    setSiteSettingsForm(prev => ({
                                      ...prev,
                                      featuredWeapons: [...prev.featuredWeapons, wid]
                                    }));
                                  }
                                }}
                              >
                                {w.imageUrl || w.image ? (
                                  <img src={w.imageUrl || w.image} alt={w.name} className="w-8 h-8 object-contain flex-shrink-0" />
                                ) : (
                                  <div className="w-8 h-8 bg-muted rounded flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{w.name}</p>
                                  <p className="text-xs text-muted-foreground">{w.category}</p>
                                </div>
                                {isSelected && <span className="text-primary text-xs font-bold">✓ Featured</span>}
                                {!isSelected && siteSettingsForm.featuredWeapons.length >= 4 && (
                                  <span className="text-xs text-muted-foreground">Max 4</span>
                                )}
                              </div>
                            );
                          })}
                        {(weapons || []).length === 0 && (
                          <p className="text-sm text-muted-foreground px-3 py-4 text-center">No weapons found. Add weapons in the CF Data tab first.</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSiteSettingsForm(prev => ({ ...prev, featuredWeapons: [] }))}
                        disabled={siteSettingsForm.featuredWeapons.length === 0}
                      >
                        Clear selection (use latest)
                      </Button>
                      <Button
                        onClick={() => updateSiteSettingsMutation.mutate(siteSettingsForm)}
                        disabled={updateSiteSettingsMutation.isPending}
                        size="sm"
                      >
                        {updateSiteSettingsMutation.isPending ? "Saving..." : "Save featured weapons"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Quick page preview menu</CardTitle>
                    <CardDescription>
                      Jump to common public pages quickly from admin so you can preview the site without hunting through the navigation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
                    <select
                      value={pagePreviewTarget}
                      onChange={(e) => setPagePreviewTarget(e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm md:min-w-[260px]"
                    >
                      {[
                        ["/", "Home"],
                        ["/news", "News"],
                        ["/videos", "Videos"],
                        ["/pricing", "Pricing"],
                        ["/sellers", "Sellers"],
                        ["/support", "Support"],
                        ["/contact", "Contact"],
                        ["/my-tickets", "My Tickets"],
                        ["/download", "Download"],
                        ["/weapons", "Weapons"],
                        ["/maps", "Maps"],
                        ["/ranks", "Ranks"],
                      ].map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" onClick={() => setLocation(pagePreviewTarget)}>
                        Open here
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          try { window.open(pagePreviewTarget, "_blank", "noopener,noreferrer"); } catch { }
                        }}
                      >
                        Open in new tab
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                      Full Admin Menu
                    </CardTitle>
                    <CardDescription>
                      Quick buttons to open every available section from one place.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {quickAccessTabs.map((tab) => (
                        <Button
                          key={tab.key}
                          variant={activeTab === tab.key ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveTab(tab.key)}
                          data-testid={`quick-menu-${tab.key}`}
                        >
                          {tab.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                      Full Admin Menu
                    </CardTitle>
                    <CardDescription>
                      Quick buttons to open every available section from one place.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {quickAccessTabs.map((tab) => (
                        <Button
                          key={tab.key}
                          variant={activeTab === tab.key ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveTab(tab.key)}
                          data-testid={`quick-menu-${tab.key}`}
                        >
                          {tab.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="media" className="space-y-6" data-testid="content-media">
                <MediaUpload onUploadSuccess={loadServerMedia} />
                <Card>
                  <CardHeader>
                    <CardTitle>Media Library</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Input placeholder="Search by public_id" value={mediaQuery} onChange={(e) => setMediaQuery(e.target.value)} className="w-48" />
                      <select value={mediaTypeFilter} onChange={(e) => setMediaTypeFilter(e.target.value)} className="h-9 px-3 rounded-md border border-input bg-background">
                        <option value="">All</option>
                        <option value="image">Images</option>
                        <option value="video">Videos</option>
                        <option value="audio">Audio</option>
                      </select>
                      <select value={mediaSort} onChange={(e) => setMediaSort(e.target.value as any)} className="h-9 px-3 rounded-md border border-input bg-background">
                        <option value="desc">Newest</option>
                        <option value="asc">Oldest</option>
                      </select>
                      <Button variant="outline" onClick={loadServerMedia} disabled={mediaLoading}>Refresh</Button>
                      <input
                        type="file"
                        accept="image/*,video/*,application/pdf"
                        multiple
                        className="hidden"
                        id="media-library-upload-input"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          setMediaUploading(true);
                          try {
                            const tokRes = await fetch('/api/security/csrf-token');
                            const tokJson = await tokRes.json();
                            const csrfToken = tokJson?.csrfToken || '';
                            let uploadedCount = 0;
                            for (const file of files) {
                              try {
                                const fd = new FormData();
                                fd.append('file', file);
                                const res = await fetch('/images/upload', {
                                  method: 'POST',
                                  headers: {
                                    'X-CSRF-Token': csrfToken,
                                    'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
                                  },
                                  body: fd,
                                });
                                const json = await res.json();
                                if (json.ok) uploadedCount++;
                                else toast({ title: `Upload failed: ${file.name}`, description: json.error || 'Unknown error', variant: 'destructive' });
                              } catch {
                                toast({ title: `Upload failed: ${file.name}`, variant: 'destructive' });
                              }
                            }
                            if (uploadedCount > 0) {
                              toast({ title: `${uploadedCount} file(s) uploaded successfully` });
                              await loadServerMedia();
                            }
                          } catch (err: any) {
                            toast({ title: 'Upload failed', description: err?.message, variant: 'destructive' });
                          } finally {
                            setMediaUploading(false);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button
                        variant="default"
                        disabled={mediaUploading}
                        onClick={() => document.getElementById('media-library-upload-input')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {mediaUploading ? 'Uploading...' : 'Upload Files'}
                      </Button>
                    </div>
                    {serverMedia.length === 0 ? (
                      <div className="text-sm text-muted-foreground">{mediaLoading ? 'Loading…' : 'No media found yet.'}</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {serverMedia.map((m) => {
                          const t = String(m.type || 'auto');
                          const isImage = t.startsWith('image');
                          const isVideo = t.startsWith('video');
                          const isAudio = t.startsWith('audio');
                          const previewUrl = m.domain_url || m.secure_url;
                          return (
                            <div key={m.secure_url + m.public_id} className="border rounded-md p-2 space-y-2">
                              <div className="aspect-video bg-muted rounded overflow-hidden flex items-center justify-center">
                                {isImage ? (
                                  <img src={previewUrl} alt={m.public_id} className="w-full h-full object-cover" loading="lazy" />
                                ) : isVideo ? (
                                  <video src={previewUrl} className="w-full h-full" controls preload="none" />
                                ) : isAudio ? (
                                  <audio src={previewUrl} className="w-full" controls preload="none" />
                                ) : (
                                  <a href={previewUrl} target="_blank" rel="noreferrer" className="text-xs text-primary">Open</a>
                                )}
                              </div>
                              <div className="text-xs break-all">{m.public_id}</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="text-[11px] break-all">Cloudinary: {m.secure_url}</div>
                                <div className="text-[11px] break-all">Domain: {m.domain_url}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => { try { navigator.clipboard.writeText(m.secure_url); toast({ title: 'Copied Cloudinary URL' }); } catch { } }}>Copy Cloudinary</Button>
                                <Button variant="outline" size="sm" onClick={() => { try { navigator.clipboard.writeText(m.domain_url); toast({ title: 'Copied Domain URL' }); } catch { } }}>Copy Domain</Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              {isSuperAdmin && (
                <TabsContent value="announcements" className="space-y-6" data-testid="content-announcements">
                  <AdminAnnouncements />
                </TabsContent>
              )}

              {canUsers && (
                <TabsContent value="users" className="space-y-6" data-testid="content-users">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Users</h2>
                    <div className="flex items-center gap-2">
                      <Badge variant={registrationClosed ? "destructive" : "secondary"} className="text-xs">
                        {registrationClosed ? "Registration Closed" : "Registration Open"}
                      </Badge>
                      <Button variant="outline" onClick={registrationClosed ? openRegistration : closeRegistration} data-testid="button-toggle-registration">
                        {registrationClosed ? "Open Registration" : "Close Registration"}
                      </Button>
                    </div>
                  </div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Registered Users</CardTitle>
                      <CardDescription>{usersLoading ? "Loading..." : `${users.length} users`}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead>Codes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((u) => (
                            <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                              <TableCell className="font-medium">{u.username}</TableCell>
                              <TableCell>{u.email || "—"}</TableCell>
                              <TableCell>{u.phone || "—"}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-xs">
                                  <Badge variant={u.verifiedEmail ? "default" : "secondary"}>Email {u.verifiedEmail ? "✔" : "✖"}</Badge>
                                  <Badge variant={u.verifiedPhone ? "default" : "secondary"}>Phone {u.verifiedPhone ? "✔" : "✖"}</Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs text-muted-foreground space-y-1">
                                  {u.phoneVerificationCode && <div>Phone Code: <span className="font-mono">{u.phoneVerificationCode}</span></div>}
                                  {u.emailVerificationCode && <div>Email Code: <span className="font-mono">{u.emailVerificationCode}</span></div>}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => generatePhoneCode(u.id)} data-testid={`button-gen-phone-${u.id}`}>Gen Phone Code</Button>
                                  <Button variant="ghost" size="sm" onClick={() => markVerified(u.id, "phone")} data-testid={`button-verify-phone-${u.id}`}>Mark Phone Verified</Button>
                                  <Button variant="ghost" size="sm" onClick={() => markVerified(u.id, "email")} data-testid={`button-verify-email-${u.id}`}>Mark Email Verified</Button>
                                  <Button variant="destructive" size="sm" onClick={() => kickUser(u.id)} data-testid={`button-kick-${u.id}`}>Kick</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {canPosts && (
                <TabsContent value="posts" className="space-y-6" data-testid="content-posts">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">Posts Management</h2>
                      <p className="text-sm text-muted-foreground">Find any post quickly and jump straight into edit mode.</p>
                    </div>
                    <div className="flex w-full max-w-md items-center gap-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={postSearch}
                        onChange={(e) => setPostSearch(e.target.value)}
                        placeholder="Search posts by title, slug, author, or category"
                        data-testid="input-search-posts"
                      />
                    </div>
                    <Dialog open={isCreatingPost} onOpenChange={(open) => {
                      setIsCreatingPost(open);
                      if (!open) {
                        setEditingPost(null);
                        resetPostForm();
                      }
                    }}>
                      <DialogTrigger asChild>
                        {canManagePosts && (
                          <Button data-testid="button-create-post">
                            <Plus className="h-4 w-4 mr-2" />
                            New Post
                          </Button>
                        )}
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {editingPost ? "Edit Post" : "Create New Post"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Title"
                            value={postForm.title}
                            onChange={(e) => {
                              const newTitle = e.target.value;
                              const generateSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)+/g, '').substring(0, 80);
                              const oldAutoSlug = generateSlug(postForm.title);
                              const currentSlug = postForm.post_slug;
                              const isAutoSlug = !currentSlug || currentSlug === oldAutoSlug;
                              setPostForm({
                                ...postForm,
                                title: newTitle,
                                post_slug: isAutoSlug ? generateSlug(newTitle) : currentSlug,
                              });
                            }}
                            data-testid="input-post-title"
                          />
                          <Input
                            placeholder="Custom Slug (auto-generated from title)"
                            value={postForm.post_slug}
                            onChange={(e) =>
                              setPostForm({ ...postForm, post_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)+/g, '') })
                            }
                            data-testid="input-post-slug"
                          />
                          <div className="flex items-center gap-2">
                            <Label>Language</Label>
                            <select
                              value={postForm.language}
                              onChange={(e) => setPostForm({ ...postForm, language: e.target.value })}
                              className="h-9 px-3 rounded-md border border-input bg-background"
                              data-testid="select-post-language"
                            >
                              <option value="en">English (LTR)</option>
                              <option value="ar">Arabic (RTL)</option>
                            </select>
                            <Badge variant="outline">{postForm.language === "ar" ? "RTL" : "LTR"}</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Content</Label>
                              {drafts.post && (
                                <Button variant="outline" size="sm" onClick={() => restoreDraft('post')}>
                                  <RotateCw className="h-3 w-3 mr-1" /> Restore Draft
                                </Button>
                              )}
                            </div>
                            <div data-testid="input-post-content">
                              <RichTextEditor
                                value={postForm.content}
                                onChange={(value) => setPostForm((prev) => ({ ...prev, content: value }))}
                                placeholder="Write your content here..."
                                direction={postForm.language === 'ar' ? 'rtl' : 'ltr'}
                                height={600}
                              />
                            </div>
                          </div>
                          <Textarea
                            placeholder="Summary (optional)"
                            value={postForm.summary}
                            onChange={(e) =>
                              setPostForm({ ...postForm, summary: e.target.value })
                            }
                            rows={2}
                            data-testid="input-post-summary"
                          />
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Main Image</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Image URL (paste or upload)"
                                value={postForm.image}
                                onChange={(e) =>
                                  setPostForm({ ...postForm, image: e.target.value })
                                }
                                data-testid="input-post-image"
                                className="flex-1"
                              />
                              <div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id="post-main-image-upload"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    try {
                                      const tokRes = await fetch('/api/security/csrf-token');
                                      const tokJson = await tokRes.json();
                                      const fd = new FormData();
                                      fd.append('file', file);
                                      fd.append('folder', 'posts');
                                      const xhr = new XMLHttpRequest();
                                      xhr.open('POST', '/images/upload', true);
                                      xhr.setRequestHeader('X-CSRF-Token', tokJson?.csrfToken || '');
                                      const result: any = await new Promise((resolve, reject) => {
                                        xhr.onreadystatechange = () => {
                                          if (xhr.readyState === 4) resolve({ ok: xhr.status < 300, body: JSON.parse(xhr.responseText || '{}') });
                                        };
                                        xhr.onerror = () => reject(new Error('Network error'));
                                        xhr.send(fd);
                                      });
                                      const url = result.body?.domain_url || result.body?.secure_url || '';
                                      if (result.ok && url) {
                                        setPostForm(prev => ({ ...prev, image: url }));
                                        toast({ title: "Image uploaded!", description: "Image URL set." });
                                      } else {
                                        toast({ title: "Upload failed", description: result.body?.error || "Unknown error", variant: "destructive" });
                                      }
                                    } catch (err: any) {
                                      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                                    }
                                  }}
                                />
                                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('post-main-image-upload')?.click()}>
                                  <Upload className="h-4 w-4 mr-1" />
                                  Upload
                                </Button>
                              </div>
                            </div>
                            {postForm.image && (
                              <img src={postForm.image} alt="Post preview" className="mt-1 h-20 w-full object-cover rounded border" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                            )}
                          </div>
                          <GalleryUploader
                            images={postForm.images}
                            onImagesChange={(newImages) => setPostForm({ ...postForm, images: newImages })}
                            toast={toast}
                          />
                          <select
                            value={postForm.category}
                            onChange={(e) =>
                              setPostForm({ ...postForm, category: e.target.value })
                            }
                            className="w-full h-9 px-3 rounded-md border border-input bg-background"
                            data-testid="select-post-category"
                          >
                            <option value="Tutorials">Tutorials</option>
                            <option value="News">News</option>
                            <option value="Reviews">Reviews</option>
                            <option value="Events">Events</option>
                          </select>
                          <Input
                            placeholder="Tags (comma separated)"
                            value={postForm.tags}
                            onChange={(e) =>
                              setPostForm({ ...postForm, tags: e.target.value })
                            }
                            data-testid="input-post-tags"
                          />
                          <Input
                            placeholder="Author"
                            value={postForm.author}
                            onChange={(e) =>
                              setPostForm({ ...postForm, author: e.target.value })
                            }
                            data-testid="input-post-author"
                          />
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={postForm.featured}
                              onChange={(e) =>
                                setPostForm({
                                  ...postForm,
                                  featured: e.target.checked,
                                })
                              }
                              data-testid="checkbox-post-featured"
                            />
                            <span className="text-sm">Featured</span>
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={postForm.previewOnHome}
                              onChange={(e) =>
                                setPostForm({
                                  ...postForm,
                                  previewOnHome: e.target.checked,
                                })
                              }
                              data-testid="checkbox-post-preview-home"
                            />
                            <span className="text-sm">Show on Home</span>
                          </label>
                          <label className="flex items-center gap-2 p-2 border border-primary/20 bg-primary/5 rounded">
                            <input
                              type="checkbox"
                              checked={postForm.fullLayout}
                              onChange={(e) =>
                                setPostForm({
                                  ...postForm,
                                  fullLayout: e.target.checked,
                                })
                              }
                            />
                            <span className="text-sm font-bold text-primary uppercase">Full Layout Mode (Wiki Style)</span>
                          </label>

                          <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-semibold">SEO Settings</h3>
                            <Input
                              placeholder="SEO Title (50-60 chars, optional)"
                              value={postForm.seoTitle}
                              onChange={(e) =>
                                setPostForm({ ...postForm, seoTitle: e.target.value })
                              }
                              maxLength={60}
                              data-testid="input-post-seo-title"
                            />
                            <Textarea
                              placeholder="Meta Description (120-155 chars, optional)"
                              value={postForm.seoDescription}
                              onChange={(e) =>
                                setPostForm({ ...postForm, seoDescription: e.target.value })
                              }
                              rows={2}
                              maxLength={155}
                              data-testid="input-post-seo-description"
                            />
                            <Input
                              placeholder="Keywords (comma separated, optional)"
                              value={postForm.seoKeywords}
                              onChange={(e) =>
                                setPostForm({ ...postForm, seoKeywords: e.target.value })
                              }
                              data-testid="input-post-seo-keywords"
                            />
                            {(() => {
                              const text = [postForm.title, postForm.summary, postForm.content].join(' ');
                              const plain = String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
                              const stop = new Set(["the", "and", "a", "an", "to", "of", "in", "on", "for", "with", "by", "is", "are", "was", "were", "be", "as", "at", "from", "that", "this", "it", "or", "if", "but", "about", "into", "over", "after", "before", "under", "above", "between", "من", "على", "في", "عن", "و", "ما", "لا", "لم", "لن", "إلى", "الى", "كان", "كانت", "ذلك", "هذه", "هذا", "قد", "لقد", "كما"]);
                              const parts = plain.replace(/[^\p{L}\p{N}\s]+/gu, ' ').split(/\s+/).filter((w) => w && w.length > 2 && !stop.has(w));
                              const freq = new Map<string, number>();
                              for (const w of parts) freq.set(w, (freq.get(w) || 0) + 1);
                              const suggestions = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).map(([w]) => w).slice(0, 8);
                              const current = (postForm.seoKeywords || '').split(',').map(s => s.trim()).filter(Boolean);
                              return suggestions.length ? (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {suggestions.map((s) => (
                                    <Badge key={s} variant={current.includes(s) ? 'default' : 'outline'} onClick={() => {
                                      const next = Array.from(new Set([...current, s]));
                                      setPostForm({ ...postForm, seoKeywords: next.join(', ') });
                                    }} className="cursor-pointer">
                                      {s}
                                    </Badge>
                                  ))}
                                </div>
                              ) : null;
                            })()}
                            <Input
                              placeholder="Canonical URL (optional)"
                              value={postForm.canonicalUrl}
                              onChange={(e) =>
                                setPostForm({ ...postForm, canonicalUrl: e.target.value })
                              }
                              data-testid="input-post-canonical"
                            />
                            <Input
                              placeholder="OG Image URL (optional)"
                              value={postForm.ogImage}
                              onChange={(e) =>
                                setPostForm({ ...postForm, ogImage: e.target.value })
                              }
                              data-testid="input-post-og-image"
                            />
                            <Input
                              placeholder="Twitter Image URL (optional)"
                              value={postForm.twitterImage}
                              onChange={(e) =>
                                setPostForm({ ...postForm, twitterImage: e.target.value })
                              }
                              data-testid="input-post-twitter-image"
                            />
                            <select
                              value={postForm.schemaType}
                              onChange={(e) =>
                                setPostForm({ ...postForm, schemaType: e.target.value })
                              }
                              className="w-full h-9 px-3 rounded-md border border-input bg-background"
                              data-testid="select-post-schema-type"
                            >
                              <option value="Article">Article</option>
                              <option value="BlogPosting">BlogPosting</option>
                              <option value="NewsArticle">NewsArticle</option>
                            </select>
                          </div>

                          <Button
                            onClick={() => {
                              const contentHtml = postForm.content;
                              const plain = String(postForm.content || postForm.summary || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                              let seoDesc = (postForm.seoDescription || '').trim();
                              if (!seoDesc || seoDesc.length < 60 || seoDesc.length > 160) {
                                const d = plain.substring(0, 160).trim();
                                seoDesc = d.length < 60 ? plain.substring(0, Math.min(160, Math.max(60, plain.length))).trim() : d;
                              }
                              const kwStr = (postForm.seoKeywords || '').trim();
                              let kws = kwStr ? kwStr.split(',').map(k => k.trim()).filter(Boolean) : [];
                              if (kws.length === 0) {
                                const text = [postForm.title, postForm.summary, postForm.content].join(' ');
                                const plainAll = String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').toLowerCase();
                                const stop = new Set(["the", "and", "a", "an", "to", "of", "in", "on", "for", "with", "by", "is", "are", "was", "were", "be", "as", "at", "from", "that", "this", "it", "or", "if", "but", "about", "into", "over", "after", "before", "under", "above", "between", "من", "على", "في", "عن", "و", "ما", "لا", "لم", "لن", "إلى", "الى", "كان", "كانت", "ذلك", "هذه", "هذا", "قد", "لقد", "كما"]);
                                const parts = plainAll.replace(/[^\p{L}\p{N}\s]+/gu, ' ').split(/\s+/).filter((w) => w && w.length > 2 && !stop.has(w));
                                const freq = new Map<string, number>();
                                for (const w of parts) freq.set(w, (freq.get(w) || 0) + 1);
                                kws = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).map(([w]) => w).slice(0, 8);
                              }
                              const data = {
                                ...postForm,
                                content: contentHtml,
                                language: postForm.language,
                                seoDescription: seoDesc,
                                tags: postForm.tags.split(",").map((t) => t.trim()),
                                seoKeywords: kws,
                              };
                              if (editingPost) {
                                updatePostMutation.mutate({ id: editingPost.id, data });
                              } else {
                                createPostMutation.mutate(data);
                              }
                            }}
                            className="flex-1"
                            data-testid="button-submit-post"
                          >
                            {editingPost ? "Update Post" : "Create Post"}
                          </Button>
                          {editingPost && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => window.open(`/posts/${editingPost.id}`, '_blank')}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Live
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-4">
                    {posts?.map((post: any) => (
                      <Card key={post.id} data-testid={`post-card-${post.id}`}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="font-semibold">{post.title}</h3>
                                {post.featured && (
                                  <Badge variant="default" className="text-xs">
                                    Featured
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {post.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {post.summary}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span>{post.views}</span>
                                </div>
                                <span>•</span>
                                <span>{post.author}</span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(`/posts/${post.id}`, '_blank')}
                                title="View Post"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canManagePosts && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingPost(post);
                                    setPostForm({
                                      title: post.title,
                                      post_slug: post.post_slug || "",
                                      content: post.content,
                                      summary: post.summary,
                                      image: post.image,
                                      images: post.images || [],
                                      category: post.category,
                                      tags: post.tags.join(", "),
                                      author: post.author,
                                      featured: post.featured,
                                      previewOnHome: post.previewOnHome !== false,
                                      readingTime: post.readingTime,
                                      language: post.language || 'en',
                                      seoTitle: post.seoTitle || "",
                                      seoDescription: post.seoDescription || "",
                                      seoKeywords: post.seoKeywords?.join(", ") || "",
                                      canonicalUrl: post.canonicalUrl || "",
                                      ogImage: post.ogImage || "",
                                      twitterImage: post.twitterImage || "",
                                      schemaType: post.schemaType || "Article",
                                      fullLayout: post.fullLayout || false,
                                      sourceUrl: post.sourceUrl || "",
                                      isVerified: post.isVerified || false,
                                      externalLinks: post.externalLinks || [],
                                    });
                                    setIsCreatingPost(true);
                                  }}
                                  data-testid={`button-edit-post-${post.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canManagePosts && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setDeleteConfirmId(post.id);
                                    setDeleteType("post");
                                  }}
                                  data-testid={`button-delete-post-${post.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              {canManagePosts && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const max = Math.max(...(posts?.map((p: any) => p.order || 0) || [0]));
                                      updatePostMutation.mutate({ id: post.id, data: { order: max + 1 } });
                                    }}
                                    data-testid={`button-post-first-${post.id}`}
                                  >
                                    First
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const next = (post.order || 0) + 1;
                                      updatePostMutation.mutate({ id: post.id, data: { order: next } });
                                    }}
                                    data-testid={`button-post-up-${post.id}`}
                                  >
                                    Up
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const next = Math.max(0, (post.order || 0) - 1);
                                      updatePostMutation.mutate({ id: post.id, data: { order: next } });
                                    }}
                                    data-testid={`button-post-down-${post.id}`}
                                  >
                                    Down
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {renderPagination(postsPage, totalPosts, setPostsPage)}
                </TabsContent>
              )}

              {canEventsNews && (
                <TabsContent value="events-news" className="space-y-6" data-testid="content-events-news">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div />
                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h2 className="text-2xl font-semibold">Events</h2>
                          <p className="text-sm text-muted-foreground">Search existing events and edit any record from the list below.</p>
                        </div>
                        <div className="flex w-full max-w-md items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Input
                            value={eventSearch}
                            onChange={(e) => setEventSearch(e.target.value)}
                            placeholder="Search events by title, slug, date, or type"
                            data-testid="input-search-events"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {isSuperAdmin && (
                            <Button
                              variant="secondary"
                              onClick={async () => {
                                try {
                                  const orders = events.map((e: any) => ({
                                    id: e.id,
                                    order: parseInt(String((document.getElementById(`event-order-${e.id}`) as HTMLInputElement)?.value || e.order || 0))
                                  }));
                                  await apiRequest("/api/events/reorder", "PATCH", { orders });
                                  queryClient.invalidateQueries({ queryKey: ["/api/events"] });
                                  toast({ title: "Orders saved successfully" });
                                } catch (e: any) {
                                  toast({ title: "Failed to save orders", description: e.message, variant: "destructive" });
                                }
                              }}
                            >
                              <RotateCw className="h-4 w-4 mr-2" />
                              Save All Orders
                            </Button>
                          )}
                          {canEventsNews && (
                            <Dialog open={showFandomDialog} onOpenChange={setShowFandomDialog}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Globe className="h-4 w-4 mr-2" />
                                  Import from Fandom Wiki
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Import from CrossFire Fandom Wiki</DialogTitle>
                                  <DialogDescription>
                                    Fetch articles, weapons, and content from the official CrossFire Fandom wiki and import them into your site.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>Import single article (by page title)</Label>
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="e.g. AK-47, Barrett M82A1..."
                                        value={fandomSingleArticle}
                                        onChange={e => setFandomSingleArticle(e.target.value)}
                                      />
                                      <Button
                                        onClick={() => fandomArticleMutation.mutate({ pageTitle: fandomSingleArticle, importAs: "post" })}
                                        disabled={fandomArticleMutation.isPending || !fandomSingleArticle.trim()}
                                      >
                                        {fandomArticleMutation.isPending ? "..." : "Import"}
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="border-t pt-4 space-y-3">
                                    <Label className="font-bold">Bulk import by category</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Category</Label>
                                        <select
                                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                          value={fandomCategory}
                                          onChange={e => setFandomCategory(e.target.value)}
                                        >
                                          <option>Weapons</option>
                                          <option>Characters</option>
                                          <option>Maps</option>
                                          <option>Game Modes</option>
                                          <option>Items</option>
                                        </select>
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Import as</Label>
                                        <select
                                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                          value={fandomImportAs}
                                          onChange={e => setFandomImportAs(e.target.value)}
                                        >
                                          <option value="weapon">Weapon</option>
                                          <option value="post">Article / Post</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs text-muted-foreground">Limit (max 50)</Label>
                                      <Input
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={fandomLimit}
                                        onChange={e => setFandomLimit(Math.min(50, Math.max(1, parseInt(e.target.value) || 10)))}
                                      />
                                    </div>
                                    <Button
                                      className="w-full"
                                      onClick={() => fandomImportMutation.mutate({ category: fandomCategory, limit: fandomLimit, importAs: fandomImportAs })}
                                      disabled={fandomImportMutation.isPending}
                                    >
                                      {fandomImportMutation.isPending ? "Importing... (this may take a minute)" : `Import ${fandomLimit} ${fandomCategory} from Fandom`}
                                    </Button>
                                  </div>
                                  {fandomImportResult && (
                                    <div className="border rounded-lg p-3 bg-muted/50 text-sm space-y-2">
                                      <p className="font-bold">{fandomImportResult.message}</p>
                                      {fandomImportResult.results?.imported?.length > 0 && (
                                        <div>
                                          <p className="text-xs text-muted-foreground mb-1">Imported:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {fandomImportResult.results.imported.slice(0, 10).map((r: any) => (
                                              <Badge key={r.title} variant="secondary" className="text-xs">{r.title}</Badge>
                                            ))}
                                            {fandomImportResult.results.imported.length > 10 && (
                                              <Badge variant="outline" className="text-xs">+{fandomImportResult.results.imported.length - 10} more</Badge>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          {isSuperAdmin && (
                            <Button
                              variant="outline"
                              onClick={() => migrateSlugsMutation.mutate()}
                              disabled={migrateSlugsMutation.isPending}
                              data-testid="button-migrate-slugs"
                            >
                              {migrateSlugsMutation.isPending ? "Migrating..." : "Migrate Slugs"}
                            </Button>
                          )}
                          {migrationCounts && (
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Events: {migrationCounts.events}</Badge>
                              <Badge variant="secondary">Posts: {migrationCounts.posts}</Badge>
                              <Badge variant="secondary">News: {migrationCounts.news}</Badge>
                            </div>
                          )}
                        </div>
                        <Dialog open={isCreatingEvent} onOpenChange={(open) => {
                          setIsCreatingEvent(open);
                          if (!open) {
                            setEditingEvent(null);
                            resetEventForm();
                            setEventValidationErrors([]);
                          }
                        }}>
                          <DialogTrigger asChild>
                            {canManageEvents && (
                              <Button data-testid="button-create-event">
                                <Plus className="h-4 w-4 mr-2" />
                                New Event
                              </Button>
                            )}
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex items-center justify-between">
                              <DialogTitle>
                                {editingEvent ? "Edit Event" : "Create New Event"}
                              </DialogTitle>
                              {drafts.event && (
                                <Button variant="outline" size="sm" onClick={() => restoreDraft('event')}>
                                  <RotateCw className="h-3 w-3 mr-1" /> Restore Draft
                                </Button>
                              )}
                            </div>
                            <div className="space-y-6">
                              <Input
                                placeholder="Title (English)"
                                value={eventForm.title}
                                onChange={(e) =>
                                  setEventForm({ ...eventForm, title: e.target.value })
                                }
                                data-testid="input-event-title"
                              />
                              <Input
                                placeholder="Title (Arabic) - العنوان بالعربية"
                                value={eventForm.titleAr}
                                onChange={(e) =>
                                  setEventForm({ ...eventForm, titleAr: e.target.value })
                                }
                                dir="rtl"
                                data-testid="input-event-title-ar"
                              />
                              <Input
                                placeholder="Custom Slug (optional - auto if empty)"
                                value={eventForm.event_name_slug}
                                onChange={(e) =>
                                  setEventForm({ ...eventForm, event_name_slug: e.target.value })
                                }
                                data-testid="input-event-slug"
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div data-testid="input-event-description">
                                  <RichTextEditor
                                    value={eventForm.description}
                                    onChange={(value) => setEventForm((prev) => ({ ...prev, description: value }))}
                                    height={320}
                                    direction="ltr"
                                  />
                                </div>
                                <div data-testid="input-event-description-ar">
                                  <RichTextEditor
                                    value={eventForm.descriptionAr}
                                    onChange={(value) => setEventForm((prev) => ({ ...prev, descriptionAr: value }))}
                                    height={320}
                                    direction="rtl"
                                  />
                                </div>
                              </div>
                              <Input
                                placeholder="Date"
                                value={eventForm.date}
                                onChange={(e) =>
                                  setEventForm({ ...eventForm, date: e.target.value })
                                }
                                data-testid="input-event-date"
                              />
                              <div className="space-y-1">
                                <Label className="text-sm font-medium">Main Image</Label>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Image URL (paste or upload below)"
                                    value={eventForm.image}
                                    onChange={(e) =>
                                      setEventForm({ ...eventForm, image: e.target.value })
                                    }
                                    data-testid="input-event-image"
                                    className="flex-1"
                                  />
                                  <div>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      id="event-main-image-upload"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          const tokRes = await fetch('/api/security/csrf-token');
                                          const tokJson = await tokRes.json();
                                          const fd = new FormData();
                                          fd.append('file', file);
                                          fd.append('folder', 'events');
                                          const xhr = new XMLHttpRequest();
                                          xhr.open('POST', '/images/upload', true);
                                          xhr.setRequestHeader('X-CSRF-Token', tokJson?.csrfToken || '');
                                          const result: any = await new Promise((resolve, reject) => {
                                            xhr.onreadystatechange = () => {
                                              if (xhr.readyState === 4) resolve({ ok: xhr.status < 300, body: JSON.parse(xhr.responseText || '{}') });
                                            };
                                            xhr.onerror = () => reject(new Error('Network error'));
                                            xhr.send(fd);
                                          });
                                          const url = result.body?.domain_url || result.body?.secure_url || '';
                                          if (result.ok && url) {
                                            setEventForm(prev => ({ ...prev, image: url }));
                                            toast({ title: "Image uploaded!", description: "Image URL set." });
                                          } else {
                                            toast({ title: "Upload failed", description: result.body?.error || "Unknown error", variant: "destructive" });
                                          }
                                        } catch (err: any) {
                                          toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                                        }
                                      }}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('event-main-image-upload')?.click()}>
                                      <Upload className="h-4 w-4 mr-1" />
                                      Upload
                                    </Button>
                                  </div>
                                </div>
                                {eventForm.image && (
                                  <img src={eventForm.image} alt="Event preview" className="mt-2 h-24 w-full object-cover rounded border" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                                )}
                              </div>
                              <GalleryUploader
                                images={eventForm.images}
                                onImagesChange={(newImages) => setEventForm({ ...eventForm, images: newImages })}
                                toast={toast}
                              />
                              <select
                                value={eventForm.type}
                                onChange={(e) =>
                                  setEventForm({
                                    ...eventForm,
                                    type: e.target.value as "upcoming" | "trending",
                                  })
                                }
                                className="w-full h-9 px-3 rounded-md border border-input bg-background"
                                data-testid="select-event-type"
                              >
                                <option value="upcoming">Upcoming</option>
                                <option value="trending">Trending</option>
                              </select>

                              <label className="flex items-center gap-2 p-2 border border-primary/20 bg-primary/5 rounded">
                                <input
                                  type="checkbox"
                                  checked={eventForm.fullLayout}
                                  onChange={(e) =>
                                    setEventForm({
                                      ...eventForm,
                                      fullLayout: e.target.checked,
                                    })
                                  }
                                />
                                <span className="text-sm font-bold text-primary uppercase">Full Layout Mode (Wiki Style)</span>
                              </label>
                              <p className="text-xs text-muted-foreground -mt-2">
                                Advanced CSS/JS blocks are preserved only when Full Layout is enabled.
                              </p>

                              <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-sm font-semibold">SEO Settings</h3>
                                <Input
                                  placeholder="SEO Title (50-60 chars, optional)"
                                  value={eventForm.seoTitle}
                                  onChange={(e) =>
                                    setEventForm({ ...eventForm, seoTitle: e.target.value })
                                  }
                                  maxLength={60}
                                  data-testid="input-event-seo-title"
                                />
                                <Textarea
                                  placeholder="Meta Description (120-155 chars, optional)"
                                  value={eventForm.seoDescription}
                                  onChange={(e) =>
                                    setEventForm({ ...eventForm, seoDescription: e.target.value })
                                  }
                                  rows={2}
                                  maxLength={155}
                                  data-testid="input-event-seo-description"
                                />
                                <Input
                                  placeholder="Keywords (comma separated, optional)"
                                  value={eventForm.seoKeywords}
                                  onChange={(e) =>
                                    setEventForm({ ...eventForm, seoKeywords: e.target.value })
                                  }
                                  data-testid="input-event-seo-keywords"
                                />
                                <Input
                                  placeholder="Canonical URL (optional)"
                                  value={eventForm.canonicalUrl}
                                  onChange={(e) =>
                                    setEventForm({ ...eventForm, canonicalUrl: e.target.value })
                                  }
                                  data-testid="input-event-canonical"
                                />
                                <Input
                                  placeholder="OG Image URL (optional)"
                                  value={eventForm.ogImage}
                                  onChange={(e) =>
                                    setEventForm({ ...eventForm, ogImage: e.target.value })
                                  }
                                  data-testid="input-event-og-image"
                                />
                                <Input
                                  placeholder="Twitter Image URL (optional)"
                                  value={eventForm.twitterImage}
                                  onChange={(e) =>
                                    setEventForm({ ...eventForm, twitterImage: e.target.value })
                                  }
                                  data-testid="input-event-twitter-image"
                                />
                              </div>

                              {eventValidationErrors.length > 0 && (
                                <Alert variant="destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>Fix the highlighted event form issues</AlertTitle>
                                  <AlertDescription>
                                    <ul className="list-disc space-y-1 pl-5">
                                      {eventValidationErrors.map((error) => (
                                        <li key={error}>{error}</li>
                                      ))}
                                    </ul>
                                  </AlertDescription>
                                </Alert>
                              )}

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => {
                                    const descHtml = eventForm.description;
                                    const descArHtml = eventForm.descriptionAr;
                                    const errors = validateEventForm(eventForm);

                                    if (errors.length > 0) {
                                      setEventValidationErrors(errors);
                                      toast({ title: "Event form needs attention", description: errors[0], variant: "destructive" });
                                      return;
                                    }

                                    setEventValidationErrors([]);

                                    const cleanTitle = String(eventForm.title || "").trim();
                                    const cleanTitleAr = String(eventForm.titleAr || "").trim();
                                    const customSlug = normalizeSlugValue(eventForm.event_name_slug || "");
                                    const generatedSlug = normalizeSlugValue(cleanTitle || cleanTitleAr || "event");
                                    const finalSlug = customSlug || generatedSlug || "event";

                                    const data = {
                                      ...eventForm,
                                      description: descHtml,
                                      descriptionAr: descArHtml,
                                      event_name_slug: finalSlug,
                                      seoKeywords: eventForm.seoKeywords
                                        ? eventForm.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean)
                                        : [],
                                    };
                                    const base = typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : '';
                                    const canonical = base ? `${base}/events/${finalSlug}` : `https://crossfire.wiki/events/${finalSlug}`;
                                    (data as any).canonicalUrl = String(data.canonicalUrl || "").trim() || canonical;
                                    if (editingEvent) {
                                      updateEventMutation.mutate({ id: editingEvent.id, data });
                                    } else {
                                      createEventMutation.mutate(data);
                                    }
                                  }}
                                  className="flex-1"
                                  disabled={createEventMutation.isPending || updateEventMutation.isPending}
                                  data-testid="button-submit-event"
                                >
                                  {createEventMutation.isPending || updateEventMutation.isPending ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
                                </Button>
                                {editingEvent && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.open(`/events/${editingEvent.event_name_slug || editingEvent.id}`, '_blank')}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Live
                                  </Button>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="space-y-3">
                        {eventsError && (
                          <Alert variant="destructive">
                            <AlertTitle>Error loading events</AlertTitle>
                            <AlertDescription>
                              {eventsError.message || "Failed to load events data"}
                            </AlertDescription>
                          </Alert>
                        )}
                        {eventsLoading && (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        )}
                        {events?.map((event: any) => (
                          <Card key={event.id} data-testid={`event-card-${event.id}`}>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="font-semibold">{event.title}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      {event.type}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{event.date}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => window.open(`/events/${event.event_name_slug || event.id}`, '_blank')}
                                    title="View Event"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {canManageEvents && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setEditingEvent(event);
                                        setEventForm({
                                          title: event.title,
                                          titleAr: event.titleAr || "",
                                          description: event.description || "",
                                          descriptionAr: event.descriptionAr || "",
                                          date: event.date,
                                          type: event.type,
                                          image: event.imageUrl || event.image || "",
                                          images: event.images || [],
                                          event_name_slug: event.event_name_slug || "",
                                          seoTitle: event.seoTitle || "",
                                          seoDescription: event.seoDescription || "",
                                          seoKeywords: event.seoKeywords?.join(", ") || "",
                                          canonicalUrl: event.canonicalUrl || "",
                                          ogImage: event.ogImage || "",
                                          twitterImage: event.twitterImage || "",
                                          schemaType: event.schemaType || "Event",
                                          fullLayout: event.fullLayout || false,
                                          sourceUrl: event.sourceUrl || "",
                                          isVerified: event.isVerified || false,
                                          externalLinks: event.externalLinks || [],
                                        });
                                        setIsCreatingEvent(true);
                                      }}
                                      data-testid={`button-edit-event-${event.id}`}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {canManageEvents && (
                                    <div className="flex items-center gap-2">
                                      <div className="flex flex-col items-center">
                                        <Label htmlFor={`event-order-${event.id}`} className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Order</Label>
                                        <Input
                                          id={`event-order-${event.id}`}
                                          type="number"
                                          defaultValue={event.order || 0}
                                          className="w-16 h-8 text-center"
                                          onBlur={async (e) => {
                                            const newOrder = parseInt(e.target.value);
                                            if (!isNaN(newOrder) && newOrder !== event.order) {
                                              try {
                                                await apiRequest(`/api/events/${event.id}`, "PATCH", { order: newOrder });
                                                queryClient.invalidateQueries({ queryKey: ["/api/events"] });
                                                toast({ title: "Order updated" });
                                              } catch (err: any) {
                                                toast({ title: "Failed to update order", description: err.message, variant: "destructive" });
                                              }
                                            }
                                          }}
                                        />
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setDeleteConfirmId(event.id);
                                          setDeleteType("event");
                                        }}
                                        data-testid={`button-delete-event-${event.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {renderPagination(eventsPage, totalEvents, setEventsPage)}
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h2 className="text-2xl font-semibold">News</h2>
                          <p className="text-sm text-muted-foreground">Search and edit any published news item without leaving the table.</p>
                        </div>
                        <div className="flex w-full max-w-md items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Input
                            value={newsSearch}
                            onChange={(e) => setNewsSearch(e.target.value)}
                            placeholder="Search news by title, slug, author, or category"
                            data-testid="input-search-news"
                          />
                        </div>
                        <Dialog open={isCreatingNews} onOpenChange={(open) => {
                          setIsCreatingNews(open);
                          if (!open) {
                            setEditingNews(null);
                            resetNewsForm();
                          }
                        }}>
                          <DialogTrigger asChild>
                            {canManageNews && (
                              <Button data-testid="button-create-news">
                                <Plus className="h-4 w-4 mr-2" />
                                New News
                              </Button>
                            )}
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex items-center justify-between">
                              <DialogTitle>
                                {editingNews ? "Edit News Item" : "Create New News Item"}
                              </DialogTitle>
                              {drafts.news && (
                                <Button variant="outline" size="sm" onClick={() => restoreDraft('news')}>
                                  <RotateCw className="h-3 w-3 mr-1" /> Restore Draft
                                </Button>
                              )}
                            </div>
                            <div className="space-y-6">
                              <Input
                                placeholder="Title (English)"
                                value={newsForm.title}
                                onChange={(e) => {
                                  const newTitle = e.target.value;
                                  const generateSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/(^-|-$)+/g, '').substring(0, 80);
                                  const oldAutoSlug = generateSlug(newsForm.title);
                                  const currentSlug = newsForm.news_slug;
                                  const isAutoSlug = !currentSlug || currentSlug === oldAutoSlug;
                                  setNewsForm({
                                    ...newsForm,
                                    title: newTitle,
                                    news_slug: isAutoSlug ? generateSlug(newTitle) : currentSlug,
                                  });
                                }}
                                data-testid="input-news-title"
                              />
                              <Input
                                placeholder="Title (Arabic) - العنوان بالعربية"
                                value={newsForm.titleAr}
                                onChange={(e) =>
                                  setNewsForm({ ...newsForm, titleAr: e.target.value })
                                }
                                dir="rtl"
                                data-testid="input-news-title-ar"
                              />
                              <Input
                                placeholder="Custom Slug (auto-generated from title)"
                                value={newsForm.news_slug}
                                onChange={(e) =>
                                  setNewsForm({ ...newsForm, news_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)+/g, '') })
                                }
                                data-testid="input-news-slug"
                              />
                              <Input
                                placeholder="Date Range (e.g., Oct 15 - Nov 4)"
                                value={newsForm.dateRange}
                                onChange={(e) =>
                                  setNewsForm({ ...newsForm, dateRange: e.target.value })
                                }
                                data-testid="input-news-daterange"
                              />
                              <div className="space-y-1">
                                <Label className="text-sm font-medium">Main Image</Label>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Image URL (paste or upload)"
                                    value={newsForm.image}
                                    onChange={(e) =>
                                      setNewsForm({ ...newsForm, image: e.target.value })
                                    }
                                    data-testid="input-news-image"
                                    className="flex-1"
                                  />
                                  <div>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      id="news-main-image-upload"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                          const tokRes = await fetch('/api/security/csrf-token');
                                          const tokJson = await tokRes.json();
                                          const fd = new FormData();
                                          fd.append('file', file);
                                          fd.append('folder', 'news');
                                          const xhr = new XMLHttpRequest();
                                          xhr.open('POST', '/images/upload', true);
                                          xhr.setRequestHeader('X-CSRF-Token', tokJson?.csrfToken || '');
                                          const result: any = await new Promise((resolve, reject) => {
                                            xhr.onreadystatechange = () => {
                                              if (xhr.readyState === 4) resolve({ ok: xhr.status < 300, body: JSON.parse(xhr.responseText || '{}') });
                                            };
                                            xhr.onerror = () => reject(new Error('Network error'));
                                            xhr.send(fd);
                                          });
                                          const url = result.body?.domain_url || result.body?.secure_url || '';
                                          if (result.ok && url) {
                                            setNewsForm(prev => ({ ...prev, image: url }));
                                            toast({ title: "Image uploaded!", description: "Image URL set." });
                                          } else {
                                            toast({ title: "Upload failed", description: result.body?.error || "Unknown error", variant: "destructive" });
                                          }
                                        } catch (err: any) {
                                          toast({ title: "Upload failed", description: err.message, variant: "destructive" });
                                        }
                                      }}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('news-main-image-upload')?.click()}>
                                      <Upload className="h-4 w-4 mr-1" />
                                      Upload
                                    </Button>
                                  </div>
                                </div>
                                {newsForm.image && (
                                  <img src={newsForm.image} alt="News preview" className="mt-1 h-20 w-full object-cover rounded border" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
                                )}
                              </div>
                              <GalleryUploader
                                images={newsForm.images}
                                onImagesChange={(newImages) => setNewsForm({ ...newsForm, images: newImages })}
                                toast={toast}
                              />
                              <select
                                value={newsForm.category}
                                onChange={(e) =>
                                  setNewsForm({ ...newsForm, category: e.target.value })
                                }
                                className="w-full h-9 px-3 rounded-md border border-input bg-background"
                                data-testid="select-news-category"
                              >
                                <option value="News">News</option>
                                <option value="Events">Events</option>
                                <option value="Reviews">Reviews</option>
                                <option value="Tutorials">Tutorials</option>
                              </select>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium">Content (English)</label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const text = prompt("Paste your content here:");
                                      if (text) {
                                        setPastedContent(text);
                                        setIsPasteFormatterOpen(true);
                                      }
                                    }}
                                    className="text-xs"
                                  >
                                    📋 Smart Paste
                                  </Button>
                                </div>
                                <div data-testid="input-news-content">
                                  <RichTextEditor
                                    value={newsForm.content}
                                    onChange={(value) => setNewsForm((prev) => ({ ...prev, content: value }))}
                                    height={320}
                                    direction="ltr"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">Content (Arabic) - المحتوى بالعربية</label>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const text = prompt("Paste your content here:");
                                        if (text) {
                                          setPastedContent(text);
                                          setIsPasteFormatterOpen(true);
                                        }
                                      }}
                                      className="text-xs"
                                    >
                                      📋 Smart Paste
                                    </Button>
                                  </div>
                                  <div data-testid="input-news-content-ar">
                                    <RichTextEditor
                                      value={newsForm.contentAr}
                                      onChange={(value) => setNewsForm((prev) => ({ ...prev, contentAr: value }))}
                                      height={320}
                                      direction="rtl"
                                    />
                                  </div>
                                </div>
                              </div>
                              <Input
                                placeholder="Author"
                                value={newsForm.author}
                                onChange={(e) =>
                                  setNewsForm({ ...newsForm, author: e.target.value })
                                }
                                data-testid="input-news-author"
                              />
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={newsForm.featured}
                                  onChange={(e) =>
                                    setNewsForm({
                                      ...newsForm,
                                      featured: e.target.checked,
                                    })
                                  }
                                  data-testid="checkbox-news-featured"
                                />
                                <span className="text-sm">Featured</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={newsForm.previewOnHome}
                                  onChange={(e) =>
                                    setNewsForm({
                                      ...newsForm,
                                      previewOnHome: e.target.checked,
                                    })
                                  }
                                  data-testid="checkbox-news-preview-home"
                                />
                                <span className="text-sm">Show on Home</span>
                              </label>
                              <label className="flex items-center gap-2 p-2 border border-primary/20 bg-primary/5 rounded">
                                <input
                                  type="checkbox"
                                  checked={newsForm.fullLayout}
                                  onChange={(e) =>
                                    setNewsForm({
                                      ...newsForm,
                                      fullLayout: e.target.checked,
                                    })
                                  }
                                />
                                <span className="text-sm font-bold text-primary uppercase">Full Layout Mode (Wiki Style)</span>
                              </label>

                              <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-sm font-semibold">SEO Settings</h3>
                                {editingNews && (
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <Badge variant={(editingNews.seoTitle && editingNews.seoTitle.trim()) ? "default" : "secondary"}>SEO Title</Badge>
                                    <Badge variant={(editingNews.seoDescription && editingNews.seoDescription.trim()) ? "default" : "secondary"}>Meta Description</Badge>
                                    <Badge variant={(Array.isArray(editingNews.seoKeywords) && editingNews.seoKeywords.length) ? "default" : "secondary"}>Keywords</Badge>
                                    <Badge variant={(editingNews.canonicalUrl && editingNews.canonicalUrl.trim()) ? "default" : "secondary"}>Canonical</Badge>
                                    <Badge variant={(editingNews.ogImage && editingNews.ogImage.trim()) ? "default" : "secondary"}>OG Image</Badge>
                                    <Badge variant={(editingNews.twitterImage && editingNews.twitterImage.trim()) ? "default" : "secondary"}>Twitter Image</Badge>
                                    <div className="col-span-2 flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            await queryClient.invalidateQueries({ queryKey: ["/api/news"] });
                                            const refreshed = await apiRequest(`/api/news/${editingNews.id}`, "GET");
                                            setEditingNews(refreshed);
                                            toast({ title: "SEO/OG refreshed" });
                                          } catch (e: any) {
                                            toast({ title: "Refresh failed", description: e?.message || String(e), variant: "destructive" });
                                          }
                                        }}
                                      >
                                        Refresh SEO/OG
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                <Input
                                  placeholder="SEO Title (50-60 chars, optional)"
                                  value={newsForm.seoTitle}
                                  onChange={(e) =>
                                    setNewsForm({ ...newsForm, seoTitle: e.target.value })
                                  }
                                  maxLength={60}
                                  data-testid="input-news-seo-title"
                                />
                                <Textarea
                                  placeholder="Meta Description (120-155 chars, optional)"
                                  value={newsForm.seoDescription}
                                  onChange={(e) =>
                                    setNewsForm({ ...newsForm, seoDescription: e.target.value })
                                  }
                                  rows={2}
                                  maxLength={155}
                                  data-testid="input-news-seo-description"
                                />
                                <Input
                                  placeholder="Keywords (comma separated, optional)"
                                  value={newsForm.seoKeywords}
                                  onChange={(e) =>
                                    setNewsForm({ ...newsForm, seoKeywords: e.target.value })
                                  }
                                  data-testid="input-news-seo-keywords"
                                />
                                <Input
                                  placeholder="Canonical URL (optional)"
                                  value={newsForm.canonicalUrl}
                                  onChange={(e) =>
                                    setNewsForm({ ...newsForm, canonicalUrl: e.target.value })
                                  }
                                  data-testid="input-news-canonical"
                                />
                                <Input
                                  placeholder="OG Image URL (optional)"
                                  value={newsForm.ogImage}
                                  onChange={(e) =>
                                    setNewsForm({ ...newsForm, ogImage: e.target.value })
                                  }
                                  data-testid="input-news-og-image"
                                />
                                <Input
                                  placeholder="Twitter Image URL (optional)"
                                  value={newsForm.twitterImage}
                                  onChange={(e) =>
                                    setNewsForm({ ...newsForm, twitterImage: e.target.value })
                                  }
                                  data-testid="input-news-twitter-image"
                                />
                              </div>

                              <Button
                                onClick={() => {
                                  const htmlNow = newsForm.content;
                                  const htmlNowAr = newsForm.contentAr;
                                  const len = (s: string) => (s || '').trim().length;
                                  if (newsForm.seoTitle && (len(newsForm.seoTitle) < 30 || len(newsForm.seoTitle) > 70)) {
                                    toast({ title: "SEO Title length", description: "Use 30–70 characters", variant: "destructive" });
                                    return;
                                  }
                                  if (newsForm.seoDescription && (len(newsForm.seoDescription) < 80 || len(newsForm.seoDescription) > 200)) {
                                    toast({ title: "Meta description length", description: "Use 80–200 characters", variant: "destructive" });
                                    return;
                                  }
                                  const kwList = (newsForm.seoKeywords || '').split(',').map((k) => k.trim()).filter(Boolean);
                                  if (kwList.length > 20) {
                                    toast({ title: "Too many keywords", description: "Limit to 20 or fewer", variant: "destructive" });
                                    return;
                                  }
                                  const isAllowedMediaUrl = (url: string) => {
                                    if (!url) return true;
                                    const s = String(url).trim();
                                    if (!s) return true;
                                    if (s.startsWith("/")) return true;
                                    if (s.startsWith("data:")) return true;
                                    if (s.startsWith("blob:")) return true;
                                    try {
                                      const u = new URL(s);
                                      return u.protocol === "http:" || u.protocol === "https:";
                                    } catch {
                                      return false;
                                    }
                                  };
                                  const validateMediaUrlsInHtml = (html: string) => {
                                    const srcs: string[] = [];
                                    const regex = /<(?:img|video|source)\b[^>]*?\s(?:src)\s*=\s*"([^"]+)"/gi;
                                    let m: RegExpExecArray | null;
                                    while ((m = regex.exec(html))) srcs.push(m[1]);
                                    for (const u of srcs) if (!isAllowedMediaUrl(u)) return u;
                                    return null;
                                  };
                                  const hasTitle = newsForm.title.trim() || newsForm.titleAr.trim();
                                  const hasContent = (htmlNow || '').trim() || (htmlNowAr || '').trim();
                                  if (!hasTitle || !hasContent) {
                                    toast({ title: "Title and content required", description: "Please provide at least one title and content (English or Arabic)", variant: "destructive" });
                                    return;
                                  }
                                  if (newsForm.image && !isAllowedMediaUrl(newsForm.image)) {
                                    toast({ title: "Invalid image URL", description: "Use a valid URL (http/https) or a relative path", variant: "destructive" });
                                    return;
                                  }
                                  const bad = validateMediaUrlsInHtml(htmlNow || "");
                                  if (bad) {
                                    toast({ title: "Invalid media URL in content", description: bad, variant: "destructive" });
                                    return;
                                  }
                                  const data = {
                                    ...newsForm,
                                    content: htmlNow,
                                    contentAr: htmlNowAr,
                                    seoKeywords: newsForm.seoKeywords
                                      ? newsForm.seoKeywords.split(",").map((k) => k.trim())
                                      : [],
                                  };
                                  if (editingNews) {
                                    updateNewsMutation.mutate({ id: editingNews.id, data });
                                  } else {
                                    createNewsMutation.mutate(data);
                                  }
                                }}
                                className="flex-1"
                                data-testid="button-submit-news"
                              >
                                {editingNews ? "Update News" : "Create News"}
                              </Button>
                              {editingNews && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => window.open(`/news/${editingNews.news_slug || editingNews.slug || editingNews.id}`, '_blank')}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Live
                                </Button>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <PasteFormatter
                          isOpen={isPasteFormatterOpen}
                          onClose={() => setIsPasteFormatterOpen(false)}
                          pastedText={pastedContent}
                          onFormatted={(formattedHtml) => {
                            setNewsForm({ ...newsForm, content: formattedHtml });
                            setPastedContent("");
                          }}
                        />
                      </div>

                      <div className="space-y-3">
                        {newsError && (
                          <Alert variant="destructive">
                            <AlertTitle>Error loading news</AlertTitle>
                            <AlertDescription>
                              {newsError.message || "Failed to load news data"}
                            </AlertDescription>
                          </Alert>
                        )}
                        {newsLoading && (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        )}
                        {newsItems?.map((news: any) => (
                          <Card key={news.id} data-testid={`news-card-${news.id}`}>
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="font-semibold text-sm line-clamp-1">{news.title}</h4>
                                    {news.featured && (
                                      <Badge variant="default" className="text-xs">
                                        Featured
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-1">{news.dateRange}</p>
                                  <Badge variant="outline" className="text-xs">{news.category}</Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => window.open(`/news/${news.news_slug || news.slug || news.id}`, '_blank')}
                                    title="View News"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {canManageNews && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setEditingNews(news);
                                        setNewsForm({
                                          title: news.title,
                                          news_slug: news.news_slug || "",
                                          titleAr: news.titleAr || "",
                                          dateRange: news.dateRange,
                                          image: news.image,
                                          images: news.images || [],
                                          category: news.category,
                                          content: news.content,
                                          contentAr: news.contentAr || "",
                                          author: news.author,
                                          featured: news.featured,
                                          previewOnHome: news.previewOnHome !== false,
                                          seoTitle: news.seoTitle || "",
                                          seoDescription: news.seoDescription || "",
                                          seoKeywords: news.seoKeywords?.join(", ") || "",
                                          canonicalUrl: news.canonicalUrl || "",
                                          ogImage: news.ogImage || "",
                                          twitterImage: news.twitterImage || "",
                                          schemaType: news.schemaType || "NewsArticle",
                                          fullLayout: news.fullLayout || false,
                                          sourceUrl: news.sourceUrl || "",
                                          isVerified: news.isVerified || false,
                                          externalLinks: news.externalLinks || [],
                                        });
                                        setIsCreatingNews(true);
                                      }}
                                      data-testid={`button-edit-news-${news.id}`}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {canManageNews && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setDeleteConfirmId(news.id);
                                        setDeleteType("news");
                                      }}
                                      data-testid={`button-delete-news-${news.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {canManageNews && (
                                    <div className="flex gap-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const max = Math.max(...(newsItems?.map((n: any) => n.order || 0) || [0]));
                                          updateNewsMutation.mutate({ id: news.id, data: { order: max + 1 } });
                                        }}
                                        data-testid={`button-news-first-${news.id}`}
                                      >
                                        First
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const next = (news.order || 0) + 1;
                                          updateNewsMutation.mutate({ id: news.id, data: { order: next } });
                                        }}
                                        data-testid={`button-news-up-${news.id}`}
                                      >
                                        Up
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const next = Math.max(0, (news.order || 0) - 1);
                                          updateNewsMutation.mutate({ id: news.id, data: { order: next } });
                                        }}
                                        data-testid={`button-news-down-${news.id}`}
                                      >
                                        Down
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      {renderPagination(newsPage, totalNews, setNewsPage)}
                    </div>
                  </div>
                </TabsContent>
              )}

              {canVerification && (
                <TabsContent value="verification" className="space-y-6" data-testid="content-verification">
                  <Card>
                    <CardHeader>
                      <CardTitle>Seller Review Verification</CardTitle>
                      <CardDescription>
                        Configure the verification popup players must complete before leaving a seller review.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col gap-4 rounded-lg border border-border/50 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <p className="text-base font-semibold">Require verification</p>
                          <p className="text-sm text-muted-foreground">
                            When enabled, reviewers must watch your video and enter the secret word before their review is accepted.
                          </p>
                        </div>
                        <Switch
                          checked={siteSettingsForm.reviewVerificationEnabled}
                          onCheckedChange={(checked) =>
                            setSiteSettingsForm((prev) => ({ ...prev, reviewVerificationEnabled: checked }))
                          }
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="verification-video-url">YouTube video URL</Label>
                          <Input
                            id="verification-video-url"
                            value={siteSettingsForm.reviewVerificationVideoUrl}
                            onChange={(e) =>
                              setSiteSettingsForm((prev) => ({ ...prev, reviewVerificationVideoUrl: e.target.value }))
                            }
                            placeholder="https://www.youtube.com/watch?v=..."
                          />
                          {siteSettingsForm.reviewVerificationVideoUrl && (
                            <Button
                              type="button"
                              variant="ghost"
                              className="px-0 text-sm"
                              onClick={() => window.open(siteSettingsForm.reviewVerificationVideoUrl, "_blank")}
                            >
                              Open video in new tab
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="verification-timecode">Highlight time (optional)</Label>
                          <Input
                            id="verification-timecode"
                            value={siteSettingsForm.reviewVerificationTimecode}
                            onChange={(e) =>
                              setSiteSettingsForm((prev) => ({ ...prev, reviewVerificationTimecode: e.target.value }))
                            }
                            placeholder="0:30"
                          />
                          <p className="text-xs text-muted-foreground">
                            Use mm:ss or hh:mm:ss to hint where the keyword appears in the video.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verification-instructions">Instructions shown to players</Label>
                        <Textarea
                          id="verification-instructions"
                          value={siteSettingsForm.reviewVerificationPrompt}
                          onChange={(e) =>
                            setSiteSettingsForm((prev) => ({ ...prev, reviewVerificationPrompt: e.target.value }))
                          }
                          placeholder="Invite players to subscribe and explain where to find the secret word."
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verification-youtube-channel">YouTube Channel URL (optional)</Label>
                        <Input
                          id="verification-youtube-channel"
                          value={siteSettingsForm.reviewVerificationYouTubeChannelUrl}
                          onChange={(e) =>
                            setSiteSettingsForm((prev) => ({ ...prev, reviewVerificationYouTubeChannelUrl: e.target.value }))
                          }
                          placeholder="https://www.youtube.com/@yourchannel or https://www.youtube.com/channel/..."
                        />
                        <p className="text-xs text-muted-foreground">
                          Your YouTube channel URL. Users will be prompted to subscribe before watching the verification video.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="verification-passphrase">Secret verification word</Label>
                        <Input
                          id="verification-passphrase"
                          value={siteSettingsForm.reviewVerificationPassphrase}
                          onChange={(e) =>
                            setSiteSettingsForm((prev) => ({ ...prev, reviewVerificationPassphrase: e.target.value }))
                          }
                          placeholder="Enter the secret word viewers must type"
                        />
                        <p className="text-xs text-muted-foreground">
                          This value is stored securely and never exposed to players.
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-muted-foreground">
                          {siteSettingsForm.reviewVerificationEnabled
                            ? "Verification is enabled. Reviews with incorrect answers are automatically rejected."
                            : "Verification is disabled. Reviews can be submitted instantly."}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              if (siteSettings) {
                                setSiteSettingsForm({
                                  reviewVerificationEnabled: siteSettings.reviewVerificationEnabled,
                                  reviewVerificationVideoUrl: siteSettings.reviewVerificationVideoUrl || "",
                                  reviewVerificationPrompt: siteSettings.reviewVerificationPrompt || "",
                                  reviewVerificationPassphrase: siteSettings.reviewVerificationPassphrase || "",
                                  reviewVerificationTimecode: siteSettings.reviewVerificationTimecode || "",
                                  reviewVerificationYouTubeChannelUrl: siteSettings.reviewVerificationYouTubeChannelUrl || "",
                                  monetizationVerifiedSellersEnabled: siteSettings.monetizationVerifiedSellersEnabled !== false,
                                  monetizationVerifiedSellerFee: siteSettings.monetizationVerifiedSellerFee ?? 30,
                                  monetizationBoostingEnabled: siteSettings.monetizationBoostingEnabled !== false,
                                  monetizationBoostingCommissionPct: siteSettings.monetizationBoostingCommissionPct ?? 12,
                                  monetizationPremiumEnabled: siteSettings.monetizationPremiumEnabled !== false,
                                  monetizationPremiumMonthlyPrice: siteSettings.monetizationPremiumMonthlyPrice ?? 2,
                                  monetizationAffiliateEnabled: siteSettings.monetizationAffiliateEnabled !== false,
                                  monetizationAffiliateCommissionPct: siteSettings.monetizationAffiliateCommissionPct ?? 4,
                                  featuredWeapons: Array.isArray((siteSettings as any).featuredWeapons) ? (siteSettings as any).featuredWeapons : [],
                                });
                              }
                            }}
                            disabled={updateSiteSettingsMutation.isPending || !siteSettings}
                          >
                            Reset
                          </Button>
                          <Button
                            onClick={() => updateSiteSettingsMutation.mutate(siteSettingsForm)}
                            disabled={updateSiteSettingsMutation.isPending || !isVerificationReady}
                          >
                            {updateSiteSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {canSiteSettings && (
                <TabsContent value="appearance" className="space-y-6" data-testid="content-appearance">
                  <Card>
                    <CardHeader>
                      <CardTitle>Appearance</CardTitle>
                      <CardDescription>Homepage background and visual defaults</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="appearance-bg">Homepage Background Image URL</Label>
                        <div className="flex gap-2">
                          <Input id="appearance-bg" value={seoSettings.bg} onChange={(e) => setSeoSettings({ ...seoSettings, bg: e.target.value })} placeholder="https://.../background.jpg" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="bg-image-upload-appearance"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const tokRes = await fetch('/api/security/csrf-token');
                                const tokJson = await tokRes.json();
                                const token = tokJson?.csrfToken || '';
                                const fd = new FormData();
                                fd.append('file', file);
                                fd.append('folder', 'backgrounds');
                                const xhr = new XMLHttpRequest();
                                xhr.open('POST', '/images/upload', true);
                                xhr.setRequestHeader('X-CSRF-Token', token);
                                const res: any = await new Promise((resolve, reject) => {
                                  xhr.onreadystatechange = () => {
                                    if (xhr.readyState === 4) resolve({ ok: xhr.status >= 200 && xhr.status < 300, json: async () => JSON.parse(xhr.responseText || '{}') });
                                  };
                                  xhr.onerror = () => reject(new Error('Network error'));
                                  xhr.send(fd);
                                });
                                const data = await res.json();
                                const url = data?.domainUrl || data?.domain_url || data?.secure_url || '';
                                if (res.ok && url) {
                                  setSeoSettings((prev) => ({ ...prev, bg: url }));
                                  toast({ title: 'Background uploaded', description: 'URL set from upload' });
                                } else {
                                  throw new Error(data?.error || 'Upload failed');
                                }
                              } catch (e: any) {
                                toast({ title: 'Upload failed', description: e?.message || String(e), variant: 'destructive' });
                              } finally {
                                (e.target as HTMLInputElement).value = '';
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('bg-image-upload-appearance')?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={async () => {
                              if (!seoSettings.bg) { toast({ title: 'Enter background URL' }); return; }
                              try { const res = await fetch(seoSettings.bg, { method: 'HEAD' }); toast({ title: 'Background Check', description: res.ok ? 'Accessible' : `Failed: ${res.status}` }); } catch { toast({ title: 'Background Check', description: 'Failed to reach image', variant: 'destructive' }); }
                            }}
                          >
                            Check
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setSeoSettings((prev) => ({ ...prev, bg: "" }))}
                          >
                            Clear
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Large landscape image recommended. URL is applied globally on the homepage.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={async () => {
                          try {
                            await apiRequest('/api/settings/site', 'PUT', {
                              backgroundImageUrl: seoSettings.bg,
                            });
                            toast({ title: 'Saved', description: 'Background updated' });
                          } catch (e: any) {
                            toast({ title: 'Save failed', description: e?.message || '', variant: 'destructive' });
                          }
                        }}>Save Background</Button>
                        <Button variant="outline" onClick={async () => {
                          try {
                            const bg = await apiRequest('/api/public/settings/site', 'GET');
                            setSeoSettings((prev) => ({ ...prev, bg: bg?.backgroundImageUrl || '' }));
                            toast({ title: 'Loaded', description: 'Background URL loaded from server' });
                          } catch { }
                        }}>Load Current</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {canSiteSettings && (
                <TabsContent value="site-settings" className="space-y-6" data-testid="content-site-settings">
                  <Card>
                    <CardHeader>
                      <CardTitle>SEO & Site Settings</CardTitle>
                      <CardDescription>Database-backed SEO settings used by robots, sitemap, and client meta tags</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="site-base">Public Base URL</Label>
                          <Input id="site-base" value={seoSettings.base} onChange={(e) => setSeoSettings({ ...seoSettings, base: e.target.value })} placeholder="https://www.crossfire.wiki" />
                        </div>
                        <div>
                          <Label htmlFor="site-og">Default OG Image URL</Label>
                          <Input id="site-og" value={seoSettings.og} onChange={(e) => setSeoSettings({ ...seoSettings, og: e.target.value })} placeholder="https://.../og-image.jpg" />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="site-bg">Homepage Background Image URL</Label>
                          <div className="flex gap-2">
                            <Input id="site-bg" value={seoSettings.bg} onChange={(e) => setSeoSettings({ ...seoSettings, bg: e.target.value })} placeholder="https://.../background.jpg" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="bg-image-upload"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const tokRes = await fetch('/api/security/csrf-token');
                                  const tokJson = await tokRes.json();
                                  const token = tokJson?.csrfToken || '';
                                  const fd = new FormData();
                                  fd.append('file', file);
                                  fd.append('folder', 'backgrounds');
                                  const xhr = new XMLHttpRequest();
                                  xhr.open('POST', '/images/upload', true);
                                  xhr.setRequestHeader('X-CSRF-Token', token);
                                  const res: any = await new Promise((resolve, reject) => {
                                    xhr.onreadystatechange = () => {
                                      if (xhr.readyState === 4) resolve({ ok: xhr.status >= 200 && xhr.status < 300, json: async () => JSON.parse(xhr.responseText || '{}') });
                                    };
                                    xhr.onerror = () => reject(new Error('Network error'));
                                    xhr.send(fd);
                                  });
                                  const data = await res.json();
                                  const url = data?.domainUrl || data?.domain_url || data?.secure_url || '';
                                  if (res.ok && url) {
                                    setSeoSettings((prev) => ({ ...prev, bg: url }));
                                    toast({ title: 'Background uploaded', description: 'URL set from upload' });
                                  } else {
                                    throw new Error(data?.error || 'Upload failed');
                                  }
                                } catch (e: any) {
                                  toast({ title: 'Upload failed', description: e?.message || String(e), variant: 'destructive' });
                                } finally {
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('bg-image-upload')?.click()}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={async () => {
                                if (!seoSettings.bg) { toast({ title: 'Enter background URL' }); return; }
                                try { const res = await fetch(seoSettings.bg, { method: 'HEAD' }); toast({ title: 'Background Check', description: res.ok ? 'Accessible' : `Failed: ${res.status}` }); } catch { toast({ title: 'Background Check', description: 'Failed to reach image', variant: 'destructive' }); }
                              }}
                            >
                              Check
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setSeoSettings((prev) => ({ ...prev, bg: "" }))}
                            >
                              Clear
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Shown as the site-wide homepage background. Large landscape image recommended.
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="site-title">Default SEO Title</Label>
                          <Input id="site-title" value={seoSettings.title} onChange={(e) => setSeoSettings({ ...seoSettings, title: e.target.value })} placeholder="CrossFire Wiki — Competitive Guide" />
                        </div>
                        <div>
                          <Label htmlFor="site-robots">Robots</Label>
                          <Input id="site-robots" value={seoSettings.robots} onChange={(e) => setSeoSettings({ ...seoSettings, robots: e.target.value })} placeholder="index, follow" />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="site-desc">Default SEO Description</Label>
                          <Textarea id="site-desc" value={seoSettings.desc} onChange={(e) => setSeoSettings({ ...seoSettings, desc: e.target.value })} rows={3} />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="site-keywords">Keywords (comma separated)</Label>
                          <Input id="site-keywords" value={seoSettings.keywords} onChange={(e) => setSeoSettings({ ...seoSettings, keywords: e.target.value })} placeholder="CrossFire, FPS, Weapons, Modes" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={async () => {
                          try {
                            await apiRequest('/api/settings/site', 'PUT', {
                              publicBaseUrl: seoSettings.base,
                              seoTitle: seoSettings.title,
                              seoDescription: seoSettings.desc,
                              seoKeywords: seoSettings.keywords.split(',').map((s) => s.trim()).filter(Boolean),
                              seoOgImage: seoSettings.og,
                              backgroundImageUrl: seoSettings.bg,
                              robots: seoSettings.robots || 'index, follow',
                            });
                            toast({ title: 'Saved', description: 'Site settings updated' });
                          } catch (e: any) {
                            toast({ title: 'Save failed', description: e?.message || '', variant: 'destructive' });
                          }
                        }}>Save Settings</Button>
                        <Button variant="outline" onClick={async () => {
                          try {
                            const d = await apiRequest('/api/public/settings/seo', 'GET');
                            const bg = await apiRequest('/api/public/settings/site', 'GET');
                            setSeoSettings({
                              base: d.publicBaseUrl || '',
                              title: d.seoTitle || '',
                              desc: d.seoDescription || '',
                              keywords: (d.seoKeywords || []).join(', '),
                              og: d.seoOgImage || '',
                              bg: bg?.backgroundImageUrl || '',
                              robots: d.robots || 'index, follow',
                            });
                            toast({ title: 'Loaded', description: 'Settings fresh from server' });
                          } catch { }
                        }}>Load Current</Button>
                        <Button variant="secondary" onClick={async () => {
                          if (!seoSettings.og) { toast({ title: 'Enter OG image URL' }); return; }
                          try { const res = await fetch(seoSettings.og, { method: 'HEAD' }); toast({ title: 'Image Check', description: res.ok ? 'Accessible' : `Failed: ${res.status}` }); } catch { toast({ title: 'Image Check', description: 'Failed to reach image', variant: 'destructive' }); }
                        }}>Check OG Image URL</Button>
                        <Button variant="secondary" onClick={async () => {
                          if (!seoSettings.bg) { toast({ title: 'Enter background URL' }); return; }
                          try { const res = await fetch(seoSettings.bg, { method: 'HEAD' }); toast({ title: 'Background', description: res.ok ? 'Accessible' : `Failed: ${res.status}` }); } catch { toast({ title: 'Background', description: 'Failed to reach image', variant: 'destructive' }); }
                        }}>Check Background URL</Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {canTutorials && (
                <TabsContent value="tutorials" className="space-y-6" data-testid="content-tutorials">
                  <TutorialManager />
                </TabsContent>
              )}

              {canScraper && (
                <TabsContent value="scraper" className="space-y-6" data-testid="content-scraper">
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-2xl font-semibold mb-4">Event Scraper</h2>
                      <ScrapingManager />
                    </div>
                    {isSuperAdmin && (
                      <>
                        <div>
                          <h2 className="text-2xl font-semibold mb-4">CrossFire Data Scraper</h2>
                          <CFDataScraper />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold mb-4">Full Page URL Scraper</h2>
                          <FullPageScraper />
                        </div>
                        <div>
                          <h2 className="text-2xl font-semibold mb-4">إصلاح المحتوى القديم (Re-scrape)</h2>
                          <WikiRescraper />
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>
              )}

              {canCFData && (
                <TabsContent value="cf-data" className="space-y-6" data-testid="content-cf-data">
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold">CrossFire Data Management</h2>
                    <p className="text-muted-foreground">
                      Manage weapons, modes, and ranks manually. Upload images and add detailed information.
                    </p>

                    {/* Data Seeding Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Data Seeding</CardTitle>
                        <CardDescription>
                          Import and process CrossFire game data from existing files.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <DataSeeder />
                      </CardContent>
                    </Card>

                    {/* Weapons Management */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Weapons</CardTitle>
                          <Dialog open={isCreatingWeapon} onOpenChange={(open) => {
                            setIsCreatingWeapon(open);
                            if (!open) {
                              setEditingWeapon(null);
                              setWeaponForm({ name: "", image: "", category: "", description: "", stats: {} });
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Weapon
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{editingWeapon ? "Edit Weapon" : "Add New Weapon"}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input
                                  placeholder="Weapon Name"
                                  value={weaponForm.name}
                                  onChange={(e) => setWeaponForm({ ...weaponForm, name: e.target.value })}
                                />
                                <div className="space-y-2">
                                  <Input
                                    placeholder="Image URL"
                                    value={weaponForm.image}
                                    onChange={(e) => setWeaponForm({ ...weaponForm, image: e.target.value })}
                                  />
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          try {
                                            const tokRes = await fetch('/api/security/csrf-token');
                                            const tokJson = await tokRes.json();
                                            const csrfToken = tokJson?.csrfToken || '';
                                            const formData = new FormData();
                                            formData.append('images', file);
                                            const res = await fetch('/api/upload-image', {
                                              method: 'POST',
                                              headers: {
                                                'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
                                                'x-csrf-token': csrfToken,
                                              },
                                              body: formData,
                                            });
                                            const data = await res.json();
                                            const url = data.results?.[0]?.domain_url || data.results?.[0]?.url || data.domain_url || data.url || '';
                                            if (url) {
                                              setWeaponForm(prev => ({ ...prev, image: url }));
                                              toast({ title: "Image uploaded successfully!" });
                                            } else {
                                              toast({ title: "Upload failed", description: data.error || "No URL returned", variant: "destructive" });
                                            }
                                          } catch {
                                            toast({ title: "Failed to upload image", variant: "destructive" });
                                          }
                                        }
                                      }}
                                      className="hidden"
                                      id="weapon-image-upload"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => document.getElementById('weapon-image-upload')?.click()}
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Upload Image
                                    </Button>
                                  </div>
                                </div>
                                <Input
                                  placeholder="Category (optional)"
                                  value={weaponForm.category}
                                  onChange={(e) => setWeaponForm({ ...weaponForm, category: e.target.value })}
                                />
                                <Textarea
                                  placeholder="Description (optional)"
                                  value={weaponForm.description}
                                  onChange={(e) => setWeaponForm({ ...weaponForm, description: e.target.value })}
                                  rows={3}
                                />
                                <Button
                                  onClick={() => {
                                    const data = { ...weaponForm };
                                    if (editingWeapon) {
                                      updateWeaponMutation.mutate({ id: editingWeapon.id, data });
                                    } else {
                                      createWeaponMutation.mutate(data);
                                    }
                                  }}
                                  className="w-full"
                                >
                                  {editingWeapon ? "Update Weapon" : "Create Weapon"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Input
                            placeholder="Search weapons by name or category..."
                            value={weaponSearch}
                            onChange={(e) => { setWeaponSearch(e.target.value); setWeaponPage(1); }}
                          />
                          {(() => {
                            const filtered = (weapons || []).filter((w: any) =>
                              !weaponSearch || w.name?.toLowerCase().includes(weaponSearch.toLowerCase()) || w.category?.toLowerCase().includes(weaponSearch.toLowerCase())
                            );
                            const totalPages = Math.ceil(filtered.length / WEAPON_PAGE_SIZE);
                            const paginated = filtered.slice((weaponPage - 1) * WEAPON_PAGE_SIZE, weaponPage * WEAPON_PAGE_SIZE);
                            return (
                              <>
                                <p className="text-xs text-muted-foreground">{filtered.length} weapons {weaponSearch ? "found" : "total"} — showing {paginated.length}</p>
                                {paginated.map((weapon: any) => (
                                  <div key={weapon.id} className="flex items-center justify-between p-3 border rounded-md gap-2">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      {weapon.image && (
                                        <img src={weapon.image} alt={weapon.name} className="w-14 h-14 object-contain rounded flex-shrink-0" />
                                      )}
                                      <div className="min-w-0">
                                        <p className="font-medium truncate">{weapon.name}</p>
                                        {weapon.category && <Badge variant="outline" className="text-xs">{weapon.category}</Badge>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {canManageCFData && (
                                        <div className="flex flex-col items-center">
                                          <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Order</Label>
                                          <Input
                                            type="number"
                                            defaultValue={weapon.order ?? 0}
                                            className="w-16 h-8 text-center"
                                            onBlur={async (e) => {
                                              const newOrder = parseInt(e.target.value);
                                              if (!isNaN(newOrder)) {
                                                try {
                                                  await apiRequest(`/api/weapons/${weapon.id}`, "PATCH", { order: newOrder });
                                                  queryClient.invalidateQueries({ queryKey: ["/api/weapons"] });
                                                  toast({ title: "Order updated" });
                                                } catch (err: any) {
                                                  toast({ title: "Failed to update order", description: err.message, variant: "destructive" });
                                                }
                                              }
                                            }}
                                          />
                                        </div>
                                      )}
                                      {canManageCFData && (
                                        <Button variant="ghost" size="icon" onClick={() => {
                                          setEditingWeapon(weapon);
                                          setWeaponForm({
                                            name: weapon.name,
                                            image: weapon.image,
                                            category: weapon.category || "",
                                            description: weapon.description || "",
                                            stats: weapon.stats || {},
                                          });
                                          setIsCreatingWeapon(true);
                                        }}>
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      )}
                                      {canManageCFData && (
                                        <Button variant="ghost" size="icon" onClick={() => {
                                          setDeleteConfirmId(weapon.id);
                                          setDeleteType("weapon");
                                        }}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {totalPages > 1 && (
                                  <div className="flex items-center justify-center gap-2 pt-2">
                                    <Button variant="outline" size="sm" disabled={weaponPage <= 1} onClick={() => setWeaponPage(p => p - 1)}>Previous</Button>
                                    <span className="text-sm text-muted-foreground">Page {weaponPage} of {totalPages}</span>
                                    <Button variant="outline" size="sm" disabled={weaponPage >= totalPages} onClick={() => setWeaponPage(p => p + 1)}>Next</Button>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Modes Management */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Game Modes</CardTitle>
                          <Dialog open={isCreatingMode} onOpenChange={(open) => {
                            setIsCreatingMode(open);
                            if (!open) {
                              setEditingMode(null);
                              setModeForm({ name: "", image: "", description: "", type: "" });
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Mode
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{editingMode ? "Edit Mode" : "Add New Mode"}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input
                                  placeholder="Mode Name"
                                  value={modeForm.name}
                                  onChange={(e) => setModeForm({ ...modeForm, name: e.target.value })}
                                />
                                <div className="space-y-2">
                                  <Input
                                    placeholder="Image URL"
                                    value={modeForm.image}
                                    onChange={(e) => setModeForm({ ...modeForm, image: e.target.value })}
                                  />
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          try {
                                            const tokRes = await fetch('/api/security/csrf-token');
                                            const tokJson = await tokRes.json();
                                            const csrfToken = tokJson?.csrfToken || '';
                                            const formData = new FormData();
                                            formData.append('images', file);
                                            const res = await fetch('/api/upload-image', {
                                              method: 'POST',
                                              headers: {
                                                'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
                                                'x-csrf-token': csrfToken,
                                              },
                                              body: formData,
                                            });
                                            const data = await res.json();
                                            const url = data.results?.[0]?.domain_url || data.results?.[0]?.url || data.domain_url || data.url || '';
                                            if (url) {
                                              setModeForm(prev => ({ ...prev, image: url }));
                                              toast({ title: "Image uploaded successfully!" });
                                            } else {
                                              toast({ title: "Upload failed", description: data.error || "No URL returned", variant: "destructive" });
                                            }
                                          } catch {
                                            toast({ title: "Failed to upload image", variant: "destructive" });
                                          }
                                        }
                                      }}
                                      className="hidden"
                                      id="mode-image-upload"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => document.getElementById('mode-image-upload')?.click()}
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Upload Image
                                    </Button>
                                  </div>
                                </div>
                                <Input
                                  placeholder="Type (optional)"
                                  value={modeForm.type}
                                  onChange={(e) => setModeForm({ ...modeForm, type: e.target.value })}
                                />
                                <Textarea
                                  placeholder="Description (optional)"
                                  value={modeForm.description}
                                  onChange={(e) => setModeForm({ ...modeForm, description: e.target.value })}
                                  rows={3}
                                />
                                <Button
                                  onClick={() => {
                                    const data = { ...modeForm };
                                    if (editingMode) {
                                      updateModeMutation.mutate({ id: editingMode.id, data });
                                    } else {
                                      createModeMutation.mutate(data);
                                    }
                                  }}
                                  className="w-full"
                                >
                                  {editingMode ? "Update Mode" : "Create Mode"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {modes?.map((mode: any) => (
                            <div key={mode.id} className="flex items-center justify-between p-3 border rounded-md">
                              <div className="flex items-center gap-3">
                                {mode.image && (
                                  <img src={mode.image} alt={mode.name} className="w-16 h-16 object-contain rounded" />
                                )}
                                <div>
                                  <p className="font-medium">{mode.name}</p>
                                  {mode.type && <Badge variant="outline" className="text-xs">{mode.type}</Badge>}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {canManageCFData && (
                                  <Button variant="ghost" size="icon" onClick={() => {
                                    setEditingMode(mode);
                                    setModeForm({
                                      name: mode.name,
                                      image: mode.image,
                                      description: mode.description || "",
                                      type: mode.type || "",
                                    });
                                    setIsCreatingMode(true);
                                  }}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {canManageCFData && (
                                  <Button variant="ghost" size="icon" onClick={() => {
                                    setDeleteConfirmId(mode.id);
                                    setDeleteType("mode");
                                  }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ranks Management */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Ranks</CardTitle>
                          <Dialog open={isCreatingRank} onOpenChange={(open) => {
                            setIsCreatingRank(open);
                            if (!open) {
                              setEditingRank(null);
                              setRankForm({ name: "", image: "", description: "", requirements: "", bonus: "" });
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Rank
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{editingRank ? "Edit Rank" : "Add New Rank"}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Input
                                  placeholder="Rank Name"
                                  value={rankForm.name}
                                  onChange={(e) => setRankForm({ ...rankForm, name: e.target.value })}
                                />
                                <div className="space-y-2">
                                  <Input
                                    placeholder="Image URL"
                                    value={rankForm.image}
                                    onChange={(e) => setRankForm({ ...rankForm, image: e.target.value })}
                                  />
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          try {
                                            const tokRes = await fetch('/api/security/csrf-token');
                                            const tokJson = await tokRes.json();
                                            const csrfToken = tokJson?.csrfToken || '';
                                            const formData = new FormData();
                                            formData.append('images', file);
                                            const res = await fetch('/api/upload-image', {
                                              method: 'POST',
                                              headers: {
                                                'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
                                                'x-csrf-token': csrfToken,
                                              },
                                              body: formData,
                                            });
                                            const data = await res.json();
                                            const url = data.results?.[0]?.domain_url || data.results?.[0]?.url || data.domain_url || data.url || '';
                                            if (url) {
                                              setRankForm(prev => ({ ...prev, image: url }));
                                              toast({ title: "Image uploaded successfully!" });
                                            } else {
                                              toast({ title: "Upload failed", description: data.error || "No URL returned", variant: "destructive" });
                                            }
                                          } catch {
                                            toast({ title: "Failed to upload image", variant: "destructive" });
                                          }
                                        }
                                      }}
                                      className="hidden"
                                      id="rank-image-upload"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => document.getElementById('rank-image-upload')?.click()}
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Upload Image
                                    </Button>
                                  </div>
                                </div>
                                <Textarea
                                  placeholder="Description (optional)"
                                  value={rankForm.description}
                                  onChange={(e) => setRankForm({ ...rankForm, description: e.target.value })}
                                  rows={2}
                                />
                                <Textarea
                                  placeholder="Requirements (optional)"
                                  value={rankForm.requirements}
                                  onChange={(e) => setRankForm({ ...rankForm, requirements: e.target.value })}
                                  rows={2}
                                />
                                <Textarea
                                  placeholder="Bonus Content (optional)"
                                  value={rankForm.bonus}
                                  onChange={(e) => setRankForm({ ...rankForm, bonus: e.target.value })}
                                  rows={2}
                                />
                                <Button
                                  onClick={() => {
                                    const data = { ...rankForm };
                                    if (editingRank) {
                                      updateRankMutation.mutate({ id: editingRank.id, data });
                                    } else {
                                      createRankMutation.mutate(data);
                                    }
                                  }}
                                  className="w-full"
                                >
                                  {editingRank ? "Update Rank" : "Create Rank"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {ranks?.map((rank: any) => (
                            <div key={rank.id} className="flex items-start justify-between p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition">
                              <div className="flex items-start gap-3 flex-1">
                                {rank.image && (
                                  <img src={rank.image} alt={rank.name} className="w-16 h-16 object-contain rounded flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold">{rank.name}</p>
                                  {rank.image && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      <a href={rank.image} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        {rank.image.substring(0, 50)}...
                                      </a>
                                    </p>
                                  )}
                                  {rank.description && <p className="text-xs text-muted-foreground mt-1">{rank.description}</p>}
                                  {rank.requirements && <p className="text-xs text-muted-foreground">{rank.requirements}</p>}
                                  {rank.bonus && (
                                    <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs">
                                      <p className="font-semibold text-yellow-700 dark:text-yellow-300">🎁 Bonus:</p>
                                      <p className="text-yellow-800 dark:text-yellow-200">{rank.bonus}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {canManageCFData && (
                                  <Button variant="ghost" size="icon" onClick={() => {
                                    setEditingRank(rank);
                                    setRankForm({
                                      name: rank.name,
                                      image: rank.image,
                                      description: rank.description || "",
                                      requirements: rank.requirements || "",
                                      bonus: rank.bonus || "",
                                    });
                                    setIsCreatingRank(true);
                                  }}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                {canManageCFData && (
                                  <Button variant="ghost" size="icon" onClick={() => {
                                    setDeleteConfirmId(rank.id);
                                    setDeleteType("rank");
                                  }}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}

              {canSellers && (
                <TabsContent value="sellers" className="space-y-6" data-testid="content-sellers">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Sellers Management</h2>
                    <div className="flex items-center gap-2">
                    {canManageSellers && (
                      <Button
                        variant="outline"
                        onClick={() => migrateSellerImagesMutation.mutate()}
                        disabled={migrateSellerImagesMutation.isPending}
                        title="Move all seller images that are not on Cloudinary to Cloudinary storage"
                      >
                        {migrateSellerImagesMutation.isPending ? "Migrating..." : "Migrate Images to Cloudinary"}
                      </Button>
                    )}
                    <Dialog open={isCreatingSeller} onOpenChange={(open) => {
                      setIsCreatingSeller(open);
                      if (!open) {
                        setEditingSeller(null);
                        resetSellerForm();
                      }
                    }}>
                      <DialogTrigger asChild>
                        {canManageSellers && (
                          <Button data-testid="button-create-seller">
                            <Plus className="h-4 w-4 mr-2" />
                            New Seller
                          </Button>
                        )}
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {editingSeller ? "Edit Seller" : "Create New Seller"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="seller-name">Seller Name</Label>
                            <Input
                              id="seller-name"
                              placeholder="Seller Name"
                              value={sellerForm.name}
                              onChange={(e) =>
                                setSellerForm({ ...sellerForm, name: e.target.value })
                              }
                              data-testid="input-seller-name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="seller-description">Description</Label>
                            <Textarea
                              id="seller-description"
                              placeholder="Short description that appears on the sellers page"
                              value={sellerForm.description}
                              onChange={(e) =>
                                setSellerForm({ ...sellerForm, description: e.target.value })
                              }
                              rows={3}
                              data-testid="input-seller-description"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="seller-promotion">Promotion Text (optional)</Label>
                            <Textarea
                              id="seller-promotion"
                              placeholder="Special offer or message shown to players"
                              value={sellerForm.promotionText}
                              onChange={(e) =>
                                setSellerForm({ ...sellerForm, promotionText: e.target.value })
                              }
                              rows={2}
                              data-testid="input-seller-promotion"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="seller-rank">Rank Position (1 = top)</Label>
                            <Input
                              id="seller-rank"
                              placeholder="e.g., 1"
                              value={sellerForm.rank}
                              onChange={(e) =>
                                setSellerForm({ ...sellerForm, rank: e.target.value })
                              }
                              data-testid="input-seller-rank"
                            />
                          </div>
                          {/* Hidden file inputs */}
                          <input
                            ref={sellerLogoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadSellerImageFile(file, 0);
                              e.target.value = '';
                            }}
                          />
                          <input
                            ref={sellerGalleryInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadSellerImageFile(file, -1);
                              e.target.value = '';
                            }}
                          />

                          {/* LOGO / MAIN IMAGE */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label>Logo / Main Image</Label>
                              <span className="text-xs text-muted-foreground">(shown as the seller's primary photo)</span>
                            </div>
                            {(() => {
                              const imgList = sellerForm.images.split(',').map(s => s.trim()).filter(Boolean);
                              const logoUrl = imgList[0] || '';
                              return logoUrl ? (
                                <div className="relative group w-48 h-32 bg-muted rounded-lg overflow-hidden border-2 border-primary/30 shadow">
                                  <img src={logoUrl} className="w-full h-full object-cover" alt="Logo" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2248%22 height%3D%2248%22 viewBox%3D%220 0 24 24%22%3E%3Crect width%3D%2224%22 height%3D%2224%22 fill%3D%22%23333%22%2F%3E%3Ctext x%3D%2212%22 y%3D%2216%22 text-anchor%3D%22middle%22 fill%3D%22%23888%22 font-size%3D%228%22%3ENo img%3C%2Ftext%3E%3C%2Fsvg%3E'; }} />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="gap-1.5 w-32"
                                      onClick={() => sellerLogoInputRef.current?.click()}
                                      disabled={uploadingSellerImage}
                                    >
                                      <Upload className="h-3.5 w-3.5" />
                                      Replace
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="gap-1.5 w-32 text-white hover:bg-white/20"
                                      onClick={() => {
                                        setEditingImageSrc(logoUrl);
                                        setImageEditorConfig({ maxSizeMB: 1, maxWidthOrHeight: 1920, initialImage: logoUrl });
                                        setEditingSellerImageIndex(0);
                                        setImageEditorOpen(true);
                                      }}
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                      Edit & Crop
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="gap-1.5 w-32"
                                      onClick={() => {
                                        const newList = imgList.filter((_, i) => i !== 0);
                                        setSellerForm({ ...sellerForm, images: newList.join(',') });
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Remove
                                    </Button>
                                  </div>
                                  <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">LOGO</div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="flex flex-col items-center justify-center w-48 h-32 border-2 border-dashed border-primary/40 rounded-lg hover:bg-muted/60 hover:border-primary transition-all cursor-pointer"
                                  onClick={() => sellerLogoInputRef.current?.click()}
                                  disabled={uploadingSellerImage}
                                >
                                  {uploadingSellerImage ? (
                                    <span className="text-xs text-muted-foreground">Uploading...</span>
                                  ) : (
                                    <>
                                      <Upload className="h-7 w-7 text-primary mb-2" />
                                      <span className="text-sm font-medium text-primary">Upload Logo</span>
                                      <span className="text-xs text-muted-foreground mt-0.5">Click to choose file</span>
                                    </>
                                  )}
                                </button>
                              );
                            })()}
                          </div>

                          {/* GALLERY IMAGES */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Label>Gallery Images</Label>
                                <span className="text-xs text-muted-foreground">(additional photos shown in the seller's page)</span>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() => sellerGalleryInputRef.current?.click()}
                                disabled={uploadingSellerImage}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add Image
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {sellerForm.images.split(',').map(s => s.trim()).filter(Boolean).slice(1).map((img, galleryIdx) => {
                                const realIdx = galleryIdx + 1;
                                return (
                                  <div key={realIdx} className="relative group aspect-video bg-muted rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-all">
                                    <img src={img} className="w-full h-full object-cover" alt={`Gallery ${galleryIdx + 1}`} onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2248%22 height%3D%2248%22 viewBox%3D%220 0 24 24%22%3E%3Crect width%3D%2224%22 height%3D%2224%22 fill%3D%22%23333%22%2F%3E%3Ctext x%3D%2212%22 y%3D%2216%22 text-anchor%3D%22middle%22 fill%3D%22%23888%22 font-size%3D%228%22%3ENo img%3C%2Ftext%3E%3C%2Fsvg%3E'; }} />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                                      <label className="w-full cursor-pointer">
                                        <span className="flex items-center justify-center gap-1 text-xs font-medium bg-white/20 hover:bg-white/30 text-white rounded px-2 py-1.5 w-full transition-colors">
                                          <Upload className="h-3 w-3" /> Replace
                                        </span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) uploadSellerImageFile(file, realIdx);
                                            e.target.value = '';
                                          }}
                                        />
                                      </label>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-full text-xs text-white hover:bg-white/20 gap-1"
                                        onClick={() => {
                                          setEditingImageSrc(img);
                                          setImageEditorConfig({ maxSizeMB: 1, maxWidthOrHeight: 1920, initialImage: img });
                                          setEditingSellerImageIndex(realIdx);
                                          setImageEditorOpen(true);
                                        }}
                                      >
                                        <Edit2 className="h-3 w-3" /> Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-7 w-full text-xs gap-1"
                                        onClick={() => {
                                          const newList = sellerForm.images.split(',').map(s => s.trim()).filter(Boolean).filter((_, i) => i !== realIdx);
                                          setSellerForm({ ...sellerForm, images: newList.join(',') });
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" /> Delete
                                      </Button>
                                    </div>
                                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">{galleryIdx + 1}</div>
                                  </div>
                                );
                              })}
                              {sellerForm.images.split(',').filter(s => s.trim()).length <= 1 && (
                                <div className="text-xs text-muted-foreground col-span-full py-2">
                                  No gallery images yet. Click "Add Image" above to add photos.
                                </div>
                              )}
                            </div>
                          </div>

                          <Textarea
                            className="hidden"
                            id="seller-images"
                            placeholder="Add image URLs separated by commas"
                            value={sellerForm.images}
                            onChange={(e) =>
                              setSellerForm({ ...sellerForm, images: e.target.value })
                            }
                            rows={3}
                            data-testid="input-seller-images"
                          />
                          <div className="space-y-2">
                            <Label>Price List</Label>
                            <div className="space-y-2">
                              {sellerForm.priceItems.map((priceItem, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                  <Input
                                    placeholder="Item name (e.g., 10k ZP)"
                                    value={priceItem.item}
                                    onChange={(e) => {
                                      const newItems = [...sellerForm.priceItems];
                                      newItems[index].item = e.target.value;
                                      setSellerForm({ ...sellerForm, priceItems: newItems });
                                    }}
                                    className="flex-1"
                                  />
                                  <Input
                                    placeholder="Price (e.g., 100 L.E)"
                                    value={priceItem.price}
                                    onChange={(e) => {
                                      const newItems = [...sellerForm.priceItems];
                                      newItems[index].price = e.target.value;
                                      setSellerForm({ ...sellerForm, priceItems: newItems });
                                    }}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const newItems = sellerForm.priceItems.filter((_, i) => i !== index);
                                      setSellerForm({ ...sellerForm, priceItems: newItems });
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSellerForm({
                                    ...sellerForm,
                                    priceItems: [...sellerForm.priceItems, { item: "", price: "" }],
                                  });
                                }}
                                className="w-full"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Price Item
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Add individual price items that will appear as a list for buyers.</p>
                          </div>
                          <div className="space-y-3 border-t pt-4">
                            <h3 className="text-sm font-medium">Contact Information</h3>
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="seller-email">Email (optional)</Label>
                                <Input
                                  id="seller-email"
                                  placeholder="Email address"
                                  value={sellerForm.email}
                                  onChange={(e) =>
                                    setSellerForm({ ...sellerForm, email: e.target.value })
                                  }
                                  data-testid="input-seller-email"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="seller-phone">Phone (optional)</Label>
                                <Input
                                  id="seller-phone"
                                  placeholder="Phone number"
                                  value={sellerForm.phone}
                                  onChange={(e) =>
                                    setSellerForm({ ...sellerForm, phone: e.target.value })
                                  }
                                  data-testid="input-seller-phone"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="seller-whatsapp">WhatsApp (optional)</Label>
                                <Input
                                  id="seller-whatsapp"
                                  placeholder="WhatsApp number"
                                  value={sellerForm.whatsapp}
                                  onChange={(e) =>
                                    setSellerForm({ ...sellerForm, whatsapp: e.target.value })
                                  }
                                  data-testid="input-seller-whatsapp"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="seller-discord">Discord (optional)</Label>
                                <Input
                                  id="seller-discord"
                                  placeholder="Discord username"
                                  value={sellerForm.discord}
                                  onChange={(e) =>
                                    setSellerForm({ ...sellerForm, discord: e.target.value })
                                  }
                                  data-testid="input-seller-discord"
                                />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="seller-website">Website URL (optional)</Label>
                                <Input
                                  id="seller-website"
                                  placeholder="https://example.com"
                                  value={sellerForm.website}
                                  onChange={(e) =>
                                    setSellerForm({ ...sellerForm, website: e.target.value })
                                  }
                                  data-testid="input-seller-website"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="seller-facebook">Facebook</Label>
                                <Input id="seller-facebook" placeholder="https://facebook.com/username" value={sellerForm.facebook} onChange={(e) => setSellerForm({ ...sellerForm, facebook: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="seller-twitter">Twitter/X</Label>
                                <Input id="seller-twitter" placeholder="https://x.com/username" value={sellerForm.twitter} onChange={(e) => setSellerForm({ ...sellerForm, twitter: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="seller-instagram">Instagram</Label>
                                <Input id="seller-instagram" placeholder="https://instagram.com/username" value={sellerForm.instagram} onChange={(e) => setSellerForm({ ...sellerForm, instagram: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="seller-youtube">YouTube</Label>
                                <Input id="seller-youtube" placeholder="https://youtube.com/@channel" value={sellerForm.youtube} onChange={(e) => setSellerForm({ ...sellerForm, youtube: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="seller-tiktok">TikTok</Label>
                                <Input id="seller-tiktok" placeholder="https://tiktok.com/@username" value={sellerForm.tiktok} onChange={(e) => setSellerForm({ ...sellerForm, tiktok: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="seller-telegram">Telegram</Label>
                                <Input id="seller-telegram" placeholder="https://t.me/username" value={sellerForm.telegram} onChange={(e) => setSellerForm({ ...sellerForm, telegram: e.target.value })} />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="seller-featured"
                              checked={sellerForm.featured}
                              onCheckedChange={(checked) =>
                                setSellerForm({ ...sellerForm, featured: checked as boolean })
                              }
                              data-testid="checkbox-seller-featured"
                            />
                            <label
                              htmlFor="seller-featured"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              Featured Seller
                            </label>
                          </div>
                          <Button
                            onClick={() => {
                              const data = {
                                name: sellerForm.name,
                                description: sellerForm.description,
                                promotionText: sellerForm.promotionText,
                                images: sellerForm.images
                                  ? sellerForm.images.split(',').map(url => url.trim())
                                  : [],
                                prices: sellerForm.priceItems
                                  .filter(item => item.item.trim() && item.price.trim())
                                  .map(item => ({
                                    item: item.item.trim(),
                                    price: parseFloat(item.price.trim()) || 0
                                  })),
                                email: sellerForm.email,
                                phone: sellerForm.phone,
                                whatsapp: sellerForm.whatsapp,
                                discord: sellerForm.discord,
                                website: sellerForm.website,
                                facebook: sellerForm.facebook,
                                twitter: sellerForm.twitter,
                                instagram: sellerForm.instagram,
                                youtube: sellerForm.youtube,
                                tiktok: sellerForm.tiktok,
                                telegram: sellerForm.telegram,
                                featured: sellerForm.featured,
                                rank: sellerForm.rank.trim() ? parseInt(sellerForm.rank.trim(), 10) : undefined,
                              };
                              if (editingSeller) {
                                updateSellerMutation.mutate({ id: editingSeller.id, data });
                              } else {
                                createSellerMutation.mutate(data);
                              }
                            }}
                            className="w-full"
                            data-testid="button-submit-seller"
                          >
                            {editingSeller ? "Update Seller" : "Create Seller"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    </div>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Images</TableHead>
                            <TableHead>Prices</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead>Rank</TableHead>
                            <TableHead>Featured</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sellers?.map((seller: any) => (
                            <TableRow key={seller.id} data-testid={`seller-row-${seller.id}`}>
                              <TableCell className="font-medium">{seller.name}</TableCell>
                              <TableCell className="max-w-xs truncate">{seller.description}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {seller.email && <Badge variant="outline" className="text-xs">Email</Badge>}
                                  {seller.phone && <Badge variant="outline" className="text-xs">Phone</Badge>}
                                  {seller.whatsapp && <Badge variant="outline" className="text-xs">WhatsApp</Badge>}
                                  {seller.discord && <Badge variant="outline" className="text-xs">Discord</Badge>}
                                  {seller.website && <Badge variant="outline" className="text-xs">Website</Badge>}
                                  {seller.facebook && <Badge variant="outline" className="text-xs">Facebook</Badge>}
                                  {seller.twitter && <Badge variant="outline" className="text-xs">Twitter</Badge>}
                                  {seller.instagram && <Badge variant="outline" className="text-xs">Instagram</Badge>}
                                  {seller.youtube && <Badge variant="outline" className="text-xs">YouTube</Badge>}
                                  {seller.tiktok && <Badge variant="outline" className="text-xs">TikTok</Badge>}
                                  {seller.telegram && <Badge variant="outline" className="text-xs">Telegram</Badge>}
                                  {!seller.email && !seller.phone && !seller.whatsapp && !seller.discord && !seller.website && (
                                    <span className="text-xs text-muted-foreground">None</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {seller.images?.length || 0} images
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {seller.prices?.length || 0} items
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm">{seller.averageRating?.toFixed(1) || '0.0'}</span>
                                  <span className="text-xs text-muted-foreground">({seller.totalReviews || 0})</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{typeof seller.rank === 'number' ? seller.rank : '—'}</Badge>
                              </TableCell>
                              <TableCell>
                                {seller.featured && <Badge variant="default" className="text-xs">Featured</Badge>}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingSeller(seller);
                                      setSellerForm({
                                        name: seller.name,
                                        description: seller.description || "",
                                        images: (seller.images || seller.imageUrls || []).join(', '),
                                        prices: seller.prices?.map((p: any) => `${p.item}:${p.price}`).join('\n') || "",
                                        priceItems: seller.prices?.map((p: any) => ({
                                          item: p.item || "",
                                          price: String(p.price || "")
                                        })) || [],
                                        email: seller.email || "",
                                        phone: seller.phone || "",
                                        whatsapp: seller.whatsapp || "",
                                        discord: seller.discord || "",
                                        website: seller.website || "",
                                        facebook: seller.facebook || "",
                                        twitter: seller.twitter || "",
                                        instagram: seller.instagram || "",
                                        youtube: seller.youtube || "",
                                        tiktok: seller.tiktok || "",
                                        telegram: seller.telegram || "",
                                        featured: seller.featured || false,
                                        promotionText: seller.promotionText || "",
                                        rank: typeof seller.rank === 'number' ? String(seller.rank) : "",
                                      });
                                      setIsCreatingSeller(true);
                                    }}
                                    data-testid={`button-edit-seller-${seller.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const slug = seller.seller_name_slug || seller.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                                      window.open(`/seller/${slug}`, '_blank');
                                    }}
                                    title="View Profile"
                                    data-testid={`button-view-seller-${seller.id}`}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                  {isSuperAdmin && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={async () => {
                                        // open reviews dialog and load reviews for this seller
                                        setActiveSellerForReviews(seller);
                                        setReviewsDialogOpen(true);
                                        setLoadingReviews(true);
                                        try {
                                          const data = await apiRequest(`/api/admin/reviews?sellerId=${seller.id}`, 'GET');
                                          setSellerReviews(data || []);
                                        } catch (err: any) {
                                          toast({ title: 'Failed to load reviews', description: err?.message, variant: 'destructive' });
                                          setSellerReviews([]);
                                        } finally {
                                          setLoadingReviews(false);
                                        }
                                      }}
                                      title="Manage reviews"
                                      data-testid={`button-manage-reviews-${seller.id}`}
                                    >
                                      <MessageSquare className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setDeleteConfirmId(seller.id);
                                      setDeleteType("seller");
                                    }}
                                    data-testid={`button-delete-seller-${seller.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!sellers || sellers.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                No sellers found. Create your first seller to get started.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {canRestoration && (
                <TabsContent value="restoration" className="space-y-6" data-testid="content-restoration">
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold">Database Restoration</h2>
                      <p className="text-muted-foreground">
                        Restore all historical events and grave modes from backup data
                      </p>
                    </div>
                    <RestorationManager />
                  </div>
                </TabsContent>
              )}

              {canTranslations && (
                <TabsContent value="translations" className="space-y-6" data-testid="content-translations">
                  <h2 className="text-2xl font-semibold">Translations Management</h2>
                  <p className="text-muted-foreground">
                    Add or update Arabic translations for events and news items. Use the edit buttons in the Events & News tab to manage translations.
                  </p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Events Translations Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {events?.map((event: any) => (
                            <div key={event.id} className="flex items-center justify-between p-3 border rounded-md" data-testid={`translation-event-${event.id}`}>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{event.title}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant={event.titleAr ? "default" : "secondary"} className="text-xs">
                                    {event.titleAr ? "Title ✓" : "Title ✗"}
                                  </Badge>
                                  <Badge variant={event.descriptionAr ? "default" : "secondary"} className="text-xs">
                                    {event.descriptionAr ? "Description ✓" : "Description ✗"}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingEvent(event);
                                  setEventForm({
                                    title: event.title,
                                    titleAr: event.titleAr || "",
                                    description: event.description || "",
                                    descriptionAr: event.descriptionAr || "",
                                    date: event.date,
                                    type: (event.type || "upcoming") as "upcoming" | "trending",
                                    image: event.imageUrl || event.image || "",
                                    images: Array.isArray(event.images) ? event.images : [],
                                    event_name_slug: event.event_name_slug || "",
                                    seoTitle: event.seoTitle || "",
                                    seoDescription: event.seoDescription || "",
                                    seoKeywords: event.seoKeywords || "",
                                    canonicalUrl: event.canonicalUrl || "",
                                    ogImage: event.ogImage || "",
                                    twitterImage: event.twitterImage || "",
                                    schemaType: event.schemaType || "Event",
                                    fullLayout: event.fullLayout || false,
                                    sourceUrl: event.sourceUrl || "",
                                    isVerified: event.isVerified || false,
                                    externalLinks: event.externalLinks || [],
                                  });
                                  setIsCreatingEvent(true);
                                }}
                                data-testid={`button-translate-event-${event.id}`}
                              >
                                <Languages className="h-4 w-4 mr-1" />
                                Translate
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>News Translations Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {newsItems?.map((news: any) => (
                            <div key={news.id} className="flex items-center justify-between p-3 border rounded-md" data-testid={`translation-news-${news.id}`}>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{news.title}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant={news.titleAr ? "default" : "secondary"} className="text-xs">
                                    {news.titleAr ? "Title ✓" : "Title ✗"}
                                  </Badge>
                                  <Badge variant={news.contentAr ? "default" : "secondary"} className="text-xs">
                                    {news.contentAr ? "Content ✓" : "Content ✗"}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingNews(news);
                                  setNewsForm({
                                    title: news.title,
                                    news_slug: news.news_slug || "",
                                    titleAr: news.titleAr || "",
                                    dateRange: news.dateRange || "",
                                    image: news.image,
                                    images: Array.isArray(news.images) ? news.images : [],
                                    category: news.category,
                                    content: news.content,
                                    contentAr: news.contentAr || "",
                                    author: news.author,
                                    featured: news.featured,
                                    previewOnHome: news.previewOnHome !== false,
                                    seoTitle: news.seoTitle || "",
                                    seoDescription: news.seoDescription || "",
                                    seoKeywords: news.seoKeywords || "",
                                    canonicalUrl: news.canonicalUrl || "",
                                    ogImage: news.ogImage || "",
                                    twitterImage: news.twitterImage || "",
                                    schemaType: news.schemaType || "NewsArticle",
                                    fullLayout: news.fullLayout || false,
                                    sourceUrl: news.sourceUrl || "",
                                    isVerified: news.isVerified || false,
                                    externalLinks: news.externalLinks || [],
                                  });
                                  setIsCreatingNews(true);
                                }}
                                data-testid={`button-translate-news-${news.id}`}
                              >
                                <Languages className="h-4 w-4 mr-1" />
                                Translate
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              )}

              {canAdmins && (
                <TabsContent value="admins" className="space-y-6" data-testid="content-admins">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Admins Management</h2>
                    <Dialog open={isCreatingAdmin} onOpenChange={(open) => {
                      setIsCreatingAdmin(open);
                      if (!open) {
                        setEditingAdmin(null);
                        resetAdminForm();
                      }
                    }}>
                      <DialogTrigger asChild>
                        {canAdmins && (
                          <Button data-testid="button-create-admin">
                            <Plus className="h-4 w-4 mr-2" />
                            New Admin
                          </Button>
                        )}
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingAdmin ? "Edit Admin" : "Create New Admin"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Username"
                            value={adminForm.username}
                            onChange={(e) =>
                              setAdminForm({ ...adminForm, username: e.target.value })
                            }
                            data-testid="input-admin-username"
                          />
                          <Input
                            type="password"
                            placeholder={editingAdmin ? "New Password (leave empty to keep current)" : "Password"}
                            value={adminForm.password}
                            onChange={(e) =>
                              setAdminForm({ ...adminForm, password: e.target.value })
                            }
                            data-testid="input-admin-password"
                          />
                          <select
                            value={adminForm.role}
                            onChange={(e) =>
                              setAdminForm({
                                ...adminForm,
                                role: e.target.value as "admin" | "seller_admin" | "super_admin",
                              })
                            }
                            className="w-full h-9 px-3 rounded-md border border-input bg-background"
                            data-testid="select-admin-role"
                          >
                            <option value="admin">Admin</option>
                            <option value="seller_admin">Seller Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                          {adminForm.role === "seller_admin" && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Allowed Sellers</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-auto border rounded-md p-2">
                                {(sellers || []).map((sel: any) => (
                                  <label key={sel.id} className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={adminForm.allowedSellerIds.includes(sel.id)}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setAdminForm((f) => ({
                                          ...f,
                                          allowedSellerIds: checked
                                            ? [...f.allowedSellerIds, sel.id]
                                            : f.allowedSellerIds.filter((id) => id !== sel.id),
                                        }));
                                      }}
                                    />
                                    <span>{sel.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="pt-2">
                            <p className="text-sm font-medium mb-2">Permissions</p>
                            <div className="max-h-72 overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-3">
                              <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                              {AVAILABLE_PERMISSIONS.map((p) => (
                                <label key={p.key} className="flex items-start gap-3 rounded-md border border-border/50 bg-background px-3 py-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={!!adminPermissionsForm[p.key]}
                                    onChange={(e) => setAdminPermissionsForm((s) => ({ ...s, [p.key]: e.target.checked }))}
                                  />
                                  <span>{p.label}</span>
                                </label>
                              ))}
                            </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => {
                              if (editingAdmin) {
                                const updates: any = { role: adminForm.role };
                                if (adminForm.username) updates.username = adminForm.username;
                                if (adminForm.password) updates.password = adminForm.password;
                                if (adminForm.role === "seller_admin") {
                                  updates.allowedSellerIds = adminForm.allowedSellerIds || [];
                                }
                                // include permissions when updating
                                updateAdminMutation.mutate({ id: editingAdmin.id, data: { ...updates, permissions: adminPermissionsForm } });
                              } else {
                                const payload: any = { ...adminForm, permissions: adminPermissionsForm };
                                if (adminForm.role === "seller_admin") {
                                  payload.allowedSellerIds = adminForm.allowedSellerIds || [];
                                }
                                createAdminMutation.mutate(payload);
                              }
                            }}
                            className="w-full"
                            data-testid="button-submit-admin"
                          >
                            {editingAdmin ? "Update Admin" : "Create Admin"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {admins?.map((admin: any) => (
                            <TableRow key={admin.id} data-testid={`admin-row-${admin.id}`}>
                              <TableCell className="font-medium" data-testid={`admin-username-${admin.id}`}>{admin.username}</TableCell>
                              <TableCell>
                                <Badge variant={(Array.isArray(admin.roles) ? admin.roles[0] : admin.role) === "super_admin" ? "default" : "secondary"} data-testid={`admin-role-${admin.id}`}>
                                  {(Array.isArray(admin.roles) ? admin.roles[0] : admin.role) === "super_admin" ? "Super Admin" : "Admin"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(admin.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingAdmin(admin);
                                      setAdminForm({
                                        username: admin.username,
                                        password: "",
                                        role: Array.isArray(admin.roles) && admin.roles.length ? admin.roles[0] : (admin.role || "admin"),
                                        allowedSellerIds: Array.isArray(admin.allowedSellerIds) ? admin.allowedSellerIds : [],
                                      });
                                      // load existing permissions for this admin (if any)
                                      (async () => {
                                        try {
                                          const perms = await apiRequest('/api/admin-permissions', 'GET');
                                          const mapping = perms || {};
                                          const adminPerms = mapping[admin.id] || {};
                                          setAdminPermissionsForm(adminPerms || {});
                                        } catch (err) {
                                          console.error('Failed to load admin permissions', err);
                                          setAdminPermissionsForm({});
                                        }
                                      })();
                                      setIsCreatingAdmin(true);
                                    }}
                                    data-testid={`button-edit-admin-${admin.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {canAdmins && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setDeleteConfirmId(admin.id);
                                        setDeleteType("admin");
                                      }}
                                      data-testid={`button-delete-admin-${admin.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {canSubscribers && (
                <TabsContent value="subscribers" className="space-y-6" data-testid="content-subscribers">
                  <h2 className="text-2xl font-semibold">Newsletter Subscribers</h2>

                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Subscribed At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscribers?.map((subscriber: any) => (
                            <TableRow key={subscriber.id} data-testid={`subscriber-row-${subscriber.id}`}>
                              <TableCell className="font-medium" data-testid={`subscriber-email-${subscriber.id}`}>
                                {subscriber.email}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(subscriber.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                {canManageSubscribers && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setDeleteConfirmId(subscriber.id);
                                      setDeleteType("subscriber");
                                    }}
                                    data-testid={`button-delete-subscriber-${subscriber.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!subscribers || subscribers.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                No subscribers yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {canMercenaries && (
                <TabsContent value="mercenaries" className="space-y-6" data-testid="content-mercenaries">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Mercenaries Management</h2>
                    <Dialog open={isCreatingMerc} onOpenChange={(open) => {
                      setIsCreatingMerc(open);
                      if (!open) {
                        setEditingMerc(null);
                        setCreateMercForm({ name: "", image: "", role: "", description: "", voiceLines: [], order: "" });
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-create-mercenary">
                          <Plus className="h-4 w-4 mr-2" />
                          New Mercenary
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {editingMerc ? "Edit Mercenary" : "Create New Mercenary"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Name"
                            value={editingMerc ? mercForm.name : createMercForm.name}
                            onChange={(e) => {
                              if (editingMerc) {
                                setMercForm({ ...mercForm, name: e.target.value });
                              } else {
                                setCreateMercForm({ ...createMercForm, name: e.target.value });
                              }
                            }}
                            data-testid="input-mercenary-name"
                          />
                          <Input
                            placeholder="Role (e.g., Assault, Sniper)"
                            value={editingMerc ? mercForm.role : createMercForm.role}
                            onChange={(e) => {
                              if (editingMerc) {
                                setMercForm({ ...mercForm, role: e.target.value });
                              } else {
                                setCreateMercForm({ ...createMercForm, role: e.target.value });
                              }
                            }}
                            data-testid="input-mercenary-role"
                          />
                          <Input
                            placeholder="Image URL"
                            value={editingMerc ? mercForm.image : createMercForm.image}
                            onChange={(e) => {
                              if (editingMerc) {
                                setMercForm({ ...mercForm, image: e.target.value });
                              } else {
                                setCreateMercForm({ ...createMercForm, image: e.target.value });
                              }
                            }}
                            data-testid="input-mercenary-image"
                          />
                          <Textarea
                            placeholder="Description"
                            value={editingMerc ? mercForm.description : createMercForm.description}
                            onChange={(e) => {
                              if (editingMerc) {
                                setMercForm({ ...mercForm, description: e.target.value });
                              } else {
                                setCreateMercForm({ ...createMercForm, description: e.target.value });
                              }
                            }}
                            rows={3}
                            data-testid="input-mercenary-description"
                          />

                          <Input
                            placeholder="Order (1 = first)"
                            value={editingMerc ? mercForm.order : createMercForm.order}
                            onChange={(e) => {
                              if (editingMerc) {
                                setMercForm({ ...mercForm, order: e.target.value });
                              } else {
                                setCreateMercForm({ ...createMercForm, order: e.target.value });
                              }
                            }}
                            data-testid="input-mercenary-order"
                          />

                          <div className="space-y-2">
                            <Label>Voice Lines (MP3 URLs)</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="audio/*"
                                multiple
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  setAudioFiles(files as File[]);
                                }}
                                data-testid="input-voice-upload"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (!audioFiles || audioFiles.length === 0) {
                                    toast({ title: 'No audio selected', variant: 'destructive' });
                                    return;
                                  }
                                  try {
                                    const uploaded: string[] = [];
                                    for (const f of audioFiles) {
                                      const formData = new FormData();
                                      formData.append('audio', f);
                                      const res = await fetch(`${apiBase}/api/upload-audio`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` },
                                        body: formData,
                                      });
                                      if (!res.ok) throw new Error('Upload failed');
                                      const json = await res.json();
                                      if (json?.url) uploaded.push(json.url);
                                    }
                                    setUploadedAudioUrls(uploaded);
                                    if (uploaded.length) {
                                      if (editingMerc) {
                                        setMercForm({ ...mercForm, voiceLines: [...mercForm.voiceLines, ...uploaded] });
                                      } else {
                                        setCreateMercForm({ ...createMercForm, voiceLines: [...createMercForm.voiceLines, ...uploaded] });
                                      }
                                      toast({ title: 'Uploaded audio files', description: `${uploaded.length} files added` });
                                    }
                                  } catch (err: any) {
                                    toast({ title: 'Failed to upload audio', description: err?.message, variant: 'destructive' });
                                  }
                                }}
                                data-testid="button-upload-voice"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Audio
                              </Button>
                            </div>
                            {(editingMerc ? mercForm.voiceLines : createMercForm.voiceLines).map((url: string, index: number) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  placeholder={`Voice line ${index + 1} URL`}
                                  value={url}
                                  onChange={(e) => {
                                    const newLines = [...(editingMerc ? mercForm.voiceLines : createMercForm.voiceLines)];
                                    newLines[index] = e.target.value;
                                    if (editingMerc) {
                                      setMercForm({ ...mercForm, voiceLines: newLines });
                                    } else {
                                      setCreateMercForm({ ...createMercForm, voiceLines: newLines });
                                    }
                                  }}
                                  data-testid={`input-voice-line-${index}`}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newLines = (editingMerc ? mercForm.voiceLines : createMercForm.voiceLines).filter((_: string, i: number) => i !== index);
                                    if (editingMerc) {
                                      setMercForm({ ...mercForm, voiceLines: newLines });
                                    } else {
                                      setCreateMercForm({ ...createMercForm, voiceLines: newLines });
                                    }
                                  }}
                                  data-testid={`button-remove-voice-line-${index}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (editingMerc) {
                                  setMercForm({ ...mercForm, voiceLines: [...mercForm.voiceLines, ""] });
                                } else {
                                  setCreateMercForm({ ...createMercForm, voiceLines: [...createMercForm.voiceLines, ""] });
                                }
                              }}
                              className="w-full"
                              data-testid="button-add-voice-line"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Voice Line
                            </Button>
                          </div>

                          <Button
                            onClick={() => {
                              const formData = editingMerc ? mercForm : createMercForm;
                              const data = {
                                name: formData.name,
                                role: formData.role,
                                image: formData.image,
                                description: formData.description,
                                voiceLines: formData.voiceLines.filter((url: string) => url.trim() !== ""),
                                order: String((formData as any).order || "").trim() ? parseInt(String((formData as any).order).trim(), 10) : undefined,
                              };

                              if (editingMerc) {
                                updateMercenaryMutation.mutate({ id: editingMerc.id, data });
                              } else {
                                createMercenaryMutation.mutate(data);
                              }
                            }}
                            className="w-full"
                            data-testid="button-submit-mercenary"
                          >
                            {editingMerc ? "Update Mercenary" : "Create Mercenary"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Image</TableHead>
                            <TableHead>Sounds</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mercenaries?.map((merc: any) => (
                            <TableRow key={merc.id} data-testid={`merc-row-${merc.id}`}>
                              <TableCell className="font-medium max-w-xs truncate">{merc.name}</TableCell>
                              <TableCell>{merc.role}</TableCell>
                              <TableCell>
                                {merc.image ? (
                                  <img src={merc.image} alt={merc.name} className="h-12 w-12 object-cover rounded" />
                                ) : (
                                  <span className="text-sm text-muted-foreground">No image</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{merc.voiceLines ? merc.voiceLines.length : 0}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  {canManageMercenaries && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setEditingMerc(merc);
                                        setMercForm({
                                          name: merc.name || "",
                                          role: merc.role || "",
                                          image: merc.image || "",
                                          description: merc.description || "",
                                          voiceLines: merc.voiceLines || [],
                                          order: typeof merc.order === 'number' ? String(merc.order) : "",
                                        });
                                        setIsCreatingMerc(true);
                                      }}
                                      data-testid={`button-edit-merc-${merc.id}`}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {canManageMercenaries && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setDeleteConfirmId(merc.id);
                                        setDeleteType("mercenary");
                                      }}
                                      data-testid={`button-delete-merc-${merc.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!mercenaries || mercenaries.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                No mercenaries found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Dialog open={isEditingMerc} onOpenChange={(open) => {
                    if (!open) {
                      setIsEditingMerc(false);
                      setEditingMerc(null);
                      setMercForm({ name: "", role: "", image: "", description: "", voiceLines: [], order: "" });
                    }
                  }}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingMerc ? `Edit ${editingMerc.name}` : "Edit Mercenary"}</DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={mercForm.name}
                            onChange={(e) => setMercForm((s) => ({ ...s, name: e.target.value }))}
                            placeholder="Mercenary name"
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setMercImageFile(e.target.files?.[0] || null)}
                              data-testid="input-image-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!mercImageFile) {
                                  toast({ title: 'No image selected', variant: 'destructive' });
                                  return;
                                }
                                try {
                                  const formData = new FormData();
                                  formData.append('image', mercImageFile);
                                  const res = await fetch(`${apiBase}/api/upload-image`, {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`,
                                      'x-csrf-token': localStorage.getItem('csrfToken') || '',
                                    },
                                    body: formData,
                                  });
                                  if (!res.ok) throw new Error('Upload failed');
                                  const json = await res.json().catch(() => null);
                                  const url = json?.domain_url || json?.results?.[0]?.domain_url || json?.url || '';
                                  if (url) {
                                    if (editingMerc) {
                                      setMercForm({ ...mercForm, image: url });
                                    } else {
                                      setCreateMercForm({ ...createMercForm, image: url });
                                    }
                                    toast({ title: 'Image uploaded', description: 'Image URL updated' });
                                  }
                                } catch (err: any) {
                                  toast({ title: 'Failed to upload image', description: err?.message, variant: 'destructive' });
                                }
                              }}
                              data-testid="button-upload-image"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Image
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label>Role</Label>
                          <Input
                            value={mercForm.role}
                            onChange={(e) => setMercForm((s) => ({ ...s, role: e.target.value }))}
                            placeholder="e.g., Assault, Support"
                          />
                        </div>
                        <div>
                          <Label>Image URL</Label>
                          <Input
                            value={mercForm.image}
                            onChange={(e) => setMercForm((s) => ({ ...s, image: e.target.value }))}
                            placeholder="https://.../image.jpg"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={mercForm.description}
                            onChange={(e) => setMercForm((s) => ({ ...s, description: e.target.value }))}
                            placeholder="Mercenary description"
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label>Voice Lines (MP3 URLs)</Label>
                          {mercForm.voiceLines.map((url: string, index: number) => (
                            <div key={index} className="flex gap-2 mb-2">
                              <Input
                                placeholder={`Voice line ${index + 1} URL`}
                                value={url}
                                onChange={(e) => {
                                  const newLines = [...mercForm.voiceLines];
                                  newLines[index] = e.target.value;
                                  setMercForm({ ...mercForm, voiceLines: newLines });
                                }}
                                data-testid={`input-edit-voice-line-${index}`}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const newLines = mercForm.voiceLines.filter((_: string, i: number) => i !== index);
                                  setMercForm({ ...mercForm, voiceLines: newLines });
                                }}
                                data-testid={`button-remove-edit-voice-line-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setMercForm({ ...mercForm, voiceLines: [...mercForm.voiceLines, ""] });
                            }}
                            className="w-full"
                            data-testid="button-add-edit-voice-line"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Voice Line
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => {
                              const first = mercForm.voiceLines.map(s => s.trim()).find(Boolean);
                              if (first) {
                                const a = new Audio(first);
                                a.play().catch(() => { });
                              } else {
                                toast({ title: 'No sound to preview', variant: 'destructive' });
                              }
                            }}
                          >
                            Preview
                          </Button>
                          <Button
                            onClick={() => {
                              if (!editingMerc) return;
                              if (!mercForm.name.trim()) {
                                toast({ title: 'Mercenary name is required', variant: 'destructive' });
                                return;
                              }
                              const sounds = mercForm.voiceLines.filter((s) => s.trim() !== "").slice(0, 30);
                              if (sounds.length === 0) {
                                toast({ title: 'Add at least one sound URL', variant: 'destructive' });
                                return;
                              }
                              updateMercenaryMutation.mutate({ id: editingMerc.id, data: { name: mercForm.name, role: mercForm.role, image: mercForm.image, description: mercForm.description, voiceLines: sounds } });
                              setAudioFiles([]);
                              setUploadedAudioUrls([]);
                            }}
                            disabled={updateMercenaryMutation.isPending}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TabsContent>
              )}

              {isSuperAdmin && (
                <TabsContent value="reset-codes" className="space-y-6" data-testid="content-reset-codes">
                  <Card>
                    <CardHeader>
                      <CardTitle>Password Reset Codes</CardTitle>
                      <CardDescription>Generate unique reset codes and copy to send manually.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row gap-2 items-start md:items-end">
                        <div className="flex-1">
                          <Label>Email</Label>
                          <Input value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="user@example.com" />
                        </div>
                        <Button onClick={generateResetCode} className="w-full md:w-auto">Generate Code</Button>
                      </div>
                      {generatedResetCode && (
                        <div className="mt-3 flex items-center gap-2">
                          <Input readOnly value={generatedResetCode} />
                          <Button type="button" onClick={() => navigator.clipboard.writeText(generatedResetCode)}>
                            Copy
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">Use your email client to send the code to the user.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {canTickets && (
                <>
                <TabsContent value="tickets" className="space-y-6" data-testid="content-tickets">
                  <h2 className="text-2xl font-semibold">Support Tickets</h2>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Attachment</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickets?.map((ticket: any) => (
                            <TableRow key={ticket.id} data-testid={`ticket-row-${ticket.id}`}>
                              <TableCell className="font-medium max-w-xs truncate">{ticket.title}</TableCell>
                              <TableCell>{ticket.userName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
                              </TableCell>
                              <TableCell>
                                <select
                                  value={ticket.status}
                                  onChange={(e) => {
                                    updateTicketMutation.mutate({
                                      id: ticket.id,
                                      data: { status: e.target.value }
                                    });
                                  }}
                                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                                  data-testid={`select-ticket-status-${ticket.id}`}
                                >
                                  <option value="open">Open</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="closed">Closed</option>
                                </select>
                              </TableCell>
                              <TableCell>
                                <select
                                  value={ticket.priority}
                                  onChange={(e) => {
                                    updateTicketMutation.mutate({
                                      id: ticket.id,
                                      data: { priority: e.target.value }
                                    });
                                  }}
                                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                                  data-testid={`select-ticket-priority-${ticket.id}`}
                                >
                                  <option value="low">Low</option>
                                  <option value="normal">Normal</option>
                                  <option value="high">High</option>
                                </select>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs max-w-xs truncate">
                                {ticket.mediaUrl ? (
                                  <a href={ticket.mediaUrl} target="_blank" rel="noreferrer" className="underline">
                                    {ticket.mediaUrl}
                                  </a>
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {ticket.createdAt}
                              </TableCell>
                              <TableCell className="text-right">
                                {canTickets && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setDeleteConfirmId(ticket.id);
                                      setDeleteType("ticket");
                                    }}
                                    data-testid={`button-delete-ticket-${ticket.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setActiveTicket(ticket);
                                    setReplyDialogOpen(true);
                                    (async () => {
                                      try {
                                        const base = (import.meta as any).env?.VITE_API_URL || "";
                                        const url = base ? `${base}/api/tickets/${ticket.id}/replies` : `/api/tickets/${ticket.id}/replies`;
                                        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` }, credentials: 'include' });
                                        if (res.ok) {
                                          const json = await res.json();
                                          setActiveTicketReplies(json || []);
                                        }
                                      } catch { }
                                    })();
                                  }}
                                  data-testid={`button-reply-ticket-${ticket.id}`}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {(!tickets || tickets.length === 0) && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                No support tickets found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  <h2 className="text-2xl font-semibold">Contact Messages</h2>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tickets?.filter((t: any) => (t.category || '').toLowerCase() === 'contact').map((ticket: any) => (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-medium max-w-xs truncate">{ticket.title}</TableCell>
                              <TableCell>{ticket.userName}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{ticket.createdAt}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setActiveTicket(ticket);
                                    setReplyDialogOpen(true);
                                    (async () => {
                                      try {
                                        const base = (import.meta as any).env?.VITE_API_URL || "";
                                        const url = base ? `${base}/api/tickets/${ticket.id}/replies` : `/api/tickets/${ticket.id}/replies`;
                                        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` }, credentials: 'include' });
                                        if (res.ok) {
                                          const json = await res.json();
                                          setActiveTicketReplies(json || []);
                                        }
                                      } catch { }
                                    })();
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {tickets && tickets.filter((t: any) => (t.category || '').toLowerCase() === 'contact').length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No contact messages</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="faq" className="space-y-6" data-testid="content-faq">
                  <FAQManager />
                </TabsContent>
                </>
              )}
              {isSuperAdmin && (
                <TabsContent value="analytics" className="space-y-6" data-testid="content-analytics">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analytics Range</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="fromDate">From</Label>
                        <Input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="toDate">To</Label>
                        <Input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tutorials</CardTitle>
                      <CardDescription>Views, unique visitors, average duration</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Unique</TableHead>
                            <TableHead>Avg ms</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(tutorialAnalytics?.group || []).map((r: any) => (
                            <TableRow key={r.tutorialId}>
                              <TableCell className="font-mono text-xs">{r.tutorialId}</TableCell>
                              <TableCell>{r.total}</TableCell>
                              <TableCell>{r.uniqueCount}</TableCell>
                              <TableCell>{Math.round(r.avgDuration || 0)}</TableCell>
                            </TableRow>
                          ))}
                          {(tutorialAnalytics?.group || []).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-muted-foreground">No data</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Sellers</CardTitle>
                      <CardDescription>Views, clicks, CTR, unique visitors</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Slug</TableHead>
                            <TableHead>Views</TableHead>
                            <TableHead>Clicks</TableHead>
                            <TableHead>CTR</TableHead>
                            <TableHead>Unique</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(sellerAnalytics?.group || []).map((r: any) => (
                            <TableRow key={r.sellerSlug}>
                              <TableCell className="font-mono text-xs">{r.sellerSlug}</TableCell>
                              <TableCell>{r.views}</TableCell>
                              <TableCell>{r.clicks}</TableCell>
                              <TableCell>{(Number(r.ctr || 0) * 100).toFixed(1)}%</TableCell>
                              <TableCell>{r.uniqueCount}</TableCell>
                            </TableRow>
                          ))}
                          {(sellerAnalytics?.group || []).length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-muted-foreground">No data</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {isSuperAdmin && (
                <>
                  <TabsContent value="custom-pages" className="space-y-6" data-testid="content-custom-pages">
                    <CustomPagesManager />
                  </TabsContent>

                  <TabsContent value="chat-settings" className="space-y-6" data-testid="content-chat-settings">
                  <div>
                    <h2 className="text-2xl font-semibold mb-6">Chat Settings & Management</h2>

                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle>Chat Registration Control</CardTitle>
                        <CardDescription>Control whether users can register for the chat</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                          <div className="space-y-1">
                            <p className="font-medium">Registration Status</p>
                            <p className="text-sm text-muted-foreground">
                              {registrationClosed ? "Chat registration is CLOSED" : "Chat registration is OPEN"}
                            </p>
                          </div>
                          <Switch
                            checked={!registrationClosed}
                            onCheckedChange={(checked) => {
                              setRegistrationClosed(!checked);
                              apiRequest("/api/admin/chat/registration", "POST", {
                                enabled: checked
                              }).then(() => {
                                toast({
                                  title: checked ? "Registration Opened" : "Registration Closed",
                                  description: checked ? "Users can now register for chat" : "Users cannot register for chat"
                                });
                              }).catch((err) => {
                                toast({
                                  title: "Error",
                                  description: err.message,
                                  variant: "destructive"
                                });
                              });
                            }}
                            data-testid="switch-chat-registration"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Registered Chat Users</CardTitle>
                        <CardDescription>Manage chat user registrations and verification status</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {usersLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : users.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">No chat users registered yet</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Username</TableHead>
                                  <TableHead>Email</TableHead>
                                  <TableHead>Registration Date</TableHead>
                                  <TableHead className="text-center">Verified</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {users.map((user: any) => (
                                  <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                                    <TableCell className="font-medium">{user.username || user.name || "Unknown"}</TableCell>
                                    <TableCell className="text-sm">{user.email || "No email"}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {user.verified ? (
                                        <Badge variant="default" className="bg-green-600">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Verified
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-yellow-600">
                                          Pending
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                      {!user.verified && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            apiRequest(`/api/admin/chat/users/${user.id}/verify`, "POST", {})
                                              .then(() => {
                                                setUsers(users.map((u: any) =>
                                                  u.id === user.id ? { ...u, verified: true } : u
                                                ));
                                                toast({ title: "User verified" });
                                              })
                                              .catch((err) => {
                                                toast({ title: "Error", description: err.message, variant: "destructive" });
                                              });
                                          }}
                                          data-testid={`button-verify-${user.id}`}
                                        >
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Verify
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => {
                                          setDeleteConfirmId(user.id);
                                          setDeleteType("chat user");
                                        }}
                                        data-testid={`button-kick-${user.id}`}
                                      >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Kick
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                        <Button
                          onClick={() => {
                            setUsersLoading(true);
                            apiRequest("/api/admin/chat/users", "GET")
                              .then((data: any) => {
                                setUsers(data || []);
                              })
                              .catch((err) => {
                                toast({ title: "Error loading users", description: err.message, variant: "destructive" });
                              })
                              .finally(() => {
                                setUsersLoading(false);
                              });
                          }}
                          className="mt-4"
                          variant="outline"
                          data-testid="button-refresh-users"
                        >
                          <RotateCw className="h-4 w-4 mr-2" />
                          Refresh User List
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                </>
              )}
              <TabsContent value="site-settings" className="space-y-6">
                <Card className="wiki-content-card">
                  <CardHeader>
                    <CardTitle className="text-2xl font-black uppercase italic tracking-tight">
                      Global Site Customization
                    </CardTitle>
                    <CardDescription>
                      Customize the look and feel of the entire wiki without restrictions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      <Label className="text-lg font-bold uppercase italic">Full Site Background</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label>Background Image URL</Label>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="https://example.com/bg.jpg" 
                              value={bgSettings.backgroundImageUrl}
                              onChange={(e) => setBgSettings({ ...bgSettings, backgroundImageUrl: e.target.value })}
                            />
                            <Button variant="outline" size="icon" onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) {
                                  const fd = new FormData();
                                  fd.append('image', file);
                                  try {
                                    const res = await fetch('/api/upload-image', {
                                      method: 'POST',
                                      headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                                      body: fd
                                    });
                                    const data = await res.json();
                                    const bgUrl = data.domain_url || data.results?.[0]?.domain_url || data.url || '';
                                    if (bgUrl) setBgSettings({ ...bgSettings, backgroundImageUrl: bgUrl });
                                  } catch (err) {
                                    toast({ title: "Upload failed", variant: "destructive" });
                                  }
                                }
                              };
                              input.click();
                            }}>
                              <Upload className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground italic">
                            Tip: Use high-quality dark/industrial images for the best CrossFire look.
                          </p>
                        </div>
                        <div className="border rounded-xl overflow-hidden aspect-video relative bg-muted">
                          {bgSettings.backgroundImageUrl ? (
                            <img src={bgSettings.backgroundImageUrl} className="w-full h-full object-cover" alt="Preview" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">No Background Set</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t">
                      <Button 
                        size="lg" 
                        onClick={saveBgSettings}
                        className="w-full md:w-auto font-black uppercase italic tracking-widest px-12"
                      >
                        Apply Global Theme
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>

      <Dialog open={reviewsDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setReviewsDialogOpen(false);
          setActiveSellerForReviews(null);
          setSellerReviews([]);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reviews for {activeSellerForReviews?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {loadingReviews ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : sellerReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews for this seller.</p>
            ) : (
              <div className="space-y-3">
                {sellerReviews.map((review: any) => (
                  <Card key={review.id}>
                    <CardContent className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{review.userName}</span>
                          {!review.phoneVerified && (
                            <Badge variant="outline" className="text-xs">Unverified</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{Array.from({ length: review.rating }).map((_, i) => (<Star key={i} className="h-4 w-4 text-yellow-400 inline-block" />))} <span className="ml-2 text-xs">{review.rating}</span></div>
                        {review.phoneCountryCode && <p className="text-xs mt-1">+{review.phoneCountryCode} • {review.phoneMasked || '****'}</p>}
                        <p className="text-xs text-muted-foreground mt-2">{new Date(review.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-start">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const base = (import.meta as any).env?.VITE_API_URL || '';
                              const url = base ? `${base}/api/admin/reviews/${review.id}/phone` : `/api/admin/reviews/${review.id}/phone`;
                              const res = await fetch(url, { headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`, 'X-CSRF-Token': csrfToken } });
                              if (res.ok) {
                                const data = await res.json();
                                toast({ title: 'Phone Revealed', description: `${data.phone} (+${data.countryCode})` });
                              } else {
                                const text = await res.text();
                                toast({ title: 'Reveal failed', description: text, variant: 'destructive' });
                              }
                            } catch (err: any) {
                              toast({ title: 'Reveal failed', description: err?.message, variant: 'destructive' });
                            }
                          }}
                        >Reveal</Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await apiRequest(`/api/admin/reviews/${review.id}/verify-phone`, 'PATCH', { csrfToken });
                              setSellerReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, phoneVerified: true } : r));
                              toast({ title: 'Verified' });
                            } catch (err: any) {
                              toast({ title: 'Verify failed', description: err?.message, variant: 'destructive' });
                            }
                          }}
                        >Verify</Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await apiRequest(`/api/admin/reviews/${review.id}/anonymize-phone`, 'PATCH', { csrfToken });
                              setSellerReviews((prev) => prev.map((r) => r.id === review.id ? { ...r, phoneMasked: '', phoneCountryCode: '', phoneVerified: false } : r));
                              toast({ title: 'Anonymized' });
                            } catch (err: any) {
                              toast({ title: 'Anonymize failed', description: err?.message, variant: 'destructive' });
                            }
                          }}
                        >Anonymize</Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            if (!activeSellerForReviews) return;
                            try {
                              await apiRequest(`/api/sellers/${activeSellerForReviews.id}/reviews/${review.id}`, 'DELETE');
                              setSellerReviews((prev) => prev.filter((r) => r.id !== review.id));
                              queryClient.invalidateQueries({ queryKey: ['/api/sellers'] });
                              queryClient.invalidateQueries({ queryKey: [`/api/sellers/${activeSellerForReviews.id}/reviews`] });
                              toast({ title: 'Review deleted' });
                            } catch (err: any) {
                              toast({ title: 'Delete failed', description: err?.message, variant: 'destructive' });
                            }
                          }}
                          data-testid={`admin-delete-review-${review.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={replyDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setReplyDialogOpen(false);
          setActiveTicket(null);
          setActiveTicketReplies([]);
          setReplyText("");
          setReplyFile(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ticket Replies</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              {activeTicketReplies?.map((r: any) => (
                <div key={r.id} className="border p-3 rounded-md">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{r.isAdmin ? 'Admin' : 'User'}</span>
                    <span>{r.createdAt}</span>
                  </div>
                  <div className="mt-2 text-sm whitespace-pre-wrap">{r.content}</div>
                  {r.mediaUrl && (
                    <div className="mt-2 text-xs break-all">{r.mediaUrl}</div>
                  )}
                </div>
              ))}
              {(!activeTicketReplies || activeTicketReplies.length === 0) && (
                <div className="text-sm text-muted-foreground">No replies yet</div>
              )}
            </div>
            <div className="space-y-3">
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4} placeholder="Type your reply" />
              <Input type="file" accept="image/*,video/*" onChange={(e) => setReplyFile(e.target.files?.[0] || null)} />
              <Button
                onClick={async () => {
                  if (!activeTicket || !replyText.trim()) return;
                  const formData = new FormData();
                  formData.append('authorName', adminUsername || 'Admin');
                  formData.append('content', replyText);
                  formData.append('isAdmin', 'true');
                  if (replyFile) formData.append('attachment', replyFile);
                  const base = (import.meta as any).env?.VITE_API_URL || '';
                  const url = base ? `${base}/api/tickets/${activeTicket.id}/replies` : `/api/tickets/${activeTicket.id}/replies`;
                  const res = await fetch(url, { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` }, credentials: 'include' });
                  if (res.ok) {
                    const created = await res.json();
                    setActiveTicketReplies([...(activeTicketReplies || []), created]);
                    setReplyText('');
                    setReplyFile(null);
                    toast({ title: 'Reply sent' });
                  } else {
                    const text = await res.text();
                    toast({ title: 'Failed to send reply', description: text, variant: 'destructive' });
                  }
                }}
              >
                Send Reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => {
        if (!open) {
          setDeleteConfirmId(null);
          setDeleteType("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteType}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImageEditorModal
        isOpen={imageEditorOpen}
        onClose={() => setImageEditorOpen(false)}
        imageSrc={editingImageSrc}
        onSave={handleImageSave}
        toast={toast}
        config={imageEditorConfig}
      />

      
    </div>
  );
}
