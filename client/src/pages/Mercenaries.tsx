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
  vipers: {
    ability: "Cobra Rush",
    abilityAr: "هجمة الكوبرا",
    descAr: "فريق نسائي نخبة من الكوماندو الأمريكي. بيشتغلوا كفريق واحد وسرعتهم في التغلغل مش ليها مثيل — لو شفتيهم، الوقت بيبقى فات. هجمتهم مفاجئة وسريعة زي الكوبرا بالظبط.",
  },
  dean: {
    ability: "Tactical Intel",
    abilityAr: "الذكاء التكتيكي",
    descAr: "عميل SIA نخبة مدرب على أعلى مستوى. متخصص في جمع المعلومات الاستخباراتية والتخطيط للعمليات السرية — دايماً خطوة قدام الخصم. مش بيتحرك غير لما بيبقى عنده الصورة كاملة.",
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
  arabella: {
    ability: "Shadow Infiltrate",
    abilityAr: "التسلل الخفي",
    descAr: "عميلة مزدوجة خبيرة في الاستخبارات والتجسس. بتستخدم ذكاءها الحاد قبل القوة في كل مهمة — الأخطر مش دايماً الأعلى صوتاً. ادخلت ألف مكان وطلعت من غير ما حد يحس.",
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
  verdandi: {
    ability: "Scorched Earth",
    abilityAr: "الأرض المحروقة",
    descAr: "في الزومبي بتشغل رشاشين وبتضرب طلقة متفجرة بعد عدد معين من الذخيرة، مع هيل وتقليل ضرر وذخيرة لا نهائية للفريق. ومعاها لكمة Smash السريعة و200% EXP. شخصية VIP رسمية في الغرب.",
  },
  melody: {
    ability: "VIP Character",
    abilityAr: "شخصية VIP",
    descAr: "محبوبة فريق Heart Shot — مرحة وبتضحك بس غدارتها قاتلة: لو غفلت عنها ثانية بتديك ضربة قلبية قبل ما تفهم حاجة. شخصية VIP رسمية في نسخة الغرب.",
  },
  paola: {
    ability: "VIP Character",
    abilityAr: "شخصية VIP",
    descAr: "مرتزقة خطيرة كسبت سمعتها في الشوارع وطلعت الرتب بدراعها. شخصية VIP رسمية في نسخة الغرب.",
  },
  roxy: {
    ability: "VIP Character",
    abilityAr: "شخصية VIP",
    descAr: "مجموعة مرتزقة أنيقة بالتاتو — مش بس شكل، ثقتهم بنفسهم بتسيطر على الميدان وبتوتر اللي قدامهم. شخصية VIP رسمية في نسخة الغرب.",
  },
  aceson: {
    ability: "VIP Character",
    abilityAr: "شخصية VIP",
    descAr: "مرتزق متنكر في صورة لاعب esports محترف — البطولات غطاء وهو بيدير العمليات بدقة تكتيكية في المنافسة والمعركة. شخصية VIP رسمية في نسخة الغرب.",
  },
  trinity: {
    ability: "VIP Character",
    abilityAr: "شخصية VIP",
    descAr: "عضوة مجموعة Trinity النخبة — شخصية VIP رسمية في نسخة الغرب من اللعبة.",
  },
  "trinity-veteran": {
    ability: "VIP Character",
    abilityAr: "شخصية VIP",
    descAr: "نسخة المحاربة القديمة من مجموعة Trinity — خبرة ميدانية أعلى وشخصية VIP رسمية في نسخة الغرب.",
  },
  titan: {
    ability: "Unstoppable Force",
    abilityAr: "القوة التي لا تُوقف",
    descAr: "تيتان هو الأضخم والأثقل والأقوى في قوات النخبة — مش بيتوقف ومش بيحس بالخوف. بيمشي في وسط النار وبيحمي الفريق ويكسر الدفاعات. ما في حاجة بتوقفه لما بيقرر يتقدم.",
  },
  // ─── West VIP Characters (real skills from CrossFire) ─────────────────────
  viper: {
    ability: "Furious Kick",
    abilityAr: "الركلة الغاضبة",
    descAr: "أول شخصيات VIP في كروس فاير — 3 أخوات (هجوم ودفاع وطور الزومبي). ركلتها الغاضبة بزر E بتطير اللي قدامها، ومعاها سكاكين رمي وسرعة حركة أعلى في الزومبي والميوتنت، ده غير 200% EXP ليها. (الاسم الأصلي: The Fates)",
  },
  switcher: {
    ability: "Throwing Knife",
    abilityAr: "السكاكين الطائرة",
    descAr: "متخصصة السكاكين — بترمي 3 سكاكين في 3 اتجاهات مرة واحدة في الزومبي والميوتنت. ده غير تقليل ضرر الوقوع والمناعة ضد قنابل الفريق. في الغرب بتتجاب بحوالي 80,000 ZP.",
  },
  florence: {
    ability: "Dual Daphne Saber",
    abilityAr: "سيفا دافني",
    descAr: "ساحرة السيوف المزدوجة — بتطلع سيفين في الزومبي وموجاتها الصوتية بتعدي من الزومبي والبوس. ومهارة Bless بتعمل هيل لنفسها وذخيرة لا نهائية للفريق 10 ثواني. (الاسم الأصلي: Nymphs)",
  },
  dahlia: {
    ability: "Dash",
    abilityAr: "الاندفاع",
    descAr: "بتندفع لقدام 3 مرات ورا بعض بزر E في الزومبي — هروب أو هجوم مفاجئ. ومعاها هجوم الورود اللي بترميه على الأعداء، وتقليل ضرر الوقوع ومناعة قنابل الفريق. (الاسم الأصلي: Ultimatum)",
  },
  annie: {
    ability: "Hunter's Mark",
    abilityAr: "علامة الصياد",
    descAr: "صيادة الميوتانت — اللي تقتله بيتعلم عليه بعلامة حمرا باينة من ورا الحيطة وبياخد ضرر زيادة 10%. ومعاها Energy Blast في الزومبي وسكاكين رمي. (الاسم الأصلي: Desperado)",
  },
  seraphina: {
    ability: "Angelic / Demonic Awakening",
    abilityAr: "استيقاظ الملاك والشيطان",
    descAr: "شخصية Infinity — بتتحول بين هيئة الملاك (هيل 50 لكل الفريق) وهيئة الشيطان (انفجار شامل بيدمر كل حاجة وفرصة قتل فوري). ومعاها Bless و300% EXP. من أقوى شخصيات الزومبي. (الاسم الأصلي: Roxana)",
  },
  jessie: {
    ability: "Wild Shot Awakening",
    abilityAr: "الطلقة البرية",
    descAr: "راعية البقر — في الزومبي بتلف مسدساتها وتضرب وهي بتتحرك وبترمي قنابل متفجرة، مع هيل وذخيرة لا نهائية للفريق. وفي البحث والتدمير بتزرع C4-Dynamite أسرع وبتعرف توقيت انفجاره بالظبط. (الاسم الأصلي: Gunslinger)",
  },
  "esports yun": {
    ability: "Furious Kick",
    abilityAr: "الركلة الغاضبة",
    descAr: "شخصية بطولات الرياضات الإلكترونية — ركلتها الغاضبة بزر E، ومعاها درع القنابل اللي بيقلل تأثير صوت الانفجار واهتزاز الأرض. ثابتة وسريعة في كل الأطوار.",
  },
  miranda: {
    ability: "Extended Combo Time",
    abilityAr: "تمديد الكومبو",
    descAr: "بتديك وقت أطول للكومبو — عداد القتل المتتالي مبيخلصش بسرعة وبتشوفه بنجمة تحت الشاشة. ومعاها الركلة الغاضبة. ممتازة للي بيجمع كيلات ورا بعض. (الاسم الأصلي: Wu Mengmeng)",
  },
  valoria: {
    ability: "Explosion of Bless",
    abilityAr: "انفجار البركة",
    descAr: "نسخة المدافع الرشاشة — انفجار شامل حواليها بزر E مع هيل وذخيرة لا نهائية وسرعة للفريق كله 10 ثواني. ومعاها الركلة الغاضبة.",
  },
  sicarios: {
    ability: "Extended Combo Time",
    abilityAr: "تمديد الكومبو",
    descAr: "كومبو ممتد + كل 100 ضرر بتاخد بونص EXP بقد kill. ومعاها انفجار البركة في الزومبي، وFlash Guard ضد العمى، وتقليل ضرر الوقوع، ومناعة قنابل الفريق — باكدج متكاملة.",
  },
  lexy: {
    ability: "Ally Sight",
    abilityAr: "رؤية الحلفاء",
    descAr: "بتشوف زمايلك من ورا الحيطة لحد 50 متر في البحث والتدمير — مفيش حد بيضيع منك. ومعاها Energy Blast في الزومبي واحتفالات النصر بزر N. (الاسم الأصلي: WoLF)",
  },
  "girl crush": {
    ability: "Random Ability",
    abilityAr: "قدرة عشوائية",
    descAr: "صندوق مفاجآت — كل مرة قدرة شكل: سرعة في الزومبي، أو تحول لميوتنت تاني، أو سيف الصدمة، أو كرة نار بتنفجر 5 مرات. ومعاها الركلة والسكاكين. مملة؟ مستحيل.",
  },
  runaways: {
    ability: "Shockwave Sword",
    abilityAr: "سيف الموجة",
    descAr: "سيف الموجة الصدمية — لما يتشحن بترمي كرة نار بتنفجر 5 مرات في الزومبي. ومعاها الركلة والسكاكين، وبتوزع Mileage Points عليك وعلى اللي في الأوضة.",
  },
  corinne: {
    ability: "Nano Sixth Sense",
    abilityAr: "الحاسة السادسة",
    descAr: "طاردة الأرواح — بتحس بالميوتنت لحد 20 متر وبتسمع صوت إنذار لو متنكر قريب منك. وكل ما تضربهم قوتك النارية بتزيد لحد 10%. ومعاها تعويذة بتشل الميوتانت نص ثانية و300% EXP في الميوتنت. (الاسم الأصلي: Serpent Exorcist)",
  },
  "jtf-expert": {
    ability: "Explosive Expert",
    abilityAr: "خبيرة المتفجرات",
    descAr: "نسخة المستقبل — بتزرع C4-Beacon بدل العادية وبتفك أسرع، وبتعرف توقيت الانفجار بالظبط. ومعاها درع كمي بيظهر وهي بتفك وسرعة أعلى وهي شايلة الـ C4. (الاسم الأصلي: JON-Future)",
  },
  sparrow: {
    ability: "Headshot Hunter",
    abilityAr: "صياد الهيدشوت",
    descAr: "في الزومبي كل ثانية بتاخد فرصة هيدشوت — أي رصاصة بتتحسب هيدشوت بضرر 100، مع ذخيرة لا نهائية وسرعة للفريق. ومعاها Sniper Master: طلقة زيادة للمسدسات وطلقتين للقناصات. (الاسم الأصلي: Hawks)",
  },
  "urðr": {
    ability: "Nano Camouflage",
    abilityAr: "التمويه النانوي",
    descAr: "شخصية Infinity — بتتخفى 10 ثواني في الميوتنت (Ctrl+F) وبتسترجع ذخيرة أو هيل كل ثانية. ومعاها علامة الصياد وسيف الطاقة اللي بيطلع موجة ضررها 1000 في الزومبي. و300% EXP. (الاسم الأصلي: Urd)",
  },
  alexandrina: {
    ability: "Raging Bullet",
    abilityAr: "الرصاصة الهائجة",
    descAr: "شخصية Infinity — في الزومبي بتمسك Barrett وحش وبتضرب 3 رصاصات مدمرة مع منطقة نار تحتها، وهيل وتقليل ضرر وذخيرة لا نهائية للفريق. وفي البحث والتدمير C4-Music Box أسرع. و300% EXP.",
  },
};

// ─── West roster + skill previews ───────────────────────────────────────────
// WEST_ONLY: official CrossFire West characters (default filter). Anything not
// listed here still shows when the West filter is turned off.
const WEST_ONLY: Record<string, boolean> = {
  dean: true, holly: true, magnolia: true, vipers: true, crusherz: true,
  gigi: true, valoria: true, arabella: true, trixy: true, ghost: true,
  viper: true, switcher: true, florence: true, dahlia: true, annie: true,
  seraphina: true, jessie: true, "esports yun": true, miranda: true,
  sicarios: true, lexy: true, "girl crush": true, ronin: true, corinne: true,
  sparrow: true, "jtf-expert": true, "urðr": true, melody: true, paola: true,
  roxy: true, aceson: true, trinity: true, "trinity-veteran": true, verdandi: true,
};

// صور الويكي بتدعم تصغير حقيقي من نفس الرابط (scale-to-width-down) — srcset حقيقي مش منظر
function wikiaThumbSrcSet(url: string): string | undefined {
  const m = String(url || "").match(/^(https:\/\/static\.wikia\.nocookie\.net\/.*\/revision\/)latest(\?.*)?$/);
  if (!m) return undefined;
  return `${m[1]}latest/scale-to-width-down/150${m[2] || ""} 150w, ${m[1]}latest/scale-to-width-down/300${m[2] || ""} 300w`;
}

function isWestChar(name: string): boolean {
  return !!WEST_ONLY[String(name || "").toLowerCase().trim()];
}

// Arabic skill names for the modal skill cards
const SKILL_AR: Record<string, string> = {
  "Furious Kick": "الركلة الغاضبة", "Throwing Knife": "السكاكين الطائرة",
  "Energy Blast": "انفجار الطاقة", "Explosion of Bless": "انفجار البركة",
  "Bless": "البركة", "Ally Sight": "رؤية الحلفاء", "Quick Escape": "الهروب السريع",
  "Upward Kick": "الركلة العلوية", "Smash": "اللكمة السريعة", "Dash": "الاندفاع",
  "Hunter's Mark": "علامة الصياد", "Nano Camouflage": "التمويه النانوي",
  "Wild Shot": "الطلقة البرية", "Dual Daphne Saber": "سيفا دافني",
  "Shockwave Sword": "سيف الموجة", "Sealing Talisman": "التعويذة الخاتمة",
  "Energy Absorb": "امتصاص الطاقة", "Nano Sixth Sense": "الحاسة السادسة",
  "Headshot Hunter": "صياد الهيدشوت", "Sniper Master": "سيد القناصات",
  "Extended Combo Time": "تمديد الكومبو", "Grenade Shield": "درع القنابل",
  "Flash Guard": "الحماية من العمى", "Quick Planting": "زرع وفك سريع",
  "C4 Timer": "مؤقت C4", "Explosive Expert": "خبير المتفجرات",
  "Danger Express": "سرعة الـ C4", "Emotion": "التعبيرات",
  "Shapeshifter": "التحول", "Hidden Weapon": "السلاح الخفي",
  "Flower Attack": "هجوم الورود", "Mileage": "نقاط Mileage",
  "Damage EXP Bonus": "بونص EXP للضرر", "Awakening": "الاستيقاظ",
  "Random Ability": "قدرة عشوائية",
};

// Verified wiki preview images for signature skills (others show text only)
const SKILL_ICONS: Record<string, string> = {
  "Furious Kick": "https://static.wikia.nocookie.net/crossfirefps/images/0/03/Furious_Kick_Female.png/revision/latest?cb=20180419093230",
  "Dash": "https://static.wikia.nocookie.net/crossfirefps/images/5/55/Dash.png/revision/latest?cb=20190119050458",
  "Hunter's Mark": "https://static.wikia.nocookie.net/crossfirefps/images/4/40/HunterMarkedEffect.png/revision/latest?cb=20190224135704",
  "Shockwave Sword": "https://static.wikia.nocookie.net/crossfirefps/images/a/a2/Shockwave_Sword.png/revision/latest?cb=20211114114335",
  "Mileage": "https://static.wikia.nocookie.net/crossfirefps/images/c/cc/Mileage.png/revision/latest?cb=20170407143103",
};

// Signature skills per West character (modal cards)
const VIP_SKILLS: Record<string, string[]> = {
  viper: ["Furious Kick", "Throwing Knife"],
  jessie: ["Wild Shot", "Explosive Expert", "Quick Planting"],
  annie: ["Hunter's Mark", "Throwing Knife", "Energy Blast"],
  lexy: ["Ally Sight", "Energy Blast"],
  magnolia: ["Energy Blast", "Quick Escape", "Upward Kick"],
  holly: ["Energy Blast", "Grenade Shield", "Furious Kick"],
  trixy: ["Shapeshifter", "Furious Kick", "Throwing Knife"],
  florence: ["Dual Daphne Saber", "Bless", "Furious Kick"],
  dahlia: ["Dash", "Flower Attack", "Throwing Knife"],
  ronin: ["Shockwave Sword", "Furious Kick", "Throwing Knife"],
  miranda: ["Extended Combo Time", "Furious Kick"],
  corinne: ["Nano Sixth Sense", "Energy Absorb", "Sealing Talisman"],
  sparrow: ["Headshot Hunter", "Sniper Master", "Furious Kick"],
  "jtf-expert": ["Explosive Expert", "C4 Timer", "Danger Express"],
  valoria: ["Explosion of Bless", "Furious Kick"],
  "urðr": ["Nano Camouflage", "Hunter's Mark", "Hidden Weapon"],
  seraphina: ["Awakening", "Bless"],
  switcher: ["Furious Kick", "Throwing Knife"],
  "esports yun": ["Furious Kick", "Grenade Shield"],
  "girl crush": ["Random Ability", "Furious Kick", "Throwing Knife"],
  sicarios: ["Extended Combo Time", "Explosion of Bless", "Damage EXP Bonus"],
  verdandi: ["Awakening", "Smash"],
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
  vip: { bg: "rgba(245,166,35,0.18)", color: "#fbbf24" },
  infinity: { bg: "rgba(168,85,247,0.18)", color: "#c084fc" },
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
  const [westOnly, setWestOnly] = useState(true);
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

  // West-only is the default view; turn it off to see every version
  const visibleMercs = westOnly ? mercenaries.filter((m) => isWestChar(m.name)) : mercenaries;

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
                {visibleMercs.length} / {mercenaries.length} operatives — {layoutStyle === "grid" ? "click any card to view details" : "hover to preview, click to expand"}
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
                title="Show West characters only"
                onClick={() => setWestOnly((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded transition-all"
                style={{ background: westOnly ? "#f5a623" : "var(--card)", color: westOnly ? "#000" : "#666", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {westOnly ? "West Only ✓" : "All Versions"}
              </button>
              {!westOnly && (
                <button
                  title="Reset to West only"
                  onClick={() => setWestOnly(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded transition-all"
                  style={{ background: "var(--card)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.35)" }}
                >
                  Reset: West
                </button>
              )}
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
              {visibleMercs.map((merc) => {
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
                      width={300} height={400}
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
              {visibleMercs.map((merc) => {
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
                        width={240} height={320}
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
              aria-label="Close"
            >
              Close
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

              {(() => {
                const key = selectedMerc.name.toLowerCase().trim();
                const skills = VIP_SKILLS[key] || [];
                if (!skills.length) return null;
                return (
                  <div className="mb-4">
                    <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: "#f5a623" }}>Signature Skills · المهارات</div>
                    <div className="grid grid-cols-1 gap-2">
                      {skills.map((sk) => (
                        <div key={sk} className="flex items-center gap-3 p-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 3 }}>
                          {SKILL_ICONS[sk] ? (
                            <img src={SKILL_ICONS[sk]} srcSet={wikiaThumbSrcSet(SKILL_ICONS[sk])} sizes="44px" alt={sk} loading="lazy" decoding="async" className="h-11 w-11 object-contain flex-shrink-0" style={{ background: "#000", borderRadius: 2 }} />
                          ) : (
                            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: "#f5a623" }} />
                          )}
                          <div className="min-w-0">
                            <div className="text-[12px] font-bold" style={{ color: "#fff", fontFamily: "'Noto Sans Arabic', sans-serif" }}>{SKILL_AR[sk] || sk}</div>
                            <div className="text-[10px]" style={{ color: "#666" }}>{sk}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
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
