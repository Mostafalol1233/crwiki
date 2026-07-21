// Forum seeding script — inserts real CrossFire forum threads and posts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY
);

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
      body: "Does anyone know what the Master rank skin is for this season? I heard rumors it's going to be a custom M4A1-S but I haven't seen any leaks yet. Last season's rewards were kind of underwhelming so hoping for something big.",
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
        { body: "Check out 'VoidSquad'. We are looking for a dedicated sniper for our evening scrims. Message me in-game.", authorName: "ClanLeader_X" },
        { body: "Also check the clan recruitment subforum — there are usually 5-10 active recruitment posts per day.", authorName: "ForumMod" }
      ]
    },
    {
      title: "Hackers in Hero Mode are getting out of hand",
      body: "Just played three games in a row where someone was using speed hacks and flying above the map. Z8 really needs to update the anti-cheat. I've submitted 3 reports this week alone. Anyone else experiencing this?",
      authorName: "ZombieHunter",
      replies: [
        { body: "Make sure you record the replay and report them on the support site. It's the only way they actually get banned. Screenshots alone don't work.", authorName: "ModFan" },
        { body: "The anti-cheat is basically a suggestion at this point. Every major update breaks it for like two days then they're back.", authorName: "SaltMine" }
      ]
    },
    {
      title: "Favorite map for Search & Destroy in ranked?",
      body: "Black Widow is a classic, but I've been really enjoying Sub Base lately for ranked matches. The tight corridors reward good crossfire setups. What are you guys playing the most in S&D ranked?",
      authorName: "TacticalMind",
      replies: [
        { body: "Ankara is the best for tactical play. So many different ways to execute onto the B site, you can never get comfortable.", authorName: "StratGod" },
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
      title: "M4A1-S Iron Beast vs. Predator — which is better?",
      body: "I'm looking to buy my first VIP weapon and I've narrowed it down to these two. Which one is better for competitive play? I see a lot of pros using the Predator in tournament streams but the Iron Beast looks insane statistically.",
      authorName: "VIP_Newbie",
      replies: [
        { body: "Predator has better recoil control for spraying, but Iron Beast feels faster on the draw. Personally prefer the Predator for mid-range.", authorName: "GunExpert" },
        { body: "If you tap fire, Iron Beast is superior at distance. If you hold left-click all day, go with the Predator. Know your playstyle first.", authorName: "SprayAndPray" },
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
      title: "Best GP weapons for someone who can't buy ZP?",
      body: "I know the VIP stuff is insane but I genuinely can't spend real money. What's the best loadout I can build purely from the GP shop? Looking for S&D mainly.",
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
        { body: "For me it's M200 > Barrett > AWM. The M200's bullet velocity means you lead less at long range. Barrett is better for close-mid peek shots.", authorName: "CounterSniperPro" },
        { body: "SV98 is massively underrated. The bolt-cycle animation is faster than people think and it's basically free from events.", authorName: "SV98Gang" }
      ]
    },
    {
      title: "Does weapon paint/skin affect stats?",
      body: "Genuine question — I see some skins going for thousands of ZP in the Black Market. Do the painted versions of weapons have any stat difference from the base version, or is it purely cosmetic? Can't find a clear answer anywhere.",
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
        { body: "The mid container stack is amazing but watch out for smokes. Once the site is smoked you need to fall to the backup positions fast.", authorName: "AntiSmoke" }
      ]
    },
    {
      title: "How to properly eco round in Ghost Mode?",
      body: "My team keeps throwing eco rounds in Ghost Mode because they don't know when to save. What's the proper rule for eco vs force buy? And should you ever full save when down 10+ rounds?",
      authorName: "TeamLeader",
      replies: [
        { body: "Basic rule: if you can't afford a primary weapon + armor, save. Buying a pistol-only round into a full-buy team just throws the economy further.", authorName: "EcoMaster" },
        { body: "Full save when you're down 4+ in a row. The economy snowball is real and trying to force buy usually gives free kills and weapons to the other team.", authorName: "EconCoach" },
        { body: "Also communicate! Half the time eco rounds fail because one guy goes rogue and buys when everyone else is saving.", authorName: "CommsMatter" }
      ]
    },
    {
      title: "Countering AWP campers as a rifler — tips?",
      body: "I keep dying to the same AWP player holding the same angle every round on Black Widow. He barely moves and just picks off anyone who pushes. As a pure rifler with no ZP how do I counter this without getting my own AWP?",
      authorName: "Rifler2024",
      replies: [
        { body: "Flashbangs are your best friend here. A well-timed flash through the AWP's corner resets his scope and gives you a free 1-second window to cross or push.", authorName: "FlashKing" },
        { body: "Smoke grenades to block his sightline entirely. Force him to reposition and then push with a teammate from a different angle. Never contest an AWP in a straight duel.", authorName: "SmokeMaster" },
        { body: "Faking one side to make him move, then committing from the other side works well. AWP players hate committing to repositions mid-round.", authorName: "MindGames" }
      ]
    },
    {
      title: "Best mercenary ability combos for ranked?",
      body: "I've been running Saki (grenade refund) + standard loadout but I'm wondering if there are better ability combos for ranked S&D. What mercs do you guys pair together at the team level for maximum synergy?",
      authorName: "MercExplorer",
      replies: [
        { body: "Luna's vision ability paired with a teammate running a smoke kit is devastating. The flash deny plus info-gathering makes it nearly impossible to push certain sites.", authorName: "AbilityGod" },
        { body: "For pure aggression: Saki for free grenades + any merc with fast movement ability. Set up early aggressive pushes before the enemy can set up crossfires.", authorName: "AggroMain" }
      ]
    },
    {
      title: "Effective use of grenades in S&D — a primer",
      body: "Stop throwing your HE grenades randomly at the start of the round! Save them for late-round situations when you know exactly where the enemy is hiding. The best HE throw is one that chips a player from 100 to 70 HP so your teammate can one-tap. Always think about the chip damage game.",
      authorName: "Grenadier",
      replies: [
        { body: "Actually, early nades can work on known rush routes — like the long alley on Port or the tunnel on Ankara. Chip damage on rushing enemies is super valuable early.", authorName: "DamageDealer" },
        { body: "Flashes are way more important than HE in coordinated play. A well-timed flash wins the site, a random HE just wastes a utility slot.", authorName: "FlashBang" }
      ]
    },
    {
      title: "Best settings for 144Hz monitors — resolution guide",
      body: "I just upgraded my monitor from 60Hz to 144Hz. Should I keep the game resolution at 800x600 for the 'classic' feel or go native 1080p? And what graphics settings actually affect performance vs. just being eye candy?",
      authorName: "RefreshRate",
      replies: [
        { body: "Stick with 800x600 or 1024x768. The character models appear wider (easier headshots) and the FPS boost is significant — you'll actually use that 144Hz.", authorName: "ProSettings" },
        { body: "Make sure you disable Vertical Sync in the Nvidia control panel or you won't actually see the 144Hz benefit. Also turn shadows to minimum — biggest FPS gain with no gameplay downside.", authorName: "TechSupport" }
      ]
    }
  ],
  mercenaries: [
    {
      title: "Complete mercenary tier list — June 2026 update",
      body: "After the June patch I've been testing all mercs in ranked. Here's my current tier list:\n\nS: Luna, Kyle\nA: Saki, Harpy\nB: Jina, Frank\nC: Alex, Suu\n\nLuna's vision buff made her the best info-gathering tool in the game. Kyle's armor passive is still broken in Wave Mode. Discuss.",
      authorName: "MercEnthusiast",
      replies: [
        { body: "Kyle is SS tier in Wave Mode and A tier in S&D. His armor passive completely changes the survivability math in long rounds.", authorName: "WaveKing" },
        { body: "I'd move Harpy up to S for S&D specifically. The ability cooldown nerf people are worried about barely matters if you use it right.", authorName: "HarpyMain" },
        { body: "Saki deserves A+ at minimum. The grenade refund mechanic is one of the strongest utility abilities in the game — free HE every 3 rounds.", authorName: "SakiFan" }
      ]
    },
    {
      title: "How to unlock mercenaries without spending ZP?",
      body: "I want to try out different mercs but they're all ZP-locked. Are there any ways to get them through events, GP, or the mission system? I've heard some rotate through GP shop occasionally.",
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
        { body: "Luna for S&D, no contest. Information wins rounds. Knowing where the enemies are is worth more than free grenades.", authorName: "InfoIsPower" },
        { body: "I switched from Saki to Luna six months ago and my win rate in ranked went up 8%. Not scientific but that's my experience.", authorName: "DataDriven" }
      ]
    }
  ],
  events: [
    {
      title: "Esports World Cup 2026 — match discussion thread",
      body: "The EWC 2026 qualifier results are in and the group stage is shaping up to be intense. Saudi Arabia's local teams are looking strong on home ground. Who do you think makes it out of Group B? My money is on the Korean squad — they looked dominant in scrims.",
      authorName: "ESportsFan",
      replies: [
        { body: "Korean teams have historically dominated international LAN events. The adaptation speed is insane. If the Saudi teams make Top 4 that would already be a major upset.", authorName: "CFFanalyst" },
        { body: "Never underestimate the Brazilian teams this year. They've been grinding the new meta since the January update and their aim is just different.", authorName: "LATAM_Fan" }
      ]
    },
    {
      title: "CF Event Pass Season 7 — is it worth it?",
      body: "Season 7 event pass dropped and I'm trying to decide if the reward track is worth the ZP investment. Anyone who completed season 6 — did you feel it was worth it? The new M4A1-S skin in this season's pass looks clean.",
      authorName: "PassDecision",
      replies: [
        { body: "Season 6 was definitely worth it if you played 4+ days a week. The daily missions are light (15-20 mins each) and the final reward weapon is usually the best skin they release all year.", authorName: "PassVet" },
        { body: "The value is there mathematically if you'd buy any of the rewards separately. Do the math on ZP cost vs individual item prices.", authorName: "ValueCalc" }
      ]
    },
    {
      title: "Global Challenge 2026 — predictions thread",
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
        { body: "Error 10054 is usually a network forceful disconnect — often your ISP or router. Try disabling your firewall temporarily to test. If it fixes it, add a CF exception.", authorName: "NetworkGuru" },
        { body: "Also check if your antivirus is flagging the update files. Some AV software quarantines game files after patches.", authorName: "TechSupport" }
      ]
    },
    {
      title: "How to report a hacker properly — step by step",
      body: "I see a lot of posts about hackers but people complain without reporting them properly. Here's the correct process: 1. Note the player's exact username. 2. Save the match replay in your client. 3. Go to z8games.com/support and submit a 'Report Player' ticket with the replay attached. 4. Include match ID from the scoreboard.",
      authorName: "CommunityHelper",
      replies: [
        { body: "Adding to this — you can also report directly from the scoreboard in-game by right-clicking the player's name. Faster for obvious hackers.", authorName: "QuickReport" },
        { body: "Thank you for posting this. The in-game report alone is often not enough — the support ticket with replay evidence gets actual bans.", authorName: "SupportTeam" }
      ]
    },
    {
      title: "Account banned for no reason — what to do?",
      body: "Logged in today and my account is banned. I haven't done anything against the rules. Never hacked, never bought accounts, nothing. My account has $300+ worth of ZP items on it. How do I appeal this?",
      authorName: "WronglyBanned",
      replies: [
        { body: "Submit a ban appeal at support.z8games.com immediately. Include your account email, username, and any purchase receipts you have. The team usually reviews within 3-5 business days.", authorName: "AppealHelper" },
        { body: "Sometimes accounts get caught in false positive waves after anti-cheat updates. Keep your receipts and be patient — wrongful bans do get reversed.", authorName: "BanExpert" }
      ]
    }
  ]
};

