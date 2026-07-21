// Forum seeding via Supabase REST API (no WebSocket dependency)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

async function supaGet(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, { headers });
  if (!res.ok) throw new Error(`GET ${table} failed: ${await res.text()}`);
  return res.json();
}

async function supaPost(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST", headers, body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`POST ${table} failed: ${await res.text()}`);
  return res.json();
}

async function supaDelete(table, filter) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "DELETE", headers
  });
  if (!res.ok) throw new Error(`DELETE ${table} failed: ${await res.text()}`);
}

async function supaPatch(table, filter, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH", headers, body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`PATCH ${table} failed: ${await res.text()}`);
}

const FORUM_DATA = {
  general: [
    {
      title: "Which server has the best ping for EU players?",
      body: "I've been playing on NA for a while but my ping is constantly over 150ms. Is there any news about a dedicated EU server or should I just switch to West?",
      authorName: "ArcticWolf99",
      replies: [
        { body: "Honestly, West is your best bet right now. The routing is a bit better for most European ISPs compared to the old East Coast nodes.", authorName: "ShadowStep" },
        { body: "Ping is just part of the game at this point. Learn to lead your shots and the delay becomes manageable.", authorName: "SniperPro2024" }
      ]
    },
    {
      title: "Ranked rewards for Season 25 — what do we know?",
      body: "Does anyone know what the Master rank skin is for this season? I heard rumors it's going to be a custom M4A1-S but I haven't seen any leaks yet. Last season's rewards were kind of underwhelming so hoping for something big this time.",
      authorName: "RankGrinder",
      replies: [
        { body: "It's definitely an M4A1-S. They posted a teaser image on the official Discord yesterday. Looks like a neon-blue theme.", authorName: "LeakHunter" },
        { body: "I'm just hoping for a decent namecard this time. The last season rewards were kind of underwhelming.", authorName: "CasualPlayer" }
      ]
    },
    {
      title: "Looking for a Clan — LTG Rank Competitive",
      body: "I'm a LTG rank player looking for an active clan that does daily wars. I main sniper and have a 1.8 K/D over the last 200 games. Must be active on Discord. DM me in-game or reply here.",
      authorName: "NoScopeKing",
      replies: [
        { body: "Check out VoidSquad. We are looking for a dedicated sniper for our evening scrims. Message me in-game.", authorName: "ClanLeader_X" },
        { body: "Also check the clan recruitment subforum — there are usually 5-10 active recruitment posts per day.", authorName: "ForumMod" }
      ]
    },
    {
      title: "Hackers in Hero Mode are getting out of hand",
      body: "Just played three games in a row where someone was using speed hacks and flying above the map. Z8 really needs to update the anti-cheat. I've submitted 3 reports this week alone. Anyone else experiencing this lately?",
      authorName: "ZombieHunter",
      replies: [
        { body: "Make sure you record the replay and report them on the support site. It's the only way they actually get banned. Screenshots alone don't work.", authorName: "ModFan" },
        { body: "The anti-cheat is basically a suggestion at this point. Every major update breaks it for like two days then they're back.", authorName: "SaltMine" }
      ]
    },
    {
      title: "Favorite map for Search & Destroy in ranked?",
      body: "Black Widow is a classic, but I've been really enjoying Sub Base lately for ranked S&D matches. The tight corridors reward good crossfire setups. What are you guys playing the most?",
      authorName: "TacticalMind",
      replies: [
        { body: "Ankara is the best for tactical play. So many different ways to execute onto the B site, you can never get comfortable defending.", authorName: "StratGod" },
        { body: "Port is always my go-to. It's simple, balanced, and doesn't have too many annoying pixel-walk corners.", authorName: "OldSchoolCF" },
        { body: "Ghost Ship for the vibes. Seriously though, the map design rewards smart rotations over pure aim.", authorName: "MapNerd" }
      ]
    },
    {
      title: "ZP or GP — which should I spend first as a new player?",
      body: "Just started playing CrossFire last month. I've accumulated some GP from matches and I'm not sure whether to spend it on permanent weapons or save up for the Black Market. Any advice for a newcomer?",
      authorName: "CF_Newbie2024",
      replies: [
        { body: "GP is best spent on permanent weapons in the shop. Get a solid AK-47 or M4A1 first. The Black Market is mostly for cosmetics.", authorName: "VeteranPlayer" },
        { body: "Save your ZP for VIP weapons during discount events. They rotate sales every 2-3 weeks and you can save up to 30%.", authorName: "SmartSpender" }
      ]
    }
  ],
  weapons: [
    {
      title: "M4A1-S Iron Beast vs. Predator — which is better for ranked?",
      body: "I'm looking to buy my first VIP weapon and I've narrowed it down to these two. Which one is better for competitive play? I see a lot of pros using the Predator in tournament streams but the Iron Beast looks insane statistically.",
      authorName: "VIP_Newbie",
      replies: [
        { body: "Predator has better recoil control for spraying, but Iron Beast feels faster on the draw. Personally prefer the Predator for mid-range fights.", authorName: "GunExpert" },
        { body: "If you tap fire, Iron Beast is superior at distance. If you hold left-click, go with the Predator. Know your playstyle first.", authorName: "SprayAndPray" },
        { body: "Both are top tier. I'd say get the one with the better skin you enjoy — you'll be looking at it 80% of the game.", authorName: "AestheticsGuy" }
      ]
    },
    {
      title: "Is the AK-47 Knife still top tier in 2026?",
      body: "The AK-47 Knife has been a staple since forever but with all the new VIP releases, is it still worth recommending to players? Asking for a friend who is debating between this and the AK-47 Scope.",
      authorName: "ClassicCF",
      replies: [
        { body: "Absolutely. The knife switch mechanic is still unmatched for aggressive plays. It's basically mandatory for pros.", authorName: "KnifeEnthusiast" },
        { body: "AK-47 Scope is better for new players since you don't need to manage the knife timing. Knife is a high skill-cap weapon.", authorName: "CoachMode" }
      ]
    },
    {
      title: "Best GP weapons for someone who can't buy ZP",
      body: "I know the VIP stuff is insane but I genuinely can't spend real money. What's the best loadout I can build purely from the GP shop? Looking for S&D mainly. Been running base AK-47 and it feels decent.",
      authorName: "FreeToPlay",
      replies: [
        { body: "AK-47, Desert Eagle, and a flashbang setup. The base AK is genuinely competitive if you control the recoil. F2P is totally viable.", authorName: "BudgetPlayer" },
        { body: "M4A1 base version is solid too. Pair it with the M9 pistol and you have a clean S&D loadout for cheap.", authorName: "LoadoutHelper" },
        { body: "Don't sleep on the SG552 either. It has one of the best damage-per-bullet ratios in the GP shop.", authorName: "HiddenGem" }
      ]
    },
    {
      title: "Sniper tier list — post your rankings",
      body: "Let's settle this. Post your sniper tier list with brief explanations. I'll start: Barrett M82A1 > M200 Intervention > AWM > SV98. The Barrett is still king for fire rate, but the M200 has better one-shot potential at range.",
      authorName: "SniperMain",
      replies: [
        { body: "For me it's M200 > Barrett > AWM. The M200 bullet velocity means you lead less at long range. Barrett is better for close-mid peek shots.", authorName: "CounterSniperPro" },
        { body: "SV98 is massively underrated. The bolt-cycle animation is faster than people think and it's basically free from events.", authorName: "SV98Gang" }
      ]
    },
    {
      title: "Does a weapon's skin/paint affect its stats?",
      body: "Genuine question — I see some skins going for thousands of ZP in the Black Market. Do the painted versions of weapons have any stat difference from the base version, or is it purely cosmetic?",
      authorName: "CuriousPlayer",
      replies: [
        { body: "Purely cosmetic. A camo AK-47 shoots exactly the same as a plain AK-47. The ZP cost is 100% for the look and the flex.", authorName: "StatChecker" },
        { body: "Some VIP versions have slightly different stats BUT that's because they're a different weapon model entirely, not the skin. Never a skin difference.", authorName: "ForumExpert" }
      ]
    }
  ],
  strategies: [
    {
      title: "Ultimate guide to crossfire setups on Port",
      body: "Port is one of the most played S&D maps in ranked, so I put together a quick guide on the best crossfire positions. Key spots: the container stacks at mid allow you to cover both mid and B-short simultaneously with two players. A-site is best defended from the crane overlook paired with someone at the cargo entrance.",
      authorName: "StratGod",
      replies: [
        { body: "Great guide. I'd add that the ship hull angle on A-site is one of the most underused cover spots — you can peek the bomb site and fall back in under a second.", authorName: "MapMaster" },
        { body: "The mid container stack is amazing but watch out for smokes. Once the site is smoked you need to fall to backup positions fast.", authorName: "AntiSmoke" }
      ]
    },
    {
      title: "How to properly eco round in Ghost Mode?",
      body: "My team keeps throwing eco rounds in Ghost Mode because they don't know when to save. What's the proper rule for eco vs force buy? And should you ever full save when down 10+ rounds?",
      authorName: "TeamLeader",
      replies: [
        { body: "Basic rule: if you can't afford a primary weapon + armor, save. Buying a pistol-only round into a full-buy team just throws the economy further.", authorName: "EcoMaster" },
        { body: "Full save when you're down 4+ in a row. The economy snowball is real and trying to force buy usually gives free weapons to the other team.", authorName: "EconCoach" }
      ]
    },
    {
      title: "Countering AWP campers as a rifler — practical tips",
      body: "I keep dying to the same AWP player holding the same angle every round on Black Widow. He barely moves and just picks off anyone who pushes. As a pure rifler with no ZP how do I counter this without getting my own AWP?",
      authorName: "Rifler2024",
      replies: [
        { body: "Flashbangs are your best friend here. A well-timed flash through the AWP corner resets his scope and gives you a free 1-second window to cross or push.", authorName: "FlashKing" },
        { body: "Smoke grenades to block his sightline entirely. Force him to reposition and then push with a teammate from a different angle. Never contest an AWP head-on.", authorName: "SmokeMaster" }
      ]
    },
    {
      title: "Best mercenary ability combos for ranked S&D",
      body: "I've been running Saki (grenade refund) + standard loadout but I'm wondering if there are better ability combos for ranked S&D. What mercs do you guys pair together at the team level for maximum synergy?",
      authorName: "MercExplorer",
      replies: [
        { body: "Luna's vision ability paired with a teammate running a smoke kit is devastating. The flash deny plus info-gathering makes it nearly impossible to push certain sites.", authorName: "AbilityGod" },
        { body: "For pure aggression: Saki for free grenades + any merc with fast movement ability. Set up early aggressive pushes before the enemy can set up crossfires.", authorName: "AggroMain" }
      ]
    },
    {
      title: "Effective grenade use in S&D — stop throwing blindly",
      body: "Stop throwing your HE grenades randomly at the start of the round! Save them for late-round situations when you know exactly where the enemy is hiding. The best HE throw is one that chips a player from 100 to 70 HP so your teammate can one-tap. Think chip damage, not kills.",
      authorName: "Grenadier",
      replies: [
        { body: "Early nades can work on known rush routes — like the long alley on Port. Chip damage on rushing enemies is super valuable in the first 20 seconds.", authorName: "DamageDealer" },
        { body: "Flashes are way more important than HE in coordinated play. A well-timed flash wins the site, a random HE just wastes a utility slot.", authorName: "FlashBang" }
      ]
    },
    {
      title: "Best graphics settings for 144Hz — performance guide",
      body: "I just upgraded my monitor from 60Hz to 144Hz. Should I keep the game resolution at 800x600 or go native 1080p? And what graphics settings actually affect performance vs. just being eye candy?",
      authorName: "RefreshRate",
      replies: [
        { body: "Stick with 800x600 or 1024x768. The character models appear wider at low res (easier headshots) and the FPS boost means you actually use that 144Hz.", authorName: "ProSettings" },
        { body: "Disable Vertical Sync in the Nvidia control panel. Also turn shadows to minimum — biggest FPS gain with zero gameplay downside.", authorName: "TechAdvice" }
      ]
    }
  ],
  mercenaries: [
    {
      title: "Complete mercenary tier list — July 2026",
      body: "After the June patch I've been testing all mercs in ranked. My current tier list:\n\nS-Tier: Luna, Kyle\nA-Tier: Saki, Harpy\nB-Tier: Jina, Frank\nC-Tier: Alex, Suu\n\nLuna's vision buff made her the best info-gathering tool in the game. Kyle's armor passive is still broken in Wave Mode. Thoughts?",
      authorName: "MercEnthusiast",
      replies: [
        { body: "Kyle is SS tier in Wave Mode and A tier in S&D. His armor passive completely changes the survivability math in long rounds.", authorName: "WaveKing" },
        { body: "I'd move Harpy up to S for S&D specifically. The ability cooldown nerf barely matters if you use it at the right moments.", authorName: "HarpyMain" },
        { body: "Saki deserves A+ at minimum. The grenade refund mechanic is one of the strongest utility abilities — free HE every 3 rounds adds up over a match.", authorName: "SakiFan" }
      ]
    },
    {
      title: "How to unlock mercenaries without spending ZP",
      body: "I want to try out different mercs but they're all ZP-locked. Are there any ways to get them through events, GP, or the mission system? I've heard some rotate through the GP shop occasionally.",
      authorName: "F2PMercHunter",
      replies: [
        { body: "Watch the event calendar. About once per month there's a login event or a point reward mission that gives a 7-day or 15-day merc rental.", authorName: "EventTracker" },
        { body: "Some mercs appear in the GP shop for limited 30-day periods. Alex was available for GP last month. Check the shop daily.", authorName: "ShopWatcher" }
      ]
    },
    {
      title: "Luna vs. Saki — which merc to buy permanently first?",
      body: "I've saved up enough ZP for one permanent merc. I'm an S&D main but I dabble in Ghost Mode too. Luna seems like the better call for info plays but Saki's grenade utility sounds incredible. Which would you invest in first?",
      authorName: "ZPSaver",
      replies: [
        { body: "Luna for S&D, no contest. Information wins rounds. Knowing where the enemies are is worth more than free grenades in competitive play.", authorName: "InfoIsPower" },
        { body: "I switched from Saki to Luna six months ago and my win rate in ranked went up noticeably. Luna is just in a different tier for information plays.", authorName: "DataDriven" }
      ]
    }
  ],
  events: [
    {
      title: "Esports World Cup 2026 — group stage discussion",
      body: "The EWC 2026 qualifier results are in and the group stage is shaping up to be intense. Saudi Arabia's local teams are looking strong on home ground. Who do you think makes it out of Group B? My money is on the Korean squad — they looked dominant in scrims.",
      authorName: "ESportsFan",
      replies: [
        { body: "Korean teams have historically dominated international LAN events. The adaptation speed is insane. If the Saudi teams make Top 4 that would already be a major upset.", authorName: "CFAnalyst" },
        { body: "Never underestimate the Brazilian teams this year. They've been grinding the new meta since January and their aim is just different.", authorName: "LATAM_Fan" }
      ]
    },
    {
      title: "CF Event Pass Season 7 — worth it or skip?",
      body: "Season 7 event pass dropped and I'm trying to decide if the reward track is worth the ZP investment. Anyone who completed season 6 — did you feel it was worth it? The new M4A1-S skin in this season's pass looks clean.",
      authorName: "PassDecision",
      replies: [
        { body: "Season 6 was definitely worth it if you played 4+ days a week. The daily missions are light (15-20 mins each) and the final reward weapon is usually the best skin they release all year.", authorName: "PassVet" },
        { body: "The value is there mathematically if you'd buy any of the rewards separately. Do the ZP math on cost vs individual item prices.", authorName: "ValueCalc" }
      ]
    },
    {
      title: "Global Challenge 2026 — predictions and dark horses",
      body: "The Global Challenge is coming up in December and the format has changed this year — now a 32-team bracket instead of 16. Which regions do you think will surprise? And who's your dark horse pick for the whole event?",
      authorName: "TourneyNerd",
      replies: [
        { body: "Dark horse: Vietnam. They've been quietly grinding the regional circuit for two years and nobody outside Asia is prepared for their aggressive push style.", authorName: "SEA_Scout" },
        { body: "The expanded bracket should give Middle East teams more exposure. CF is huge there and I expect at least 2 regional teams to reach the quarterfinals.", authorName: "RegionalRep" }
      ]
    }
  ],
  help: [
    {
      title: "Can't connect to servers — error code 10054",
      body: "Getting error 10054 every time I try to connect to any server. This started after the latest patch update. I've tried restarting, verifying files, and reinstalling. Still happening. Anyone else experiencing this?",
      authorName: "ConnectionIssue",
      replies: [
        { body: "Error 10054 is usually a network forceful disconnect — often your ISP or router. Try disabling your firewall temporarily to test. If it fixes it, add a CF exception rule.", authorName: "NetworkGuru" },
        { body: "Also check if your antivirus is flagging the update files. Some AV software quarantines game files after patches without telling you.", authorName: "TechSupport" }
      ]
    },
    {
      title: "How to report a hacker properly — step by step",
      body: "I see a lot of posts about hackers but people complain without reporting them properly. Here's the correct process: 1. Note the player's exact username. 2. Save the match replay in your client. 3. Go to z8games.com/support and submit a Report Player ticket with the replay attached. 4. Include the match ID from the scoreboard.",
      authorName: "CommunityHelper",
      replies: [
        { body: "You can also report directly from the scoreboard in-game by right-clicking the player's name. Faster for obvious hackers.", authorName: "QuickReport" },
        { body: "Thank you for posting this. The in-game report alone is often not enough — the support ticket with replay evidence gets actual bans.", authorName: "SupportInfo" }
      ]
    },
    {
      title: "Account suspended — how to appeal?",
      body: "Logged in today and my account shows as suspended. I haven't done anything against the rules. Never hacked, never bought accounts. My account has a lot of ZP items on it. How do I properly appeal this and who do I contact?",
      authorName: "WronglyBanned",
      replies: [
        { body: "Submit a ban appeal at support.z8games.com immediately. Include your account email, username, and any purchase receipts you have. The team usually reviews within 3-5 business days.", authorName: "AppealHelper" },
        { body: "Sometimes accounts get caught in false positive waves after anti-cheat updates. Keep your receipts and be patient — wrongful bans do get reversed.", authorName: "BanExpert" }
      ]
    }
  ]
};

