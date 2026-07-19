import React from "react";

export default function NeonOps() {
  const eventsStrip = [
    { name: "Football Frenzy", dates: "Jun 11 - Jul 19" },
    { name: "Blazing Bonus", dates: "Jul 1 - 31" },
    { name: "Infinity VIP M4A1-S Prometheus", dates: "Jul 8 - Aug 5" },
    { name: "CF Event Pass Season 7", dates: "Jun 10 - Aug 5" },
  ];

  const featuredEvent = {
    title: "Football Frenzy: Ultimate Showdown",
    dates: "Jun 11 - Jul 19",
    description: "Compete in the ultimate gridiron battle. Score points, earn exclusive weapon skins, and dominate the seasonal leaderboards before the whistle blows.",
  };

  const sideEvents = [
    { title: "Infinity VIP M4A1-S Prometheus", dates: "Jul 8 - Aug 5" },
    { title: "CF Event Pass Season 7", dates: "Jun 10 - Aug 5" },
  ];

  const wikiSections = [
    {
      title: "Weapons",
      desc: "Assault Rifles, Snipers, SMGs & Melee",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#e53e3e]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7v3.5l-4.5 4.5h-5.5l-2-2v-4.5l4.5-4.5h5.5l2 2V7zM3 13.5v7l4-4v-3M7 16.5l3-3" />
          <circle cx="15.5" cy="8.5" r="1.5" />
        </svg>
      ),
    },
    {
      title: "Game Modes",
      desc: "Search & Destroy, Ghost Mode, Mutation",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#63b3ed]">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </svg>
      ),
    },
    {
      title: "Maps",
      desc: "Black Widow, Port, Eagle Eye & More",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#e53e3e]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3L3 6v15l6-3M9 3l6 3M9 3v15M21 6l-6-3v15l6 3V6zM15 6v15" />
        </svg>
      ),
    },
    {
      title: "Mercenaries",
      desc: "Global Risk, Black List, VIP Characters",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#63b3ed]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v3" />
        </svg>
      ),
    },
    {
      title: "Ranks",
      desc: "From Trainee to Marshall",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#e53e3e]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      title: "Tutorials",
      desc: "Movement, Recoil Control, Tactics",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-[#63b3ed]">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20V4H6.5A2.5 2.5 0 004 6.5v13z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8h4M12 12h4" />
        </svg>
      ),
    },
  ];

  const newsItems = [
    { title: "Season 7 Battle Pass: Everything You Need to Know", date: "Jul 15, 2026" },
    { title: "Top 10 Weapons for Competitive Play", date: "Jul 12, 2026" },
    { title: "New Mercenary Skills Explained", date: "Jul 08, 2026" },
    { title: "Event Calendar: July 2026", date: "Jul 01, 2026" },
  ];

  return (
    <div 
      className="min-h-screen text-gray-200 font-sans selection:bg-[#e53e3e] selection:text-white pb-20"
      style={{ 
        backgroundColor: "#0d1117",
        backgroundImage: "linear-gradient(rgba(13, 17, 23, 0.95), rgba(13, 17, 23, 0.95)), repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255, 255, 255, 0.02) 2px, rgba(255, 255, 255, 0.02) 4px)"
      }}
    >
      {/* Header / Nav */}
      <header className="border-b border-[#1f2937] bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-[#e53e3e] flex items-center justify-center rounded-sm" style={{ clipPath: "polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)" }}>
              <span className="font-bold text-white text-sm tracking-tighter">CF</span>
            </div>
            <span className="font-bold tracking-widest text-lg uppercase text-white">
              Neon<span className="text-[#e53e3e]">Ops</span>
            </span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-bold tracking-widest uppercase text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Wiki</a>
            <a href="#" className="hover:text-white transition-colors">Database</a>
            <a href="#" className="hover:text-white transition-colors">Tier Lists</a>
            <a href="#" className="hover:text-white transition-colors">Community</a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 px-6 overflow-hidden border-b border-[#1f2937]/50">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#e53e3e] via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white mb-2" style={{ fontFamily: "Impact, sans-serif" }}>
            CROSSFIRE WIKI
          </h1>
          <div className="h-1 w-32 bg-[#e53e3e] mb-8 shadow-[0_0_15px_#e53e3e]"></div>
          <p className="text-xl md:text-2xl text-gray-400 mb-12 tracking-wide max-w-2xl font-light">
            The Definitive Tactical FPS Resource
          </p>

          <div className="w-full max-w-2xl relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#e53e3e] to-[#63b3ed] rounded-sm opacity-20 group-hover:opacity-100 transition duration-500 blur-sm"></div>
            <div className="relative flex items-center bg-[#111823] border border-[#1f2937] rounded-sm px-4 py-3 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-500 mr-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search weapons, maps, mercenaries..." 
                className="w-full bg-transparent border-none text-white focus:outline-none placeholder-gray-600 font-mono text-sm"
              />
              <button className="bg-[#e53e3e]/20 text-[#e53e3e] px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#e53e3e] hover:text-white transition-colors border border-[#e53e3e]/50">
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Strip HUD */}
      <div className="bg-[#0a0d12] border-b border-[#e53e3e]/30 overflow-hidden shadow-[0_4px_20px_rgba(229,62,62,0.05)]">
        <div className="flex animate-[marquee_20s_linear_infinite] whitespace-nowrap py-3">
          {[...eventsStrip, ...eventsStrip].map((event, i) => (
            <div key={i} className="flex items-center mx-6 gap-3">
              <span className="w-2 h-2 rounded-full bg-[#e53e3e] shadow-[0_0_8px_#e53e3e] animate-pulse"></span>
              <span className="text-sm font-bold tracking-wider text-gray-300 uppercase">{event.name}</span>
              <span className="text-xs font-mono text-[#63b3ed] bg-[#63b3ed]/10 px-2 py-0.5 rounded-sm border border-[#63b3ed]/20">[{event.dates}]</span>
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-8 space-y-16">
          {/* Active Events Section */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-3xl font-black uppercase tracking-widest text-white">Active Ops</h2>
              <div className="h-px bg-gradient-to-r from-[#e53e3e] to-transparent flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Featured Event */}
              <div 
                className="md:col-span-2 relative bg-[#111823] p-8 border-l-4 border-[#e53e3e] group overflow-hidden"
                style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)" }}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-32 h-32 text-[#e53e3e] -mt-10 -mr-10">
                    <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z" />
                  </svg>
                </div>
                <div className="relative z-10">
                  <span className="inline-block px-2 py-1 bg-[#e53e3e]/20 text-[#e53e3e] text-xs font-mono font-bold mb-4 border border-[#e53e3e]/30">
                    FEATURED DIRECTIVE
                  </span>
                  <h3 className="text-3xl font-bold text-white mb-2 uppercase tracking-wide">{featuredEvent.title}</h3>
                  <div className="flex items-center gap-2 mb-6">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#63b3ed]">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                    </svg>
                    <span className="font-mono text-sm text-[#63b3ed]">{featuredEvent.dates}</span>
                  </div>
                  <p className="text-gray-400 mb-6 leading-relaxed max-w-xl">
                    {featuredEvent.description}
                  </p>
                  <button className="bg-transparent border border-[#e53e3e] text-[#e53e3e] hover:bg-[#e53e3e] hover:text-white px-6 py-2 text-sm font-bold tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(229,62,62,0.2)] hover:shadow-[0_0_20px_rgba(229,62,62,0.6)]">
                    Access Intel
                  </button>
                </div>
              </div>

              {/* Side Events */}
              {sideEvents.map((event, idx) => (
                <div 
                  key={idx}
                  className="bg-[#111823] p-6 border-l-2 border-[#63b3ed] hover:border-[#e53e3e] transition-colors relative"
                  style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)" }}
                >
                  <h4 className="text-lg font-bold text-gray-200 mb-3 uppercase tracking-wide">{event.title}</h4>
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-500">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="font-mono text-xs text-gray-400">{event.dates}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Wiki Sections Grid */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <h2 className="text-3xl font-black uppercase tracking-widest text-white">Database</h2>
              <div className="h-px bg-gradient-to-r from-[#e53e3e] to-transparent flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wikiSections.map((section, idx) => (
                <div 
                  key={idx}
                  className="group bg-[#111823] border border-[#1f2937] hover:border-[#63b3ed]/50 p-6 flex flex-col items-center text-center transition-all cursor-pointer relative overflow-hidden hover:bg-[#151d2b]"
                  style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}
                >
                  <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-[#1f2937] to-transparent"></div>
                  <div className="mb-4 p-3 bg-[#0d1117] rounded-full border border-[#1f2937] group-hover:border-[#63b3ed]/30 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    {section.icon}
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-wide group-hover:text-[#63b3ed] transition-colors">{section.title}</h4>
                  <p className="text-xs text-gray-500 font-mono">{section.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-10">
          
          {/* Latest News */}
          <section>
            <h3 className="text-xl font-bold uppercase tracking-widest text-gray-300 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#e53e3e]"></span>
              Comm Link
            </h3>
            <div className="flex flex-col gap-3">
              {newsItems.map((news, idx) => (
                <div 
                  key={idx}
                  className="bg-[#111823] p-4 border-l-2 border-[#1f2937] hover:border-[#e53e3e] transition-all cursor-pointer group"
                >
                  <span className="text-xs font-mono text-[#63b3ed] block mb-2 opacity-70 group-hover:opacity-100">{news.date}</span>
                  <h4 className="text-sm font-bold text-gray-300 group-hover:text-white leading-snug">{news.title}</h4>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-3 bg-[#111823] border border-[#1f2937] text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-white hover:border-gray-500 transition-colors">
              View All Transmissions
            </button>
          </section>

          {/* Quick Stats / Global Status */}
          <section className="bg-[#111823] border border-[#1f2937] p-6 relative" style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)" }}>
            <div className="absolute top-0 right-0 w-16 h-1 bg-gradient-to-l from-[#e53e3e] to-transparent"></div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6">Server Status</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-300">NA Server</span>
                  <span className="text-green-400">ONLINE</span>
                </div>
                <div className="w-full h-1 bg-[#0d1117] rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-green-500 opacity-80"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-300">EU Server</span>
                  <span className="text-green-400">ONLINE</span>
                </div>
                <div className="w-full h-1 bg-[#0d1117] rounded-full overflow-hidden">
                  <div className="w-[92%] h-full bg-green-500 opacity-80"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-300">Competitive MM</span>
                  <span className="text-[#e53e3e]">HEAVY LOAD</span>
                </div>
                <div className="w-full h-1 bg-[#0d1117] rounded-full overflow-hidden">
                  <div className="w-[98%] h-full bg-[#e53e3e] opacity-80"></div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* CTA Section */}
      <section className="max-w-5xl mx-auto px-6 mt-10">
        <div className="relative p-[1px] bg-gradient-to-r from-[#e53e3e] via-transparent to-[#63b3ed] rounded-sm shadow-[0_0_30px_rgba(229,62,62,0.15)] group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#e53e3e]/20 to-[#63b3ed]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 blur-xl"></div>
          <div className="bg-[#0a0d12] relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-widest text-white mb-2">Join the Vanguard</h2>
              <p className="text-gray-400 max-w-md">Connect with thousands of mercenaries, find a clan, and get real-time intel on updates.</p>
            </div>
            <button className="flex-shrink-0 flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 font-bold tracking-wider uppercase transition-colors rounded-sm">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
              </svg>
              Discord Server
            </button>
          </div>
        </div>
      </section>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
}
