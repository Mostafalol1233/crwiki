import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { getCurrentUser } from "@/lib/supabaseApi";
import PageSEO from "@/components/PageSEO";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  User, Camera, Shield, Edit3, Check, X, Loader2,
  Ticket, MessageSquare, Clock, Award, LogOut,
  Gamepad2, Swords, Trophy, Target, RefreshCw, AlertCircle, TrendingUp, Zap, ChevronDown, Sparkles
} from "lucide-react";

// Load Puter.js via CDN — avoids bundling its own React copy
function loadPuter(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).puter) return resolve((window as any).puter);
    const existing = document.getElementById("puter-js-cdn");
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).puter));
      return;
    }
    const script = document.createElement("script");
    script.id = "puter-js-cdn";
    script.src = "https://js.puter.com/v2/";
    script.onload = () => resolve((window as any).puter);
    script.onerror = () => reject(new Error("Failed to load Puter.js"));
    document.head.appendChild(script);
  });
}

const GOLD = "#f5a623";
const CARD_BG = "var(--card)";

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) {
  return (
    <div
      className="flex flex-col items-center gap-1 p-4"
      style={{ background: CARD_BG, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
    >
      <Icon className="h-4 w-4 mb-1" style={{ color: GOLD }} />
      <span className="text-xl font-black" style={{ color: "var(--foreground)" }}>{value}</span>
      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#555" }}>{label}</span>
      {sub && <span className="text-[8px]" style={{ color: "#444" }}>{sub}</span>}
    </div>
  );
}

function CFStatCard({ label, value, icon: Icon, color }: { label: string; value: string | number | null; icon: any; color?: string }) {
  return (
    <div
      className="flex flex-col gap-1 p-3"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="h-3 w-3" style={{ color: color || GOLD }} />
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#555" }}>{label}</span>
      </div>
      <span className="text-base font-black" style={{ color: "var(--foreground)" }}>
        {value !== null && value !== undefined ? value : "—"}
      </span>
    </div>
  );
}

function formatExp(exp: number | null): string {
  if (exp === null) return "—";
  if (exp >= 1_000_000_000) return (exp / 1_000_000_000).toFixed(2) + "B";
  if (exp >= 1_000_000) return (exp / 1_000_000).toFixed(1) + "M";
  if (exp >= 1_000) return (exp / 1_000).toFixed(0) + "K";
  return String(exp);
}

function formatNum(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

// ─── Rank EXP thresholds (cumulative EXP required — sourced from CF wiki) ─────
const RANK_EXP: Record<number, { name: string; exp: number }> = {
  1:   { name: "Trainee 1",              exp: 0 },
  2:   { name: "Trainee 2",              exp: 457 },
  3:   { name: "Private",                exp: 913 },
  4:   { name: "Private First Class",    exp: 1_825 },
  5:   { name: "Corporal",               exp: 3_193 },
  6:   { name: "Sergeant 1",             exp: 5_017 },
  7:   { name: "Sergeant 2",             exp: 7_297 },
  8:   { name: "Sergeant 3",             exp: 10_033 },
  9:   { name: "Sergeant 4",             exp: 13_225 },
  10:  { name: "Staff Sergeant 1",       exp: 17_785 },
  11:  { name: "Staff Sergeant 2",       exp: 23_941 },
  12:  { name: "Staff Sergeant 3",       exp: 33_061 },
  13:  { name: "Staff Sergeant 4",       exp: 43_093 },
  14:  { name: "Staff Sergeant 5",       exp: 54_037 },
  15:  { name: "Staff Sergeant 6",       exp: 65_893 },
  16:  { name: "Sergeant First Class 1", exp: 78_661 },
  17:  { name: "Sergeant First Class 2", exp: 92_341 },
  18:  { name: "Sergeant First Class 3", exp: 106_933 },
  19:  { name: "Sergeant First Class 4", exp: 122_437 },
  20:  { name: "Sergeant First Class 5", exp: 138_853 },
  21:  { name: "Sergeant First Class 6", exp: 156_181 },
  22:  { name: "Master Sergeant 1",      exp: 174_421 },
  23:  { name: "Master Sergeant 2",      exp: 193_573 },
  24:  { name: "Master Sergeant 3",      exp: 213_637 },
  25:  { name: "Master Sergeant 4",      exp: 234_613 },
  26:  { name: "Master Sergeant 5",      exp: 256_501 },
  27:  { name: "Master Sergeant 6",      exp: 279_301 },
  28:  { name: "Second Lieutenant 1",    exp: 326_725 },
  29:  { name: "Second Lieutenant 2",    exp: 375_973 },
  30:  { name: "Second Lieutenant 3",    exp: 427_045 },
  31:  { name: "Second Lieutenant 4",    exp: 479_941 },
  32:  { name: "Second Lieutenant 5",    exp: 534_661 },
  33:  { name: "Second Lieutenant 6",    exp: 591_205 },
  34:  { name: "Second Lieutenant 7",    exp: 649_573 },
  35:  { name: "Second Lieutenant 8",    exp: 709_765 },
  36:  { name: "First Lieutenant 1",     exp: 771_781 },
  37:  { name: "First Lieutenant 2",     exp: 835_621 },
  38:  { name: "First Lieutenant 3",     exp: 901_285 },
  39:  { name: "First Lieutenant 4",     exp: 968_773 },
  40:  { name: "First Lieutenant 5",     exp: 1_038_085 },
  41:  { name: "First Lieutenant 6",     exp: 1_109_221 },
  42:  { name: "First Lieutenant 7",     exp: 1_182_181 },
  43:  { name: "First Lieutenant 8",     exp: 1_256_965 },
  44:  { name: "Captain 1",              exp: 1_333_573 },
  45:  { name: "Captain 2",              exp: 1_412_005 },
  46:  { name: "Captain 3",              exp: 1_492_261 },
  47:  { name: "Captain 4",              exp: 1_574_341 },
  48:  { name: "Captain 5",              exp: 1_658_245 },
  49:  { name: "Captain 6",              exp: 1_743_973 },
  50:  { name: "Captain 7",              exp: 1_831_525 },
  51:  { name: "Captain 8",              exp: 1_920_901 },
  52:  { name: "Major 1",                exp: 2_057_701 },
  53:  { name: "Major 2",                exp: 2_107_237 },
  54:  { name: "Major 3",                exp: 2_339_509 },
  55:  { name: "Major 4",                exp: 2_484_517 },
  56:  { name: "Major 5",                exp: 2_632_261 },
  57:  { name: "Major 6",                exp: 2_782_741 },
  58:  { name: "Major 7",                exp: 2_935_957 },
  59:  { name: "Major 8",                exp: 3_091_909 },
  60:  { name: "Lieutenant Colonel 1",   exp: 3_277_045 },
  61:  { name: "Lieutenant Colonel 2",   exp: 3_465_373 },
  62:  { name: "Lieutenant Colonel 3",   exp: 3_673_537 },
  63:  { name: "Lieutenant Colonel 4",   exp: 3_885_178 },
  64:  { name: "Lieutenant Colonel 5",   exp: 4_100_296 },
  65:  { name: "Lieutenant Colonel 6",   exp: 4_318_891 },
  66:  { name: "Lieutenant Colonel 7",   exp: 4_540_963 },
  67:  { name: "Lieutenant Colonel 8",   exp: 4_766_512 },
  68:  { name: "Colonel 1",              exp: 5_028_199 },
  69:  { name: "Colonel 2",              exp: 5_319_184 },
  70:  { name: "Colonel 3",              exp: 5_614_501 },
  71:  { name: "Colonel 4",              exp: 5_914_150 },
  72:  { name: "Colonel 5",              exp: 6_218_131 },
  73:  { name: "Colonel 6",              exp: 6_526_501 },
  74:  { name: "Colonel 7",              exp: 6_839_203 },
  75:  { name: "Colonel 8",              exp: 7_156_237 },
  76:  { name: "Brigadier General 1",    exp: 7_578_037 },
  77:  { name: "Brigadier General 2",    exp: 8_026_912 },
  78:  { name: "Brigadier General 3",    exp: 8_481_772 },
  79:  { name: "Brigadier General 4",    exp: 8_964_562 },
  80:  { name: "Brigadier General 5",    exp: 9_475_852 },
  81:  { name: "Brigadier General 6",    exp: 10_016_212 },
  82:  { name: "Major General 1",        exp: 10_586_212 },
  83:  { name: "Major General 2",        exp: 11_186_422 },
  84:  { name: "Major General 3",        exp: 11_817_412 },
  85:  { name: "Major General 4",        exp: 12_479_752 },
  86:  { name: "Major General 5",        exp: 13_174_012 },
  87:  { name: "Major General 6",        exp: 13_900_762 },
  88:  { name: "Lieutenant General 1",   exp: 14_660_572 },
  89:  { name: "Lieutenant General 2",   exp: 15_454_012 },
  90:  { name: "Lieutenant General 3",   exp: 16_281_652 },
  91:  { name: "Lieutenant General 4",   exp: 17_144_062 },
  92:  { name: "Lieutenant General 5",   exp: 18_041_812 },
  93:  { name: "Lieutenant General 6",   exp: 18_975_472 },
  94:  { name: "General 1",              exp: 19_945_612 },
  95:  { name: "General 2",              exp: 20_952_802 },
  96:  { name: "General 3",              exp: 21_997_612 },
  97:  { name: "General 4",              exp: 23_080_612 },
  98:  { name: "General 5",              exp: 24_202_372 },
  99:  { name: "General 6",              exp: 25_363_462 },
  100: { name: "Marshall",               exp: 26_564_452 },
  101: { name: "Grand Marshall",         exp: 100_000_000 },
};

/** Build a reverse map from rank name (lower-cased, trimmed) → tier number */
const RANK_NAME_TO_TIER: Record<string, number> = {};
for (const [tier, info] of Object.entries(RANK_EXP)) {
  RANK_NAME_TO_TIER[info.name.toLowerCase().trim()] = Number(tier);
}

const Z8_RANK_IMG = (tier: number) =>
  `https://z8games.akamaized.net/cfna/templates/assets/imgs/rank_${tier}.jpg`;

/** Given current EXP + rank name/tier from API, compute progress toward a chosen target rank.
 *  Priority for determining current tier:
 *  1. Match the API rank name against RANK_NAME_TO_TIER (most reliable)
 *  2. Fall back to EXP-based lookup (only if name doesn't match)
 *  This avoids negative EXP when the profile EXP scale differs from rank thresholds. */
function getRankProgress(
  exp: number,
  currentTier: number | null,
  chosenTargetTier?: number | null,
  rankName?: string | null,
) {
  const tiers = Object.keys(RANK_EXP).map(Number).sort((a, b) => a - b);
  const maxTier = tiers[tiers.length - 1];

  // 1. Try to match the API rank name (e.g. "Brigadier General") to a tier.
  //    The API often returns only the base name without a number suffix,
  //    so try an exact match first, then a prefix scan.
  let curTier: number | null = null;
  if (rankName) {
    const key = rankName.toLowerCase().trim();
    if (RANK_NAME_TO_TIER[key] !== undefined) {
      curTier = RANK_NAME_TO_TIER[key];
    } else {
      // Partial prefix match — "Brigadier General" → first tier whose name starts with it
      const match = tiers.find(t => RANK_EXP[t].name.toLowerCase().startsWith(key));
      if (match !== undefined) curTier = match;
    }
  }

  // 2. If name lookup succeeded, use it; otherwise fall back to EXP-based derivation
  if (!curTier) {
    curTier = tiers[0];
    for (const t of tiers) {
      if (RANK_EXP[t].exp <= exp) curTier = t;
      else break;
    }
    // Also consider API-provided tier if it produces non-negative within-rank EXP
    if (currentTier && RANK_EXP[currentTier] && RANK_EXP[currentTier].exp <= exp) {
      curTier = currentTier;
    }
  }

  const curInfo   = RANK_EXP[curTier] || { name: "Unknown", exp: 0 };
  const isMaxRank = curTier >= maxTier;

  // True immediate next rank
  const trueNextTier = tiers.find(t => t > curTier) ?? null;
  const trueNextInfo = trueNextTier ? RANK_EXP[trueNextTier] : null;

  // Chosen destination
  const destTier = (!isMaxRank && chosenTargetTier && chosenTargetTier > curTier && RANK_EXP[chosenTargetTier])
    ? chosenTargetTier
    : trueNextTier;
  const destInfo = destTier ? RANK_EXP[destTier] : null;

  const expIntoCurrentRank = Math.max(0, exp - curInfo.exp);
  const expNeededToDest    = destInfo ? destInfo.exp - curInfo.exp : null;
  const expToDest          = destInfo ? Math.max(0, destInfo.exp - exp) : null;
  const pct = isMaxRank
    ? 100
    : destInfo && expNeededToDest && expNeededToDest > 0
      ? Math.min(99, Math.max(0, (expIntoCurrentRank / expNeededToDest) * 100))
      : 0;

  return {
    curTier, curInfo,
    trueNextTier, trueNextInfo,
    destTier, destInfo,
    isMaxRank,
    expIntoCurrentRank,
    expNeededToDest,
    expToDest,
    pct,
    maxTier,
    allTiers: tiers,
  };
}

/** Parse a raw input — profile URL or nickname — and return fetch params */
function parseProfileInput(raw: string): { type: "url"; profileUrl: string } | { type: "nickname"; nickname: string } {
  const s = raw.trim();
  if (s.startsWith("http") || s.includes("z8games.com/profile/") || s.includes("cfwest.") || s.includes("/profile/")) {
    return { type: "url", profileUrl: s };
  }
  return { type: "nickname", nickname: s };
}

export default function Profile() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [ticketCount, setTicketCount] = useState<number | null>(null);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // CF Game link state
  const [cfNickname, setCfNickname] = useState("");
  const [cfNicknameInput, setCfNicknameInput] = useState("");
  const [cfStats, setCfStats] = useState<any>(null);
  const [cfLoading, setCfLoading] = useState(false);
  const [cfError, setCfError] = useState("");
  const [cfLinkMode, setCfLinkMode] = useState(false);
  const [cfSyncTime, setCfSyncTime] = useState<string | null>(null);
  const [targetRankTier, setTargetRankTier] = useState<number | null>(null);
  const [showRankPicker, setShowRankPicker] = useState(false);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tips, setTips] = useState<string[]>([]);
  const [tipsError, setTipsError] = useState("");

  useEffect(() => {
    getCurrentUser().then(async (u) => {
      if (u) {
        setUser(u);
        setDisplayName(u.user_metadata?.username || u.user_metadata?.full_name || "");
        setBio(u.user_metadata?.bio || "");
        setAvatarUrl(u.user_metadata?.avatar || u.user_metadata?.avatar_url || "");

        // Load saved CF data
        const savedNick = u.user_metadata?.cf_nickname || "";
        const savedStats = u.user_metadata?.cf_stats || null;
        const savedSync = u.user_metadata?.cf_last_sync || null;
        setCfNickname(savedNick);
        setCfNicknameInput(savedNick);
        if (savedStats) setCfStats(savedStats);
        if (savedSync) setCfSyncTime(savedSync);

        // Fetch real ticket and comment counts
        if (u.email) {
          const [ticketsRes, commentsRes] = await Promise.all([
            supabase.from("tickets").select("id", { count: "exact", head: true }).eq("user_email", u.email),
            supabase.from("comments").select("id", { count: "exact", head: true }).eq("author_name", u.user_metadata?.username || u.email),
          ]);
          setTicketCount(ticketsRes.count ?? 0);
          setCommentCount(commentsRes.count ?? 0);
        }
      }
      setLoading(false);
    });
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const { uploadToSupabase } = await import("@/lib/uploadToSupabase");
      const url = await uploadToSupabase(file, "avatars");
      if (!url) throw new Error("Upload failed — no URL returned");
      setAvatarUrl(url);
      const { error } = await supabase.auth.updateUser({ data: { avatar: url, avatar_url: url } });
      if (error) throw error;
      toast({ title: "Profile picture updated" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Could not upload image. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { username: displayName, bio },
      });
      if (error) throw error;
      setEditing(false);
      toast({ title: "Profile saved" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message || "Could not save profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Fetch CF player stats — accepts profile URL or nickname
  const fetchCFStats = async (raw: string) => {
    if (!raw.trim()) return;
    setCfLoading(true);
    setCfError("");
    try {
      const parsed = parseProfileInput(raw.trim());
      let endpoint = "";
      if (parsed.type === "url") {
        endpoint = `/api/player/lookup?profileUrl=${encodeURIComponent(parsed.profileUrl)}&region=west`;
      } else {
        endpoint = `/api/player/lookup?nickname=${encodeURIComponent(parsed.nickname)}&region=west`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok || !data.success) {
        // If profile ID lookup failed with suggestNickname, keep the input so user can try nickname
        setCfError(data.error || "Could not fetch stats. Try again shortly.");
        return;
      }

      const now = new Date().toISOString();
      const resolvedNick = data.profile.nickname || raw.trim();
      setCfStats(data.profile);
      setCfNickname(resolvedNick);
      setCfNicknameInput(resolvedNick);
      setCfSyncTime(now);
      setCfLinkMode(false);

      await supabase.auth.updateUser({
        data: {
          cf_nickname: resolvedNick,
          cf_region: "west",
          cf_stats: data.profile,
          cf_last_sync: now,
        },
      });
    } catch {
      setCfError("Network error. Please try again.");
    } finally {
      setCfLoading(false);
    }
  };

  const handleUnlinkCF = async () => {
    setCfStats(null);
    setCfNickname("");
    setCfNicknameInput("");
    setCfSyncTime(null);
    setCfError("");
    setTips([]);
    await supabase.auth.updateUser({
      data: { cf_nickname: null, cf_stats: null, cf_last_sync: null },
    });
  };

  const handleGetTips = async () => {
    if (!cfStats) return;
    const rp = getRankProgress(cfStats.exp, cfStats.rankTier ? Number(cfStats.rankTier) : null, targetRankTier, cfStats.rank);
    if (!rp.destInfo) return;
    setTipsLoading(true);
    setTips([]);
    setTipsError("");
    try {
      const puterInstance = await loadPuter();
      const expToDest = rp.expToDest ?? 0;
      const prompt = [
        `A CrossFire player "${cfStats.nickname || cfNickname}" is currently ranked "${cfStats.rank || rp.curInfo.name}" and wants to reach "${rp.destInfo.name}".`,
        expToDest > 0 ? `They need ${expToDest.toLocaleString()} more EXP.` : "",
        cfStats.kdRatio ? `Their K/D ratio is ${cfStats.kdRatio}.` : "",
        cfStats.winRate ? `Their win rate is ${cfStats.winRate}%.` : "",
        cfStats.clan ? `They are in clan [${cfStats.clan}].` : "",
        (cfStats.vipLevel != null || cfStats.vipDays != null)
          ? `VIP status: ${cfStats.vipLevel != null ? `Level ${cfStats.vipLevel}` : ""}${cfStats.vipDays != null ? ` (${cfStats.vipDays} days remaining)` : ""}.`
          : "",
        "",
        "Give 4-5 practical bullet-point tips to earn EXP faster and improve stats. Be specific to CrossFire NA gameplay.",
      ].filter(Boolean).join("\n");

      // Use default model (gpt-4o-mini) — specialized models require extra auth on Puter
      const response = await puterInstance.ai.chat(prompt);
      const text: string = response?.message?.content ?? response?.text ?? String(response ?? "");
      if (!text) throw new Error("Empty response from AI");
      const lines = text
        .split(/\n/)
        .map((l: string) => l.replace(/^[\d]+[\.\)]\s*/, "").replace(/^[-•*]\s*/, "").trim())
        .filter((l: string) => l.length > 12)
        .slice(0, 6);
      setTips(lines);
    } catch (e: any) {
      setTipsError(e.message || "Could not load tips. Try again.");
    } finally {
      setTipsLoading(false);
    }
  };

  const initials = (displayName || user?.email || "?")[0].toUpperCase();
  const email = user?.email || "";
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Unknown";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--background)" }}>
        <PageSEO title="Profile — CrossFire Wiki" description="Sign in to view your profile." />
        <Shield className="h-12 w-12 opacity-20" style={{ color: GOLD }} />
        <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: "var(--foreground)" }}>Not Signed In</h2>
        <p className="text-sm" style={{ color: "#555" }}>You need to be logged in to view your profile.</p>
        <div className="flex gap-3">
          <Link href="/login">
            <button
              className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest"
              style={{ background: GOLD, color: "#000", borderRadius: "2px" }}
            >
              Sign In
            </button>
          </Link>
          <Link href="/register">
            <button
              className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest"
              style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", color: GOLD, borderRadius: "2px" }}
            >
              Create Account
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageSEO title={`${displayName || "Profile"} — CrossFire Wiki`} description="Your CrossFire Wiki profile." />

      <div className="min-h-screen py-10 md:py-16" style={{ background: "var(--background)" }}>
        {/* Top gradient accent */}
        <div
          className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(245,166,35,0.04), transparent)" }}
        />

        <div className="relative max-w-4xl mx-auto px-4 md:px-8">

          {/* ── Profile card ── */}
          <div
            className="relative overflow-hidden mb-6"
            style={{ background: CARD_BG, border: "1px solid rgba(245,166,35,0.15)", borderRadius: "6px" }}
          >
            {/* Top gold bar */}
            <div className="h-[3px]" style={{ background: `linear-gradient(to right, ${GOLD}, transparent)` }} />

            {/* Banner / cover area */}
            <div
              className="h-28"
              style={{ background: "linear-gradient(135deg, #0d1117 0%, #0f1923 50%, #0d1117 100%)" }}
            >
              <div
                className="w-full h-full opacity-20"
                style={{
                  backgroundImage: "repeating-linear-gradient(45deg, rgba(245,166,35,0.1) 0px, rgba(245,166,35,0.1) 1px, transparent 1px, transparent 24px)",
                }}
              />
            </div>

            {/* Avatar + Info */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ background: "rgba(245,166,35,0.1)", border: "3px solid rgba(245,166,35,0.4)" }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-black" style={{ color: GOLD }}>{initials}</span>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full" style={{ background: "rgba(0,0,0,0.6)" }}>
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ background: GOLD, borderRadius: "50%", border: "2px solid var(--background)" }}
                    disabled={uploading}
                  >
                    <Camera className="h-3.5 w-3.5 text-black" />
                  </button>
                  <input type="file" ref={fileRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
                </div>

                {/* Name + email */}
                <div className="flex-1 pt-2">
                  {editing ? (
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full text-2xl font-black uppercase tracking-tight bg-transparent outline-none border-b mb-1"
                      style={{ color: "var(--foreground)", borderColor: "rgba(245,166,35,0.4)" }}
                      placeholder="Your display name"
                      maxLength={32}
                    />
                  ) : (
                    <h1 className="text-2xl font-black uppercase tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
                      {displayName || "Anonymous Soldier"}
                    </h1>
                  )}
                  <p className="text-[11px] mt-0.5" style={{ color: "#555" }}>{email}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: "#444" }}>
                    Member since {joinDate}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 sm:self-center">
                  {editing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110"
                        style={{ background: GOLD, color: "#000", borderRadius: "2px" }}
                      >
                        {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        Save
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#666", borderRadius: "2px" }}
                      >
                        <X className="h-3 w-3" /> Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110"
                        style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", color: GOLD, borderRadius: "2px" }}
                      >
                        <Edit3 className="h-3 w-3" /> Edit Profile
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest"
                        style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: "2px" }}
                      >
                        <LogOut className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              {editing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the community about yourself..."
                  maxLength={200}
                  rows={2}
                  className="w-full text-sm bg-transparent outline-none resize-none px-3 py-2"
                  style={{
                    color: "var(--foreground)",
                    border: "1px solid rgba(245,166,35,0.2)",
                    borderRadius: "3px",
                    background: "rgba(255,255,255,0.02)",
                  }}
                />
              ) : (
                bio && (
                  <p className="text-sm leading-relaxed" style={{ color: "#666" }}>{bio}</p>
                )
              )}
            </div>
          </div>

          {/* ── Site stats row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard icon={Ticket} label="Tickets" value={ticketCount !== null ? ticketCount : "—"} />
            <StatCard icon={MessageSquare} label="Comments" value={commentCount !== null ? commentCount : "—"} />
            <StatCard icon={Clock} label="Days Active" value={Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000)} />
            <StatCard icon={Award} label="Rank" value="Member" />
          </div>

          {/* ── CrossFire Game Stats ── */}
          <div
            className="mb-6"
            style={{ background: CARD_BG, border: "1px solid rgba(245,166,35,0.12)", borderRadius: "6px", overflow: "hidden" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4" style={{ color: GOLD }} />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                  CrossFire Game Stats
                </span>
              </div>
              {cfNickname && cfStats && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchCFStats(cfNickname)}
                    disabled={cfLoading}
                    title="Refresh stats"
                    className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest transition-all hover:opacity-80"
                    style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", color: GOLD, borderRadius: "2px" }}
                  >
                    {cfLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    Sync
                  </button>
                  <button
                    onClick={() => { setCfLinkMode(true); setCfNicknameInput(cfNickname); }}
                    className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#555", borderRadius: "2px" }}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <div className="p-5">
              {/* ── Already linked — show stats ── */}
              {cfNickname && cfStats && !cfLinkMode ? (
                <div>
                  {/* Player header row */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="flex items-center gap-2 px-3 py-1.5"
                      style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: "3px" }}
                    >
                      <Gamepad2 className="h-3.5 w-3.5" style={{ color: GOLD }} />
                      <span className="text-sm font-black" style={{ color: GOLD }}>{cfStats.nickname || cfNickname}</span>
                    </div>
                    {cfStats.rank && (
                      <div
                        className="flex items-center gap-1.5 px-2 py-1"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "3px" }}
                      >
                        <Shield className="h-3 w-3" style={{ color: "#888" }} />
                        <span className="text-[10px] font-bold" style={{ color: "#888" }}>{cfStats.rank}</span>
                      </div>
                    )}
                    {cfStats.clan && (
                      <div className="flex items-center gap-1.5 px-2 py-1" style={{ background: "rgba(255,255,255,0.02)", borderRadius: "3px" }}>
                        {cfStats.clanImage && (
                          <img src={cfStats.clanImage} alt="" className="w-4 h-4 object-contain flex-shrink-0"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <span className="text-[9px] font-bold" style={{ color: "#555" }}>[{cfStats.clan}]</span>
                      </div>
                    )}
                    {cfSyncTime && (
                      <span className="text-[8px] ml-auto" style={{ color: "#383838" }}>
                        Synced {new Date(cfSyncTime).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* ── Rank progress widget ── */}
                  {cfStats.exp !== null && (() => {
                    const rp = getRankProgress(cfStats.exp, cfStats.rankTier ? Number(cfStats.rankTier) : null, targetRankTier, cfStats.rank);
                    return (
                      <div
                        className="mb-4 p-4"
                        style={{ background: "rgba(245,166,35,0.03)", border: "1px solid rgba(245,166,35,0.12)", borderRadius: "4px" }}
                      >
                        {/* Rank row */}
                        <div className="flex items-center gap-4 mb-3">

                          {/* Current rank badge */}
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <img
                              src={cfStats.rankImage || Z8_RANK_IMG(rp.curTier)}
                              alt={rp.curInfo.name}
                              className="w-10 h-10 object-contain"
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                            <span className="text-[8px] font-black uppercase tracking-wide text-center" style={{ color: GOLD, maxWidth: 64 }}>
                              {cfStats.rank || rp.curInfo.name}
                            </span>
                          </div>

                          {/* Progress bar + EXP info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1.5">
                              <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3" style={{ color: GOLD }} />
                                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#555" }}>EXP</span>
                              </div>
                              <span className="text-xs font-black" style={{ color: GOLD }}>
                                {cfStats.exp.toLocaleString()}
                              </span>
                            </div>
                            <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  background: `linear-gradient(to right, ${GOLD}, #f5c842)`,
                                  width: `${rp.pct}%`,
                                  transition: "width 0.8s ease",
                                  boxShadow: `0 0 8px rgba(245,166,35,0.4)`,
                                }}
                              />
                            </div>

                            {rp.isMaxRank ? (
                              /* ── Max rank — no destination to show ── */
                              <p className="text-[9px] mt-1.5 font-bold" style={{ color: GOLD }}>
                                🎖️ Maximum rank achieved — Grand Marshal!
                              </p>
                            ) : rp.destInfo && rp.expToDest !== null ? (
                              /* ── Progress toward chosen destination ── */
                              <div className="flex justify-between items-center mt-1.5">
                                <span className="text-[8px]" style={{ color: "#444" }}>
                                  {rp.expIntoCurrentRank.toLocaleString()} / {rp.expNeededToDest?.toLocaleString() ?? "—"} EXP into rank
                                </span>
                                <span className="text-[8px] font-bold" style={{ color: "#666" }}>
                                  {rp.expToDest.toLocaleString()} to go
                                </span>
                              </div>
                            ) : null}
                          </div>

                          {/* Target rank badge — clickable to open destination picker */}
                          {!rp.isMaxRank && rp.destTier && rp.destInfo && (
                            <div
                              className="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer select-none"
                              title="Click to choose a target rank"
                              onClick={() => setShowRankPicker(v => !v)}
                            >
                              <div className="relative">
                                <img
                                  src={Z8_RANK_IMG(rp.destTier)}
                                  alt={rp.destInfo.name}
                                  className="w-10 h-10 object-contain"
                                  style={{ opacity: 0.55, filter: "grayscale(0.4)" }}
                                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                                />
                                {/* Chevron indicator */}
                                <div
                                  className="absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full"
                                  style={{ background: "#111", border: `1px solid ${GOLD}` }}
                                >
                                  <ChevronDown className="w-2.5 h-2.5" style={{ color: GOLD }} />
                                </div>
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-wide text-center" style={{ color: "#555", maxWidth: 64 }}>
                                {rp.destInfo.name}
                              </span>
                              {targetRankTier && targetRankTier !== rp.trueNextTier && (
                                <span className="text-[7px] uppercase tracking-widest" style={{ color: GOLD }}>goal</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* ── Destination picker dropdown ── */}
                        {showRankPicker && !rp.isMaxRank && (
                          <div
                            className="mt-1 rounded overflow-hidden"
                            style={{ border: "1px solid #2a2a2a", background: "#0d0d0d", maxHeight: 200, overflowY: "auto" }}
                          >
                            {/* Reset to default (next rank) */}
                            <div
                              className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                              style={{
                                borderBottom: "1px solid #1a1a1a",
                                background: !targetRankTier ? "rgba(245,166,35,0.06)" : "transparent",
                                color: !targetRankTier ? GOLD : "#555",
                              }}
                              onClick={() => { setTargetRankTier(null); setShowRankPicker(false); }}
                            >
                              <span className="text-[10px] font-bold">Next rank (default)</span>
                              {!targetRankTier && <span className="ml-auto text-[9px]">✓</span>}
                            </div>

                            {/* All ranks above current */}
                            {rp.allTiers.filter(t => t > rp.curTier).map(t => {
                              const info = RANK_EXP[t];
                              const expNeeded = Math.max(0, info.exp - cfStats.exp);
                              const isChosen = t === targetRankTier;
                              return (
                                <div
                                  key={t}
                                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer"
                                  style={{
                                    background: isChosen ? "rgba(245,166,35,0.08)" : "transparent",
                                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                                  }}
                                  onClick={() => { setTargetRankTier(t); setShowRankPicker(false); }}
                                >
                                  <img src={Z8_RANK_IMG(t)} className="w-5 h-5 object-contain flex-shrink-0" alt="" />
                                  <span className="text-[10px]" style={{ color: isChosen ? GOLD : "#888" }}>
                                    {info.name}
                                  </span>
                                  <span className="text-[9px] ml-auto font-mono" style={{ color: isChosen ? GOLD : "#3a3a3a" }}>
                                    {expNeeded === 0 ? "✓" : `+${expNeeded.toLocaleString()}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* VIP row — always render the container so it's visible even when null */}
                        <div
                          className="flex items-center gap-3 pt-2.5 mt-2"
                          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                        >
                          <Trophy className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#a78bfa" }} />
                          {(cfStats.vipDays != null || cfStats.vipLevel != null) ? (
                            <>
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#a78bfa" }}>
                                VIP{cfStats.vipLevel != null ? ` Level ${cfStats.vipLevel}` : ""}
                              </span>
                              {cfStats.vipDays != null && (
                                <span className="text-[10px]" style={{ color: "#666" }}>
                                  {cfStats.vipDays} days remaining
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px]" style={{ color: "#444" }}>
                              VIP status not detected — sync again or link via profile URL
                            </span>
                          )}
                        </div>

                        {/* AI Tips section */}
                        {!rp.isMaxRank && (
                          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: "#555" }}>
                                AI Rank Tips
                              </span>
                              <button
                                onClick={handleGetTips}
                                disabled={tipsLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded transition-all disabled:opacity-50"
                                style={{
                                  background: "rgba(245,166,35,0.12)",
                                  border: "1px solid rgba(245,166,35,0.3)",
                                  color: GOLD,
                                  cursor: tipsLoading ? "not-allowed" : "pointer",
                                }}
                              >
                                {tipsLoading
                                  ? <><Loader2 className="h-3 w-3 animate-spin" /> Thinking...</>
                                  : <><Sparkles className="h-3 w-3" /> Get AI Tips</>}
                              </button>
                            </div>

                            {tipsError && (
                              <p className="text-[10px] px-3 py-2 rounded" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                                {tipsError}
                              </p>
                            )}

                            {tips.length > 0 && (
                              <ul className="space-y-2">
                                {tips.map((tip, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span
                                      className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded text-[8px] font-black mt-0.5"
                                      style={{ background: "rgba(245,166,35,0.15)", color: GOLD, border: `1px solid rgba(245,166,35,0.25)` }}
                                    >{i + 1}</span>
                                    <span className="text-[11px] leading-relaxed" style={{ color: "#bbb" }}>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {!tips.length && !tipsLoading && !tipsError && (
                              <p className="text-[10px]" style={{ color: "#444" }}>
                                Click "Get AI Tips" for personalized CrossFire rank-up advice powered by Grok via Puter.js — no API key needed.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <CFStatCard label="Kills" value={formatNum(cfStats.kills)} icon={Swords} />
                    <CFStatCard label="Deaths" value={formatNum(cfStats.deaths)} icon={Target} />
                    <CFStatCard label="K/D Ratio" value={cfStats.kdRatio ?? "—"} icon={TrendingUp} color={
                      cfStats.kdRatio >= 2 ? "#22c55e" : cfStats.kdRatio >= 1 ? GOLD : "#f87171"
                    } />
                    <CFStatCard label="Wins" value={formatNum(cfStats.wins)} icon={Trophy} />
                    <CFStatCard label="Win Rate" value={cfStats.winRate ? `${cfStats.winRate}%` : "—"} icon={TrendingUp} />
                    <CFStatCard label="EXP" value={formatExp(cfStats.exp)} icon={Zap} />
                    {cfStats.level && <CFStatCard label="Level" value={cfStats.level} icon={Award} />}
                    {cfStats.playtime && <CFStatCard label="Playtime" value={cfStats.playtime} icon={Clock} />}
                  </div>
                </div>
              ) : cfNickname && !cfStats && !cfLinkMode ? (
                /* Linked but no stats yet — prompt to sync */
                <div className="flex flex-col items-center gap-3 py-4">
                  <Gamepad2 className="h-8 w-8 opacity-30" style={{ color: GOLD }} />
                  <p className="text-[11px] text-center" style={{ color: "#555" }}>
                    Linked as <strong style={{ color: GOLD }}>{cfNickname}</strong> — click Sync to load your stats.
                  </p>
                  <button
                    onClick={() => fetchCFStats(cfNickname)}
                    disabled={cfLoading}
                    className="flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110"
                    style={{ background: GOLD, color: "#000", borderRadius: "2px" }}
                  >
                    {cfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Sync My Stats
                  </button>
                </div>
              ) : !cfNickname || cfLinkMode ? (
                /* Link form */
                <div className="flex flex-col gap-4">
                  <div>
                    {/* Explain what to paste */}
                    <div
                      className="flex items-start gap-2 px-3 py-2.5 mb-3 text-[11px]"
                      style={{ background: "rgba(245,166,35,0.05)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: "3px", color: "#888" }}
                    >
                      <Zap className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" style={{ color: GOLD }} />
                      <span>
                        Paste your <strong style={{ color: GOLD }}>CrossFire profile link</strong>{" "}
                        <span style={{ color: "#555" }}>
                          (e.g. crossfire.z8games.com/profile/26992814)
                        </span>{" "}
                        or enter your <strong style={{ color: GOLD }}>in-game nickname</strong>.
                        We'll fetch your EXP, rank progress, VIP days, K/D and more.
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={cfNicknameInput}
                        onChange={(e) => { setCfNicknameInput(e.target.value); setCfError(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") fetchCFStats(cfNicknameInput); }}
                        placeholder="Profile link or in-game nickname..."
                        maxLength={200}
                        className="flex-1 px-3 py-2 text-sm font-bold bg-transparent outline-none"
                        style={{
                          color: "var(--foreground)",
                          border: "1px solid rgba(245,166,35,0.25)",
                          borderRadius: "3px",
                          background: "rgba(255,255,255,0.02)",
                        }}
                      />
                      <button
                        onClick={() => fetchCFStats(cfNicknameInput)}
                        disabled={cfLoading || !cfNicknameInput.trim()}
                        className="flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-40"
                        style={{ background: GOLD, color: "#000", borderRadius: "2px", whiteSpace: "nowrap" }}
                      >
                        {cfLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gamepad2 className="h-3.5 w-3.5" />}
                        {cfLoading ? "Fetching..." : "Load Stats"}
                      </button>
                      {cfLinkMode && (
                        <button
                          onClick={() => { setCfLinkMode(false); setCfError(""); }}
                          className="px-3 py-2 text-[10px] font-black uppercase tracking-widest"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#555", borderRadius: "2px" }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Error */}
                  {cfError && (
                    <div
                      className="flex items-start gap-2 px-3 py-2.5 text-[11px]"
                      style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "3px", color: "#f87171" }}
                    >
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      {cfError}
                    </div>
                  )}

                  <p className="text-[9px]" style={{ color: "#383838" }}>
                    Stats are fetched live from CrossFire West and cached on your profile.
                    Case-sensitive — use your exact in-game nickname.
                  </p>

                  {cfNickname && (
                    <button
                      onClick={handleUnlinkCF}
                      className="self-start text-[9px] font-bold uppercase tracking-widest"
                      style={{ color: "#555" }}
                    >
                      Remove linked account
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Quick actions ── */}
          <div
            className="p-5"
            style={{ background: CARD_BG, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-4" style={{ color: "#444" }}>Quick Actions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: "My Support Tickets", href: "/my-tickets", icon: Ticket },
                { label: "Browse Events", href: "/events", icon: Clock },
                { label: "Weapons Database", href: "/weapons", icon: Shield },
                { label: "Community Posts", href: "/posts", icon: MessageSquare },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href}>
                  <div
                    className="flex items-center gap-3 px-4 py-3 transition-all hover:border-[rgba(245,166,35,0.3)] cursor-pointer"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "3px" }}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" style={{ color: GOLD }} />
                    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--foreground)" }}>{label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
