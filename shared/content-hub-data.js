export const globalContentPages = [
  {
    slug: "weapon-guides",
    title: "Weapon Guides",
    titleAr: "دليل الأسلحة",
    category: "Combat archive",
    categoryAr: "أرشيف القتال",
    summary: "Compare rifles, SMGs, shotguns and specialty weapons by role, handling, range and the situations where each one makes sense.",
    summaryAr: "قارن بين البنادق والرشاشات والأسلحة المتخصصة حسب الدور والتحكم والمدى والمواقف التي يبرع فيها كل سلاح.",
    accent: "#f5a623",
    image: "/portal/weapons.jpg",
    imageAlt: "CrossFire weapons archive",
    stats: ["Weapon comparisons", "Loadout notes", "Beginner friendly"],
    statsAr: ["مقارنات الأسلحة", "ملاحظات التجهيز", "مناسب للمبتدئين"],
    sections: [
      {
        title: "What you will find",
        titleAr: "ماذا ستجد هنا",
        items: [
          "Clear breakdowns of damage, range, recoil and handling",
          "Practical picks for rush, hold, support and long-range roles",
          "Cross-links to the weapon archive and regional availability"
        ],
        itemsAr: [
          "شرح واضح للضرر والمدى والارتداد وسهولة التحكم",
          "اختيارات عملية للاندفاع والدفاع والدعم والاشتباك البعيد",
          "روابط مباشرة إلى أرشيف الأسلحة وتوفرها حسب المنطقة"
        ]
      },
      {
        title: "Start with a useful question",
        titleAr: "ابدأ بسؤال مفيد",
        items: [
          "Which weapon fits my role and preferred distance?",
          "What should I practise before taking this weapon into ranked play?",
          "Which alternatives offer a similar feel without the same weaknesses?"
        ],
        itemsAr: [
          "ما السلاح المناسب لدوري والمسافة التي أفضلها؟",
          "ما الذي يجب أن أتدرب عليه قبل استخدامه في اللعب التنافسي؟",
          "ما البدائل التي تقدم إحساساً قريباً دون نفس نقاط الضعف؟"
        ]
      }
    ],
    relatedLinks: [
      { label: "Open weapons archive", labelAr: "فتح أرشيف الأسلحة", href: "/weapons" },
      { label: "Compare regional data", labelAr: "مقارنة البيانات الإقليمية", href: "/compare/ak47-beast" }
    ]
  },
  {
    slug: "regional-overviews",
    title: "Regional Overviews",
    titleAr: "نظرة على المناطق",
    category: "Global archive",
    categoryAr: "الأرشيف العالمي",
    summary: "Understand how CrossFire content differs across West, China, Vietnam, Brazil, the Philippines, Korea and Russia without mixing separate versions together.",
    summaryAr: "افهم اختلاف محتوى CrossFire بين الغرب والصين وفيتنام والبرازيل والفلبين وكوريا وروسيا دون خلط النسخ المختلفة معاً.",
    accent: "#38bdf8",
    image: "/portal/maps.webp",
    imageAlt: "CrossFire maps archive",
    stats: ["7 regions", "Version-aware", "Side-by-side context"],
    statsAr: ["7 مناطق", "مراعاة اختلاف النسخ", "سياق مقارن"],
    sections: [
      {
        title: "Why regional context matters",
        titleAr: "لماذا تهم المقارنة الإقليمية",
        items: [
          "Names, events and availability can change between versions",
          "A guide is more useful when it states which region it describes",
          "The archive keeps local facts beside the global CrossFire picture"
        ],
        itemsAr: [
          "قد تختلف الأسماء والأحداث والتوفر بين النسخ المختلفة",
          "يصبح الدليل أكثر فائدة عندما يوضح المنطقة التي يتحدث عنها",
          "يضع الأرشيف المعلومات المحلية بجانب صورة CrossFire العالمية"
        ]
      },
      {
        title: "Browse the world map",
        titleAr: "تصفح خريطة العالم",
        items: [
          "Open a region to see its server focus, status and featured content",
          "Use comparison pages when the same weapon appears across regions",
          "Submit missing facts for editorial review instead of guessing"
        ],
        itemsAr: [
          "افتح أي منطقة لمعرفة خادمها وتركيزها وحالتها ومحتواها المميز",
          "استخدم صفحات المقارنة عندما يظهر السلاح نفسه في أكثر من منطقة",
          "أرسل المعلومات الناقصة للمراجعة بدلاً من التخمين"
        ]
      }
    ],
    relatedLinks: [
      { label: "Explore the global wiki", labelAr: "استكشاف الويكي العالمي", href: "/global-wiki" },
      { label: "Open weapon comparison", labelAr: "فتح مقارنة الأسلحة", href: "/compare/ak47-beast" }
    ]
  },
  {
    slug: "mode-and-map-collections",
    title: "Modes & Map Collections",
    titleAr: "مجموعات المودات والخرائط",
    category: "Game systems",
    categoryAr: "أنظمة اللعب",
    summary: "Learn the objective, rhythm and pressure points of each mode, then connect that knowledge to the maps where it matters most.",
    summaryAr: "تعرف على الهدف وإيقاع اللعب ونقاط الضغط في كل مود، ثم اربط ذلك بالخرائط التي يظهر فيها بأكبر تأثير.",
    accent: "#34d399",
    image: "/portal/modes.webp",
    imageAlt: "CrossFire game modes archive",
    stats: ["Objective first", "Map callouts", "Strategy focused"],
    statsAr: ["الهدف أولاً", "نداءات الخرائط", "تركيز استراتيجي"],
    sections: [
      {
        title: "Turn a map into a plan",
        titleAr: "حوّل الخريطة إلى خطة",
        items: [
          "Know the win condition before choosing a route or weapon",
          "Mark safe rotations, exposed crossings and common fight zones",
          "Separate public-match advice from coordinated team play"
        ],
        itemsAr: [
          "اعرف شرط الفوز قبل اختيار طريق الحركة أو السلاح",
          "حدد مسارات الدوران الآمنة والمعابر المكشوفة ومناطق الاشتباك المعتادة",
          "فرّق بين نصائح اللعب العام واللعب المنسق مع الفريق"
        ]
      },
      {
        title: "Build a repeatable routine",
        titleAr: "ابنِ روتيناً قابلاً للتكرار",
        items: [
          "Review the objective, learn two reliable routes and watch the timer",
          "Use map knowledge to create better decisions, not just memorised spots",
          "Return after updates because map flow can change"
        ],
        itemsAr: [
          "راجع الهدف وتعلم طريقين موثوقين وراقب الوقت",
          "استخدم معرفة الخريطة لصنع قرارات أفضل لا لحفظ أماكن ثابتة فقط",
          "عد إلى الدليل بعد التحديثات لأن إيقاع الخريطة قد يتغير"
        ]
      }
    ],
    relatedLinks: [
      { label: "Explore maps", labelAr: "استكشاف الخرائط", href: "/maps" },
      { label: "Browse game modes", labelAr: "تصفح المودات", href: "/modes" }
    ]
  },
  {
    slug: "mercenary-and-rank-pages",
    title: "Mercenaries & Ranks",
    titleAr: "المرتزقة والرتب",
    category: "Progression systems",
    categoryAr: "أنظمة التطور",
    summary: "Follow the roles, abilities, ranks and rewards that shape a player's long-term path through CrossFire.",
    summaryAr: "تابع الأدوار والقدرات والرتب والمكافآت التي تشكل طريق اللاعب الطويل داخل CrossFire.",
    accent: "#a78bfa",
    image: "/portal/mercenaries.webp",
    imageAlt: "CrossFire mercenaries archive",
    stats: ["Role profiles", "Rank milestones", "Progression notes"],
    statsAr: ["ملفات الأدوار", "مراحل الرتب", "ملاحظات التطور"],
    sections: [
      {
        title: "Read beyond the name",
        titleAr: "اقرأ ما وراء الاسم",
        items: [
          "Understand what a mercenary changes in a real match",
          "Separate cosmetic appeal from useful role information",
          "Track rank requirements and rewards with clear milestones"
        ],
        itemsAr: [
          "افهم ما الذي يغيره المرتزق فعلياً داخل المباراة",
          "افصل بين الشكل الجذاب والمعلومة المفيدة عن الدور",
          "تابع متطلبات الرتبة ومكافآتها عبر مراحل واضحة"
        ]
      },
      {
        title: "Use the progression archive",
        titleAr: "استخدم أرشيف التطور",
        items: [
          "Pick a realistic next target instead of chasing every reward at once",
          "Use role pages to decide which skills deserve practice first",
          "Check updates before treating an old progression tip as current"
        ],
        itemsAr: [
          "اختر هدفاً تالياً واقعياً بدلاً من مطاردة كل المكافآت مرة واحدة",
          "استخدم صفحات الأدوار لتحديد المهارات التي تستحق التدريب أولاً",
          "راجع التحديثات قبل اعتبار نصيحة قديمة مناسبة للوقت الحالي"
        ]
      }
    ],
    relatedLinks: [
      { label: "Browse mercenaries", labelAr: "تصفح المرتزقة", href: "/mercenaries" },
      { label: "View rank data", labelAr: "عرض بيانات الرتب", href: "/ranks" }
    ]
  },
  {
    slug: "events-and-updates",
    title: "Events & Updates",
    titleAr: "الأحداث والتحديثات",
    category: "Live service",
    categoryAr: "المحتوى الحي",
    summary: "Keep up with seasonal events, new modes, balance changes and community announcements through a timeline that explains what actually changed.",
    summaryAr: "تابع الأحداث الموسمية والمودات الجديدة وتغييرات التوازن وإعلانات المجتمع عبر خط زمني يشرح ما الذي تغير فعلاً.",
    accent: "#fb7185",
    image: "/portal/events.jpg",
    imageAlt: "CrossFire events archive",
    stats: ["Timeline view", "Reward context", "Patch summaries"],
    statsAr: ["عرض زمني", "سياق المكافآت", "ملخصات التحديثات"],
    sections: [
      {
        title: "Read an update with context",
        titleAr: "اقرأ التحديث مع سياقه",
        items: [
          "See the date, region and type of change before reading the details",
          "Separate confirmed information from community discussion",
          "Find the practical effect on weapons, maps, modes or rewards"
        ],
        itemsAr: [
          "شاهد التاريخ والمنطقة ونوع التغيير قبل قراءة التفاصيل",
          "افصل المعلومات المؤكدة عن نقاشات المجتمع والتسريبات",
          "اعرف التأثير العملي على الأسلحة أو الخرائط أو المودات أو المكافآت"
        ]
      },
      {
        title: "Never miss the useful part",
        titleAr: "لا تفوت الجزء المفيد",
        items: [
          "Use event pages to check eligibility, duration and reward structure",
          "Return after a patch when early reports have been verified",
          "Follow the news archive for longer explanations and source links"
        ],
        itemsAr: [
          "استخدم صفحات الأحداث لمعرفة الشروط والمدة ونظام المكافآت",
          "عد بعد التحديث عندما يتم التحقق من التقارير الأولى",
          "تابع أرشيف الأخبار للشرح الكامل وروابط المصادر"
        ]
      }
    ],
    relatedLinks: [
      { label: "Open event calendar", labelAr: "فتح تقويم الأحداث", href: "/events" },
      { label: "Read latest news", labelAr: "قراءة آخر الأخبار", href: "/news" }
    ]
  },
  {
    slug: "community-guides",
    title: "Community Guides",
    titleAr: "أدلة المجتمع",
    category: "Player knowledge",
    categoryAr: "معرفة اللاعبين",
    summary: "Turn practical player knowledge into readable guides: beginner walkthroughs, tactical notes, troubleshooting and answers that save time.",
    summaryAr: "حوّل خبرة اللاعبين العملية إلى أدلة سهلة القراءة: شروحات للمبتدئين ونصائح تكتيكية وحلول وإجابات توفر الوقت.",
    accent: "#f59e0b",
    image: "/portal/ranks.webp",
    imageAlt: "CrossFire progression archive",
    stats: ["Practical answers", "Cross-linked guides", "Editorial review"],
    statsAr: ["إجابات عملية", "أدلة مترابطة", "مراجعة تحريرية"],
    sections: [
      {
        title: "A good guide respects the reader",
        titleAr: "الدليل الجيد يحترم القارئ",
        items: [
          "Start with the problem and give the useful answer before the background",
          "Use screenshots, steps and examples instead of vague promises",
          "Say when information is uncertain, regional or awaiting verification"
        ],
        itemsAr: [
          "ابدأ بالمشكلة وقدم الإجابة المفيدة قبل التفاصيل الجانبية",
          "استخدم الصور والخطوات والأمثلة بدلاً من الوعود العامة",
          "وضح عندما تكون المعلومة غير مؤكدة أو إقليمية أو قيد المراجعة"
        ]
      },
      {
        title: "Build knowledge that lasts",
        titleAr: "ابنِ معرفة تعيش طويلاً",
        items: [
          "Link a guide to its weapon, map, mode or event so readers can continue",
          "Prefer specific observations over filler text",
          "Update old pages when the game changes instead of creating duplicates"
        ],
        itemsAr: [
          "اربط الدليل بسلاحه أو خريطته أو موده أو حدثه ليكمل القارئ البحث",
          "فضل الملاحظات المحددة على الكلام المكرر لملء المساحة",
          "حدث الصفحات القديمة عند تغير اللعبة بدلاً من إنشاء نسخ مكررة"
        ]
      }
    ],
    relatedLinks: [
      { label: "Browse published pages", labelAr: "تصفح الصفحات المنشورة", href: "/pages" },
      { label: "Ask the AI assistant", labelAr: "اسأل المساعد الذكي", href: "/ai" }
    ]
  }
];
