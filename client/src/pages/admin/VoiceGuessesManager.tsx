import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/supabaseAdmin";
import { Trash2, CheckCircle, Mic } from "lucide-react";

interface Guess {
  id: string;
  clip: string;
  guess_name: string;
  user_id: string;
  username: string;
  contact: string;
  reviewed: boolean;
  created_at: string;
}

const ENDPOINT = "/api/admin/rebuild?action=admin-table&type=voice_guesses";

export default function VoiceGuessesManager() {
  const [rows, setRows] = useState<Guess[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "reviewed">("all");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{ data?: Guess[] }>(ENDPOINT, {
        method: "POST",
        body: JSON.stringify({ action: "admin-table", type: "voice_guesses", operation: "list", page: 1, pageSize: 200 }),
      });
      setRows(res.data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this guess?")) return;
    await adminFetch(ENDPOINT, { method: "POST", body: JSON.stringify({ action: "admin-table", type: "voice_guesses", operation: "delete", id }) });
    load();
  };

  const toggleReviewed = async (g: Guess) => {
    await adminFetch(ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ action: "admin-table", type: "voice_guesses", operation: "update", id: g.id, row: { reviewed: !g.reviewed } }),
    });
    load();
  };

  const shown = rows.filter((r) => (filter === "all" ? true : filter === "new" ? !r.reviewed : r.reviewed));
  const byClip: Record<string, Guess[]> = {};
  shown.forEach((r) => { (byClip[r.clip] = byClip[r.clip] || []).push(r); });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Mic size={20} color="#d4a017" />
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Voice Detective — Guesses ({rows.length})</h2>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {(["all", "new", "reviewed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: filter === f ? "#d4a017" : "transparent", color: filter === f ? "#000" : "#a1a1aa",
                border: "1px solid #3f3f46" }}>
              {f === "all" ? "All" : f === "new" ? "New" : "Reviewed"}
            </button>
          ))}
          <button onClick={load} style={{ padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", background: "transparent", color: "#fafafa", border: "1px solid #3f3f46" }}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "#71717a", fontSize: 14 }}>Loading… (if this stays empty, run supabase/migrations/voice-guesses.sql first)</div>
      ) : shown.length === 0 ? (
        <div style={{ color: "#71717a", fontSize: 14 }}>No guesses yet. Share /voice-detective with the community!</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {Object.entries(byClip).map(([clip, list]) => (
            <div key={clip} style={{ background: "#111114", border: "1px solid #27272a", borderRadius: 10, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <audio controls preload="none" src={clip} style={{ height: 32, maxWidth: 260 }} />
                <span style={{ fontSize: 12, color: "#71717a", fontFamily: "monospace" }}>{clip}</span>
                <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 800, color: "#d4a017" }}>{list.length} guess{list.length > 1 ? "es" : ""}</span>
              </div>
              {list.map((g) => (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderTop: "1px solid #1c1c1f", fontSize: 13 }}>
                  <button onClick={() => toggleReviewed(g)} title={g.reviewed ? "Mark unreviewed" : "Mark reviewed"}
                    style={{ background: "none", border: "none", cursor: "pointer", color: g.reviewed ? "#4ade80" : "#52525b" }}>
                    <CheckCircle size={16} />
                  </button>
                  <strong style={{ color: "#fafafa" }}>{g.guess_name}</strong>
                  <span style={{ color: "#71717a" }}>by {g.username || "guest"}{g.contact ? ` (${g.contact})` : ""}</span>
                  <span style={{ marginLeft: "auto", color: "#52525b", fontSize: 11 }}>{new Date(g.created_at).toLocaleString()}</span>
                  <button onClick={() => remove(g.id)} title="Delete"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
