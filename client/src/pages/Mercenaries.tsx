import { useQuery } from "@tanstack/react-query";
import { getMercenaries } from "@/lib/supabaseApi";
import { useLanguage } from "@/components/LanguageProvider";
import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, Grid3x3, Zap, StopCircle } from "lucide-react";
import PageSEO from "@/components/PageSEO";

interface Mercenary {
  id: string;
  name: string;
  image: string;
  role: string;
  description?: string;
  voiceLines?: string[];
}

const mercenaryImageByName: Record<string, string> = {
  wolf: "https://files.catbox.moe/6npa73.jpeg",
  vipers: "https://files.catbox.moe/4il6hi.jpeg",
  viper: "https://files.catbox.moe/4il6hi.jpeg",
  sisterhood: "https://files.catbox.moe/3o58nb.jpeg",
  "black mamba": "https://files.catbox.moe/r26ox6.jpeg",
  "arch honorary": "https://files.catbox.moe/ctwnqz.jpeg",
  desperado: "https://files.catbox.moe/hh7h5u.jpeg",
  ronin: "https://files.catbox.moe/eck3jc.jpeg",
  dean: "https://files.catbox.moe/t78mvu.jpeg",
  thoth: "https://files.catbox.moe/g4zfzn.jpeg",
  sfg: "https://files.catbox.moe/3bba2g.jpeg",
  // Additional VIP characters
  xenon: "https://files.catbox.moe/6npa73.jpeg",
  "gm xenon": "https://files.catbox.moe/6npa73.jpeg",
  harrier: "https://files.catbox.moe/eck3jc.jpeg",
  phoenix: "https://files.catbox.moe/hh7h5u.jpeg",
  specter: "https://files.catbox.moe/ctwnqz.jpeg",
  shadow: "https://files.catbox.moe/r26ox6.jpeg",
  reaper: "https://files.catbox.moe/3bba2g.jpeg",
  storm: "https://files.catbox.moe/g4zfzn.jpeg",
  nova: "https://files.catbox.moe/4il6hi.jpeg",
  ranger: "https://files.catbox.moe/3o58nb.jpeg",
  blaze: "https://files.catbox.moe/6npa73.jpeg",
  titan: "https://files.catbox.moe/hh7h5u.jpeg",
};

// Local voice lines from merc-mp3 folder (served via /merc-voices/)
const LOCAL_VOICE_LINES: Record<string, string[]> = {
  dean: ["/merc-voices/dean.mp3"],
  sisterhood: ["/merc-voices/sisterhood.mp3"],
  "black mamba": ["/merc-voices/black-mamba.mp3"],
  vipers: ["/merc-voices/vipers.mp3"],
  viper: ["/merc-voices/vipers.mp3"],
  crusherz: ["/merc-voices/crusherz.mp3"],
  gigi: ["/merc-voices/gigi.mp3", "/merc-voices/valoria.mp3", "/merc-voices/arabella.mp3"],
  valoria: ["/merc-voices/valoria.mp3", "/merc-voices/gigi.mp3"],
  arabella: ["/merc-voices/arabella.mp3", "/merc-voices/gigi.mp3"],
  "subject alpha": ["/merc-voices/subject-alpha.mp3"],
  ghost: ["/merc-voices/ghost.mp3"],
};

function getMercVoiceLines(merc: Mercenary): string[] {
  // 1. If Supabase already has voice lines, use those
  if (merc.voiceLines && merc.voiceLines.length > 0) return merc.voiceLines;
  // 2. Fall back to local mp3 files by name
  const key = String(merc.name || "").toLowerCase().trim();
  return LOCAL_VOICE_LINES[key] || [];
}