async function seed() {
  console.log("Starting forum seed via REST API...");
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  
  // Fetch categories
  const cats = await supaGet('forum_categories', '?select=id,slug&order=sort_order.asc');
  console.log(`Found ${cats.length} categories: ${cats.map(c => c.slug).join(', ')}`);
  
  if (cats.length === 0) {
    console.error("No categories found. Run the forum setup SQL first.");
    process.exit(1);
  }

  // Clear existing data
  console.log("Clearing existing threads and posts...");
  try {
    await supaDelete('forum_posts', 'id=neq.00000000-0000-0000-0000-000000000000');
    await supaDelete('forum_threads', 'id=neq.00000000-0000-0000-0000-000000000000');
    console.log("Cleared.");
  } catch (e) {
    console.log("Clear note:", e.message);
  }

  let threadTotal = 0, postTotal = 0;

  for (const cat of cats) {
    const threads = FORUM_DATA[cat.slug];
    if (!threads) { console.log(`No data for: ${cat.slug}`); continue; }
    console.log(`\nSeeding ${threads.length} threads for: ${cat.slug}`);

    for (const td of threads) {
      const daysAgo = Math.floor(Math.random() * 120);
      const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

      let threadRows;
      try {
        threadRows = await supaPost('forum_threads', {
          category_id: cat.id,
          title: td.title,
          body: td.body,
          author_name: td.authorName,
          reply_count: td.replies?.length || 0,
          view_count: Math.floor(Math.random() * 800) + 50,
          last_reply_at: createdAt,
          created_at: createdAt,
          is_pinned: false,
          is_locked: false,
        });
      } catch (e) {
        console.error("  Thread error:", e.message); continue;
      }

      const thread = Array.isArray(threadRows) ? threadRows[0] : threadRows;
      threadTotal++;
      console.log(`  + "${td.title.slice(0, 55)}"`);

      // OP post
      try {
        await supaPost('forum_posts', {
          thread_id: thread.id, body: td.body,
          author_name: td.authorName, is_op: true, created_at: createdAt,
        });
      } catch (e) { /* ignore */ }

      // Replies
      for (let i = 0; i < (td.replies || []).length; i++) {
        const r = td.replies[i];
        const replyAt = new Date(new Date(createdAt).getTime() + (i + 1) * 3600000 * (1 + Math.random() * 24)).toISOString();
        try {
          await supaPost('forum_posts', {
            thread_id: thread.id, body: r.body,
            author_name: r.authorName, is_op: false, created_at: replyAt,
          });
          postTotal++;
          // Update last_reply_at
          await supaPatch('forum_threads', `id=eq.${thread.id}`, { last_reply_at: replyAt });
        } catch (e) { /* ignore */ }
      }
    }

    // Update category counts
    const totalPostsForCat = threads.reduce((s, t) => s + (t.replies?.length || 0), 0);
    try {
      await supaPatch('forum_categories', `id=eq.${cat.id}`, {
        thread_count: threads.length,
        post_count: totalPostsForCat
      });
    } catch (e) { /* ignore */ }
  }

  console.log(`\n✓ Done: ${threadTotal} threads, ${postTotal} posts seeded.`);
}

seed().catch(err => { console.error("Seed failed:", err); process.exit(1); });
