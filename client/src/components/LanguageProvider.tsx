import { createContext, useContext, useEffect, useState } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    home: "Home",
    about: "About",
    contact: "Contact",
    categories: "Categories",
    all: "All",
    news: "News",
    reviews: "Reviews",
    tutorials: "Tutorials",
    events: "Events",
    search: "Search articles...",
    readMore: "Read More",
    recentPosts: "Recent Posts",
    popularTags: "Popular Tags",
    mostViewed: "Most Viewed",
    bimoraPicks: "Bimora's Picks",
    readingTime: "min read",
    views: "views",
    latest: "Latest",
    popular: "Popular",
    featured: "Featured",
    relatedArticles: "Related Articles",
    comments: "Comments",
    addComment: "Add a comment",
    submit: "Submit",
    admin: "Admin Dashboard",
    logout: "Logout",
    login: "Login",
    copyright: "© 2025 Bimora Gaming — All Rights Reserved",
    loading: "Loading...",
    newsNotFound: "News Not Found",
    backToNews: "Back to News",
    readMoreNews: "Read More News",
    newsAndUpdates: "& Updates",
    translationNote: "Translation Note:",
    translationNoteText: "This article will be automatically translated using AI translation API when implemented.",
    mercenaries: "Mercenaries",
    mercenariesSubtitle: "Choose your warrior. Master your destiny.",
    graveGames: "GRAVE GAMES",
    graveGamesSubtitle: "The Spider's Web Awaits",
    eventDescription: "Enter the Spider's Web this Halloween season! Complete thrilling challenges, earn exclusive rewards, and prove your skills in this limited-time event.",
    eventDetails: "Navigate through the treacherous web of challenges designed to test even the most experienced mercenaries. Each completed challenge brings you closer to unlocking rare weapons, character skins, and special Halloween-themed items.",
    eventFeatures: "Event Features",
    eventFeature1: "Complete daily and weekly challenges",
    eventFeature2: "Earn exclusive Halloween-themed rewards",
    eventFeature3: "Unlock special character skins and weapon camos",
    eventFeature4: "Track your progress through the event portal",
    eventFeature5: "Compete with other mercenaries on the leaderboard",
    limitedTimeOnly: "Limited Time Only",
    limitedTimeText: "This event runs from October 1st through October 31st. Don't miss your chance to collect these exclusive Halloween items before the web disappears!",
    aboutBimora: "About Bimora Gaming",
    aboutWelcome: "Welcome to Bimora Gaming, your premier source for CrossFire news, character guides, weapon reviews, and gaming updates.",
    ourMission: "Our Mission",
    missionText: "We're dedicated to providing comprehensive CrossFire gaming content that helps players stay updated with the latest news, master new characters, and improve their gameplay. From beginner guides to advanced strategies, we cover it all.",
    whatWeCover: "What We Cover",
    coverItem1: "CrossFire game news and updates",
    coverItem2: "Character guides and mercenary profiles",
    coverItem3: "Weapon reviews and gameplay tips",
    coverItem4: "Community events and tournaments",
    coverItem5: "Game modes and strategy guides",
    joinCommunity: "Join Our Community",
    communityText: "Connect with fellow CrossFire players, share your gaming experiences, and stay updated with the latest game updates. Follow us on social media and subscribe to our newsletter for regular updates.",
    contactUs: "Contact Us",
    contactSubtitle: "Have a question or suggestion? We'd love to hear from you.",
    email: "Email",
    chat: "Chat",
    liveChatSupport: "Live chat support",
    notFound: "404 Page Not Found",
    notFoundText: "Did you forget to add the page to the router?",
    backToHome: "Go back home",
    eventInformation: "Event Information",
    theSpidersWeb: "The Spider's Web",
    eventDates: "October 1 - 31, 2025",
    loginToCheckProgress: "Login to Check Your Progress",
    social: "Social",
    followUsOnline: "Follow us online",
    sendUsMessage: "Send us a message",
    name: "Name",
    yourName: "Your name",
    yourEmail: "your@email.com",
    message: "Message",
    tellUsWhatsOnYourMind: "Tell us what's on your mind...",
    eventNotFound: "Event Not Found",
    back: "Back",
    upcoming: "Upcoming",
    trending: "Trending",
    showOriginal: "Show Original",
    showTranslation: "Show Translation",
    viewingTranslation: "You are viewing the translated version",
    translationAvailable: "Translation available - click the button above to switch",
  },
  ar: {
    home: "الرئيسية",
    about: "من نحن",
    contact: "اتصل بنا",
    categories: "التصنيفات",
    all: "الكل",
    news: "أخبار",
    reviews: "مراجعات",
    tutorials: "دروس",
    events: "فعاليات",
    search: "ابحث عن المقالات...",
    readMore: "اقرأ المزيد",
    recentPosts: "آخر المقالات",
    popularTags: "الوسوم الشائعة",
    mostViewed: "الأكثر مشاهدة",
    bimoraPicks: "اختيارات بيوميرا",
    readingTime: "دقيقة قراءة",
    views: "مشاهدة",
    latest: "الأحدث",
    popular: "الأكثر شعبية",
    featured: "مميز",
    relatedArticles: "مقالات ذات صلة",
    comments: "التعليقات",
    addComment: "أضف تعليقاً",
    submit: "إرسال",
    admin: "لوحة الإدارة",
    logout: "تسجيل الخروج",
    login: "تسجيل الدخول",
    copyright: "© 2025 Bimora Gaming — جميع الحقوق محفوظة",
    loading: "جاري التحميل...",
    newsNotFound: "الخبر غير موجود",
    backToNews: "العودة للأخبار",
    readMoreNews: "اقرأ المزيد من الأخبار",
    newsAndUpdates: "والتحديثات",
    translationNote: "ملاحظة الترجمة:",
    translationNoteText: "سيتم ترجمة هذا المقال تلقائياً باستخدام واجهة برمجة التطبيقات للترجمة الآلية عند التفعيل.",
    mercenaries: "المرتزقة",
    mercenariesSubtitle: "اختر محاربك. أتقن مصيرك.",
    graveGames: "ألعاب القبور",
    graveGamesSubtitle: "شبكة العنكبوت في الانتظار",
    eventDescription: "ادخل شبكة العنكبوت في موسم الهالوين هذا! أكمل التحديات المثيرة، واكسب مكافآت حصرية، وأثبت مهاراتك في هذا الحدث محدود المدة.",
    eventDetails: "تنقل عبر شبكة التحديات الخطيرة المصممة لاختبار حتى أكثر المرتزقة خبرة. كل تحدٍ مكتمل يقربك من فتح أسلحة نادرة، وأزياء شخصيات، وعناصر خاصة بالهالوين.",
    eventFeatures: "ميزات الحدث",
    eventFeature1: "أكمل التحديات اليومية والأسبوعية",
    eventFeature2: "اكسب مكافآت حصرية بطابع الهالوين",
    eventFeature3: "افتح أزياء شخصيات خاصة وتمويه أسلحة",
    eventFeature4: "تتبع تقدمك عبر بوابة الحدث",
    eventFeature5: "تنافس مع مرتزقة آخرين على لوحة المتصدرين",
    limitedTimeOnly: "لفترة محدودة فقط",
    limitedTimeText: "يستمر هذا الحدث من 1 أكتوبر حتى 31 أكتوبر. لا تفوت فرصتك لجمع هذه العناصر الحصرية للهالوين قبل اختفاء الشبكة!",
    aboutBimora: "عن Bimora Gaming",
    aboutWelcome: "مرحباً بك في Bimora Gaming، مصدرك الأول لأخبار CrossFire، وأدلة الشخصيات، ومراجعات الأسلحة، وتحديثات الألعاب.",
    ourMission: "مهمتنا",
    missionText: "نحن ملتزمون بتوفير محتوى شامل عن ألعاب CrossFire يساعد اللاعبين على البقاء على اطلاع بأحدث الأخبار، وإتقان الشخصيات الجديدة، وتحسين أسلوب اللعب. من أدلة المبتدئين إلى الاستراتيجيات المتقدمة، نغطي كل شيء.",
    whatWeCover: "ما نغطيه",
    coverItem1: "أخبار وتحديثات لعبة CrossFire",
    coverItem2: "أدلة الشخصيات وملفات المرتزقة",
    coverItem3: "مراجعات الأسلحة ونصائح اللعب",
    coverItem4: "الفعاليات المجتمعية والبطولات",
    coverItem5: "أوضاع اللعب وأدلة الاستراتيجيات",
    joinCommunity: "انضم إلى مجتمعنا",
    communityText: "تواصل مع زملائك لاعبي CrossFire، وشارك تجاربك في الألعاب، وابق على اطلاع بأحدث تحديثات اللعبة. تابعنا على وسائل التواصل الاجتماعي واشترك في نشرتنا الإخبارية للحصول على تحديثات منتظمة.",
    contactUs: "اتصل بنا",
    contactSubtitle: "هل لديك سؤال أو اقتراح؟ نود أن نسمع منك.",
    email: "البريد الإلكتروني",
    chat: "الدردشة",
    liveChatSupport: "دعم الدردشة المباشرة",
    notFound: "الصفحة غير موجودة 404",
    notFoundText: "هل نسيت إضافة الصفحة إلى الموجه؟",
    backToHome: "العودة للصفحة الرئيسية",
    eventInformation: "معلومات الحدث",
    theSpidersWeb: "شبكة العنكبوت",
    eventDates: "1 - 31 أكتوبر 2025",
    loginToCheckProgress: "تسجيل الدخول لمتابعة تقدمك",
    social: "التواصل الاجتماعي",
    followUsOnline: "تابعنا عبر الإنترنت",
    sendUsMessage: "أرسل لنا رسالة",
    name: "الاسم",
    yourName: "اسمك",
    yourEmail: "بريدك@الإلكتروني.com",
    message: "الرسالة",
    tellUsWhatsOnYourMind: "أخبرنا بما يدور في ذهنك...",
    eventNotFound: "الحدث غير موجود",
    back: "رجوع",
    upcoming: "قادم",
    trending: "رائج",
    showOriginal: "عرض النص الأصلي",
    showTranslation: "عرض الترجمة",
    viewingTranslation: "أنت تشاهد النسخة المترجمة",
    translationAvailable: "الترجمة متوفرة - انقر الزر أعلاه للتبديل",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", language);
    
    // Add/remove Arabic font class for smoother font switching
    if (language === "ar") {
      root.classList.add("font-arabic");
    } else {
      root.classList.remove("font-arabic");
    }
    
    localStorage.setItem("language", language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "ar" : "en"));
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