async function seed() {
  console.log("Fetching forum categories...");
  const { data: cats, error: catErr } = await supabase
    .from('forum_categories')
    .select('id, slug');
  
  if (catErr) {
    console.error("Error fetching categories:", catErr.message);
    process.exit(1);
  }
  
  if (!cats || cats.length === 0) {
    console.error("No categories found. Run the forum setup SQL first.");
    process.exit(1);
  }
  
  console.log(`Found ${cats.length} categories: ${cats.map(c => c.slug).join(', ')}`);

  // Clear existing threads and posts
  console.log("Clearing existing forum threads and posts...");
  await supabase.from('forum_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('forum_threads').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  let threadTotal = 0;
  let postTotal = 0;

  for (const cat of cats) {
    const threads = FORUM_DATA[cat.slug];
    if (!threads) {
      console.log(`No data for category: ${cat.slug}`);
      continue;
    }
    
    console.log(`\nSeeding ${threads.length} threads for: ${cat.slug}`);
    
    for (const threadData of threads) {
      // Spread created_at over last few months for realistic timestamps
      const daysAgo = Math.floor(Math.random() * 120);
      const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
      
      const { data: thread, error: tErr } = await supabase
        .from('forum_threads')
        .insert([{
          category_id: cat.id,
          title: threadData.title,
          body: threadData.body,
          author_name: threadData.authorName,
          reply_count: threadData.replies?.length || 0,
          view_count: Math.floor(Math.random() * 800) + 50,
          last_reply_at: createdAt,
          created_at: createdAt,
          is_pinned: false,
          is_locked: false,
        }])
        .select()
        .single();
      
      if (tErr) {
        console.error(`  Thread insert error: ${tErr.message}`);
        continue;
      }
      
      threadTotal++;
      console.log(`  + Thread: "${threadData.title.slice(0, 50)}"`);

      // Insert OP post
      await supabase.from('forum_posts').insert([{
        thread_id: thread.id,
        body: threadData.body,
        author_name: threadData.authorName,
        is_op: true,
        created_at: createdAt,
      }]);

      // Insert replies
      for (let i = 0; i < (threadData.replies || []).length; i++) {
        const reply = threadData.replies[i];
        const replyAt = new Date(new Date(createdAt).getTime() + (i + 1) * 3600000 * (1 + Math.random() * 24)).toISOString();
        
        const { error: rErr } = await supabase.from('forum_posts').insert([{
          thread_id: thread.id,
          body: reply.body,
          author_name: reply.authorName,
          is_op: false,
          created_at: replyAt,
        }]);
        
        if (!rErr) {
          postTotal++;
          // Update thread last_reply_at
          await supabase.from('forum_threads').update({ last_reply_at: replyAt }).eq('id', thread.id);
        }
      }
    }
    
    // Update category counts
    const totalPosts = threads.reduce((s, t) => s + (t.replies?.length || 0), 0);
    await supabase.from('forum_categories').update({
      thread_count: threads.length,
      post_count: totalPosts
    }).eq('id', cat.id);
  }
  
  console.log(`\n✓ Seeding complete: ${threadTotal} threads, ${postTotal} posts inserted.`);
}

seed().catch(console.error);
