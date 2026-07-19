import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { getCurrentUser } from "@/lib/supabaseApi";
import PageSEO from "@/components/PageSEO";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  User, Camera, Shield, Edit3, Check, X, Loader2,
  Ticket, MessageSquare, Clock, Award, LogOut,
  Gamepad2, Swords, Trophy, Target, RefreshCw, AlertCircle, TrendingUp, Zap
} from "lucide-react";

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
      // Use the backend upload endpoint (same as admin uses) to bypass storage RLS
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "avatars");
      const res = await fetch("/images/upload", { method: "POST", body: fd });
      const json = await res.json();
      const url = json.domain_url || json.secure_url || json.url || "";
      if (!res.ok || !url) throw new Error(json.error || "Upload failed");
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

  // Fetch CF player stats from server (server proxies to z8games.com to bypass CDN)
  const fetchCFStats = async (nick: string) => {
    if (!nick.trim()) return;
    setCfLoading(true);
    setCfError("");
    try {
      const res = await fetch(`/api/player/lookup?nickname=${encodeURIComponent(nick.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.notFound) {
          setCfError(`Player "${nick}" not found on CrossFire NA. Check the nickname and try again.`);
        } else {
          setCfError(data.error || "Could not fetch stats. Try again shortly.");
        }
        return;
      }

      const now = new Date().toISOString();
      setCfStats(data.profile);
      setCfNickname(nick.trim());
      setCfSyncTime(now);
      setCfLinkMode(false);

      // Save to Supabase user metadata
      await supabase.auth.updateUser({
        data: {
          cf_nickname: nick.trim(),
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
    await supabase.auth.updateUser({
      data: { cf_nickname: null, cf_stats: null, cf_last_sync: null },
    });
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
                      <div className="px-2 py-1" style={{ background: "rgba(255,255,255,0.02)", borderRadius: "3px" }}>
                        <span className="text-[9px] font-bold" style={{ color: "#555" }}>[{cfStats.clan}]</span>
                      </div>
                    )}
                    {cfSyncTime && (
                      <span className="text-[8px] ml-auto" style={{ color: "#383838" }}>
                        Synced {new Date(cfSyncTime).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* EXP bar */}
                  {cfStats.exp !== null && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3 w-3" style={{ color: GOLD }} />
                          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#555" }}>Total EXP</span>
                        </div>
                        <span className="text-sm font-black" style={{ color: GOLD }}>
                          {cfStats.exp.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(to right, ${GOLD}, #f5c842)`,
                            width: `${Math.min(100, (cfStats.exp / 100_000_000) * 100)}%`,
                            transition: "width 0.8s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}

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
                    <p className="text-[11px] mb-3" style={{ color: "#666" }}>
                      Enter your <strong style={{ color: GOLD }}>CrossFire in-game nickname</strong> exactly as it appears in the game.
                      We'll automatically fetch your EXP, rank, K/D, kills, and more from CrossFire NA.
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={cfNicknameInput}
                        onChange={(e) => { setCfNicknameInput(e.target.value); setCfError(""); }}
                        onKeyDown={(e) => { if (e.key === "Enter") fetchCFStats(cfNicknameInput); }}
                        placeholder="Your exact in-game nickname..."
                        maxLength={32}
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
                    Stats are fetched live from CrossFire NA (crossfire.z8games.com) and cached on your profile.
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
