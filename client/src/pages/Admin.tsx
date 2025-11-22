import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useLocation } from "wouter";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import ScrapingManager from "@/components/ScrapingManager";
import TutorialManager from "@/components/TutorialManager";
import CFDataScraper from "@/components/CFDataScraper";
import RestorationManager from "@/components/RestorationManager";
import { PasteFormatter } from "@/components/PasteFormatter";
import { AdvancedContentManager } from "@/components/AdvancedContentManager";
import { Switch } from "@/components/ui/switch";
import type { SiteSettings } from "@/types/site-settings";
import type { ScrapedEvent } from "@shared/types";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [adminRole, setAdminRole] = useState<string>("");
  const [adminUsername, setAdminUsername] = useState<string>("");
  
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
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
    voiceLines: [] as string[] 
  });
  const [createMercForm, setCreateMercForm] = useState({ 
    name: "", 
    image: "", 
    role: "", 
    description: "",
    voiceLines: [] as string[] 
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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

  // Paste formatter state
  const [isPasteFormatterOpen, setIsPasteFormatterOpen] = useState(false);
  const [pastedContent, setPastedContent] = useState("");

  // Reviews management (super_admin only)
  const [reviewsDialogOpen, setReviewsDialogOpen] = useState(false);
  const [activeSellerForReviews, setActiveSellerForReviews] = useState<any | null>(null);
  const [sellerReviews, setSellerReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [activeTicketReplies, setActiveTicketReplies] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [registrationClosed, setRegistrationClosed] = useState(false);

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

  // Controlled active tab so we can provide a responsive selector on small screens
  const [activeTab, setActiveTab] = useState<string>("dashboard");

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
  const canAdmins = isSuperAdmin;
  const canUsers = isSuperAdmin;
  const canSubscribers = isSuperAdmin || !!adminPerms["subscribers:manage"];
  const canScraper = isSuperAdmin || !!adminPerms["events:scrape"] || !!adminPerms["news:scrape"];
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

  useEffect(() => {
    const allowed = new Set<string>([
      "dashboard",
      ...(canPosts ? ["posts"] : []),
      ...(canEventsNews ? ["events-news"] : []),
      ...(canTutorials ? ["tutorials"] : []),
      ...(canSellers ? ["sellers"] : []),
      ...(canCFData ? ["cf-data"] : []),
      ...(canRestoration ? ["restoration"] : []),
      ...(canTranslations ? ["translations"] : []),
      ...(canVerification ? ["verification"] : []),
      ...(canAdmins ? ["admins"] : []),
      ...(canUsers ? ["users"] : []),
      ...(canSubscribers ? ["subscribers"] : []),
      ...(canScraper ? ["scraper"] : []),
      ...(canMercenaries ? ["mercenaries"] : []),
      ...(canTickets ? ["tickets"] : []),
      ...(isSuperAdmin ? ["seller-reviews"] : []),
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
    canSubscribers,
    canScraper,
    canMercenaries,
    canTickets,
    isSuperAdmin,
  ]);

  // Users management
  useEffect(() => {
    if (!canUsers) return;
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
  }, [canUsers]);

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

  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    summary: "",
    image: "",
    category: "Tutorials",
    tags: "",
    author: "Bimora Team",
    featured: false,
    previewOnHome: true,
    readingTime: 5,
    // SEO fields
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    canonicalUrl: "",
    ogImage: "",
    twitterImage: "",
    schemaType: "Article",
  });

  const [eventForm, setEventForm] = useState({
    title: "",
    titleAr: "",
    description: "",
    descriptionAr: "",
    date: "",
    type: "upcoming" as "upcoming" | "trending",
    image: "",
    // SEO fields
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    canonicalUrl: "",
    ogImage: "",
    twitterImage: "",
    schemaType: "Event",
  });

  const [newsForm, setNewsForm] = useState({
    title: "",
    titleAr: "",
    dateRange: "",
    image: "",
    category: "News",
    content: "",
    contentAr: "",
    author: "Bimora Team",
    featured: false,
    previewOnHome: true,
    // SEO fields
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
    canonicalUrl: "",
    ogImage: "",
    twitterImage: "",
    schemaType: "NewsArticle",
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
    featured: false,
    promotionText: "",
  });

  const [adminForm, setAdminForm] = useState({
    username: "",
    password: "",
    role: "admin" as "admin" | "super_admin",
  });
  const [adminPermissionsForm, setAdminPermissionsForm] = useState<Record<string, boolean>>({});

  const AVAILABLE_PERMISSIONS: { key: string; label: string }[] = [
    { key: "events:add", label: "Events - Add (manual)" },
    { key: "events:scrape", label: "Events - Scrape (import)" },
    { key: "news:add", label: "News - Add (manual)" },
    { key: "news:scrape", label: "News - Scrape (import)" },
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
  });

  const [isCreatingWeapon, setIsCreatingWeapon] = useState(false);
  const [isCreatingMode, setIsCreatingMode] = useState(false);
  const [isCreatingRank, setIsCreatingRank] = useState(false);
  const [editingWeapon, setEditingWeapon] = useState<any>(null);
  const [editingMode, setEditingMode] = useState<any>(null);
  const [editingRank, setEditingRank] = useState<any>(null);

  const [siteSettingsForm, setSiteSettingsForm] = useState({
    reviewVerificationEnabled: false,
    reviewVerificationVideoUrl: "",
    reviewVerificationPrompt: "",
    reviewVerificationPassphrase: "",
    reviewVerificationTimecode: "",
    reviewVerificationYouTubeChannelUrl: "",
  });

  const isVerificationReady = !siteSettingsForm.reviewVerificationEnabled || (
    siteSettingsForm.reviewVerificationVideoUrl.trim() !== "" &&
    siteSettingsForm.reviewVerificationPassphrase.trim() !== ""
  );

  const { data: stats } = useQuery<{
    totalPosts: number;
    totalComments: number;
    totalViews: number;
    recentPosts: any[];
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: posts } = useQuery<any[]>({
    queryKey: ["/api/posts"],
  });

  const { data: events } = useQuery<any[]>({
    queryKey: ["/api/events"],
  });

  const { data: newsItems } = useQuery<any[]>({
    queryKey: ["/api/news"],
  });

  const { data: tickets } = useQuery<any[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: admins } = useQuery<any[]>({
    queryKey: ["/api/admins"],
    queryFn: () => apiRequest("/api/admins", "GET"),
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
    enabled: isSuperAdmin,
  });

  const { data: weapons } = useQuery<any[]>({
    queryKey: ["/api/weapons"],
    enabled: isSuperAdmin,
  });

  const { data: modes } = useQuery<any[]>({
    queryKey: ["/api/modes"],
    enabled: isSuperAdmin,
  });

  const { data: ranks } = useQuery<any[]>({
    queryKey: ["/api/ranks"],
    enabled: isSuperAdmin,
  });

  const { data: mercenaries } = useQuery<any[]>({
    queryKey: ["/api/mercenaries"],
    queryFn: () => apiRequest("/api/mercenaries", "GET"),
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
      toast({ title: "Event created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create event", variant: "destructive" });
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
      toast({ title: "Event updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update event", variant: "destructive" });
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
    onError: () => {
      toast({ title: "Failed to create news item", variant: "destructive" });
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
    onError: () => {
      toast({ title: "Failed to update news item", variant: "destructive" });
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
      setRankForm({ name: "", image: "", description: "", requirements: "" });
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
      setRankForm({ name: "", image: "", description: "", requirements: "" });
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
    mutationFn: (data: any) => apiRequest("/api/admins", "POST", data),
    onSuccess: async (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admins"] });
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
    onSuccess: (data: SiteSettings) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/site"] });
      setSiteSettingsForm({
        reviewVerificationEnabled: data.reviewVerificationEnabled,
        reviewVerificationVideoUrl: data.reviewVerificationVideoUrl || "",
        reviewVerificationPrompt: data.reviewVerificationPrompt || "",
        reviewVerificationPassphrase: data.reviewVerificationPassphrase || "",
        reviewVerificationTimecode: data.reviewVerificationTimecode || "",
        reviewVerificationYouTubeChannelUrl: data.reviewVerificationYouTubeChannelUrl || "",
      });
      toast({ title: "Verification settings updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update verification settings",
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
      setCreateMercForm({ name: "", image: "", role: "", description: "", voiceLines: [] });
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
      setMercForm({ name: "", role: "", image: "", description: "", voiceLines: [] });
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

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadedImageUrl(data.url);
      setImageFile(null);
      toast({ title: "Image uploaded successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to upload image", variant: "destructive" });
    },
  });

  const resetPostForm = () => {
    setPostForm({
      title: "",
      content: "",
      summary: "",
      image: "",
      category: "Tutorials",
      tags: "",
      author: "Bimora Team",
      featured: false,
      previewOnHome: true,
      readingTime: 5,
      // SEO fields
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      canonicalUrl: "",
      ogImage: "",
      twitterImage: "",
      schemaType: "Article",
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
      // SEO fields
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      canonicalUrl: "",
      ogImage: "",
      twitterImage: "",
      schemaType: "Event",
    });
  };

  const resetNewsForm = () => {
    setNewsForm({
      title: "",
      titleAr: "",
      dateRange: "",
      image: "",
      category: "News",
      content: "",
      contentAr: "",
      author: "Bimora Team",
      featured: false,
      previewOnHome: true,
      // SEO fields
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      canonicalUrl: "",
      ogImage: "",
      twitterImage: "",
      schemaType: "NewsArticle",
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
      featured: false,
      promotionText: "",
    });
  };

  const resetAdminForm = () => {
    setAdminForm({
      username: "",
      password: "",
      role: "admin",
    });
  };

  const handleImageUpload = () => {
    if (imageFile) {
      uploadImageMutation.mutate(imageFile);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(uploadedImageUrl);
      setCopied(true);
      toast({ title: "URL copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API or have permissions issues
      const textArea = document.createElement('textarea');
      textArea.value = uploadedImageUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        toast({ title: "URL copied to clipboard!" });
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        toast({ title: "Failed to copy URL", variant: "destructive" });
      }
      document.body.removeChild(textArea);
    }
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
    <div className="min-h-screen bg-background">
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
            <AdvancedContentManager />
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
            <div className="w-full lg:w-56">
              {/* small screen: select picker */}
              <div className="block lg:hidden mb-3">
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="dashboard">Dashboard</option>
                  {canPosts && <option value="posts">Posts</option>}
                  {canEventsNews && <option value="events-news">Events & News</option>}
                  {canTutorials && <option value="tutorials">Tutorials</option>}
                  {canSellers && <option value="sellers">Sellers</option>}
                  {canCFData && <option value="cf-data">CF Data</option>}
                  {canTranslations && <option value="translations">Translations</option>}
                  {canVerification && <option value="verification">Review Verification</option>}
                  {canAdmins && <option value="admins">Admins</option>}
                  {canSubscribers && <option value="subscribers">Subscribers</option>}
                  {canScraper && <option value="scraper">Scraper</option>}
                  {canMercenaries && <option value="mercenaries">Mercenaries</option>}
                {canTickets && <option value="tickets">Tickets</option>}
                {isSuperAdmin && <option value="reset-codes">Password Reset Codes</option>}
              </select>
              </div>

              {/* large screen: vertical tabs list */}
              <TabsList className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-2">
                <TabsTrigger value="dashboard" data-testid="tab-dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </TabsTrigger>
                {canPosts && (
                <TabsTrigger value="posts" data-testid="tab-posts">
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Posts</span>
                </TabsTrigger>
                )}
                {canEventsNews && (
                <TabsTrigger value="events-news" data-testid="tab-events-news">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Events & News</span>
                </TabsTrigger>
                )}
                {canTutorials && (
                  <TabsTrigger value="tutorials" data-testid="tab-tutorials">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Tutorials</span>
                  </TabsTrigger>
                )}
                {canSellers && (
                  <TabsTrigger value="sellers" data-testid="tab-sellers">
                    <Store className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Sellers</span>
                  </TabsTrigger>
                )}
                {canCFData && (
                  <TabsTrigger value="cf-data" data-testid="tab-cf-data">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">CF Data</span>
                  </TabsTrigger>
                )}
                {canRestoration && (
                  <TabsTrigger value="restoration" data-testid="tab-restoration">
                    <RotateCw className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Restore Data</span>
                  </TabsTrigger>
                )}
                {canTranslations && (
                <TabsTrigger value="translations" data-testid="tab-translations">
                  <Languages className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Translations</span>
                </TabsTrigger>
                )}
                {canVerification && (
                  <TabsTrigger value="verification" data-testid="tab-verification">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Review Verification</span>
                  </TabsTrigger>
                )}
                {canAdmins && (
                  <TabsTrigger value="admins" data-testid="tab-admins">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Admins</span>
                  </TabsTrigger>
                )}
                {canSubscribers && (
                  <TabsTrigger value="subscribers" data-testid="tab-subscribers">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Subscribers</span>
                  </TabsTrigger>
                )}
                {canScraper && (
                <TabsTrigger value="scraper" data-testid="tab-scraper">
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Scraper</span>
                </TabsTrigger>
                )}
                {canMercenaries && (
                <TabsTrigger value="mercenaries" data-testid="tab-mercenaries">
                  <Star className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Mercenaries</span>
                </TabsTrigger>
                )}
                {canTickets && (
                <TabsTrigger value="tickets" data-testid="tab-tickets">
                  <LifeBuoy className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Tickets</span>
                </TabsTrigger>
                )}
                {isSuperAdmin && (
                  <TabsTrigger value="seller-reviews" data-testid="tab-seller-reviews">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Seller Review Verification</span>
                  </TabsTrigger>
                )}
                {isSuperAdmin && (
                  <TabsTrigger value="reset-codes" data-testid="tab-reset-codes">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Password Reset Codes</span>
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
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Image Upload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        setUploadedImageUrl("");
                      }
                    }}
                    data-testid="input-image-upload"
                  />
                  {imageFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {imageFile.name}
                    </p>
                  )}
                </div>
                
                <Button
                  onClick={handleImageUpload}
                  disabled={!imageFile || uploadImageMutation.isPending}
                  className="w-full"
                  data-testid="button-upload-image"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadImageMutation.isPending ? "Uploading..." : "Upload to Catbox.moe"}
                </Button>

                {uploadedImageUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Image URL:</p>
                    <div className="flex gap-2">
                      <Input
                        value={uploadedImageUrl}
                        readOnly
                        data-testid="input-uploaded-url"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyUrl}
                        data-testid="button-copy-url"
                      >
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Posts Management</h2>
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
                      onChange={(e) =>
                        setPostForm({ ...postForm, title: e.target.value })
                      }
                      data-testid="input-post-title"
                    />
                    <div className="space-y-2">
                      <div data-testid="input-post-content">
                        <ReactQuill
                          theme="snow"
                          value={postForm.content}
                          onChange={(value) =>
                            setPostForm({ ...postForm, content: value })
                          }
                          modules={{
                            toolbar: [
                              [{ 'header': [1, 2, 3, false] }],
                              ['bold', 'italic', 'underline', 'strike'],
                              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                              ['link', 'blockquote', 'code-block'],
                              ['clean']
                            ],
                          }}
                          placeholder="Write your content here..."
                          style={{ minHeight: '200px' }}
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
                    <Input
                      placeholder="Image URL"
                      value={postForm.image}
                      onChange={(e) =>
                        setPostForm({ ...postForm, image: e.target.value })
                      }
                      data-testid="input-post-image"
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
                    
                    {/* SEO Fields */}
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
                        const data = {
                          ...postForm,
                          tags: postForm.tags.split(",").map((t) => t.trim()),
                          seoKeywords: postForm.seoKeywords
                            ? postForm.seoKeywords.split(",").map((k) => k.trim())
                            : [],
                        };
                        if (editingPost) {
                          updatePostMutation.mutate({ id: editingPost.id, data });
                        } else {
                          createPostMutation.mutate(data);
                        }
                      }}
                      className="w-full"
                      data-testid="button-submit-post"
                    >
                      {editingPost ? "Update Post" : "Create Post"}
                    </Button>
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
                        {canManagePosts && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingPost(post);
                            setPostForm({
                              title: post.title,
                              content: post.content,
                              summary: post.summary,
                              image: post.image,
                              category: post.category,
                              tags: post.tags.join(", "),
                              author: post.author,
                              featured: post.featured,
                              previewOnHome: post.previewOnHome !== false,
                              readingTime: post.readingTime,
                              seoTitle: post.seoTitle || "",
                              seoDescription: post.seoDescription || "",
                              seoKeywords: post.seoKeywords?.join(", ") || "",
                              canonicalUrl: post.canonicalUrl || "",
                              ogImage: post.ogImage || "",
                              twitterImage: post.twitterImage || "",
                              schemaType: post.schemaType || "Article",
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          )}

          {canEventsNews && (
          <TabsContent value="events-news" className="space-y-6" data-testid="content-events-news">
            <div className="space-y-6">
              {isSuperAdmin ? (
                <>
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Event Scraper</h2>
                    <ScrapingManager />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">CrossFire Data Scraper</h2>
                    <CFDataScraper />
                  </div>
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Event Scraper</CardTitle>
                    <CardDescription>
                      Only super admins can import events directly from the forum. Reach out to a super admin if you need new events published.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div/>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">Events</h2>
                  <div className="flex gap-2">
                    {canUseScraper && (
                    <Button
                      variant="outline"
                      onClick={() => scrapeEventsMutation.mutate()}
                      disabled={scrapeEventsMutation.isPending}
                      data-testid="button-scrape-events"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {scrapeEventsMutation.isPending ? "Scraping..." : "Scrape Events"}
                    </Button>
                    )}
                    <Dialog open={isCreatingEvent} onOpenChange={(open) => {
                      setIsCreatingEvent(open);
                      if (!open) {
                        setEditingEvent(null);
                        resetEventForm();
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
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                      <DialogHeader>
                        <DialogTitle>
                          {editingEvent ? "Edit Event" : "Create New Event"}
                        </DialogTitle>
                      </DialogHeader>
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
                        <Textarea
                          placeholder="Description (English)"
                          value={eventForm.description}
                          onChange={(e) =>
                            setEventForm({ ...eventForm, description: e.target.value })
                          }
                          rows={3}
                          data-testid="input-event-description"
                        />
                        <Textarea
                          placeholder="Description (Arabic) - الوصف بالعربية"
                          value={eventForm.descriptionAr}
                          onChange={(e) =>
                            setEventForm({ ...eventForm, descriptionAr: e.target.value })
                          }
                          rows={3}
                          dir="rtl"
                          data-testid="input-event-description-ar"
                        />
                        <Input
                          placeholder="Date"
                          value={eventForm.date}
                          onChange={(e) =>
                            setEventForm({ ...eventForm, date: e.target.value })
                          }
                          data-testid="input-event-date"
                        />
                        <Input
                          placeholder="Image URL (optional)"
                          value={eventForm.image}
                          onChange={(e) =>
                            setEventForm({ ...eventForm, image: e.target.value })
                          }
                          data-testid="input-event-image"
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
                        
                        {/* SEO Fields */}
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
                        
                        <Button
                          onClick={() => {
                            const data = {
                              ...eventForm,
                              seoKeywords: eventForm.seoKeywords
                                ? eventForm.seoKeywords.split(",").map((k) => k.trim())
                                : [],
                            };
                            if (editingEvent) {
                              updateEventMutation.mutate({ id: editingEvent.id, data });
                            } else {
                              createEventMutation.mutate(data);
                            }
                          }}
                          className="w-full"
                          data-testid="button-submit-event"
                        >
                          {editingEvent ? "Update Event" : "Create Event"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-3">
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
                                  image: event.image || "",
                                  seoTitle: event.seoTitle || "",
                                  seoDescription: event.seoDescription || "",
                                  seoKeywords: event.seoKeywords?.join(", ") || "",
                                  canonicalUrl: event.canonicalUrl || "",
                                  ogImage: event.ogImage || "",
                                  twitterImage: event.twitterImage || "",
                                  schemaType: event.schemaType || "Event",
                                });
                                setIsCreatingEvent(true);
                              }}
                              data-testid={`button-edit-event-${event.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            )}
                            {canManageEvents && (
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
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">News</h2>
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
                      <DialogHeader>
                        <DialogTitle>
                          {editingNews ? "Edit News Item" : "Create New News Item"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        <Input
                          placeholder="Title (English)"
                          value={newsForm.title}
                          onChange={(e) =>
                            setNewsForm({ ...newsForm, title: e.target.value })
                          }
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
                          placeholder="Date Range (e.g., Oct 15 - Nov 4)"
                          value={newsForm.dateRange}
                          onChange={(e) =>
                            setNewsForm({ ...newsForm, dateRange: e.target.value })
                          }
                          data-testid="input-news-daterange"
                        />
                        <Input
                          placeholder="Image URL"
                          value={newsForm.image}
                          onChange={(e) =>
                            setNewsForm({ ...newsForm, image: e.target.value })
                          }
                          data-testid="input-news-image"
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
                            <ReactQuill
                              theme="snow"
                              value={newsForm.content}
                              onChange={(value) =>
                                setNewsForm({ ...newsForm, content: value })
                              }
                              modules={{
                                toolbar: [
                                  [{ 'header': [1, 2, 3, false] }],
                                  ['bold', 'italic', 'underline'],
                                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                  ['link'],
                                  ['clean']
                                ],
                              }}
                              style={{ minHeight: '150px' }}
                            />
                          </div>
                        </div>
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
                            <ReactQuill
                              theme="snow"
                              value={newsForm.contentAr}
                              onChange={(value) =>
                                setNewsForm({ ...newsForm, contentAr: value })
                              }
                              modules={{
                                toolbar: [
                                  [{ 'header': [1, 2, 3, false] }],
                                  ['bold', 'italic', 'underline'],
                                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                  ['link'],
                                  ['clean']
                                ],
                              }}
                              style={{ minHeight: '150px', direction: 'rtl' }}
                            />
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
                        
                        {/* SEO Fields */}
                        <div className="space-y-4 pt-4 border-t">
                          <h3 className="text-sm font-semibold">SEO Settings</h3>
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
                            const data = {
                              ...newsForm,
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
                          className="w-full"
                          data-testid="button-submit-news"
                        >
                          {editingNews ? "Update News" : "Create News"}
                        </Button>
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
                          {canManageNews && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingNews(news);
                          setNewsForm({
                            title: news.title,
                            titleAr: news.titleAr || "",
                            dateRange: news.dateRange,
                            image: news.image,
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
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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

          {canTutorials && (
            <TabsContent value="tutorials" className="space-y-6" data-testid="content-tutorials">
            <TutorialManager />
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
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    fetch('/api/upload-image', {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                                      },
                                      body: formData,
                                    })
                                      .then(res => res.json())
                                      .then(data => {
                                        if (data.url) {
                                          setWeaponForm({ ...weaponForm, image: data.url });
                                          toast({ title: "Image uploaded successfully!" });
                                        }
                                      })
                                      .catch(() => toast({ title: "Failed to upload image", variant: "destructive" }));
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
                    {weapons?.map((weapon: any) => (
                      <div key={weapon.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-3">
                          {weapon.image && (
                            <img src={weapon.image} alt={weapon.name} className="w-16 h-16 object-contain rounded" />
                          )}
                          <div>
                            <p className="font-medium">{weapon.name}</p>
                            {weapon.category && <Badge variant="outline" className="text-xs">{weapon.category}</Badge>}
                          </div>
                        </div>
                        <div className="flex gap-2">
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
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    fetch('/api/upload-image', {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                                      },
                                      body: formData,
                                    })
                                      .then(res => res.json())
                                      .then(data => {
                                        if (data.url) {
                                          setModeForm({ ...modeForm, image: data.url });
                                          toast({ title: "Image uploaded successfully!" });
                                        }
                                      })
                                      .catch(() => toast({ title: "Failed to upload image", variant: "destructive" }));
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
                        setRankForm({ name: "", image: "", description: "", requirements: "" });
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
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    fetch('/api/upload-image', {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                                      },
                                      body: formData,
                                    })
                                      .then(res => res.json())
                                      .then(data => {
                                        if (data.url) {
                                          setRankForm({ ...rankForm, image: data.url });
                                          toast({ title: "Image uploaded successfully!" });
                                        }
                                      })
                                      .catch(() => toast({ title: "Failed to upload image", variant: "destructive" }));
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
                      <div key={rank.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-3">
                          {rank.image && (
                            <img src={rank.image} alt={rank.name} className="w-16 h-16 object-contain rounded" />
                          )}
                          <div>
                            <p className="font-medium">{rank.name}</p>
                            {rank.requirements && <p className="text-xs text-muted-foreground">{rank.requirements}</p>}
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
                      <Label htmlFor="seller-images">Image URLs</Label>
                      <Textarea
                        id="seller-images"
                        placeholder="Add image URLs separated by commas"
                        value={sellerForm.images}
                        onChange={(e) =>
                          setSellerForm({ ...sellerForm, images: e.target.value })
                        }
                        rows={3}
                        data-testid="input-seller-images"
                      />
                      <p className="text-xs text-muted-foreground">Paste direct image links separated by commas.</p>
                    </div>
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
                          featured: sellerForm.featured,
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
                                      images: seller.images?.join(', ') || "",
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
                                      featured: seller.featured || false,
                                      promotionText: seller.promotionText || "",
                                    });
                                    setIsCreatingSeller(true);
                                  }}
                              data-testid={`button-edit-seller-${seller.id}`}
                            >
                              <Edit className="h-4 w-4" />
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
                                        const data = await apiRequest(`/api/sellers/${seller.id}/reviews`, 'GET');
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
                              image: event.image || "",
                              seoTitle: event.seoTitle || "",
                              seoDescription: event.seoDescription || "",
                              seoKeywords: event.seoKeywords || "",
                              canonicalUrl: event.canonicalUrl || "",
                              ogImage: event.ogImage || "",
                              twitterImage: event.twitterImage || "",
                              schemaType: event.schemaType || "Event",
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
                              titleAr: news.titleAr || "",
                              dateRange: news.dateRange || "",
                              image: news.image,
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
                            role: e.target.value as "admin" | "super_admin",
                          })
                        }
                        className="w-full h-9 px-3 rounded-md border border-input bg-background"
                        data-testid="select-admin-role"
                      >
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                      <div className="pt-2">
                        <p className="text-sm font-medium mb-2">Permissions</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {AVAILABLE_PERMISSIONS.map((p) => (
                            <label key={p.key} className="flex items-center gap-2 text-sm">
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
                      <Button
                        onClick={() => {
                          if (editingAdmin) {
                            const updates: any = { role: adminForm.role };
                            if (adminForm.username) updates.username = adminForm.username;
                            if (adminForm.password) updates.password = adminForm.password;
                            // include permissions when updating
                            updateAdminMutation.mutate({ id: editingAdmin.id, data: { ...updates, permissions: adminPermissionsForm } });
                          } else {
                            createAdminMutation.mutate({ ...adminForm, permissions: adminPermissionsForm });
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
                    setCreateMercForm({ name: "", image: "", role: "", description: "", voiceLines: [] });
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
                  setMercForm({ name: "", role: "", image: "", description: "", voiceLines: [] });
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
                          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                          data-testid="input-image-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (!imageFile) {
                              toast({ title: 'No image selected', variant: 'destructive' });
                              return;
                            }
                            try {
                              const formData = new FormData();
                              formData.append('image', imageFile);
                              const res = await fetch(`${apiBase}/api/upload-image`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}` },
                                body: formData,
                              });
                              if (!res.ok) throw new Error('Upload failed');
                              const url = await res.text();
                              if (url) {
                                if (editingMerc) {
                                  setMercForm({ ...mercForm, image: url });
                                } else {
                                  setCreateMercForm({ ...createMercForm, image: url });
                                }
                                setUploadedImageUrl(url);
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
                          const first = mercForm.voiceLines.map(s=>s.trim()).find(Boolean);
                          if (first) {
                            const a = new Audio(first);
                            a.play().catch(()=>{});
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
                          const sounds = mercForm.voiceLines.filter((s) => s.trim() !== "").slice(0,30);
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
                                } catch {}
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
                                } catch {}
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
            )}
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
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{Array.from({length: review.rating}).map((_,i)=> (<Star key={i} className="h-4 w-4 text-yellow-400 inline-block"/>))} <span className="ml-2 text-xs">{review.rating}</span></div>
                        {review.comment && <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>}
                        <p className="text-xs text-muted-foreground mt-2">{new Date(review.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex items-start">
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

      <style>{`
        /* Quill Editor Styling */
        .ql-container {
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
          font-size: 0.875rem;
        }
        
        .ql-editor {
          min-height: 150px;
          background-color: #fafafa;
          padding: 12px;
          font-family: inherit;
        }
        
        .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        
        .ql-toolbar {
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem 0.375rem 0 0;
          background-color: #f9fafb;
        }
        
        .ql-toolbar button {
          padding: 4px 8px;
        }
        
        .ql-toolbar.ql-snow {
          border-radius: 0.375rem 0.375rem 0 0;
        }
        
        .ql-container.ql-snow {
          border-radius: 0 0 0.375rem 0.375rem;
        }
        
        .ql-editor h1 {
          font-size: 2rem;
          margin: 0.5rem 0;
        }
        
        .ql-editor h2 {
          font-size: 1.5rem;
          margin: 0.5rem 0;
        }
        
        .ql-editor h3 {
          font-size: 1.25rem;
          margin: 0.5rem 0;
        }
        
        .ql-editor p {
          margin: 0.5rem 0;
        }
        
        .ql-editor ul, .ql-editor ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        
        .ql-editor a {
          color: #0066cc;
          text-decoration: none;
        }
        
        /* RTL support for Arabic content */
        .ql-editor[dir="rtl"] {
          direction: rtl;
          text-align: right;
        }
      `}</style>
    </div>
  );
}