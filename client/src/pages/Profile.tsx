import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { getCurrentUser, uploadImageToSupabase } from "@/lib/supabaseApi";
import PageSEO from "@/components/PageSEO";
import { supabase } from "@/lib/supabase";
import {
  User, Camera, Shield, Edit3, Check, X, Loader2,
  Ticket, MessageSquare, Clock, Award, LogOut,
} from "lucide-react";

const GOLD = "#f5a623";
const CARD_BG = "var(--card)";

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div
      className="flex flex-col items-center gap-1 p-4"
      style={{ background: CARD_BG, border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px" }}
    >
      <Icon className="h-4 w-4 mb-1" style={{ color: GOLD }} />
      <span className="text-xl font-black" style={{ color: "var(--foreground)" }}>{value}</span>
      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#555" }}>{label}</span>
    </div>
  );
}

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) {
        setUser(u);
        setDisplayName(u.user_metadata?.username || u.user_metadata?.full_name || "");
        setBio(u.user_metadata?.bio || "");
        setAvatarUrl(u.user_metadata?.avatar || u.user_metadata?.avatar_url || "");
      }
      setLoading(false);
    });
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadImageToSupabase(file, "media");
      setAvatarUrl(url);
      await supabase.auth.updateUser({ data: { avatar: url, avatar_url: url } });
    } catch {
      // silent
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.auth.updateUser({
        data: { username: displayName, bio },
      });
      setEditing(false);
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
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

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard icon={Ticket} label="Tickets" value="—" />
            <StatCard icon={MessageSquare} label="Comments" value="—" />
            <StatCard icon={Clock} label="Days Active" value={Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000)} />
            <StatCard icon={Award} label="Rank" value="Member" />
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
