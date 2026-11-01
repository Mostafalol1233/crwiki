const base = String(process.env.VITE_SUPABASE_URL || '').replace(/[\r\n]/g, '').replace(/\/$/, '');
const key = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SERVICE_ROLE || process.env.service_role;
if (!base || !key) throw new Error('Supabase URL and service key are required');

const reportImage = `${base}/storage/v1/object/public/media/editorial/reporting/crossfire-support-center.jpg`;
const officialGuide = 'https://help.z8games.com/hc/en-us/articles/38957683167515-How-do-I-report-a-hacker';
const supportHome = 'https://help.z8games.com/';
const harassmentGuide = 'https://help.z8games.com/hc/en-us/articles/3895770686299-I-am-getting-harassed-by-a-player-in-CrossFire-What-should-I-do';

const content = `
<h2>Report the violation, not the person</h2>
<p>A strong report is factual, calm, and easy for the support team to verify. This guide separates hacking, harassment, and offensive names so you can send the report through the channel that matches the problem.</p>
<figure class="article-figure"><img src="${reportImage}" alt="CrossFire support center page used for a reporting guide"><figcaption>Use the official CrossFire support center for a report that needs evidence or follow-up.</figcaption></figure>
<h2>Choose the right reporting route</h2>
<h3>Suspected hacking or cheating</h3>
<p>Open the official support center and choose the <strong>Hacking Report</strong> option shown on the left side of the page. The official help article explains that this form is for submitting a new hacking report. Use it when the evidence needs to be reviewed outside the match.</p>
<h3>Harassment, insults, or threats</h3>
<p>Submit a new support ticket. Include the player’s exact name and a short description of what happened. Keep the description specific: quote the message when necessary, explain where it appeared, and include the date and approximate time.</p>
<h3>Offensive or inappropriate character names</h3>
<p>Use the support center and describe the exact character name or clan tag. Do not replace the name with an accusation or a guess about the player’s identity.</p>
<h2>Evidence that helps the review</h2>
<ol>
<li>Record the full moment when possible, including the scoreboard or room information.</li>
<li>Keep the player name, server or region, mode, map, date, and approximate time visible.</li>
<li>For chat abuse, capture the complete message and enough surrounding context to show who sent it.</li>
<li>For suspected cheating, provide a short clip that shows the behavior more than once instead of a single unusual shot.</li>
<li>Keep the original file. Do not add arrows, filters, or edits that could hide important context.</li>
</ol>
<h2>What to write in the ticket</h2>
<p>Use a clear subject such as <strong>Report: player name — suspected hacking</strong> or <strong>Report: player name — harassment</strong>. In the description, answer four questions: who was involved, what happened, when and where it happened, and what evidence you attached.</p>
<blockquote class="article-callout"><strong>Privacy and safety:</strong> Never include your password, verification code, payment details, or private account information in a report. A report should contain evidence about the match or behavior, not secrets about your account.</blockquote>
<h2>What not to do</h2>
<ul>
<li>Do not publish accusations or private information about the player.</li>
<li>Do not send many empty reports for the same incident. One complete report is easier to review.</li>
<li>Do not retaliate in chat or alter the evidence after recording it.</li>
<li>Do not promise that a player will receive a specific punishment. The support team decides the outcome after review.</li>
</ul>
<h2>After sending the report</h2>
<p>Save the ticket number or confirmation message and use the support center for follow-up. The available form names and in-game menus can change between versions, so always follow the current instructions shown by official CrossFire support.</p>
<p class="article-source-note"><strong>Official references:</strong> <a href="${officialGuide}">How do I report a hacker?</a> · <a href="${harassmentGuide}">I am getting harassed by a player</a> · <a href="${supportHome}">Z8Games Support Center</a></p>
`;