// VIP character ability data (frontend-side, shown in modal)
const VIP_DATA: Record<string, { ability: string; abilityAr: string; descAr: string }> = {
  wolf: {
    ability: "Shadow Step",
    abilityAr: "خطوة الظل",
    descAr: "ضابط قوات خاصة بريطانية ومتخصص في العمليات السرية. قدرته الخارقة في التسلل بتخليه يتحرك بدون ما يعمل أي صوت — يظهر ويختفي زي الوهم. لو حسيت إن في حاجة بتتحرك في الضلمة.. على الأغلب هو.",
  },
  vipers: {
    ability: "Cobra Rush",
    abilityAr: "هجمة الكوبرا",
    descAr: "فريق نسائي نخبة من الكوماندو الأمريكي. بيشتغلوا كفريق واحد وسرعتهم في التغلغل مش ليها مثيل — لو شفتيهم، الوقت بيبقى فات. هجمتهم مفاجئة وسريعة زي الكوبرا بالظبط.",
  },
  viper: {
    ability: "Cobra Rush",
    abilityAr: "هجمة الكوبرا",
    descAr: "فريق نسائي نخبة من الكوماندو الأمريكي. بيشتغلوا كفريق واحد وسرعتهم في التغلغل مش ليها مثيل — خطوة واحدة غلط وخلصت.",
  },
  sisterhood: {
    ability: "Iron Bond",
    abilityAr: "رابطة الحديد",
    descAr: "مجموعة محاربات متخصصات في الحرب الإلكترونية والتكتيك الميداني. قوتهم في التعاون — لما بيكونوا مع بعض، بيبقوا أقوى من أي فريق تاني. الرابط بينهم أقوى من الحديد نفسه.",
  },
  "black mamba": {
    ability: "Lethal Precision",
    abilityAr: "دقة قاتلة",
    descAr: "قناص محترف مشهور بدقة تصويبه الخارقة. بيقدر يصيب أهداف على مسافات بعيدة جداً من غير ما يُحس بيه حد — طلقة واحدة، نتيجة واحدة. مفيش مكان تهرب فيه لما بيحدد هدفه.",
  },
  "arch honorary": {
    ability: "Battle Hardened",
    abilityAr: "مُصلَّب بالمعارك",
    descAr: "محارب محترف عنده خبرة واسعة في ميادين الحرب من حول العالم. جسمه اتعوّد على الضرب — بيتحمل أكتر من أي جندي عادي. المعارك اللي اتعوم فيها خلّته الأصعب في الميدان.",
  },
  desperado: {
    ability: "Wild Card",
    abilityAr: "الورقة المجهولة",
    descAr: "محارب شرير خبير في القتال الميداني — مش بيتبع قواعد ومش بيتوقع أحد حركته. هجماته مفاجئة ومحسوبش على أي حسابات. لو فكرت إنك عرفت خطته، معناه إنه غيّرها.",
  },
  ronin: {
    ability: "Blade Mastery",
    abilityAr: "إتقان السيف",
    descAr: "سامورائي ياباني قديم انقطع صلته بسيده. متخصص في القتال بالسلاح الأبيض والسكين — سريع وميت في نفس الوقت. السيف في إيده مش بس سلاح، ده جزء منه.",
  },
  dean: {
    ability: "Tactical Intel",
    abilityAr: "الذكاء التكتيكي",
    descAr: "عميل SIA نخبة مدرب على أعلى مستوى. متخصص في جمع المعلومات الاستخباراتية والتخطيط للعمليات السرية — دايماً خطوة قدام الخصم. مش بيتحرك غير لما بيبقى عنده الصورة كاملة.",
  },
  thoth: {
    ability: "Ancient Wisdom",
    abilityAr: "حكمة الأجداد",
    descAr: "مقاتل مصري مستلهم من الإله ثوت. عنده معرفة واسعة بالأسلحة القديمة والحديثة — هجماته محسوبة وذكية زي الألغاز المعمارية. حكمة آلاف السنين في جسم مقاتل واحد.",
  },
  sfg: {
    ability: "Coordinated Strike",
    abilityAr: "الضربة المنسقة",
    descAr: "مجموعة القوات الخاصة — فريق منسق بيشتغل كوحدة واحدة. قوتهم في التناسق الكامل وتنفيذ الخطط الهجومية بدقة جراحية. لما بيهاجموا، المكان بيخلص في ثواني.",
  },
  ghost: {
    ability: "Phantom Step",
    abilityAr: "خطوة الشبح",
    descAr: "مشغّل سري خبير في التخفي الكامل. بيقدر يتحرك بين الأعداء بدون ما يُلفت أي انتباه — تشوفه لما يكون خلصك. شبح حقيقي، موجود بس مش واضح.",
  },
  gigi: {
    ability: "Rapid Deploy",
    abilityAr: "النشر الفوري",
    descAr: "مقاتلة متخصصة في العمليات الميدانية وجمع المعلومات السريعة. خفيفة الحركة وذكية في التعامل مع المواقف الصعبة. بتوصل للهدف قبل ما أي حد يحس بيها.",
  },
  valoria: {
    ability: "Command Presence",
    abilityAr: "حضور القيادة",
    descAr: "ضابطة نخبة من وحدات التدخل السريع. معروفة بقدرتها الاستثنائية على قيادة الفريق تحت أشد ظروف الضغط. لما بتتكلم، الكل بيسمع ومفيش حد بيتأخر.",
  },
  arabella: {
    ability: "Shadow Infiltrate",
    abilityAr: "التسلل الخفي",
    descAr: "عميلة مزدوجة خبيرة في الاستخبارات والتجسس. بتستخدم ذكاءها الحاد قبل القوة في كل مهمة — الأخطر مش دايماً الأعلى صوتاً. ادخلت ألف مكان وطلعت من غير ما حد يحس.",
  },
  "subject alpha": {
    ability: "Enhanced Reflexes",
    abilityAr: "ردود أفعال محسّنة",
    descAr: "جندي تجريبي خضع لتحسينات بيولوجية متقدمة. قدراته الجسدية فوق الطبيعية بتخليه تهديد من مستوى آخر — مش إنسان عادي. التجارب اللي اتعمل عليها خلّته أسرع وأقوى من أي جندي تاني.",
  },
  crusherz: {
    ability: "Brute Force",
    abilityAr: "القوة الغاشمة",
    descAr: "جندي هجوم ثقيل متخصص في اقتحام المواقع المحصنة. قوته الجسدية الهائلة مش لها حدود — ما في باب بيصمد قدامه. لو شافك هيقرب، الأفضل تجري.",
  },
  // ─── New VIP Characters ───────────────────────────────────────────────────
  xenon: {
    ability: "Gamma Surge",
    abilityAr: "موجة جاما",
    descAr: "GM Xenon هو واحد من أقوى العملاء المعيّنين رسميًا من إدارة SIA. بيطلع في اللحظات الحاسمة ومش بيكسر الصمت غير لما الأمر يستحق — لما بيظهر، الميدان بيتغير. طاقته الخارقة مصدرها تدريب سري على أعلى مستوى.",
  },
  "gm xenon": {
    ability: "Gamma Surge",
    abilityAr: "موجة جاما",
    descAr: "GM Xenon هو واحد من أقوى العملاء المعيّنين رسميًا من إدارة SIA. بيطلع في اللحظات الحاسمة ومش بيكسر الصمت غير لما الأمر يستحق — لما بيظهر، الميدان بيتغير. طاقته الخارقة مصدرها تدريب سري على أعلى مستوى.",
  },
  harrier: {
    ability: "Aerial Assault",
    abilityAr: "الهجوم الجوي",
    descAr: "هاريير هو مقاتل جوي نخبة متدرب على العمليات السريعة من الأعلى للأسفل. بيضرب زي الصقر — فجأة، من فوق، وبدقة مش طبيعية. لما بيهاجم، الدنيا بتقف لثانية.",
  },
  phoenix: {
    ability: "Rebirth Protocol",
    abilityAr: "بروتوكول البعث",
    descAr: "فينيكس كاراكتر أسطوري في الساحة — الزملا بيسموه 'العقاب الرسمي'. بيتجدد في كل معركة ويرجع أقوى من اللي راح. مش بتوقعه يوقف وإنت بتضربه، لأنه بيرجع أقوى.",
  },
  specter: {
    ability: "Ghost Cloak",
    abilityAr: "عباءة الشبح",
    descAr: "سبيكتر عميل من الدرجة الأولى متخصص في الاختفاء الكامل خلال المهمات. مش بيتكلم كتير، بس لما بيتحرك بتحسه من الاهتزاز. أهدافه بيختفوا زيه بالظبط.",
  },
  shadow: {
    ability: "Dark Shroud",
    abilityAr: "ستار الظلام",
    descAr: "شادو ماجناس — خبير الاستخبارات اللي اتعوّد على العمل في الظلام الكامل. مفيش معلومة بتفوته ومفيش مكان بيصعب عليه. الظلام بالنسباله مش تهديد، ده أدواته.",
  },
  reaper: {
    ability: "Final Strike",
    abilityAr: "الضربة الأخيرة",
    descAr: "ريبر هو الوجه المرعب للإنهاء — متخصص في التصفية النهائية والعمليات اللي محدش بيرجع منها. ضربته الأخيرة مش بس قوية، دي حكم نهائي. الاسم بيقول كل حاجة.",
  },
  storm: {
    ability: "Thunder Rush",
    abilityAr: "هجمة الرعد",
    descAr: "ستورم هو مقاتل الخطوط الأمامية اللي بيجي زي العاصفة — سريع، مدمّر، ومفيش حاجة بتوقفه. بيكسر الخطوط ويفتح الطريق للفريق. لما بيهجم، الكل بيهرب أو يتأثر.",
  },
  nova: {
    ability: "Stellar Burst",
    abilityAr: "انفجار نجمي",
    descAr: "نوفا هو أحدث العملاء المنضمين لقوات النخبة — مش شهير بس خطير جداً. طاقته الانفجارية بتخلي المنطقة كلها حول الهدف في خطر. جديد على الساحة بس بيبقى الأقوى في الميدان.",
  },
  ranger: {
    ability: "Long Range Mastery",
    abilityAr: "إتقان المدى البعيد",
    descAr: "رينجر هو سيد المسافة البعيدة — بيصوّب من حيث ما بتشوفوش وبيصيب بدقة مرعبة. بيحمي الفريق من بعيد ومش بيسمح لأي هدف يهرب من نطاق تصويبه. صاحبه في الميدان، عدوه يخبّا.",
  },
  blaze: {
    ability: "Inferno Charge",
    abilityAr: "شحنة الجحيم",
    descAr: "بليز هو مقاتل النيران والتدمير — كل حاجة بيلمسها بتتحول لنار. متخصص في تطهير المواقع بالنيران والتغطية الكثيفة. دخل معركة واحدة معاه وهتعرف ليه اسمه بليز.",
  },
  titan: {
    ability: "Unstoppable Force",
    abilityAr: "القوة التي لا تُوقف",
    descAr: "تيتان هو الأضخم والأثقل والأقوى في قوات النخبة — مش بيتوقف ومش بيحس بالخوف. بيمشي في وسط النار وبيحمي الفريق ويكسر الدفاعات. ما في حاجة بتوقفه لما بيقرر يتقدم.",
  },
};

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  assault: { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
  sniper: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa" },
  medic: { bg: "rgba(34,197,94,0.15)", color: "#4ade80" },
  scout: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24" },
  guardian: { bg: "rgba(139,92,246,0.15)", color: "#a78bfa" },
  engineer: { bg: "rgba(20,184,166,0.15)", color: "#2dd4bf" },
  samurai: { bg: "rgba(236,72,153,0.15)", color: "#f472b6" },
  specialist: { bg: "rgba(245,166,35,0.15)", color: "#f5a623" },
};

