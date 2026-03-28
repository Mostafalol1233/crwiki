import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, HelpCircle, Megaphone, Gamepad2, Wrench, Users, Shield, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import PageSEO from "@/components/PageSEO";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

const CATEGORY_ICONS: Record<string, any> = {
  Announcements: Megaphone,
  "Game Mechanics": Gamepad2,
  "Technical Support FAQ": Wrench,
  "Clan Mechanics": Users,
  "CrossFire GMs and MODs": Shield,
  "User Abuse/Hacking": AlertTriangle,
};

const STATIC_FAQ_DATA = [
  {
    id: "announcements",
    name: "Announcements",
    nameAr: "الإعلانات",
    articles: [
      {
        id: "1",
        title: "CrossFire: IGN and Clan name change - new policy!",
        titleAr: "CrossFire: سياسة جديدة لتغيير اسم اللاعب والكلان!",
        body: "Attention Mercenaries, With the newest patch we will update our IGN and Clan name change policy, so that you don't need to contact the support team to regain previously used IGNs or clan names.\n\n- If you want to change your IGN or clan name to one you had used in the last 90 days, you will be able to use it again immediately. You will still need to purchase an In-game Change Item in order to do that.\n- If you want to change your IGN or clan name to one somebody else had used recently, you will need to wait 90 days until it is available again.\n- The support team will not accept requests for IGNs that are currently not in use, since all IGNs that were not used within 90 days are available for everybody.\n- In case a player is inactive with an IGN you would like to use, you still need to contact the support team to free the IGN.",
        bodyAr: "انتبه يا مرتزق! مع آخر تحديث، اتغيرت السياسة بتاعة تغيير الاسم في اللعبة والكلان.\n\n- لو عايز ترجع اسم كنت بتستخدمه في آخر 90 يوم، تقدر تاخده فورًا. بس هتحتاج تشتري أيتم التغيير من الجيم.\n- لو الاسم كان شخص تاني بيستخدمه، هتستنى 90 يوم لحد ما يبقى متاح.\n- الساببورت مش هيقبل طلبات للأسامي اللي مش اتستخدمت، لأنها متاحة للكل أصلًا.\n- لو في لاعب مش بيلعب وعايز اسمه، ابعت للساببورت وهما هيشوفوا الموضوع.",
      },
    ],
  },
  {
    id: "game-mechanics",
    name: "Game Mechanics",
    nameAr: "ميكانيكا اللعبة",
    articles: [
      {
        id: "2",
        title: "Redeem Code FAQs",
        titleAr: "أسئلة عن كودات الاسترداد",
        body: "How do I get a code?\nWe give out codes through various events and promotions, or during our live streams. Follow us on Twitter & Facebook and our channels on Twitch and YouTube.\n\nCan I give my code to a friend?\nYes, but most codes can only be redeemed a certain number of times until they expire.\n\nI redeemed an item that I no longer want, can I give this item away?\nAll redeemed items are bound to your account and cannot be traded or given away.\n\nDo codes expire?\nYes, most of our codes have an expiration date unless announced otherwise.\n\nWhere can I find the free gift?\nYou can find the redeemed gift in your in-game inventory.\n\nIt says I need to create a character first...\nYour inventory has not been created yet. Download the game and create a character first, then try your code again.",
        bodyAr: "إزاي أجيب كود؟\nبنطلع كودات في الإيفنتات والبرومشن أو في اللايف ستريمز. اتابعونا على تويتر وفيسبوك وتويتش ويوتيوب.\n\nأقدر أدي الكود لصاحبي؟\nأيوه، بس معظم الكودات بيتسترد عدد معين من المرات وبعدين بتنتهي.\n\nاستردت أيتم ومش عايزاه، أقدر أعطيه لحد تاني؟\nلا، الأيتمات المستردة ببئى مربوطة بحسابك ومش هتقدر تتبادلها أو تديها لحد.\n\nالكودات بتنتهي؟\nأيوه، معظم الكودات ليها تاريخ انتهاء غير ما بيتعلن خلاف كده.\n\nفين الهدية الفريبي؟\nهتلاقيها في إنفنتوري اللعبة.\n\nبيقولي لازم أعمل كاراكتر الأول!\nده معناه إن إنفنتوريك ماتعملش لسه. نزل اللعبة واعمل كاراكتر الأول، وبعدين جرب الكود تاني.",
      },
      {
        id: "3",
        title: "How can I buy items in CrossFire?",
        titleAr: "إزاي أشتري أيتمات في CrossFire؟",
        body: "New weapons or items can be purchased from the in-game Item Shop, Black Market, or MP Shop. After logging into the game, please click on the Item Shop button located at the top of the screen. You will find a variety of ZP and GP items available!",
        bodyAr: "تقدر تشتري أسلحة وأيتمات جديدة من الشوب الجوا اللعبة، الـ Black Market، أو الـ MP Shop. بعد ما تلوج إن، دوس على زرار الـ Item Shop فوق على الشاشة، وهتلاقي حاجات كتير بـ ZP وبـ GP!",
      },
      {
        id: "4",
        title: "How do I add other players to my CrossFire friend list?",
        titleAr: "إزاي أضيف ناس على فريند ليست في CrossFire؟",
        body: "When you are in the same room or channel as your friend, right-click their name. Then, left-click the \"Add Friend\" button. Once they confirm your request, their in-game name will be added to your CF friend list.",
        bodyAr: "لما تكون في نفس الروم أو الشانل مع صاحبك، كليك يمين على اسمه، وبعدين كليك شمال على \"Add Friend\". لما يقبل الطلب، اسمه هيتضاف على الفريند ليست بتاعتك.",
      },
      {
        id: "5",
        title: "How do I create a character in CrossFire?",
        titleAr: "إزاي أعمل كاراكتر في CrossFire؟",
        body: "After logging into CrossFire, you'll be prompted to create your first character. Choose a unique in-game name (IGN), select your character appearance, and confirm. Your character will be created and you can start playing immediately.",
        bodyAr: "بعد ما تلوج إن، اللعبة هتطلب منك تعمل أول كاراكتر. اختار اسم فريد ليك، اختار شكل الكاراكتر، وبعدين اتأكد. الكاراكتر هيتعمل وتقدر تبدأ اللعب على طول.",
      },
      {
        id: "6",
        title: "How do I trade items/GP/ZP with another player?",
        titleAr: "إزاي أتبادل أيتمات أو GP أو ZP مع لاعب تاني؟",
        body: "CrossFire does not support direct trading of ZP between players. GP can be used in the MP Shop. Items obtained from the Item Shop or Black Market are bound to your account and cannot be traded. Always be cautious of scammers who claim they can trade ZP.",
        bodyAr: "CrossFire مش بتدعم التبادل المباشر للـ ZP بين اللاعبين. الـ GP تقدر تستخدمه في الـ MP Shop. الأيتمات اللي جبتها من الشوب أو البلاك ماركت بتبقى مربوطة بحسابك ومش قابلة للتبادل. اتحذر دايمًا من الناس اللي بتدعي إنها تقدر تبادل ZP، ده نصب!",
      },
      {
        id: "7",
        title: "How do I watch a replay after saving it?",
        titleAr: "إزاي أشوف الريبلاي بعد ما أحفظه؟",
        body: "To watch a saved replay, go to the CrossFire lobby and look for the Replay option in the menu. Select the replay you want to watch from your saved list. Replays are stored in your Documents\\Cross Fire\\Replay folder by default.",
        bodyAr: "عشان تشوف الريبلاي اللي حفظته، روح اللوبي بتاع CrossFire ودور على أوبشن الـ Replay في القائمة. اختار الريبلاي اللي عايز تشوفه من القايمة. الريبلايز بتتحفظ في مجلد Documents\\Cross Fire\\Replay افتراضيًا.",
      },
      {
        id: "8",
        title: "What are the available currencies in CrossFire?",
        titleAr: "إيه هي العملات المتاحة في CrossFire؟",
        body: "CrossFire has two main currencies:\n- ZP (Z-Points): Premium currency purchased with real money. Used for premium items in the Item Shop.\n- GP (Game Points): Free currency earned by playing the game. Used in the MP Shop for weapons and items.",
        bodyAr: "في CrossFire في عملتين أساسيتين:\n- ZP (زد-بوينتس): عملة بريميوم بتشتريها بفلوس حقيقية، وبتستخدمها عشان تشتري حاجات بريميوم في الشوب.\n- GP (جيم بوينتس): عملة فريبي بتكسبها من اللعب، وبتستخدمها في الـ MP Shop.",
      },
      {
        id: "9",
        title: "What are the basic game controls?",
        titleAr: "إيه هي الكنترولز الأساسية في اللعبة؟",
        body: "Basic CrossFire controls:\n- WASD: Movement\n- Mouse: Aim\n- Left Click: Shoot\n- Right Click: Aim Down Sights (ADS)\n- R: Reload\n- G: Throw Grenade\n- F: Use/Interact\n- Tab: Show Scoreboard\n- Enter: Chat\n\nYou can customize all key bindings in the game settings.",
        bodyAr: "الكنترولز الأساسية في CrossFire:\n- WASD: للحركة\n- الماوس: للتصويب\n- كليك يسار: للإطلاق\n- كليك يمين: زووم التصويب (ADS)\n- R: ريلود\n- G: رمي قنبلة\n- F: استخدام/تفاعل\n- Tab: عرض السكوربورد\n- Enter: الشات\n\nتقدر تغير كل الأزرار من الإعدادات.",
      },
      {
        id: "10",
        title: "What is CrossFire?",
        titleAr: "إيه هو CrossFire؟",
        body: "CrossFire is a free-to-play online first-person shooter (FPS) game developed by Smilegate. It features two mercenary organizations (Black List and Global Risk) battling against each other. The game offers various modes including Team Deathmatch, Search & Destroy, and many more.",
        bodyAr: "CrossFire هي لعبة شوتر من منظور الشخص الأول (FPS) أونلاين وفريبي تو بلاي، اتطورت من Smilegate. فيها منظمتين مرتزقة (Black List وGlobal Risk) بيتقاتلوا ضد بعض. اللعبة فيها موودات كتير زي التيم ديثماتش، والسيرش آند ديستروي، وأكتر.",
      },
      {
        id: "11",
        title: "What is Wave Mode and how does it work?",
        titleAr: "إيه هو الـ Wave Mode وإزاي بيشتغل؟",
        body: "Wave Mode is a cooperative game mode in CrossFire where players team up to fight against waves of AI-controlled enemies. As you progress through the waves, enemies become stronger and more numerous. The goal is to survive as many waves as possible and earn rewards.",
        bodyAr: "الـ Wave Mode هو موود تعاوني في CrossFire فين اللاعبين بيتعاونوا مع بعض عشان يقاوموا موجات من الأعداء اللي بيتحكم فيهم الكومبيوتر. كل ما تعدي موجة، الأعداء بيبقوا أقوى وأكتر. الهدف هو إنك تصمد أكبر عدد ممكن من الموجات وتكسب مكافآت.",
      },
      {
        id: "12",
        title: "Why do I not win anything from the Black Market?",
        titleAr: "ليه مش بكسب حاجة من الـ Black Market؟",
        body: "The Black Market system is a luck-based system where players purchase a crate knowing that they will receive three random items when they open any crate. This system is purely based on luck and there is no guarantee for any user to win a specific weapon from a crate. All players have the same chance of winning, and Z8Games Staff members do not and cannot increase, decrease, or manipulate the winning rate of any crate under any circumstances.",
        bodyAr: "الـ Black Market هو نظام مبني على الحظ، لما بتشتري كريت بتعرف إنك هتاخد 3 أيتمات عشوائية. النظام ده بالحظ بالظبط ومافيش ضمان إنك تكسب سلاح معين. كل اللاعبين عندهم نفس فرصة الفوز، والموظفين مش بيقدروا يزودوا أو يقللوا نسبة الربح لأي حد تحت أي ظرف.",
      },
    ],
  },
  {
    id: "technical-support",
    name: "Technical Support FAQ",
    nameAr: "أسئلة الدعم الفني",
    articles: [
      {
        id: "13",
        title: "How do I download and install CrossFire?",
        titleAr: "إزاي أنزل وأنصب CrossFire؟",
        body: "You can download CrossFire by clicking on the download button on the official page. After you download the installer, run it and the installation wizard will guide you through the process.\n\nStep 1: Go to the Download page and press the Download button.\nStep 2: If a download pop-up appears, click Run or Save depending on your browser.\nStep 3: Once the download is complete, the program will begin to install.\nStep 4: Follow the installation wizard instructions to complete setup.",
        bodyAr: "تقدر تنزل CrossFire من زرار التنزيل في الصفحة الرسمية. بعد ما تنزل الإنستولر، شغله والـ Wizard هيبعتك خطوة خطوة.\n\nخطوة 1: روح صفحة التنزيل ودوس على زرار التنزيل.\nخطوة 2: لو ظهرلك بوب أب، دوس Run أو Save حسب البراوزر بتاعك.\nخطوة 3: بعد ما التنزيل يخلص، البرنامج هيبدأ التنصيب.\nخطوة 4: اتبع التعليمات لحد ما التنصيب يخلص.",
      },
      {
        id: "14",
        title: "How do I perform a Dxdiag and how do I get the file?",
        titleAr: "إزاي أعمل Dxdiag وأجيب الملف؟",
        body: "DirectX Diagnostic Tool helps you troubleshoot issues with DirectX. To get the Dxdiag file:\n1. In Windows, search for 'dxdiag' and select it from the results.\n2. In the tool, select 'Save All Information' to save the diagnostic report.\n3. Open the text document and send us the text within your request, or save the txt document and upload it with your reply.\n4. Please try zipping the file using .zip or .rar format (Maximum file size for upload is 10 MB).",
        bodyAr: "أداة DirectX Diagnostic بتساعدك تشخص مشاكل الـ DirectX. عشان تجيب ملف الـ Dxdiag:\n1. ابحث عن 'dxdiag' في ويندوز واختاره.\n2. في الأداة، دوس 'Save All Information' تحفظ التقرير.\n3. افتح ملف النص وبعت المحتوى مع طلبك، أو ارفع الملف في ردك.\n4. حاول تعمله زيب بـ .zip أو .rar (أقصى حجم للرفع 10 ميجا).",
      },
      {
        id: "15",
        title: "I am having a low Frames-Per-Second (FPS). How can I improve it?",
        titleAr: "الـ FPS بتاعي وطي. إزاي أحسنه؟",
        body: "There are various issues that might affect your FPS in-game. To improve your FPS:\n- Update your graphics card drivers to the latest version\n- Optimize your game settings (Resolution, Anti-aliasing, etc.)\n- Optimize your computer (update Windows, clean registry, etc.)\n- Test your internet connection\n- Close all running programs when running CrossFire\n- Consider upgrading hardware like RAM or graphics card",
        bodyAr: "في أسباب كتير ممكن تأثر على الـ FPS بتاعك. عشان تحسنه:\n- حدّث درايفرات كارت الشاشة للإصدار الأحدث\n- بسّط إعدادات اللعبة (الدقة، الـ Anti-aliasing، إلخ)\n- بسّط الكمبيوتر (حدّث ويندوز، نضف الريجستري، إلخ)\n- اختبر سرعة النت بتاعك\n- اقفل كل البرامج الشغالة في الخلفية لما تلعب\n- فكر في أبجريد الهاردوير زي الرام أو كارت الشاشة",
      },
      {
        id: "16",
        title: "I am receiving a message that says 'This service is not available in your region'!",
        titleAr: "بييجيلي رسالة بتقول إن الخدمة مش متاحة في منطقتي!",
        body: "This message means that CrossFire is geo-restricted in your region. Z8Games operates CrossFire for specific regions. If you're seeing this message, CrossFire may not be officially available in your country. You may want to check if there's a regional version of CrossFire available for your area.",
        bodyAr: "الرسالة دي معناها إن CrossFire مش متاحة في بلدك. Z8Games بتشغل اللعبة في مناطق معينة. لو بتشوف الرسالة دي، ممكن اللعبة مش متاحة رسميًا في بلدك. ابحث إذا كان في إصدار ريجيونال للعبة في منطقتك.",
      },
      {
        id: "17",
        title: "I cannot hear gunfire or people walking, but I can hear the radio and game messages. What can I do?",
        titleAr: "مش سامع صوت الرصاص أو المشي بس سامع الراديو والرسايل. إيه الحل؟",
        body: "This is typically a sound settings issue. Try the following:\n1. Check your in-game sound settings and make sure all audio channels are enabled.\n2. Update your sound card drivers.\n3. Try changing the audio output device in Windows settings.\n4. Verify the game files integrity through the game launcher.\n5. If the issue persists, submit a support ticket with your Dxdiag file.",
        bodyAr: "ده غالبًا مشكلة في إعدادات الصوت. جرب الآتي:\n1. افحص إعدادات الصوت في اللعبة وتأكد إن كل قنوات الصوت شغالة.\n2. حدّث درايفر كارت الصوت.\n3. جرب تغيير جهاز الصوت من إعدادات ويندوز.\n4. افحص سلامة ملفات اللعبة من خلال اللانشر.\n5. لو المشكلة فضلت، ابعت تذكرة ساببورت مع ملف الـ Dxdiag.",
      },
      {
        id: "18",
        title: "I have some technical issues and don't know what to do. Help me!",
        titleAr: "عندي مشاكل تقنية ومش عارف أعمل إيه. ساعدوني!",
        body: "If you're experiencing technical issues, here are the steps to follow:\n1. Check if CrossFire servers are under maintenance.\n2. Restart your computer and router.\n3. Update your game client to the latest version.\n4. Check your firewall and antivirus settings.\n5. Run the game as Administrator.\n6. If nothing works, submit a support ticket with detailed information about your issue and your Dxdiag file.",
        bodyAr: "لو عندك مشاكل تقنية، اتبع الخطوات دي:\n1. اتأكد إن سيرفرات CrossFire مش في صيانة.\n2. عيد تشغيل الكمبيوتر والراوتر.\n3. حدّث الكلاينت بتاع اللعبة.\n4. افحص إعدادات الفايروول والأنتي فايرس.\n5. شغل اللعبة كـ Administrator.\n6. لو مفيش حاجة نفعت، ابعت تذكرة ساببورت مع تفاصيل المشكلة وملف الـ Dxdiag.",
      },
      {
        id: "19",
        title: "My mouse movements are shaky/wobbly. How can I fix that?",
        titleAr: "حركة الماوس بتاعتي مش ثابتة/بترتجف. إزاي أصلحها؟",
        body: "Shaky mouse movements in CrossFire can be caused by:\n1. Mouse acceleration settings - disable mouse acceleration in Windows settings.\n2. In-game sensitivity settings - adjust your mouse sensitivity.\n3. Surface/pad issues - use a proper gaming mouse pad.\n4. Driver issues - update your mouse drivers.\n5. FPS drops - improve your FPS first as very low FPS can cause this issue.",
        bodyAr: "اهتزاز الماوس في CrossFire ممكن يبقى بسبب:\n1. إعدادات تسريع الماوس - وقّف تسريع الماوس من إعدادات ويندوز.\n2. إعدادات الحساسية في اللعبة - عدّل حساسية الماوس.\n3. السطح - استخدم باد جيمينج مناسب.\n4. الدرايفرات - حدّث درايفر الماوس.\n5. انخفاض الـ FPS - حسّن الـ FPS الأول لأن انخفاضه الشديد ممكن يسبب المشكلة.",
      },
      {
        id: "20",
        title: "What are the minimum system requirements for CrossFire?",
        titleAr: "إيه هي الحد الأدنى لمتطلبات تشغيل CrossFire؟",
        body: "Minimum System Requirements for CrossFire:\n- OS: Windows XP / Vista / 7 / 8 / 10\n- CPU: Intel Pentium 4 1.8GHz or higher\n- RAM: 512 MB or more\n- GPU: NVIDIA GeForce FX 5200 or ATI Radeon 9600 or higher\n- HDD: At least 4 GB free space\n- Internet: Broadband connection required",
        bodyAr: "الحد الأدنى لمتطلبات تشغيل CrossFire:\n- نظام التشغيل: ويندوز XP / Vista / 7 / 8 / 10\n- المعالج: Intel Pentium 4 بـ 1.8GHz أو أعلى\n- الرام: 512 ميجا أو أكثر\n- كارت الشاشة: NVIDIA GeForce FX 5200 أو ATI Radeon 9600 أو أعلى\n- مساحة: 4 جيجا فاضية على الأقل\n- النت: اتصال برودباند",
      },
      {
        id: "21",
        title: "What are the operating systems supported by CrossFire?",
        titleAr: "إيه أنظمة التشغيل اللي CrossFire بتدعمها؟",
        body: "CrossFire officially supports:\n- Windows XP (32-bit)\n- Windows Vista (32/64-bit)\n- Windows 7 (32/64-bit)\n- Windows 8 / 8.1 (32/64-bit)\n- Windows 10 (32/64-bit)\n\nMac OS and Linux are not officially supported.",
        bodyAr: "CrossFire بتدعم رسميًا:\n- ويندوز XP (32-بت)\n- ويندوز Vista (32/64-بت)\n- ويندوز 7 (32/64-بت)\n- ويندوز 8 / 8.1 (32/64-بت)\n- ويندوز 10 (32/64-بت)\n\nنظام Mac OS وLinux مش مدعومين رسميًا.",
      },
      {
        id: "22",
        title: "What is a port? How can I open ports on my router to play?",
        titleAr: "إيه هو الـ Port؟ وإزاي أفتح البورتات على الراوتر؟",
        body: "A port is a virtual connection point that allows your computer to communicate with game servers. To open ports for CrossFire:\n1. Access your router's admin panel (usually at 192.168.1.1).\n2. Find the Port Forwarding section.\n3. Add the CrossFire ports: TCP/UDP 7000-7999.\n4. Save settings and restart your router.\n\nNote: The exact steps vary by router model. Check your router's manual for specific instructions.",
        bodyAr: "الـ Port هو نقطة اتصال افتراضية بتخلي الكمبيوتر يتواصل مع سيرفرات اللعبة. عشان تفتح البورتات لـ CrossFire:\n1. ادخل على لوحة إدارة الراوتر (عادةً على 192.168.1.1).\n2. دور على قسم Port Forwarding.\n3. ضيف بورتات CrossFire: TCP/UDP 7000-7999.\n4. احفظ الإعدادات وعيد تشغيل الراوتر.\n\nملاحظة: الخطوات بتختلف حسب موديل الراوتر. ارجع للمانيوال بتاع الراوتر.",
      },
      {
        id: "23",
        title: "What is lag/ping and what contributes to it?",
        titleAr: "إيه هو اللاج والـ Ping وإيه اللي بيسببه؟",
        body: "Lag is a delay between your actions and what happens in-game. Ping is the measurement of this delay in milliseconds (ms). Lower ping = less lag.\n\nFactors contributing to lag:\n- Distance from game servers\n- Internet connection speed and stability\n- Network congestion\n- Background downloads/uploads\n- Router/modem issues\n- ISP throttling\n\nTips to reduce lag: Use wired connection, close background apps, choose server closest to you.",
        bodyAr: "اللاج هو التأخير بين اللي بتعمله وما بيحصل في اللعبة. الـ Ping هو قياس التأخير ده بالميللي ثانية (ms). كل ما الـ Ping أقل = لاج أقل.\n\nأسباب اللاج:\n- بعد سيرفرات اللعبة عنك\n- سرعة واستقرار النت بتاعك\n- ازدحام الشبكة\n- تنزيلات في الخلفية\n- مشاكل في الراوتر أو المودم\n- الـ ISP بيبطئ اتصالك\n\nنصايح لتقليل اللاج: استخدم كابل بدل الواي فاي، اقفل التطبيقات اللي شغالة في الخلفية، واختار السيرفر الأقرب ليك.",
      },
    ],
  },
  {
    id: "clan-mechanics",
    name: "Clan Mechanics",
    nameAr: "ميكانيكا الكلان",
    articles: [
      {
        id: "24",
        title: "How do I add players to my clan?",
        titleAr: "إزاي أضيف لاعبين للكلان بتاعي؟",
        body: "To add players to your clan, you need to be the Clan Leader or have invitation rights. Right-click on the player's name in the lobby or channel and select 'Invite to Clan'. The player will receive an invitation and can accept or decline.",
        bodyAr: "عشان تضيف لاعبين للكلان، لازم تكون قايد الكلان أو عندك صلاحية الدعوة. كليك يمين على اسم اللاعب في اللوبي أو الشانل، واختار 'Invite to Clan'. اللاعب هياخد دعوة ويقدر يقبل أو يرفض.",
      },
      {
        id: "25",
        title: "How do I create/join a clan in CrossFire?",
        titleAr: "إزاي أعمل أو أنضم لكلان في CrossFire؟",
        body: "To create a clan:\n1. Go to the Clan menu in the game lobby.\n2. Select 'Create Clan'.\n3. Choose a unique clan name and tag.\n4. Pay the clan creation fee in GP.\n5. Your clan is created and you become the leader.\n\nTo join a clan:\n1. Accept an invitation from a clan leader.\n2. Or search for open clans and apply to join.",
        bodyAr: "عشان تعمل كلان:\n1. روح قايمة الكلان في لوبي اللعبة.\n2. اختار 'Create Clan'.\n3. اختار اسم وتاج فريدين للكلان.\n4. ادفع رسوم إنشاء الكلان بالـ GP.\n5. الكلان هيتعمل وانت هتبقى القايد.\n\nعشان تنضم لكلان:\n1. اقبل دعوة من قايد كلان.\n2. أو ابحث عن كلانات مفتوحة وقدم طلب انضمام.",
      },
      {
        id: "26",
        title: "How do I delete my clan?",
        titleAr: "إزاي أمسح الكلان بتاعي؟",
        body: "Only the Clan Leader can delete a clan. To delete your clan:\n1. Go to the Clan management menu.\n2. Select 'Disband Clan' or 'Delete Clan'.\n3. Confirm your decision.\n\nNote: All clan members will be removed and clan data will be lost permanently. Make sure you want to do this before confirming.",
        bodyAr: "بس قايد الكلان اللي يقدر يمسح الكلان. عشان تمسح الكلان بتاعك:\n1. روح قايمة إدارة الكلان.\n2. اختار 'Disband Clan' أو 'Delete Clan'.\n3. أكد قرارك.\n\nملاحظة: كل الأعضاء هيتحذفوا وبيانات الكلان هتتمسح نهائيًا. تأكد إنك عايز تعمل كده قبل ما تأكد.",
      },
      {
        id: "27",
        title: "How do I leave my clan?",
        titleAr: "إزاي أسيب الكلان بتاعي؟",
        body: "To leave your current clan:\n1. Go to the Clan menu.\n2. Select 'Leave Clan'.\n3. Confirm your choice.\n\nNote: If you are the Clan Leader, you must transfer leadership to another member before leaving, or disband the clan.",
        bodyAr: "عشان تسيب الكلان الحالي:\n1. روح قايمة الكلان.\n2. اختار 'Leave Clan'.\n3. أكد اختيارك.\n\nملاحظة: لو انت قايد الكلان، لازم تنقل القيادة لعضو تاني الأول قبل ما تسيب، أو تحل الكلان.",
      },
      {
        id: "28",
        title: "What is a clan?",
        titleAr: "إيه هو الكلان؟",
        body: "A clan is a group of players who join together under a common name and tag. Clans allow players to:\n- Play together regularly\n- Participate in clan wars\n- Build a community within CrossFire\n- Earn clan rankings and rewards\n- Have a clan page with member statistics",
        bodyAr: "الكلان هو مجموعة لاعبين بيتجمعوا تحت اسم وتاج مشترك. الكلان بيخلي اللاعبين:\n- يلعبوا مع بعض بانتظام\n- يشاركوا في حروب الكلانات\n- يبنوا مجتمع داخل CrossFire\n- يكسبوا ترتيبات ومكافآت للكلان\n- يكون عندهم صفحة كلان مع إحصائيات الأعضاء",
      },
      {
        id: "29",
        title: "What is the clan page? Can I manage my clan from the website?",
        titleAr: "إيه هو صفحة الكلان؟ أقدر أدير الكلان من الموقع؟",
        body: "The clan page is a web page on z8games.com that shows your clan's information including:\n- Clan name, tag, and logo\n- Member list and their ranks\n- Clan statistics and achievements\n\nYou can view clan information from the website, but most clan management (adding/removing members, etc.) is done within the game itself.",
        bodyAr: "صفحة الكلان هي صفحة ويب على z8games.com بتعرض معلومات الكلان بتاعك زي:\n- اسم الكلان، التاج، واللوجو\n- قايمة الأعضاء ورتبهم\n- إحصائيات الكلان وإنجازاته\n\nتقدر تشوف معلومات الكلان من الموقع، بس معظم إدارة الكلان (إضافة/حذف أعضاء، إلخ) بيتعمل جوا اللعبة نفسها.",
      },
    ],
  },
  {
    id: "gms-mods",
    name: "CrossFire GMs and MODs",
    nameAr: "مشرفو CrossFire (GMs) والـ MODs",
    articles: [
      {
        id: "30",
        title: "How can I become a GM?",
        titleAr: "إزاي أبقى GM؟",
        body: "Game Master (GM) positions at Z8Games are staff positions and are not open for public application at all times. When Z8Games is looking for new GMs, they typically announce it through official channels. Keep an eye on their official Discord, website, and social media for any recruitment announcements.",
        bodyAr: "وظايف الـ Game Master (GM) في Z8Games هي وظايف رسمية ومش دايمًا متاحة للتقديم. لما Z8Games بتدور على GMs جدد، بتعلن عن ده في قنواتها الرسمية. خلي عينك على الديسكورد الرسمي والموقع ومواقع التواصل الاجتماعي لأي إعلانات توظيف.",
      },
      {
        id: "31",
        title: "How do I contact a GM?",
        titleAr: "إزاي أتواصل مع GM؟",
        body: "You can contact GMs through:\n1. The official CrossFire Discord server.\n2. Submitting a support ticket on the help center.\n3. During in-game GM events.\n\nNote: GMs will never ask for your account password. If someone claiming to be a GM asks for your password, it is a scammer.",
        bodyAr: "تقدر تتواصل مع الـ GMs عن طريق:\n1. سيرفر الديسكورد الرسمي لـ CrossFire.\n2. بعت تذكرة ساببورت في مركز المساعدة.\n3. في إيفنتات الـ GM الجوا اللعبة.\n\nملاحظة: الـ GMs مش هيطلبوا منك الباسورد بتاعك أبدًا. لو حد بيدّعي إنه GM وطلب الباسورد، ده نصاب!",
      },
      {
        id: "32",
        title: "How do I know if someone is a GM?",
        titleAr: "إزاي أعرف إن شخص ما هو GM فعلًا؟",
        body: "Official GMs in CrossFire have special indicators:\n- They have a GM tag or special title next to their name.\n- They are listed on the official CrossFire website and Discord.\n- Their accounts are verified through official channels.\n\nWarning: GMs will NEVER ask for your password, personal information, or ZP. Anyone claiming to be a GM and asking for these things is a scammer.",
        bodyAr: "الـ GMs الرسميين في CrossFire عندهم علامات مميزة:\n- عندهم تاج GM أو لقب خاص جنب اسمهم.\n- مذكورين على الموقع الرسمي لـ CrossFire والديسكورد.\n- حساباتهم متأكدة من القنوات الرسمية.\n\nتحذير: الـ GMs مش هيطلبوا الباسورد بتاعك أو بياناتك الشخصية أو ZP أبدًا. أي حد بيدّعي إنه GM وبيطلب حاجة زي دي هو نصاب!",
      },
      {
        id: "33",
        title: "What is a GM?",
        titleAr: "إيه هو الـ GM؟",
        body: "GM stands for Game Master. GMs are Z8Games staff members responsible for:\n- Moderating the game community\n- Organizing and hosting in-game events\n- Enforcing game rules and policies\n- Helping players with issues\n- Reporting bugs and feedback to the development team",
        bodyAr: "GM اختصار لـ Game Master. الـ GMs هم موظفون من Z8Games مسؤولون عن:\n- الإشراف على مجتمع اللعبة\n- تنظيم وتشغيل الإيفنتات الجوا اللعبة\n- تطبيق قواعد وسياسات اللعبة\n- مساعدة اللاعبين في مشاكلهم\n- الإبلاغ عن البجز والملاحظات لفريق التطوير",
      },
      {
        id: "34",
        title: "What is a MOD? And what are their responsibilities?",
        titleAr: "إيه هو الـ MOD وإيه مسؤولياته؟",
        body: "MOD stands for Moderator. MODs are community volunteers who help manage the CrossFire community. Their responsibilities include:\n- Moderating forums and social media channels\n- Reporting violations to GMs\n- Helping players with questions\n- Maintaining a positive community environment\n\nMODs are not Z8Games employees but work closely with the GM team.",
        bodyAr: "MOD اختصار لـ Moderator (مشرف). الـ MODs هم متطوعون من المجتمع بيساعدوا في إدارة مجتمع CrossFire. مسؤولياتهم شاملة:\n- الإشراف على الفوروم وقنوات التواصل الاجتماعي\n- الإبلاغ عن المخالفات للـ GMs\n- مساعدة اللاعبين في استفساراتهم\n- الحفاظ على بيئة مجتمعية إيجابية\n\nالـ MODs مش موظفين في Z8Games بس بيشتغلوا بشكل وثيق مع فريق الـ GMs.",
      },
      {
        id: "35",
        title: "Who are the current CrossFire GMs?",
        titleAr: "مين هم الـ GMs الحاليين في CrossFire؟",
        body: "The current GMs working on CrossFire can be found on the official CrossFire Discord server. Join the Discord to see the full list of active GMs and their roles.",
        bodyAr: "هتلاقي الـ GMs الحاليين اللي بيشتغلوا على CrossFire على سيرفر الديسكورد الرسمي. انضم للديسكورد عشان تشوف القايمة الكاملة للـ GMs النشطين ومهامهم.",
      },
    ],
  },
  {
    id: "user-abuse-hacking",
    name: "User Abuse/Hacking",
    nameAr: "إساءة الاستخدام والهاك",
    articles: [
      {
        id: "36",
        title: "How do I report a hacker?",
        titleAr: "إزاي أبلغ عن هاكر؟",
        body: "To report a hacker, you need to submit a replay file as evidence:\n1. After a match, click 'Save' on the results screen to save the replay.\n2. The replay file will be saved to: C:\\Users\\username\\Documents\\Cross Fire\\Replay\n3. Log into z8games.com and go to the support site.\n4. Click the 'Hacking Report' button and submit your report with the replay file.\n\nNote: Only reports with replay files will be considered. Reports without evidence cannot be processed.",
        bodyAr: "عشان تبلغ عن هاكر، محتاج ترفع ريبلاي كدليل:\n1. بعد الماتش، دوس 'Save' في شاشة النتايج عشان تحفظ الريبلاي.\n2. الريبلاي هيتحفظ في: C:\\Users\\username\\Documents\\Cross Fire\\Replay\n3. لوج إن على z8games.com وروح لموقع الساببورت.\n4. دوس زرار 'Hacking Report' وارفع التقرير مع ملف الريبلاي.\n\nملاحظة: بس التقارير اللي معاها ريبلاي اللي هتتنظر. التقارير من غير دليل مش هتتعالج.",
      },
      {
        id: "37",
        title: "I am getting harassed by a player in CrossFire. What should I do?",
        titleAr: "في لاعب بيضايقني في CrossFire. إيه اللي أعمله؟",
        body: "If you're being harassed by another player:\n1. Submit a new support ticket with the harasser's name.\n2. Describe the nature of the harassment.\n3. Include a screenshot as proof.\n\nIn-game abuse will not be tolerated at Z8Games and offenders will be dealt with swiftly and sternly.",
        bodyAr: "لو في لاعب بيضايقك:\n1. ابعت تذكرة ساببورت جديدة باسم اللي بيضايقك.\n2. اوصف طبيعة التحرش.\n3. ضمّن سكرين شوت كدليل.\n\nZ8Games مش بتتسامح مع الإساءة في اللعبة والمخالفين هيتعاملوا معاهم بجدية وبسرعة.",
      },
      {
        id: "38",
        title: "I found a player with an offensive/inappropriate character name. What should I do?",
        titleAr: "لاقيت لاعب باسم مسيء/غير لائق. إيه اللي أعمله؟",
        body: "If you find a player with an offensive or inappropriate name:\n1. Open a new customer service ticket.\n2. Include the offensive/inappropriate name in the ticket.\n3. Add a screenshot of the incident if possible.\n\nOffensive/inappropriate names will not be tolerated at Z8Games and offenders will be dealt with swiftly and sternly.",
        bodyAr: "لو لاقيت لاعب باسم مسيء أو غير لائق:\n1. افتح تذكرة خدمة عملاء جديدة.\n2. ضمّن الاسم المسيء في التذكرة.\n3. ضيف سكرين شوت للحادثة لو ممكن.\n\nZ8Games مش بتتسامح مع الأسامي المسيئة أو غير اللائقة والمخالفين هيتعاملوا معاهم بجدية وبسرعة.",
      },
      {
        id: "39",
        title: "My account has been permanently blocked because I used hacks. Can I get it back?",
        titleAr: "حسابي اتحجب نهائيًا لأني استخدمت هاكس. أقدر أسترده؟",
        body: "No. Any usage of hacks will result in a permanent ban for all associated accounts. Using hacks violates the CrossFire Terms of Service and this decision is final and cannot be appealed.",
        bodyAr: "لا. أي استخدام للهاكس بيؤدي لحجب نهائي لكل الحسابات المرتبطة. استخدام الهاكس بينتهك شروط الخدمة لـ CrossFire والقرار ده نهائي ومش ممكن يتطعن فيه.",
      },
      {
        id: "40",
        title: "My account is blocked and I don't know why. What should I do?",
        titleAr: "حسابي اتحجب ومش عارف ليه. إيه اللي أعمله؟",
        body: "If your account has been blocked and you don't know why:\n1. Submit a support ticket/request.\n2. Provide your account username and any relevant details.\n3. A staff member will investigate and explain the reason for the block.\n\nNote: Blocks are typically applied for violations of the CrossFire Terms of Service.",
        bodyAr: "لو حسابك اتحجب ومش عارف ليه:\n1. ابعت تذكرة/طلب ساببورت.\n2. ضيف يوزرنيم حسابك وأي تفاصيل مهمة.\n3. موظف من الفريق هيحقق في الموضوع ويشرح سبب الحجب.\n\nملاحظة: الحجب بيتطبق عادةً على المخالفين لشروط خدمة CrossFire.",
      },
    ],
  },
];