const contentAr = `
<h2>بلّغ عن المخالفة، مش عن الشخص</h2>
<p>البلاغ القوي يكون هادئًا ومحددًا وسهل التحقق منه. افصل بين الغش والتحرش والاسم غير اللائق، واستخدم مسار الدعم المناسب لكل حالة بدل إرسال وصف عام.</p>
<figure class="article-figure"><img src="${reportImage}" alt="واجهة مركز دعم كروس فاير المستخدمة في شرح طريقة الإبلاغ"><figcaption>استخدم مركز دعم كروس فاير الرسمي عندما تحتاج إلى إرسال دليل أو متابعة البلاغ.</figcaption></figure>
<h2>اختار طريقة البلاغ الصحيحة</h2>
<h3>الاشتباه في الهاك أو الغش</h3>
<p>افتح مركز الدعم الرسمي واختر خيار <strong>Hacking Report</strong> الظاهر في الجانب الأيسر. المقال الرسمي يوضح أن هذا النموذج مخصص لإرسال بلاغ جديد عن الهاك. استخدمه عندما يحتاج الدليل إلى مراجعة خارج المباراة.</p>
<h3>الشتيمة أو التحرش أو التهديد</h3>
<p>أرسل تذكرة دعم جديدة. اكتب اسم اللاعب بالضبط واشرح ما حدث باختصار. لو الموضوع متعلق برسالة، اكتب نصها كما ظهر، وحدد مكان ظهورها وتاريخها والوقت التقريبي.</p>
<h3>اسم لاعب أو كلان غير لائق</h3>
<p>استخدم مركز الدعم واكتب الاسم أو علامة الكلان كما ظهرت. لا تستبدل الاسم باتهام أو تخمين عن هوية صاحبه.</p>
<h2>الأدلة التي تساعد على المراجعة</h2>
<ol>
<li>سجل اللحظة كاملة قدر الإمكان، مع ظهور لوحة النتائج أو بيانات الغرفة.</li>
<li>خلّي اسم اللاعب والسيرفر أو المنطقة والمود والماب والتاريخ والوقت التقريبي واضحين.</li>
<li>في بلاغات الشات، صوّر الرسالة كاملة مع جزء كافٍ من السياق لمعرفة من أرسلها.</li>
<li>في بلاغ الهاك، أرسل مقطعًا قصيرًا يوضح التصرف أكثر من مرة بدل لقطة واحدة غريبة.</li>
<li>احتفظ بالملف الأصلي، ومتضيفش أسهم أو فلاتر أو تعديلات ممكن تخفي جزءًا من الدليل.</li>
</ol>
<h2>تكتب إيه في التذكرة؟</h2>
<p>استخدم عنوانًا واضحًا مثل <strong>بلاغ: اسم اللاعب — اشتباه في هاك</strong> أو <strong>بلاغ: اسم اللاعب — إساءة</strong>. داخل الوصف جاوب على أربع نقاط: مين اللاعب، إيه اللي حصل، إمتى وفين حصل، وإيه الأدلة اللي أرفقتها.</p>
<blockquote class="article-callout"><strong>الخصوصية والأمان:</strong> متكتبش كلمة السر أو كود التحقق أو بيانات الدفع أو أي معلومات خاصة بالحساب. البلاغ يحتاج دليلًا عن المباراة أو التصرف، مش أسرار حسابك.</blockquote>
<h2>حاجات متعملهاش</h2>
<ul>
<li>متنشرش اتهامات أو بيانات شخصية عن اللاعب.</li>
<li>متبعتش بلاغات كثيرة فاضية عن نفس الواقعة. البلاغ الواحد المفصل أسهل في المراجعة.</li>
<li>متنتقمش في الشات، ومتعدلش الدليل بعد تسجيله.</li>
<li>متوعدش إن لاعبًا هيتعاقب بعقوبة معينة. فريق الدعم هو اللي بيحدد النتيجة بعد المراجعة.</li>
</ul>
<h2>بعد إرسال البلاغ</h2>
<p>احتفظ برقم التذكرة أو رسالة التأكيد، واستخدم مركز الدعم للمتابعة. أسماء النماذج وقوائم الإبلاغ داخل اللعبة ممكن تختلف حسب الإصدار، لذلك اتبع التعليمات الظاهرة حاليًا في دعم كروس فاير الرسمي.</p>
<p class="article-source-note"><strong>مراجع رسمية:</strong> <a href="${officialGuide}">طريقة الإبلاغ عن الهاكر</a> · <a href="${harassmentGuide}">الإبلاغ عن التحرش من لاعب</a> · <a href="${supportHome}">مركز دعم زد 8 جيمز</a></p>
`;

const payload = {
  title: 'How to Report Hackers, Harassment, and Offensive Names in CrossFire',
  title_ar: 'إزاي تعمل بلاغ عن الهاك أو الشتيمة أو الاسم غير اللائق في كروس فاير؟',
  category: 'guides',
  image_url: reportImage,
  og_image: reportImage,
  content,
  content_ar: contentAr,
  summary: 'A calm, evidence-first guide to reporting suspected hacking, harassment, threats, and offensive names through the correct CrossFire support route.',
  seo_title: 'How to Report Hackers and Harassment in CrossFire | CrossFire Wiki',
  seo_description: 'Learn what to report, which CrossFire support route to use, and how to prepare clear evidence without exposing private account information.',
  focus_keyword: 'how to report hackers in CrossFire',
  seo_keywords: ['CrossFire report hacker', 'CrossFire harassment report', 'CrossFire support', 'بلاغ هاك كروس فاير'],
  source_url: officialGuide,
  gallery: [{ url: reportImage, description: 'CrossFire support center' }],
  images: [reportImage],
  featured: true,
  preview_on_home: true,
  reading_time: 6,
  updated_at: new Date().toISOString(),
};

const response = await fetch(`${base}/rest/v1/posts?post_slug=eq.how-to-report-hackers-harassment-crossfire`, {
  method: 'PATCH',
  headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
  body: JSON.stringify(payload),
});
const text = await response.text();
if (!response.ok) throw new Error(`${response.status}: ${text}`);
console.log(JSON.stringify(JSON.parse(text).map((row) => ({ id: row.id, title: row.title, image_url: row.image_url, updated_at: row.updated_at })), null, 2));
