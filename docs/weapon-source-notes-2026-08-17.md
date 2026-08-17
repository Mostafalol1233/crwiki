# ملاحظات مصدر الأسلحة — 17 أغسطس 2026

## مصدر Z8Games الرسمي

صفحة الكتالوج الرسمية هي: https://crossfire.z8games.com/weapons.html

تُظهر الصفحة فلاتر الاقتناء التالية: All، ZP، GP، MP، Zombie، VIP، New، إضافة إلى فئات Assault Rifles وSniper Rifles وSub Machine Guns وMachine Guns وShotguns وPistols وMelee وGrenades. الصفحة تعرض حاليًا 37 صفحة ترقيمًا، وتعرض في الصفحة الأولى أسلحة مثل QBZ-03-Demon و[T] AK-47-Demon وAK-47-K-CF Stars Beast وM4A1-S-Prometheus.

صور الكتالوج الفردية تُخدم من نطاق Z8Games الرسمي، مثل:
https://z8games.akamaized.net/cfna/web/inventory/weapons/540_400/C5469.png
https://z8games.akamaized.net/cfna/web/inventory/weapons/540_400/C8019.png

## مصدر المتجر الرسمي

صفحة المتجر الرسمية هي: https://crossfire.z8games.com/shop/

الصفحة تعرض عناصر بسعر EP، وتشمل أسلحة مباشرة مثل M4A1-S-Pure Silver وAK47-Scope-Red Dragon وDesert Eagle Tiger وDual Colt - Red Dragon بسعر 600 EP، كما تعرض صناديق مثل AK-47-Buster-Ice Crate وM60-Bloodthirst Crate وAWM-Invictus Crate بسعر 1,000 EP. هذا يثبت أن EP متجر مستقل عن GP وZP وMP، ولا يجوز نسب هذه العناصر إلى GP أو ZP بلا دليل.

## حالة بيانات الإنتاج

نقطة الإنتاج /api/content?type=weapons أعادت 1,000 سجلًا. عدد 996 سجلًا يحمل وصفًا عامًا بصيغة «اسم السلاح - CrossFire weapon.»، وثلاثة سجلات بلا صورة، والفئات الحالية تشمل 422 Assault Rifle و304 Sniper Rifle و131 Melee و68 Pistol و33 Shotgun و30 Grenade و6 SMG و5 Machine Gun وسجلًا واحدًا Imported.

لذلك يجب عدم نسخ الوصف الحالي أو اعتباره مصدرًا. طبقة الإثراء الجديدة ستحتفظ بحالة verification، ورابط المصدر، وطريقة اقتناء unverified عندما لا يوجد دليل فردي قابل للتحقق.

## مبدأ التدقيق

لا تُستنتج طريقة الاقتناء من اسم السلاح أو من صورة Roadmap. إذا كان الدليل يثبت أنه ظاهر في الكتالوج فقط، تُسجل حالة «مذكور في الكتالوج الرسمي؛ طريقة الاقتناء غير محددة». وإذا ظهر في صفحة متجر، يُسجل اسم المتجر والعملة كما وردا. أما Lapis وDemon وBlack Market فتحتاج إلى صفحة إعلان أو سجل رسمي خاص بها، ولا تُعمم على كل نسخة تحمل اللاحقة نفسها.

## صفحة مرجعية فردية وفروق المصدر

صفحة AK47 في الموسوعة المرجعية: https://crossfirefps.fandom.com/wiki/AK47
تقدم الصفحة وصف السلاح، نوعه كسلاح هجومي، الشركة المصنعة، وقسم Obtainable الذي يذكر Item Shop وWeapon Master وBasic Weapon (WE)، كما تفصل بين Overview وAvailability. هذه البيانات مفيدة لإنشاء وصف أساسي، لكن الصفحة ليست مصدرًا أوليًا من Z8Games، لذلك يجب وسمها كمرجع ثانوي وعدم تحويل معلومات إصدار منطقة إلى حقيقة عالمية.