function getRoleStyle(role: string) {
  return ROLE_COLORS[role.toLowerCase()] || { bg: "rgba(156,163,175,0.12)", color: "#9ca3af" };
}

function resolveMercImage(merc: Mercenary) {
  const image = String((merc as any).image_url || merc.image || "").trim();
  if (/^https?:\/\//i.test(image)) return image;
  const key = String(merc.name || "").toLowerCase().trim();
  if (mercenaryImageByName[key]) return mercenaryImageByName[key];
  return mercenaryImageByName["wolf"];
}

export default function Mercenaries() {
  const { t } = useLanguage();
  const [playingMercId, setPlayingMercId] = useState<string | null>(null);
  const [layoutStyle, setLayoutStyle] = useState<"strip" | "grid">("grid");
  const [expandedMercId, setExpandedMercId] = useState<string | null>(null);
  const [selectedMerc, setSelectedMerc] = useState<Mercenary | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const lastSoundRef = useRef<{ [key: string]: string | null }>({});
  const [stopFlash, setStopFlash] = useState(false);

  const { data: rawMercenaries = [], isLoading } = useQuery<Mercenary[]>({
    queryKey: ["/api/mercenaries"],
    queryFn: getMercenaries,
  });

  // Augment with local voice lines
  const mercenaries: Mercenary[] = rawMercenaries.map((m) => ({
    ...m,
    voiceLines: getMercVoiceLines(m),
  }));

  const playRandomSound = (mercId: string, voiceLines?: string[]) => {
    if (!voiceLines || voiceLines.length === 0) return;
    let randomSound = voiceLines[Math.floor(Math.random() * voiceLines.length)];
    const last = lastSoundRef.current[mercId];
    if (voiceLines.length > 1 && last) {
      let attempts = 0;
      while (randomSound === last && attempts < 5) {
        randomSound = voiceLines[Math.floor(Math.random() * voiceLines.length)];
        attempts++;
      }
    }
    lastSoundRef.current[mercId] = randomSound;
    if (playingMercId && audioRefs.current[playingMercId]) {
      audioRefs.current[playingMercId].pause();
      audioRefs.current[playingMercId].currentTime = 0;
    }
    if (!audioRefs.current[mercId]) audioRefs.current[mercId] = new Audio();
    const audio = audioRefs.current[mercId];
    audio.src = randomSound;
    audio.play().catch((err) => console.error("Audio play error:", err));
    setPlayingMercId(mercId);
    audio.onended = () => setPlayingMercId(null);
  };

  const stopAllAudio = () => {
    try {
      Object.values(audioRefs.current).forEach((audio) => {
        try { audio.pause(); audio.currentTime = 0; } catch {}
      });
      setPlayingMercId(null);
      setStopFlash(true);
      setTimeout(() => setStopFlash(false), 250);
    } catch {}
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Space") {
        e.preventDefault();
        stopAllAudio();
        setSelectedMerc(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#f5a623] border-t-transparent animate-spin" />
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#555" }}>Loading Mercenaries...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageSEO
        title="CrossFire Mercenaries — Characters, Roles & Voice Lines | CrossFire Wiki"
        description="Browse all CrossFire mercenaries with roles, abilities, voice lines and detailed profiles. Discover Wolf, Sisterhood, Black Mamba, Desperado and more."
        image="https://z8games.akamaized.net/cfna/templates/assets/images/feature-cf-left.jpg"
        canonicalPath="/mercenaries"
      />

      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14">

          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
            <a href="/" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", cursor: "pointer", fontWeight: 600, textDecoration: "none" }}>Home</a>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>›</span>
            <span style={{ fontSize: 11, color: "#f5a623", fontWeight: 700 }}>Mercenaries</span>
          </div>

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: "#f5a623" }}>
                Elite Operators
              </p>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none" style={{ color: "var(--foreground)" }}>
                {t("mercenaries") || "Mercenaries"}
              </h1>
              <p className="text-sm mt-1.5" style={{ color: "#666" }}>
                {mercenaries.length} operatives — {layoutStyle === "grid" ? "click any card to view details" : "hover to preview, click to expand"}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <div className="flex rounded overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <button
                  onClick={() => setLayoutStyle("strip")}
                  title="Strip layout"
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all"
                  style={{ background: layoutStyle === "strip" ? "#f5a623" : "var(--card)", color: layoutStyle === "strip" ? "#000" : "#666" }}
                >
                  <Zap className="h-3 w-3" /> Strip
                </button>
                <button
                  onClick={() => setLayoutStyle("grid")}
                  title="Grid layout"
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all"
                  style={{ background: layoutStyle === "grid" ? "#f5a623" : "var(--card)", color: layoutStyle === "grid" ? "#000" : "#666", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <Grid3x3 className="h-3 w-3" /> Grid
                </button>
              </div>
              <button
                title="Stop all audio (Esc / Space)"
                onClick={stopAllAudio}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded transition-all"
                style={{ background: stopFlash ? "#ef4444" : "var(--card)", color: stopFlash ? "#fff" : "#666", border: `1px solid ${stopFlash ? "#ef4444" : "rgba(255,255,255,0.08)"}` }}
              >
                <StopCircle className="h-3.5 w-3.5" /> Mute All
              </button>
            </div>
          </div>

          {/* ── STRIP LAYOUT ── */}
          {layoutStyle === "strip" ? (
            <div
              className="flex overflow-x-auto w-full cf-merc-strip"
              style={{ height: "480px", background: "hsl(var(--background))", border: "1px solid rgba(245,166,35,0.12)", borderRadius: "4px" }}
            >
              {mercenaries.map((merc) => {
                const voiceLines = merc.voiceLines || [];
                const roleStyle = getRoleStyle(merc.role || "");
                const isExpanded = expandedMercId === merc.id;
                return (
                  <div
                    key={merc.id}
                    className="relative flex-shrink-0 overflow-hidden cursor-pointer transition-all duration-300 ease-out"
                    style={{ width: isExpanded ? "340px" : "88px", minWidth: isExpanded ? "340px" : "88px", borderRight: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={() => setExpandedMercId(merc.id)}
                    onMouseLeave={() => setExpandedMercId(null)}
                    onClick={() => setSelectedMerc(merc)}
                  >
                    <img
                      src={resolveMercImage(merc)}
                      alt={merc.name}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = mercenaryImageByName["wolf"]; }}
                      className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500"
                      style={{ transform: isExpanded ? "scale(1.05)" : "scale(1)" }}
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.1) 100%)" }} />
                    {isExpanded && <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, #f5a623, transparent)" }} />}

                    {!isExpanded && (
                      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center" style={{ transform: "rotate(-90deg) translateX(-30%)", transformOrigin: "center" }}>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: "rgba(255,255,255,0.6)" }}>{merc.name}</span>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="absolute inset-0 flex flex-col justify-end p-5 z-10">
                        <h3 className="text-white text-2xl font-black uppercase tracking-tight leading-tight mb-1">{merc.name}</h3>
                        {merc.description && (
                          <p className="text-[11px] leading-relaxed mb-3 line-clamp-2" style={{ color: "rgba(255,255,255,0.55)" }}>{merc.description}</p>
                        )}
                        {voiceLines.length > 0 ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); playRandomSound(merc.id, voiceLines); }}
                            className="flex items-center gap-2 w-full py-2.5 px-4 text-[10px] font-black uppercase tracking-widest transition-all hover:brightness-110"
                            style={{ background: playingMercId === merc.id ? "rgba(239,68,68,0.8)" : "rgba(245,166,35,0.9)", color: "#000", borderRadius: "2px" }}
                          >
                            {playingMercId === merc.id ? (
                              <><VolumeX className="h-3.5 w-3.5" /> Playing... ({voiceLines.length} lines)</>
                            ) : (
                              <><Volume2 className="h-3.5 w-3.5" /> Play Voice Line ({voiceLines.length})</>
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 py-2.5 px-4 text-[10px] font-bold uppercase tracking-widest" style={{ background: "rgba(255,255,255,0.05)", color: "#444", borderRadius: "2px" }}>
                            <VolumeX className="h-3.5 w-3.5" /> No voice lines
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── GRID LAYOUT ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {mercenaries.map((merc) => {
                const voiceLines = merc.voiceLines || [];
                const roleStyle = getRoleStyle(merc.role || "");
                return (
                  <div
                    key={merc.id}
                    className="group relative overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
                    style={{ borderRadius: "4px", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
                    onClick={() => setSelectedMerc(merc)}
                  >
                    <div className="aspect-[3/4] overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                      <img
                        src={resolveMercImage(merc)}
                        alt={merc.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = mercenaryImageByName["wolf"]; }}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 25%, transparent 65%)" }} />
                    <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "#f5a623" }} />

                    {voiceLines.length > 0 && (
                      <div className="absolute top-2.5 right-2.5">
                        <div className="flex items-center gap-1 px-1.5 py-0.5" style={{ background: "rgba(0,0,0,0.7)", borderRadius: "2px", border: "1px solid rgba(245,166,35,0.3)" }}>
                          <Volume2 className="h-2.5 w-2.5" style={{ color: "#f5a623" }} />
                          <span className="text-[8px] font-bold" style={{ color: "#f5a623" }}>{voiceLines.length}</span>
                        </div>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                      <h3 className="text-white font-black text-sm uppercase tracking-tight leading-tight">{merc.name}</h3>
                      {voiceLines.length > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); playRandomSound(merc.id, voiceLines); }}
                          className="w-full mt-2 py-1.5 text-[9px] font-black uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0"
                          style={{ background: playingMercId === merc.id ? "rgba(239,68,68,0.9)" : "rgba(245,166,35,0.9)", color: "#000", borderRadius: "2px" }}
                        >
                          {playingMercId === merc.id ? "Playing..." : "▶ Voice"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-10 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: "#222" }}>
              SIA • SPECIAL OPERATIVE DIVISION
            </p>
          </div>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selectedMerc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedMerc(null)}
        >
          <div
            className="relative max-w-md w-full overflow-hidden"
            style={{ background: "hsl(var(--card))", border: "1px solid rgba(245,166,35,0.25)", borderRadius: "4px", boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, #f5a623, transparent)" }} />
            <button
              onClick={() => setSelectedMerc(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded transition-colors hover:text-[#f5a623]"
              style={{ color: "#666", background: "rgba(0,0,0,0.5)" }}
            >
              ✕
            </button>
            <div className="relative h-72 overflow-hidden">
              <img src={resolveMercImage(selectedMerc)} alt={selectedMerc.name} className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #0d0d0d 0%, transparent 60%)" }} />
            </div>
            <div className="px-6 pb-6">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-1 mt-3">{selectedMerc.name}</h2>

              {/* VIP ability badge */}
              {(() => {
                const key = selectedMerc.name.toLowerCase().trim();
                const vip = VIP_DATA[key];
                return vip ? (
                  <div className="mb-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3" style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 3 }}>
                      <Zap className="h-3 w-3" style={{ color: "#f5a623" }} />
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#f5a623" }}>{vip.ability}</span>
                      <span className="text-[10px] font-bold mx-1" style={{ color: "#555" }}>·</span>
                      <span className="text-[11px] font-bold" style={{ color: "#f5a623", fontFamily: "'Noto Sans Arabic', sans-serif" }}>{vip.abilityAr}</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#888", fontFamily: "'Noto Sans Arabic', sans-serif", direction: "rtl" }}>{vip.descAr}</p>
                  </div>
                ) : selectedMerc.description ? (
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "#888" }}>{selectedMerc.description}</p>
                ) : null;
              })()}

              {/* Voice lines list */}
              {(() => {
                const vl = selectedMerc.voiceLines || [];
                return vl.length > 0 ? (
                  <div>
                    <button
                      onClick={() => playRandomSound(selectedMerc.id, vl)}
                      className="w-full flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-widest transition-all hover:brightness-110 mb-3"
                      style={{ background: playingMercId === selectedMerc.id ? "#ef4444" : "#f5a623", color: "#000", borderRadius: "2px" }}
                    >
                      {playingMercId === selectedMerc.id ? (
                        <><VolumeX className="h-4 w-4" /> Playing Voice Line...</>
                      ) : (
                        <><Volume2 className="h-4 w-4" /> Play Random Voice Line ({vl.length})</>
                      )}
                    </button>
                    {vl.length > 1 && (
                      <div className="flex flex-wrap gap-1.5">
                        {vl.map((line, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (!audioRefs.current[selectedMerc.id]) audioRefs.current[selectedMerc.id] = new Audio();
                              const audio = audioRefs.current[selectedMerc.id];
                              audio.src = line;
                              audio.play().catch(() => {});
                              setPlayingMercId(selectedMerc.id);
                              audio.onended = () => setPlayingMercId(null);
                            }}
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 transition-colors"
                            style={{ background: "rgba(245,166,35,0.12)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "2px" }}
                          >
                            Line {idx + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 py-3 px-4 text-[11px] font-bold uppercase tracking-widest" style={{ background: "rgba(255,255,255,0.04)", color: "#444", borderRadius: "2px" }}>
                    <VolumeX className="h-4 w-4" /> No voice lines available
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
