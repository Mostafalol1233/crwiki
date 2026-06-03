import { useEffect, useState } from "react";
import { SiDiscord } from "react-icons/si";
import { Users } from "lucide-react";

interface DiscordMember {
  id: string;
  username: string;
  avatar_url: string;
  status: string;
}

interface WidgetData {
  presence_count: number;
  members: DiscordMember[];
  name: string;
}

const GUILD_ID = "1005574145503465532";
const INVITE = "https://discord.gg/7AbuDrNNJM";

export function DiscordWidget() {
  const [data, setData] = useState<WidgetData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`https://discord.com/api/guilds/${GUILD_ID}/widget.json`)
      .then((r) => r.json())
      .then((d) => {
        if (d.code === 50004 || d.message) {
          setError(true);
        } else {
          setData(d);
        }
      })
      .catch(() => setError(true));
  }, []);

  return (
    <div
      className="overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1e2a3a 0%, #2c3e54 60%, #1a2636 100%)",
        border: "1px solid rgba(88,101,242,0.3)",
        borderRadius: "6px",
        maxWidth: "340px",
        width: "100%",
        fontFamily: "'gg sans', 'Noto Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: "rgba(88,101,242,0.2)", borderBottom: "1px solid rgba(88,101,242,0.2)" }}
      >
        <SiDiscord style={{ color: "#5865f2", fontSize: "22px", flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <p className="font-black text-[11px] uppercase tracking-wider truncate" style={{ color: "#fff" }}>
            Discord
          </p>
          {data && (
            <p className="text-[12px] font-semibold" style={{ color: "#7dd87b" }}>
              {data.presence_count} Soldiers Online
            </p>
          )}
          {!data && !error && (
            <p className="text-[11px]" style={{ color: "#9ba8b4" }}>Loading...</p>
          )}
          {error && (
            <p className="text-[11px]" style={{ color: "#9ba8b4" }}>CrossFire Community</p>
          )}
        </div>
        <div
          className="flex items-center gap-1 px-2 py-1"
          style={{ background: "rgba(125,216,123,0.15)", borderRadius: "4px" }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: "#7dd87b" }} />
          <span className="text-[9px] font-bold" style={{ color: "#7dd87b" }}>ONLINE</span>
        </div>
      </div>

      {/* Member avatars */}
      {data && data.members && data.members.length > 0 ? (
        <div className="p-3">
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {data.members.slice(0, 35).map((member) => (
              <div key={member.id} className="relative group cursor-pointer" title={member.username}>
                <img
                  src={member.avatar_url || `https://cdn.discordapp.com/embed/avatars/0.png`}
                  alt={member.username}
                  className="w-full aspect-square rounded-full object-cover"
                  style={{ border: "2px solid rgba(88,101,242,0.3)" }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://cdn.discordapp.com/embed/avatars/0.png`;
                  }}
                />
                <div
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border"
                  style={{
                    background: member.status === "dnd" ? "#ed4245" : member.status === "idle" ? "#faa81a" : "#23a55a",
                    borderColor: "#1e2a3a",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 flex items-center gap-3">
          <Users className="h-8 w-8 opacity-30" style={{ color: "#7289da" }} />
          <div>
            <p className="text-[12px] font-bold" style={{ color: "#d2d8e0" }}>CrossFire Wiki Discord</p>
            <p className="text-[11px]" style={{ color: "#9ba8b4" }}>Join hundreds of active CF players</p>
          </div>
        </div>
      )}

      {/* Join button */}
      <div className="px-3 pb-3">
        <a
          href={INVITE}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-2.5 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110"
          style={{
            background: "#4752c4",
            color: "#fff",
            borderRadius: "4px",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#5865f2"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#4752c4"; }}
        >
          <SiDiscord style={{ fontSize: "13px" }} />
          JOIN NOW!
        </a>
      </div>
    </div>
  );
}