صفحة AK47-Beast: https://crossfirefps.fandom.com/wiki/AK47-Beast
توضح أن الصفحة تصنفه VVIP وتذكر في Obtainable: Black Market وItem Shop (VVIP) وReturning Players System في بعض المناطق وEvent. هذا يثبت أن طريقة الاقتناء قد تختلف حسب الإصدار والمنطقة، ولذلك لا يجوز تسجيل «Black Market» كطريقة وحيدة لكل نسخة أو كل سيرفر.

صفحة فئات الأسلحة: https://crossfirefps.fandom.com/wiki/Weapons
تذكر بصورة عامة Item Shop وMileage Shop وBlack Market، وتذكر GP وMP وCash، إضافة إلى صناديق Mutation/Zombie وReward Crates وأنظمة الجمع. هذه الصفحة تصلح لتصنيف taxonomy فقط، لا لإثبات طريقة اقتناء سلاح فردي في CrossFire West.

## قرار جودة البيانات

بسبب وجود 1,000 سجل إنتاجي مقابل كتالوج Z8Games الظاهر في 37 صفحة، سيعمل الإثراء على مستويين: سجل موثق مباشرة من Z8Games عندما يتطابق الاسم والصورة أو يظهر في المتجر/الإعلان، وسجل مرجعي ثانوي عندما يتوفر وصف فردي في الموسوعة مع رابط واضح. أي سجل لا يحمل دليلًا فرديًا سيظهر في الواجهة بعبارة أن طريقة الاقتناء غير متحققة بدل تخمين GP أو ZP أو Lapis.

## مصدر endpoint في كتالوج Z8Games

صفحة الكتالوج تحمل ملف JavaScript رسميًا باسم `page_weapon_search.js` من نطاق `z8games.akamaized.net/cfna/templates/assets/js/pages/`. يظهر أن الكتالوج تفاعلي ويعتمد endpoint داخليًا لجلب صفحات النتائج؛ لا ينبغي الاعتماد على طلب curl مباشر إذا أعاد 403، بل يجب قراءة الطلب من سياق الصفحة نفسه أو الاكتفاء بالبيانات المرئية والمصادر الرسمية القابلة للرابط.

## ملاحظة عن ملف JavaScript

المسار الذي ظهر في DOM لملف `page_weapon_search.js` أعاد صفحة «Not found» عند فتحه مباشرة من نطاق CDN. لذلك لم أعتبر endpoint أو معاملات غير مرئية حقيقة موثقة، واستمررت في استخدام الكتالوج الرسمي الظاهر والروابط الفردية الثابتة، مع إبقاء نتائج الاقتناء غير المعروفة معلّمة صراحة.

## تدقيق سلامة الاقتناء

تتضمن السجلات المرجعية المستخرجة تسميات مثل `Item Shop` و`Black Market` و`Mileage Shop` و`Event` و`VVIP System` وأنظمة المكافآت والأنماط. لم تتضمن البيانات الخام تسمية اقتناء صريحة باسم `Lapis`. كما أن ظهور `Demon` أو `Demonic` أو `Bull Demon King` في اسم السلاح أو وصفه لا يُعامل كدليل على إصدار Lapis أو على طريقة اقتناء محددة. لذلك تحتفظ جميع سجلات الاقتناء في `shared/weapon-descriptions.ts` بالقيمة `acquisitionVerified: false` إلى أن يؤكدها متجر إقليمي رسمي أو إعلان Black Market أو إعلان Lapis أو صفحة إصدار من Z8Games. وتعرض الواجهة هذه البيانات بوصفها ملاحظة مرجعية مع تنبيه مستقل إلى أن التأكيد الإقليمي مطلوب.

تبقى سجلات إصدارات CrossFire West الفردية الثمانية عشر الموثقة في `shared/crossfire-west-recent-weapons.ts`، ولا تُستخدم صور Roadmap المجمعة لإثبات طريقة اقتناء سلاح فردي.
