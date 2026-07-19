import React from "react";

export function TacticalDark() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-300 font-sans selection:bg-[#d4a017] selection:text-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#333]">
        {/* Crosshair/Grid Background Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #333 1px, transparent 1px),
              linear-gradient(to bottom, #333 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            backgroundPosition: "center center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
          {/* Crosshair accents */}
          <div className="absolute top-1/2 left-1/2 w-48 h-48 -translate-x-1/2 -translate-y-1/2 border border-[#d4a017] rounded-full opacity-30"></div>
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#d4a017] opacity-20 -translate-y-1/2"></div>
          <div className="absolute top-0 left-1/2 w-[1px] h-full bg-[#d4a017] opacity-20 -translate-x-1/2"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 flex flex-col items-center text-center z-10">
          <div className="inline-block border border-[#d4a017] text-[#d4a017] text-xs font-mono tracking-[0.2em] px-3 py-1 mb-6 uppercase bg-[#d4a017]/10">
            Intel Database / Access Granted
          </div>
          <h1 className="text-6xl md:text-8xl font-bold text-white tracking-tighter uppercase mb-4" style={{ fontFamily: "Impact, sans-serif" }}>
            CrossFire <span className="text-[#d4a017]">Wiki</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-mono tracking-widest uppercase mb-10 max-w-3xl">
            Weapons · Mercenaries · Ranks · Events
          </p>
          
          <div className="w-full max-w-2xl relative flex items-center">
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d4a017" strokeWidth="2" strokeLinecap="square">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="SEARCH DATABASE..."
              className="w-full bg-[#111] border-2 border-[#333] focus:border-[#d4a017] text-white px-12 py-4 text-lg font-mono uppercase placeholder-gray-600 outline-none transition-colors"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#d4a017] text-black font-bold uppercase tracking-wider px-6 py-2 hover:bg-[#e0b020] transition-colors">
              Deploy
            </button>
          </div>
        </div>
      </section>

      {/* Events Strip */}
      <div className="bg-[#d4a017] text-black border-y border-[#d4a017]/80 overflow-hidden py-2">
        <div className="flex gap-8 whitespace-nowrap overflow-x-auto px-6 scrollbar-hide font-mono text-sm font-bold uppercase tracking-widest items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-black animate-pulse"></span>
            <span>Active Operations</span>
          </div>
          <span>///</span>
          <span>Football Frenzy (Jun 11 – Jul 19)</span>
          <span>///</span>
          <span>Blazing Bonus (Jul 1 – 31)</span>
          <span>///</span>
          <span>Infinity VIP M4A1-S Prometheus (Jul 8 – Aug 5)</span>
          <span>///</span>
          <span>CF Event Pass Season 7 (Jun 10 – Aug 5)</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-16 space-y-24">
        {/* Events Section */}
        <section>
          <div className="flex items-end justify-between border-b border-[#333] pb-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Current Events</h2>
              <p className="text-[#d4a017] font-mono text-sm mt-1 uppercase">Live Briefings</p>
            </div>
            <button className="text-sm font-mono text-gray-400 hover:text-[#d4a017] uppercase tracking-widest transition-colors flex items-center gap-2">
              View All
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Featured Event */}
            <div className="lg:col-span-2 group relative border border-[#333] bg-[#111] hover:border-[#d4a017] transition-colors cursor-pointer overflow-hidden flex flex-col justify-end h-80">
              <div 
                className="absolute inset-0 opacity-20 transition-opacity group-hover:opacity-40"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, #d4a017 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }}
              ></div>
              <div className="absolute top-4 left-4 bg-[#d4a017] text-black font-mono text-xs font-bold px-2 py-1 uppercase">
                Featured
              </div>
              <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#d4a017] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[#d4a017] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative z-10 p-8 bg-gradient-to-t from-black via-black/80 to-transparent pt-32">
                <div className="text-[#d4a017] font-mono text-sm mb-2 font-bold">Jun 10 – Aug 5</div>
                <h3 className="text-3xl font-bold text-white uppercase tracking-wide">CF Event Pass Season 7</h3>
                <p className="text-gray-400 mt-2 font-mono text-sm">Earn exclusive rewards, weapon crates, and mercenary skins.</p>
              </div>
            </div>

            {/* Side Events */}
            <div className="flex flex-col gap-6">
              <div className="flex-1 group relative border border-[#333] bg-[#111] hover:border-[#d4a017] transition-colors cursor-pointer overflow-hidden p-6 flex flex-col justify-end">
                <div className="absolute top-0 right-0 bg-[#d4a017]/10 w-32 h-32 transform rotate-45 translate-x-16 -translate-y-16 group-hover:bg-[#d4a017]/20 transition-colors"></div>
                <div className="relative z-10">
                  <div className="text-[#d4a017] font-mono text-xs mb-1 font-bold">Jun 11 – Jul 19</div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-wide">Football Frenzy</h3>
                </div>
              </div>
              
              <div className="flex-1 group relative border border-[#333] bg-[#111] hover:border-[#d4a017] transition-colors cursor-pointer overflow-hidden p-6 flex flex-col justify-end">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, #d4a017 25%, transparent 25%, transparent 50%, #d4a017 50%, #d4a017 75%, transparent 75%, transparent)', backgroundSize: '10px 10px' }}></div>
                <div className="relative z-10">
                  <div className="text-[#d4a017] font-mono text-xs mb-1 font-bold">Jul 8 – Aug 5</div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-wide">Infinity VIP M4A1-S Prometheus</h3>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wiki Sections */}
        <section>
          <div className="flex items-end justify-between border-b border-[#333] pb-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Database Index</h2>
              <p className="text-[#d4a017] font-mono text-sm mt-1 uppercase">Classified Files</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              {
                title: "Weapons",
                desc: "Assault Rifles, Snipers, SMGs, Melee",
                icon: (
                  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <path d="M12 40h20v6H12zM32 36h20v4H32zM48 36h4v10h-4zM24 40v8h-6v-8z" />
                    <path d="M10 40l-2-6 16-4 12-2 16 6v6" />
                    <circle cx="20" cy="34" r="2" />
                    <path d="M52 36l4 2v4" />
                  </svg>
                )
              },
              {
                title: "Game Modes",
                desc: "Team Deathmatch, Search & Destroy",
                icon: (
                  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <circle cx="32" cy="32" r="20" />
                    <circle cx="32" cy="32" r="10" />
                    <path d="M32 4v8M32 52v8M4 32h8M52 32h8" />
                  </svg>
                )
              },
              {
                title: "Maps",
                desc: "Black Widow, Port, Eagle Eye",
                icon: (
                  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <path d="M32 10c-10 0-18 8-18 18 0 14 18 28 18 28s18-14 18-28c0-10-8-18-18-18z" />
                    <circle cx="32" cy="28" r="6" />
                    <path d="M12 46l-4 8h48l-4-8" />
                  </svg>
                )
              },
              {
                title: "Mercenaries",
                desc: "Characters, Factions, Special Forces",
                icon: (
                  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <path d="M32 14c-8 0-14 6-14 14v10h28V28c0-8-6-14-14-14z" />
                    <path d="M14 38v4c0 4 4 8 8 8h20c4 0 8-4 8-8v-4" />
                    <path d="M26 38v6M38 38v6" />
                    <path d="M32 14v-6M24 16l-4-4M40 16l4-4" />
                  </svg>
                )
              },
              {
                title: "Ranks",
                desc: "Progression, EXP, Badges",
                icon: (
                  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <path d="M32 8l8 24h20l-16 12 6 20-18-14-18 14 6-20-16-12h20z" />
                    <path d="M32 20v24M22 32h20" stroke="#d4a017" opacity="0.5" />
                  </svg>
                )
              },
              {
                title: "Tutorials",
                desc: "Movement, Recoil Control, Strats",
                icon: (
                  <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
                    <path d="M16 12h32v40H16z" />
                    <path d="M16 12c-4 0-6 2-6 6v34c0 4 2 6 6 6" />
                    <path d="M24 24h16M24 32h16M24 40h8" />
                  </svg>
                )
              }
            ].map((section, i) => (
              <div key={i} className="group border border-[#333] bg-[#111] p-6 hover:border-[#d4a017] transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center">
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[30px] border-l-[30px] border-t-[#333] border-l-transparent group-hover:border-t-[#d4a017] transition-colors"></div>
                <div className="absolute bottom-0 left-0 w-8 h-1 bg-[#333] group-hover:bg-[#d4a017] transition-colors"></div>
                
                <div className="text-[#555] group-hover:text-[#d4a017] transition-colors mb-6 mt-4">
                  {section.icon}
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-wider mb-2">{section.title}</h3>
                <p className="text-gray-500 font-mono text-xs">{section.desc}</p>
                
                <div className="mt-6 border border-[#333] group-hover:border-[#d4a017] px-4 py-1 text-xs font-mono text-[#555] group-hover:text-[#d4a017] uppercase tracking-widest transition-colors">
                  Access
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Latest News */}
        <section>
          <div className="flex items-end justify-between border-b border-[#333] pb-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Comms / News</h2>
              <p className="text-[#d4a017] font-mono text-sm mt-1 uppercase">HQ Transmissions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { date: "Jul 15, 2024", title: "New Weapon Balance Update", cat: "Patch Notes" },
              { date: "Jul 10, 2024", title: "Season 7 Pass Announced", cat: "Events" },
              { date: "Jul 05, 2024", title: "Tournament Results: Summer Clash", cat: "Esports" },
              { date: "Jun 28, 2024", title: "Map Rotation Changes - July", cat: "System" }
            ].map((news, i) => (
              <div key={i} className="flex bg-[#111] border border-[#222] hover:border-[#444] transition-colors cursor-pointer group">
                <div className="w-1 bg-[#d4a017]/50 group-hover:bg-[#d4a017] transition-colors"></div>
                <div className="p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono text-[#d4a017] border border-[#d4a017]/30 px-1">{news.cat}</span>
                    <span className="text-xs font-mono text-gray-500">{news.date}</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">{news.title}</h4>
                </div>
                <div className="ml-auto p-4 flex items-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#333] group-hover:text-[#d4a017] transition-colors" strokeWidth="2" strokeLinecap="square">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* CTA Footer */}
      <footer className="border-t border-[#333] mt-24">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="bg-[#1a1a1a] border border-[#333] p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMWExYTFhIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyMjIiPjwvcmVjdD4KPC9zdmc+')] opacity-50"></div>
            <div className="relative z-10 flex flex-col items-center">
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none" stroke="#d4a017" strokeWidth="2" strokeLinecap="square" className="mb-6">
                <path d="M12 20c0-6 6-10 20-10s20 4 20 10c0 14-8 28-20 36C20 48 12 34 12 20z" />
                <path d="M24 28l6 6 12-12" />
              </svg>
              <h2 className="text-4xl font-bold text-white uppercase tracking-wider mb-4">Join the Battalion</h2>
              <p className="text-gray-400 font-mono max-w-lg mb-8">Connect with other mercenaries. Share loadouts, discuss tactics, and find squads in the official CrossFire Wiki Discord server.</p>
              <button className="bg-white text-black font-bold uppercase tracking-widest px-8 py-4 hover:bg-[#d4a017] transition-colors border-2 border-transparent hover:border-white">
                Initialize Discord Connection
              </button>
            </div>
          </div>
          
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between text-xs font-mono text-gray-600 uppercase tracking-widest">
            <div>© {new Date().getFullYear()} CF Wiki Database</div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <span className="hover:text-[#d4a017] cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-[#d4a017] cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-[#d4a017] cursor-pointer transition-colors">HQ Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