function AccordionItem({
  question,
  questionAr,
  answer,
  answerAr,
  language,
  isOpen,
  onToggle,
}: {
  question: string;
  questionAr: string;
  answer: string;
  answerAr: string;
  language: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const displayQuestion = language === "ar" ? questionAr || question : question;
  const displayAnswer = language === "ar" ? answerAr || answer : answer;

  return (
    <div className="border border-border rounded-lg overflow-hidden mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium text-sm md:text-base pr-4">{displayQuestion}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 flex-shrink-0 text-primary" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-border bg-muted/20">
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
            {displayAnswer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [faqData, setFaqData] = useState(STATIC_FAQ_DATA);

  const { data: serverFaq } = useQuery({
    queryKey: ["/api/faq-categories"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/faq-categories");
        if (!res.ok) return null;
        return res.json();
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    if (serverFaq && Array.isArray(serverFaq) && serverFaq.length > 0) {
      setFaqData(serverFaq);
    }
  }, [serverFaq]);

  const allCategories = [
    { id: "all", name: "All Topics", nameAr: "كل المواضيع" },
    ...faqData.map((cat) => ({ id: cat.id, name: cat.name, nameAr: cat.nameAr })),
  ];

  const filteredData = faqData.filter((cat) => {
    if (activeCategory !== "all" && cat.id !== activeCategory) return false;
    return true;
  });

  const filterArticles = (articles: typeof STATIC_FAQ_DATA[0]["articles"]) => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.titleAr?.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q) ||
        a.bodyAr?.toLowerCase().includes(q)
    );
  };

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalArticles = faqData.reduce((sum, cat) => sum + cat.articles.length, 0);

  return (
    <>
      <PageSEO
        title={isAr ? "أسئلة شائعة — CrossFire Wiki" : "FAQ — CrossFire Wiki"}
        description={
          isAr
            ? "إجابات على أكتر الأسئلة شيوعًا عن CrossFire - اللعبة، الحسابات، الدعم الفني، والأكتر."
            : "Answers to the most common questions about CrossFire — gameplay, accounts, technical support, and more."
        }
        canonicalPath="/faq"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HelpCircle className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">
                {isAr ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {isAr
                ? "لاقي إجابات على أكتر الأسئلة شيوعًا عن CrossFire. لو مش لاقي إجاباتك، ابعتلنا تذكرة ساببورت."
                : "Find answers to the most common questions about CrossFire. If you can't find your answer, submit a support ticket."}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Badge variant="secondary">
                {totalArticles} {isAr ? "سؤال" : "articles"}
              </Badge>
              <Badge variant="outline">
                {faqData.length} {isAr ? "تصنيف" : "categories"}
              </Badge>
            </div>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? "ابحث في الأسئلة..." : "Search questions..."}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {allCategories.map((cat) => {
              const Icon = cat.id === "all" ? HelpCircle : CATEGORY_ICONS[cat.name] || HelpCircle;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {isAr ? cat.nameAr : cat.name}
                </button>
              );
            })}
          </div>

          <div className="space-y-8">
            {filteredData.map((category) => {
              const articles = filterArticles(category.articles);
              if (articles.length === 0) return null;
              const Icon = CATEGORY_ICONS[category.name] || HelpCircle;
              return (
                <div key={category.id}>
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">
                      {isAr ? category.nameAr : category.name}
                    </h2>
                    <Badge variant="secondary" className="ml-auto">
                      {articles.length}
                    </Badge>
                  </div>
                  <div>
                    {articles.map((article) => (
                      <AccordionItem
                        key={article.id}
                        question={article.title}
                        questionAr={article.titleAr || article.title}
                        answer={article.body}
                        answerAr={article.bodyAr || article.body}
                        language={language}
                        isOpen={!!openItems[article.id]}
                        onToggle={() => toggleItem(article.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredData.every((cat) => filterArticles(cat.articles).length === 0) && (
              <div className="text-center py-16 text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="text-lg">
                  {isAr
                    ? "مش لاقي نتايج. جرب كلمات تانية."
                    : "No results found. Try different keywords."}
                </p>
              </div>
            )}
          </div>

          <div className="mt-12 text-center p-6 bg-muted/30 rounded-xl border border-border">
            <HelpCircle className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold text-lg mb-2">
              {isAr ? "مش لاقي إجابتك؟" : "Still can't find your answer?"}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {isAr
                ? "فريق الدعم بتاعنا موجود يساعدك. ابعتلنا تذكرة وهنرد عليك في أسرع وقت."
                : "Our support team is here to help. Submit a ticket and we'll get back to you as soon as possible."}
            </p>
            <a
              href="/support"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
            >
              {isAr ? "ابعت تذكرة ساببورت" : "Submit a Support Ticket"}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
