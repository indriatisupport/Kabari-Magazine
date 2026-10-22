/* =====================================================================
   Kabari Assistant  |  free, runs 100% in the browser (no API, no server)
   Answers from data.js (ISSUES, CONFIG) and site.js (T strings).
   INSTALL: add this line AFTER <script src="site.js"></script> on every page:
            <script src="chat.js"></script>
   ===================================================================== */
(function () {
'use strict';

/* ---------- language helpers ---------- */
const SL = () => (typeof lang !== 'undefined' && lang === 'id') ? 'id' : 'en';
let RL = 'en';                                   // language of the reply being built
const mn = m => (RL === 'id' ? MONTHS_ID : MONTHS_EN)[m - 1];
const tt = k => (T[k] ? (T[k][RL] || T[k].en) : k);
const P = (en, id) => ({ t: 'p', v: RL === 'id' ? id : en });
const chips = a => ({ t: 'chips', v: a });
const links = a => ({ t: 'links', v: a });
const issue = i => ({ t: 'issue', v: i });
const lab = o => (typeof o === 'string' ? o : (o[RL] || o.en));
const one = a => a[Math.floor(Math.random() * a.length)];
const Pv = (en, id) => P(one(en), one(id));
const MEM = { name: '' };
const cap = w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
const RE_NAME = /\b(?:my name is|i am called|i'm called|call me|nama saya|namaku|panggil saya)\s+([A-Za-z\u00C0-\u00FF][A-Za-z\u00C0-\u00FF'’-]{1,20})/i;
function learn(q) { const m = String(q).match(RE_NAME); if (m) MEM.name = cap(m[1]); }
const aiOn = () => typeof CONFIG !== 'undefined' && !!CONFIG.chatEndpoint;

/* ---------- text normalising and language detection ---------- */
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s\/\-.@']/g, ' ').replace(/\s+/g, ' ').trim();
const ID_W = /\b(edisi|bulan|tahun|terbaru|terkini|berlangganan|langganan|hubungi|kontak|alamat|lokasi|tentang|bagaimana|dimana|siapa|bisa|tolong|halo|hai|terima kasih|makasih|arsip|majalah|unduh|baca|pertama|sebelumnya|berapa|apa|ada|dan|yang|untuk|mei|agustus|januari|februari|maret|juni|juli|oktober|desember|gratis|aplikasi)\b/g;
const EN_W = /\b(issue|issues|edition|latest|newest|subscribe|contact|where|about|how|what|who|can|please|hello|hi|thanks|the|is|are|do|you|your|download|read|free|app|many)\b/g;
function pick(q) {
  const n = norm(q), a = (n.match(ID_W) || []).length, b = (n.match(EN_W) || []).length;
  return a > b ? 'id' : b > a ? 'en' : SL();
}

/* ---------- date parsing: "Sep 2012", "september 2012", "2012-09", "9/2012", "Agustus 2025" ---------- */
const MW = { january:1,jan:1,januari:1,february:2,feb:2,februari:2,pebruari:2,march:3,mar:3,maret:3,april:4,apr:4,may:5,mei:5,june:6,jun:6,juni:6,july:7,jul:7,juli:7,august:8,aug:8,agustus:8,agu:8,agt:8,ags:8,september:9,sep:9,sept:9,october:10,oct:10,oktober:10,okt:10,november:11,nov:11,nopember:11,december:12,dec:12,desember:12,des:12 };
const MR = Object.keys(MW).sort((a, b) => b.length - a.length).join('|');
const RE_MY = new RegExp('\\b(' + MR + ')\\.?\\s*(?:of\\s+|,\\s*)?(20[0-3]\\d)\\b', 'g');
const RE_YM = new RegExp('\\b(20[0-3]\\d)\\s*,?\\s*(' + MR + ')\\b', 'g');
const RE_N1 = /\b(20[0-3]\d)[-\/.](0?[1-9]|1[0-2])\b/g;
const RE_N2 = /\b(0?[1-9]|1[0-2])[-\/.](20[0-3]\d)\b/g;
const RE_MONLY = new RegExp('\\b(' + MR + ')\\b');
const RE_KEY = /\b(issue|issues|edition|editions|edisi|magazine|majalah|kabari)\b/;
function dates(n) {
  const list = [], seen = new Set();
  const add = (y, m) => { const k = y + '-' + m; if (!seen.has(k)) { seen.add(k); list.push({ y: +y, m: +m }); } };
  let s = ' ' + n + ' ';
  s = s.replace(RE_MY, (_, w, y) => { add(y, MW[w]); return ' '; });
  s = s.replace(RE_YM, (_, y, w) => { add(y, MW[w]); return ' '; });
  s = s.replace(RE_N1, (_, y, m) => { add(y, m); return ' '; });
  s = s.replace(RE_N2, (_, m, y) => { add(y, m); return ' '; });
  const years = [...new Set(s.match(/\b20[0-3]\d\b/g) || [])].map(Number);
  return { list, years };
}

/* ---------- answer builders (each returns an array of "parts") ---------- */
const MAIL = () => ({ l: { en: 'Email us', id: 'Kirim email' }, href: 'mailto:' + CONFIG.email });
const ISSUU = () => ({ l: 'Issuu', href: CONFIG.issuu, ext: 1 });

function hRange(y, m) {
  const f = CONFIG.startYear, L0 = ISSUES[0];
  if (y < f) return [
    P(`Our online archive starts in ${f}, so ${m ? mn(m) + ' ' : ''}${y} isn't listed here. Kabari has been publishing since 2007, and you may find older editions on our Issuu page.`,
      `Arsip online kami dimulai pada ${f}, jadi ${m ? mn(m) + ' ' : ''}${y} tidak tersedia di sini. Kabari terbit sejak 2007, dan edisi lama mungkin ada di halaman Issuu kami.`),
    links([ISSUU()]), chips([{ l: String(f), run: () => hYear(f) }])];
  return [
    P(`${m ? mn(m) + ' ' : ''}${y} hasn't been published yet. The latest issue is ${mn(L0.m)} ${L0.y}:`,
      `${m ? mn(m) + ' ' : ''}${y} belum terbit. Edisi terbaru adalah ${mn(L0.m)} ${L0.y}:`), issue(L0)];
}
function inArchive(y, m) {
  const f = CONFIG.startYear, L0 = ISSUES[0];
  return !(y < f || y > L0.y || (m && y === L0.y && m > L0.m));
}
function hIssue(y, m) {
  if (!inArchive(y, m)) return hRange(y, m);
  const i = ISSUES.find(z => z.y === y && z.m === m);
  if (i.read || i.pdf) return [P(`Here is the ${mn(m)} ${y} issue:`, `Ini edisi ${mn(m)} ${y}:`), issue(i)];
  return [
    P(`The ${mn(m)} ${y} issue is in our archive list, but its online copy hasn't been uploaded yet. You can look for it on Kabari's Issuu page, or email us and we'll help.`,
      `Edisi ${mn(m)} ${y} tercatat di arsip kami, tetapi salinan onlinenya belum diunggah. Anda bisa mencarinya di halaman Issuu Kabari, atau kirim email kepada kami.`),
    issue(i), links([MAIL()])];
}
function hYear(y) {
  if (!inArchive(y)) return hRange(y);
  const l = ISSUES.filter(i => i.y === y).slice().reverse();
  return [
    P(`${y} has ${l.length} issue${l.length > 1 ? 's' : ''} (${mn(l[0].m)} to ${mn(l[l.length - 1].m)}). Tap a month:`,
      `Tahun ${y} memiliki ${l.length} edisi (${mn(l[0].m)} sampai ${mn(l[l.length - 1].m)}). Pilih bulan:`),
    chips(l.map(i => ({ l: mn(i.m), run: () => hIssue(y, i.m) }))),
    links([{ l: { en: `Open ${y} in the archive`, id: `Buka ${y} di arsip` }, href: 'archive.html?year=' + y }])];
}
function hMonthOnly(m) {
  const l = ISSUES.filter(i => i.m === m).slice(0, 4);
  return [
    P(`Which year? Here are the most recent ${mn(m)} issues:`, `Tahun berapa? Berikut edisi ${mn(m)} terbaru:`),
    chips(l.map(i => ({ l: `${mn(m)} ${i.y}`, run: () => hIssue(i.y, m) }))),
    P('Or type it like “' + mn(m) + ' 2020”.', 'Atau ketik seperti “' + mn(m) + ' 2020”.')];
}
const hLatest = () => [P(`The latest issue is ${mn(ISSUES[0].m)} ${ISSUES[0].y}:`, `Edisi terbaru adalah ${mn(ISSUES[0].m)} ${ISSUES[0].y}:`), issue(ISSUES[0])];
const hPrev = () => [P(`The issue before the latest is ${mn(ISSUES[1].m)} ${ISSUES[1].y}:`, `Edisi sebelum yang terbaru adalah ${mn(ISSUES[1].m)} ${ISSUES[1].y}:`), issue(ISSUES[1])];
const hFirst = () => {
  const f = ISSUES[ISSUES.length - 1];
  return [P(`Kabari has published since 2007. The oldest issue in our online archive is ${mn(f.m)} ${f.y}:`,
            `Kabari terbit sejak 2007. Edisi tertua di arsip online kami adalah ${mn(f.m)} ${f.y}:`), issue(f)];
};
const hArchive = () => {
  const L0 = ISSUES[0], yrs = [];
  for (let y = L0.y; y >= L0.y - 3; y--) yrs.push(y);
  return [
    P(`The archive has ${ISSUES.length} monthly issues, from ${CONFIG.startYear} to ${mn(L0.m)} ${L0.y}. Pick a year, or browse everything on the archive page.`,
      `Arsip memuat ${ISSUES.length} edisi bulanan, dari ${CONFIG.startYear} sampai ${mn(L0.m)} ${L0.y}. Pilih tahun, atau jelajahi semuanya di halaman arsip.`),
    chips(yrs.map(y => ({ l: String(y), run: () => hYear(y) }))),
    links([{ l: { en: 'Open the archive', id: 'Buka arsip' }, href: 'archive.html' }])];
};
const hSubscribe = () => {
  const href = (CONFIG.signup && CONFIG.signup.inline) ? 'contact.html#subscribe' : (CONFIG.signupUrl || 'mailto:' + CONFIG.email + '?subject=Subscribe');
  return [P('Subscribe by email and we will let you know when each new issue is published. You can unsubscribe at any time.',
            'Berlangganan lewat email dan kami akan memberi tahu Anda saat setiap edisi baru terbit. Anda dapat berhenti berlangganan kapan saja.'),
          links([{ l: { en: 'Go to the subscribe form', id: 'Ke formulir langganan' }, href }])];
};
const hContact = () => [
  P(`You can email the Kabari team at ${CONFIG.email}, or use the contact form.`, `Anda dapat mengirim email ke tim Kabari di ${CONFIG.email}, atau gunakan formulir kontak.`),
  links([MAIL(), { l: { en: 'Contact form', id: 'Formulir kontak' }, href: 'contact.html' }])];
const hLocation = () => [
  P(`Kabari Magazine is based in ${CONFIG.location}, and serves the Indonesian community across the United States.`,
    `Majalah Kabari berbasis di ${CONFIG.location}, melayani komunitas Indonesia di seluruh Amerika Serikat.`),
  links([MAIL()])];
const hAbout = () => [P(tt('ab1') + ' ' + tt('ab2'), tt('ab1') + ' ' + tt('ab2')), links([{ l: { en: 'About page', id: 'Halaman Tentang' }, href: 'about.html' }])];
const hHistory = () => [P(`${tt('tl07')} ${tt('tl12')} ${tt('tl17')}`, `${tt('tl07')} ${tt('tl12')} ${tt('tl17')}`), links([{ l: { en: 'Read our story', id: 'Baca kisah kami' }, href: 'about.html' }])];
const hTopics = () => [
  P('Kabari covers ' + CATS.map(c => tt('c_' + c) + ' (' + tt('tp_' + c).replace(/\.$/, '').toLowerCase() + ')').join('; ') + '.',
    'Kabari meliput ' + CATS.map(c => tt('c_' + c) + ' (' + tt('tp_' + c).replace(/\.$/, '').toLowerCase() + ')').join('; ') + '.'),
  P('Each monthly issue mixes these topics. You can browse issues by month and year.', 'Setiap edisi bulanan memuat campuran topik ini. Anda dapat menelusuri edisi per bulan dan tahun.'),
  links([{ l: { en: 'Browse the archive', id: 'Jelajahi arsip' }, href: 'archive.html' }])];
const hApp = () => {
  const a = CONFIG.apps || {}, l = [];
  if (a.appStore) l.push({ l: { en: 'App Store', id: 'App Store' }, href: a.appStore, ext: 1 });
  if (a.googlePlay) l.push({ l: { en: 'Google Play', id: 'Google Play' }, href: a.googlePlay, ext: 1 });
  const out = [P(tt('app_d'), tt('app_d'))];
  if (l.length) out.push(links(l));
  else out.push(P('The download links are being added to this site soon. Meanwhile you can read the available issues online.', 'Tautan unduhan akan segera ditambahkan di situs ini. Sementara itu, Anda dapat membaca edisi yang tersedia secara online.'), chips([{ l: { en: 'Latest issue', id: 'Edisi terbaru' }, run: hLatest }]));
  return out;
};
const hSocial = n => {
  const s = CONFIG.social || {}, names = { facebook: 'Facebook', instagram: 'Instagram', pinterest: 'Pinterest', x: 'X', youtube: 'YouTube' };
  let keys = Object.keys(s).filter(k => s[k]);
  const asked = keys.filter(k => n.includes(k) || (k === 'facebook' && /\bfb\b/.test(n)) || (k === 'instagram' && /\big\b/.test(n)));
  if (asked.length) keys = asked;
  return [P('Follow Kabari for stories, covers and community news:', 'Ikuti Kabari untuk kisah, sampul, dan kabar komunitas:'), links(keys.map(k => ({ l: names[k], href: s[k], ext: 1 })))];
};
const hRead = () => [
  P('Every issue marked as available can be read online or downloaded as a PDF for personal use. Tell me the month and year, like “Sep 2025”, or pick one:',
    'Setiap edisi yang tersedia dapat dibaca online atau diunduh sebagai PDF untuk penggunaan pribadi. Sebutkan bulan dan tahunnya, misalnya “Sep 2025”, atau pilih:'),
  chips([{ l: { en: 'Latest issue', id: 'Edisi terbaru' }, run: hLatest }, { l: { en: 'Browse by year', id: 'Jelajahi per tahun' }, run: hArchive }])];
const hPrice = () => [
  P('The issues on this website can be read online or downloaded as PDF for personal, non-commercial use. For anything about print copies, pricing or permissions, please email us.',
    'Edisi di situs ini dapat dibaca online atau diunduh sebagai PDF untuk penggunaan pribadi non-komersial. Untuk cetakan, harga, atau izin, silakan kirim email kepada kami.'),
  links([MAIL()])];
const hAdvertise = () => [
  P(`For advertising, partnerships or story submissions, please email ${CONFIG.email} with a short description and the Kabari team will get back to you.`,
    `Untuk iklan, kerja sama, atau pengiriman artikel, silakan kirim email ke ${CONFIG.email} dengan deskripsi singkat dan tim Kabari akan menghubungi Anda.`),
  links([MAIL(), { l: { en: 'Contact form', id: 'Formulir kontak' }, href: 'contact.html' }])];
const hLang = () => [P('The site and this assistant work in English and Indonesian. Use the EN / ID switch at the top of the page.', 'Situs dan asisten ini tersedia dalam bahasa Inggris dan Indonesia. Gunakan tombol EN / ID di bagian atas halaman.')];
const hWeb = () => [P(`Our website is ${CONFIG.website.replace('https://', '')}, and our digital editions are on Issuu.`, `Situs kami adalah ${CONFIG.website.replace('https://', '')}, dan edisi digital kami ada di Issuu.`), links([{ l: { en: 'Website', id: 'Situs web' }, href: CONFIG.website, ext: 1 }, ISSUU()])];
const hIssuu = () => [P('Kabari publishes its digital editions on Issuu.', 'Kabari menerbitkan edisi digitalnya di Issuu.'), links([ISSUU()])];
const hPrivacy = () => [aiOn()
  ? P('Our Privacy Policy explains what we collect and how we use it. Please note that chat messages are sent to an AI service to write replies, so please don’t share personal details here.', 'Kebijakan Privasi kami menjelaskan data yang kami kumpulkan dan penggunaannya. Perlu diketahui, pesan chat dikirim ke layanan AI untuk menulis balasan, jadi mohon jangan membagikan data pribadi di sini.')
  : P('Our Privacy Policy explains what we collect and how we use it. This chat runs in your browser and does not send your messages anywhere.', 'Kebijakan Privasi kami menjelaskan data yang kami kumpulkan dan penggunaannya. Chat ini berjalan di browser Anda dan tidak mengirim pesan Anda ke mana pun.'),
  links([{ l: { en: 'Privacy Policy', id: 'Kebijakan Privasi' }, href: 'privacy.html' }])];
const hTerms = () => [P('Our Terms of Service cover use of the site, copyright and links to other sites.', 'Ketentuan Layanan kami mencakup penggunaan situs, hak cipta, dan tautan ke situs lain.'), links([{ l: { en: 'Terms of Service', id: 'Ketentuan Layanan' }, href: 'terms.html' }])];
const hHelp = () => [
  P('I can find any issue by month and year (for example “Sep 2012” or “Agustus 2025”), list a whole year, open the latest issue, and answer questions about Kabari, subscribing, the app and contacting the team.',
    'Saya dapat menemukan edisi mana pun berdasarkan bulan dan tahun (misalnya “Sep 2012” atau “Agustus 2025”), menampilkan satu tahun penuh, membuka edisi terbaru, dan menjawab pertanyaan tentang Kabari, berlangganan, aplikasi, dan cara menghubungi tim.'),
  starters()];
const starters = () => chips([
  { l: { en: 'Latest issue', id: 'Edisi terbaru' }, run: hLatest },
  { l: { en: 'Browse by year', id: 'Jelajahi per tahun' }, run: hArchive },
  { l: { en: 'Subscribe', id: 'Berlangganan' }, run: hSubscribe },
  { l: { en: 'Contact', id: 'Kontak' }, run: hContact },
  { l: { en: 'About Kabari', id: 'Tentang Kabari' }, run: hAbout }]);
const hWelcome = () => [P('Hi! How can I help you today?', 'Halo! Ada yang bisa saya bantu hari ini?')];
const hFallback = () => [
  P('I’m not sure about that one. I can find any issue by month and year, and answer questions about Kabari. For anything else, the team is happy to help by email.',
    'Saya belum yakin soal itu. Saya bisa mencari edisi berdasarkan bulan dan tahun, dan menjawab pertanyaan tentang Kabari. Untuk hal lain, tim kami siap membantu lewat email.'),
  starters(), links([MAIL()])];

/* ---------- small talk (varied wording, so it never sounds canned) ---------- */
const hGreet = () => MEM.name
  ? [Pv(['Hello again, ' + MEM.name + '! What can I help you with?', 'Hi ' + MEM.name + '! Good to see you. How can I help?'], ['Halo lagi, ' + MEM.name + '! Ada yang bisa saya bantu?', 'Hai ' + MEM.name + '! Senang bertemu lagi. Ada yang bisa saya bantu?'])]
  : [Pv(['Hello! Nice to hear from you. What can I help you with today?', 'Hi there! How can I help you today?', 'Hey! Welcome to Kabari. Are you looking for a particular issue, or just browsing?'],
        ['Halo! Senang bertemu Anda. Ada yang bisa saya bantu hari ini?', 'Hai! Ada yang bisa saya bantu?', 'Halo, selamat datang di Kabari! Mencari edisi tertentu, atau sekadar melihat-lihat?'])];
const hNameSaid = () => MEM.name
  ? [Pv(['Nice to meet you, ' + MEM.name + '! How can I help you today?', 'Great to meet you, ' + MEM.name + '! What can I do for you?'], ['Senang berkenalan, ' + MEM.name + '! Ada yang bisa saya bantu?', 'Salam kenal, ' + MEM.name + '! Apa yang bisa saya bantu?'])]
  : [P('Nice to meet you! How can I help you today?', 'Senang berkenalan! Ada yang bisa saya bantu?')];
const hMemory = () => MEM.name
  ? [P('Yes, you told me your name is ' + MEM.name + '. I keep track of what you tell me in our chat, on this device.', 'Ya, Anda bilang nama Anda ' + MEM.name + '. Saya mengingat apa yang Anda ceritakan di chat ini, di perangkat ini.')]
  : [P('I don’t know your name yet. Tell me, and I’ll remember it while we chat on this device.', 'Saya belum tahu nama Anda. Beri tahu saya, dan saya akan mengingatnya selama kita mengobrol di perangkat ini.')];
const hHow = () => [Pv(
  ['I’m doing well, thanks for asking! How about you? Is there something I can help you find?', 'Doing great, thank you! What can I do for you today?'],
  ['Saya baik, terima kasih sudah bertanya! Bagaimana dengan Anda? Ada yang bisa saya bantu?', 'Baik-baik saja, terima kasih! Ada yang bisa saya bantu hari ini?'])];
const hWho = () => [P('I’m the Kabari virtual assistant, so not a person, but I’ll do my best to help like one. I can find any issue and answer questions about the magazine.',
  'Saya asisten virtual Kabari, jadi bukan manusia, tetapi saya akan berusaha membantu sebaik mungkin. Saya bisa mencari edisi mana pun dan menjawab pertanyaan tentang majalah.')];
const hOk = () => [Pv(['Great! Let me know if you need anything else.', 'Sounds good. I’m here if you have more questions.'], ['Baik! Kabari saya jika butuh yang lain.', 'Siap. Saya di sini kalau ada pertanyaan lain.'])];
const hThanks = () => [Pv(['You’re welcome! Anything else I can help with?', 'Happy to help! Just ask if you need anything else.'], ['Sama-sama! Ada lagi yang bisa saya bantu?', 'Senang bisa membantu! Tanya saja jika butuh yang lain.'])];
const hSorry = () => [Pv(['No problem at all! What can I help you with?', 'Nothing to apologize for. How can I help?'], ['Tidak masalah! Ada yang bisa saya bantu?', 'Tidak perlu minta maaf. Ada yang bisa saya bantu?'])];
const hPraise = () => [Pv(['Thank you, that’s kind of you! Is there anything else I can help with?', 'Glad I could help! Let me know if there’s more.'], ['Terima kasih, Anda baik sekali! Ada lagi yang bisa saya bantu?', 'Senang bisa membantu! Kabari saya jika ada lagi.'])];
const hBye = () => [Pv(['Goodbye! Come back when the next issue is out.', 'Take care! I’m here whenever you need me.'], ['Sampai jumpa! Kembali lagi saat edisi berikutnya terbit.', 'Jaga diri! Saya di sini kapan pun Anda butuh.'])];

/* ---------- intent rules (first match wins). kind: chat = local small talk, issue = exact lookup, info = site info ---------- */
const FULL = r => new RegExp('^(' + r + ')( there| kabari| all| semua| bot)?[ !.?]*$');
const RULES = [
  [FULL('hi|hello|hey|hallo|halo|hai|yo|assalamualaikum|selamat (pagi|siang|sore|malam)|good (morning|afternoon|evening)'), hGreet, 'chat'],
  [/\b(my name is|call me|i am called|i'm called|nama saya|namaku|panggil saya)\b/, hNameSaid, 'chat'],
  [/\b(my name|remember me|do you remember|do you know me|what did i (say|tell|ask)|who am i|nama saya siapa|ingat saya|kamu ingat)\b/, hMemory, 'info'],
  [/\b(how are you|how r u|how are things|how is it going|how's it going|what's up|whats up|apa kabar|lagi apa)\b/, hHow, 'chat'],
  [/\b(are you (a )?(bot|human|real|robot|ai|person|chatbot|machine)|who are you|what are you|your name|siapa kamu|siapa anda|kamu (siapa|bot|manusia)|apakah (kamu|anda) (bot|manusia))\b/, hWho, 'chat'],
  [/\b(thanks|thank you|thx|terima kasih|makasih)\b/, hThanks, 'chat'],
  [FULL('ok|okay|oke|okey|cool|great|nice|good|mantap|sip|alright|got it|i see|noted|understood'), hOk, 'chat'],
  [/\b(sorry|maaf)\b/, hSorry, 'chat'],
  [/\b(good (job|bot)|awesome|amazing|you('re| are) (great|helpful|smart|awesome)|keren|helpful)\b/, hPraise, 'chat'],
  [/^(bye|goodbye|see you|sampai jumpa)\b/, hBye, 'chat'],
  [/\b(help|bantuan|tolong|what can you|can you do|bisa apa|menu)\b/, hHelp, 'info'],
  [/\b(advertis\w*|iklan|sponsor\w*|submit|contribut\w*|kontribusi|partner\w*|kerja ?sama|collaborat\w*|write for|kirim artikel|press release)\b/, hAdvertise, 'info'],
  [/\b(subscri\w*|newsletter|sign ?up|mailing list|langganan|berlangganan|buletin)\b/, hSubscribe, 'info'],
  [/\b(latest|newest|most recent|current issue|new issue|terbaru|terkini|edisi baru)\b/, hLatest, 'issue'],
  [/\b(previous issue|last issue|prior issue|sebelumnya)\b/, hPrev, 'issue'],
  [/\b(first issue|oldest|earliest|edisi pertama|tertua|terlama)\b/, hFirst, 'issue'],
  [/\b(apps?|application|aplikasi|ios|android|iphone|google play|play store|app store)\b/, hApp, 'info'],
  [/\b(free|price|prices|cost|paid|gratis|harga|bayar|berbayar|print copy|hard ?copy|cetak)\b/, hPrice, 'info'],
  [/\b(read|download|pdf|unduh|baca|access|akses)\b/, hRead, 'info'],
  [/\b(contact|e-?mail|reach (you|out)|hubungi|kontak|surel|phone|telepon|call you|talk to|support|customer)\b/, hContact, 'info'],
  [/\b(location|located|address|where (is|are) (you|kabari|your|the office)|based|office|lokasi|alamat|dimana|di mana|kantor|san francisco)\b/, hLocation, 'info'],
  [/\b(social|facebook|instagram|pinterest|youtube|twitter|medsos|media sosial|follow|ikuti|ig|fb)\b/, hSocial, 'info'],
  [/\bissuu\b/, hIssuu, 'info'],
  [/\b(website|web site|situs|kabarinews|url)\b/, hWeb, 'info'],
  [/\b(privacy|privasi|personal data|cookies?|data pribadi)\b/, hPrivacy, 'info'],
  [/\b(terms|ketentuan|syarat|copyright|hak cipta|legal)\b/, hTerms, 'info'],
  [/\b(history|sejarah|founded|since when|sejak kapan|berdiri|established|how old|started|began|when did|2007)\b/, hHistory, 'info'],
  [/\b(about|who (are|is)|what is kabari|what's kabari|apa itu|tentang|siapa|mission|misi|visi|kabari magazine)\b/, hAbout, 'info'],
  [/\b(topics?|categor\w*|sections?|what do you (cover|publish)|culture|business|lifestyle|community|news|budaya|berita|bisnis|komunitas|gaya hidup|topik|kategori|liputan)\b/, hTopics, 'info'],
  [/\b(language|languages|bahasa|indonesian|english|inggris|translat\w*)\b/, hLang, 'info'],
  [/\b(archive|archives|arsip|browse|all issues|how many|berapa|semua edisi|list|years?|tahun)\b/, hArchive, 'info']
];

/* reply() returns { parts, kind } */
function reply(q) {
  RL = pick(q); learn(q);
  const n = norm(q);
  if (!n) return { parts: hHelp(), kind: 'info' };
  const d = dates(n);
  if (d.list.length) { let o = []; d.list.slice(0, 3).forEach(({ y, m }) => { o = o.concat(hIssue(y, m)); }); return { parts: o, kind: 'issue' }; }
  if (d.years.length === 1) return { parts: hYear(d.years[0]), kind: 'issue' };
  if (d.years.length > 1) return { parts: [P('Which year would you like?', 'Tahun berapa yang Anda inginkan?'), chips(d.years.slice(0, 6).map(y => ({ l: String(y), run: () => hYear(y) })))], kind: 'issue' };
  const mo = n.match(RE_MONLY);
  if (mo && RE_KEY.test(n)) return { parts: hMonthOnly(MW[mo[1]]), kind: 'issue' };
  for (const [re, fn, kind] of RULES) if (re.test(n)) return { parts: fn(n), kind };
  return { parts: hFallback(), kind: 'none' };
}

/* ---------- node/test hook: no DOM, expose engine only ---------- */
if (typeof window === 'undefined') { globalThis.KB_ENGINE = { reply, setLang: l => { RL = l; } }; return; }

/* ---------- widget UI ---------- */
const css = `
.kb-fab{position:fixed;right:1.1rem;bottom:1.1rem;z-index:200;display:flex;align-items:center;gap:.55rem;padding:.75rem 1.15rem;border-radius:99px;background:var(--ink,#0A0A0A);color:#fff;font:600 .95rem var(--f2,Inter,system-ui,sans-serif);border:2px solid var(--lime,#22C55E);box-shadow:0 10px 28px rgba(10,10,10,.35);cursor:pointer;transition:background .2s,transform .2s}
.kb-fab:hover{background:var(--green,#0F7B3F)}.kb-fab svg{width:1.25rem;height:1.25rem;fill:none;stroke:var(--lime,#22C55E);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.kb-panel{position:fixed;right:1.1rem;bottom:1.1rem;z-index:210;width:min(390px,calc(100vw - 2rem));height:min(580px,calc(100vh - 2rem));height:min(580px,calc(100dvh - 2rem));display:none;flex-direction:column;background:#fff;color:var(--ink,#0A0A0A);border:1px solid var(--line,#E3E8E4);border-radius:16px;box-shadow:0 24px 60px rgba(10,10,10,.35);overflow:hidden;font:400 .95rem/1.5 var(--f2,Inter,system-ui,sans-serif)}
.kb-panel.open{display:flex}.kb-fab.hide{display:none}
.kb-hd{display:flex;align-items:center;gap:.7rem;padding:.85rem 1rem;background:var(--ink,#0A0A0A);color:#fff;border-bottom:3px solid var(--lime,#22C55E)}
.kb-hd .kb-mk{display:grid;place-items:center;width:2rem;height:2rem;border-radius:8px;background:var(--lime,#22C55E);color:#0A0A0A;font:700 1.15rem var(--f1,Georgia,serif)}
.kb-hd b{display:block;font:700 1.05rem var(--f1,Georgia,serif);line-height:1.2}.kb-hd small{display:block;color:#D1D5DB;font-size:.78rem}
.kb-x{margin-left:.2rem;width:2.2rem;height:2.2rem;border-radius:8px;color:#fff;font-size:1.5rem;line-height:1;cursor:pointer;background:none;border:0}.kb-x:hover{background:#2b2b2b}
.kb-log{position:relative;flex:1;overflow-y:auto;padding:1rem;background:var(--soft,#F1F6F2);display:flex;flex-direction:column;gap:.7rem;scroll-behavior:smooth}
.kb-m{max-width:92%;display:flex;flex-direction:column;gap:.5rem}.kb-bot{align-self:flex-start}.kb-me{align-self:flex-end}
.kb-m p{padding:.6rem .9rem;border-radius:14px;overflow-wrap:anywhere}
.kb-bot p{background:#fff;border:1px solid var(--line,#E3E8E4);border-top-left-radius:4px}
.kb-me p{background:var(--green,#0F7B3F);color:#fff;border-top-right-radius:4px}
.kb-card{display:flex;gap:.8rem;background:#fff;border:1px solid var(--line,#E3E8E4);border-radius:12px;padding:.7rem}
.kb-th{flex:none;width:68px;aspect-ratio:3/4;border-radius:5px;overflow:hidden;box-shadow:0 5px 12px rgba(10,10,10,.25);display:flex;flex-direction:column;justify-content:space-between;padding:.4rem;color:#fff;font-family:var(--f1,Georgia,serif);position:relative}
.kb-th img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.kb-th b{font-size:.5rem;letter-spacing:.14em;border-bottom:2px solid var(--lime,#22C55E);align-self:flex-start;position:relative}.kb-th span{font-size:.72rem;font-weight:800;position:relative;line-height:1.1}.kb-th em{font-style:normal;font-size:1.05rem;font-weight:900;position:relative;line-height:1}
.kb-cb{display:flex;flex-direction:column;gap:.35rem;min-width:0}.kb-cb strong{font:700 1.05rem var(--f1,Georgia,serif);line-height:1.2}
.kb-st{font-size:.8rem;color:#4B5563}.kb-st.ok{color:var(--green,#0F7B3F);font-weight:600}
.kb-row{display:flex;flex-wrap:wrap;gap:.4rem}
.kb-b,.kb-chip{display:inline-block;padding:.3rem .8rem;border-radius:99px;font:600 .85rem var(--f2,Inter,system-ui,sans-serif);border:1.5px solid var(--ink,#0A0A0A);background:#fff;color:var(--ink,#0A0A0A);cursor:pointer;text-decoration:none;transition:background .15s,color .15s}
.kb-b.s{background:var(--green,#0F7B3F);border-color:var(--green,#0F7B3F);color:#fff}.kb-b.s:hover{background:var(--green-d,#0A5C2E);border-color:var(--green-d,#0A5C2E)}
.kb-b:hover,.kb-chip:hover{background:var(--ink,#0A0A0A);color:#fff}
.kb-chip{border-color:#CBD5CE}
.kb-ft{padding:.7rem .8rem;border-top:1px solid var(--line,#E3E8E4);background:#fff}
.kb-ft form{display:flex;gap:.5rem}.kb-ft input{flex:1;min-width:0;padding:.6rem .8rem;border:2px solid var(--ink,#0A0A0A);border-radius:10px;font:inherit;background:#fff;color:inherit}
.kb-send{padding:.5rem 1rem;border-radius:10px;background:var(--green,#0F7B3F);color:#fff;font:700 .9rem var(--f2,Inter,system-ui,sans-serif);border:0;cursor:pointer}.kb-send:hover{background:var(--green-d,#0A5C2E)}
.kb-note{margin-top:.4rem;font-size:.72rem;color:#6B7280;text-align:center}
.kb-typing{display:inline-flex;align-items:center;gap:.55rem;padding:.55rem .85rem;background:#fff;border:1px solid var(--line,#E3E8E4);border-radius:14px;border-top-left-radius:4px;color:#6B7280;font-size:.8rem}
.kb-typing .d{display:inline-flex;gap:4px;align-items:flex-end;height:10px}.kb-typing i{width:7px;height:7px;border-radius:50%;background:var(--green,#0F7B3F);animation:kbb 1.1s infinite ease-in-out}.kb-typing i:nth-child(2){animation-delay:.15s}.kb-typing i:nth-child(3){animation-delay:.3s}
@keyframes kbb{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-6px);opacity:1}}
.kb-m{animation:kbin .25s ease-out}@keyframes kbin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.kb-clr{margin-left:auto;padding:.3rem .7rem;border-radius:99px;border:1px solid #4B5563;color:#E5E7EB;font:600 .75rem var(--f2,Inter,system-ui,sans-serif);background:none;cursor:pointer}.kb-clr:hover{background:#2b2b2b}
@media(max-width:800px){.kb-panel{right:0;bottom:0;left:0;width:100%;height:86vh;height:86dvh;border-radius:16px 16px 0 0}.kb-fab{right:.8rem;bottom:.8rem}.kb-ft{padding-bottom:calc(.7rem + env(safe-area-inset-bottom,0px))}}
@media(prefers-reduced-motion:reduce){.kb-log{scroll-behavior:auto}.kb-typing i,.kb-m{animation:none}}
`;
const UI = {
  open: { en: 'Ask Kabari', id: 'Tanya Kabari' },
  title: { en: 'Kabari Assistant', id: 'Asisten Kabari' },
  sub: { en: 'Find any issue in seconds', id: 'Temukan edisi apa pun dalam hitungan detik' },
  ph: { en: 'Type your message', id: 'Ketik pesan Anda' },
  typing: { en: 'typing…', id: 'mengetik…' },
  clr: { en: 'New chat', id: 'Chat baru' },
  clrt: { en: 'Clear this chat and forget what you told me', id: 'Hapus chat ini dan lupakan yang Anda ceritakan' },
  send: { en: 'Send', id: 'Kirim' }, close: { en: 'Close chat', id: 'Tutup chat' },
  note: { en: 'Answers come from this website. This chat is saved on this device only. Tap “New chat” to clear it.', id: 'Jawaban berasal dari situs ini. Chat ini hanya tersimpan di perangkat Anda. Ketuk “Chat baru” untuk menghapusnya.' },
  noteai: { en: 'Replies are written by an AI assistant using this website’s information. This chat is saved on this device only. Please don’t share sensitive details.', id: 'Balasan ditulis oleh asisten AI berdasarkan informasi situs ini. Chat ini hanya tersimpan di perangkat Anda. Mohon tidak membagikan data sensitif.' },
  read: { en: 'Read online', id: 'Baca online' }, pdf: { en: 'Download PDF', id: 'Unduh PDF' },
  det: { en: 'Details', id: 'Detail' }, ok: { en: 'Available online', id: 'Tersedia online' }, no: { en: 'Not online yet', id: 'Belum tersedia online' }
};
const u = k => UI[k][SL()];
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

const st = el('style'); st.id = 'kb-css'; st.textContent = css; document.head.appendChild(st);
const fab = el('button', 'kb-fab'); fab.type = 'button'; fab.setAttribute('aria-haspopup', 'dialog'); fab.setAttribute('aria-expanded', 'false');
fab.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span></span>';
const panel = el('section', 'kb-panel'); panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-labelledby', 'kb-t');
const hd = el('div', 'kb-hd'); const mk = el('span', 'kb-mk', 'K'); mk.setAttribute('aria-hidden', 'true');
const hb = el('div'); const ht = el('b'); ht.id = 'kb-t'; const hs = el('small'); hb.append(ht, hs);
const xb = el('button', 'kb-x', '×'); xb.type = 'button'; const clr = el('button', 'kb-clr'); clr.type = 'button'; hd.append(mk, hb, clr, xb);
const log = el('div', 'kb-log'); log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite');
const ft = el('div', 'kb-ft'); const fm = el('form'); fm.autocomplete = 'off';
const inp = el('input'); inp.type = 'text'; inp.maxLength = 200; const sb = el('button', 'kb-send'); sb.type = 'submit'; fm.append(inp, sb);
const note = el('p', 'kb-note'); ft.append(fm, note);
panel.append(hd, log, ft); document.body.append(fab, panel);

function applyLang() {
  fab.lastChild.textContent = u('open'); ht.textContent = u('title'); hs.textContent = u('sub');
  inp.placeholder = u('ph'); inp.setAttribute('aria-label', u('ph')); sb.textContent = u('send');
  xb.setAttribute('aria-label', u('close')); clr.textContent = u('clr'); clr.title = u('clrt'); clr.setAttribute('aria-label', u('clrt')); note.textContent = aiOn() ? u('noteai') : u('note'); panel.setAttribute('aria-label', u('title'));
}

function linkEl(o, solid) {
  const a = el('a', 'kb-b' + (solid ? ' s' : ''), lab(o.l)); a.href = o.href;
  if (o.ext) { a.target = '_blank'; a.rel = 'noopener'; }
  if (o.dl) a.setAttribute('download', '');
  return a;
}
function issueEl(i) {
  const c = el('div', 'kb-card'), th = el('div', 'kb-th');
  if (i.cover) { const im = el('img'); im.src = i.cover; im.alt = ''; im.loading = 'lazy'; th.appendChild(im); }
  else { th.style.background = CAT_COLOR[i.cat]; th.append(el('b', '', 'KABARI'), el('span', '', MONTHS_EN[i.m - 1].slice(0, 3)), el('em', '', String(i.y))); }
  const b = el('div', 'kb-cb'), ok = !!(i.read || i.pdf);
  const nm = (SL() === 'id' ? MONTHS_ID : MONTHS_EN)[i.m - 1] + ' ' + i.y;
  const stt = el('span', 'kb-st' + (ok ? ' ok' : ''), ok ? u('ok') : u('no'));
  const row = el('div', 'kb-row');
  if (i.read) row.appendChild(linkEl({ l: u('read'), href: i.read, ext: 1 }, true));
  if (i.pdf) row.appendChild(linkEl({ l: u('pdf'), href: i.pdf, dl: 1 }, false));
  if (!ok) row.appendChild(linkEl({ l: 'Issuu', href: CONFIG.issuu, ext: 1 }, true));
  if (typeof openModal === 'function') {
    const d = el('button', 'kb-b', u('det')); d.type = 'button'; d.onclick = () => openModal(i); row.appendChild(d);
  }
  b.append(el('strong', '', nm), stt, row); c.append(th, b); return c;
}
function scrollTo(node) { log.scrollTop = Math.max(0, node.offsetTop - 8); }
const KEY = 'kabariChat', TTL = 30 * 24 * 3600 * 1000;
let ST = { v: 1, t: Date.now(), hist: [], log: [], name: '', open: false };
try { const r = JSON.parse(localStorage.getItem(KEY) || 'null'); if (r && r.v === 1 && Date.now() - r.t < TTL) ST = r; } catch (e) {}
MEM.name = ST.name || '';
function save() { ST.t = Date.now(); ST.name = MEM.name; try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} }
function ser(parts) {
  return parts.map(p => p.t === 'p' ? { t: 'p', v: p.v } : p.t === 'issue' ? { t: 'issue', id: p.v.id } : p.t === 'links' ? { t: 'links', v: p.v.map(o => ({ l: o.l, href: o.href, ext: o.ext, dl: o.dl })) } : null).filter(Boolean);
}
function des(a) { return a.map(p => p.t === 'issue' ? { t: 'issue', v: ISSUES.find(i => i.id === p.id) } : p).filter(p => p.t !== 'issue' || p.v); }
function logPush(e) { ST.log.push(e); if (ST.log.length > 40) ST.log.splice(0, ST.log.length - 40); save(); }
function addUser(text, skip) { const w = el('div', 'kb-m kb-me'); w.appendChild(el('p', '', text)); log.appendChild(w); log.scrollTop = log.scrollHeight; if (!skip) logPush({ r: 'u', v: text }); }
function addBot(parts, skip) {
  const w = el('div', 'kb-m kb-bot');
  parts.forEach(p => {
    if (p.t === 'p') w.appendChild(el('p', '', p.v));
    else if (p.t === 'issue') w.appendChild(issueEl(p.v));
    else if (p.t === 'links') { const r = el('div', 'kb-row'); p.v.forEach((o, n) => r.appendChild(linkEl(o, n === 0))); w.appendChild(r); }
    else if (p.t === 'chips') {
      const r = el('div', 'kb-row');
      p.v.forEach(o => { const c = el('button', 'kb-chip', lab(o.l)); c.type = 'button'; c.onclick = () => { if (busy) return; RL = SL(); addUser(lab(o.l)); respond(() => { const p = o.run(); remember('user', lab(o.l)); remember('assistant', plain(p) || '(showed results)'); return p; }); }; r.appendChild(c); });
      w.appendChild(r);
    }
  });
  log.appendChild(w); scrollTo(w);
  if (!skip) logPush({ r: 'b', p: ser(parts) });
}
const hist = ST.hist; let busy = false, aiCalls = 0;
function remember(role, content) {
  hist.push({ role, content: String(content).slice(0, role === 'assistant' ? 300 : 500) });
  if (hist.length > 80) hist.splice(0, hist.length - 80);
  save();
}
const plain = parts => parts.filter(p => p.t === 'p').map(p => p.v).join(' ');
function facts() {
  const L0 = ISSUES[0], on = ISSUES.filter(i => i.read || i.pdf), by = {};
  on.forEach(i => { (by[i.y] = by[i.y] || []).push(i.m); });
  const onl = Object.keys(by).sort().map(y => y + ': ' + MONTHS_EN[Math.min(...by[y]) - 1] + ' to ' + MONTHS_EN[Math.max(...by[y]) - 1]).join('; ') || 'none yet';
  const s = CONFIG.social || {}, soc = Object.keys(s).filter(k => s[k]).map(k => k + ' ' + s[k]).join(', ');
  const a = CONFIG.apps || {};
  return [
    'About: ' + T.ab1.en + ' ' + T.ab2.en,
    'History: ' + T.tl07.en + ' ' + T.tl12.en + ' ' + T.tl17.en,
    'Mobile app: ' + T.ab4.en + ' ' + ((a.appStore || a.googlePlay) ? 'Links: ' + [a.appStore, a.googlePlay].filter(Boolean).join(' ') : 'Store links are not on the website yet.'),
    'Latest issue: ' + MONTHS_EN[L0.m - 1] + ' ' + L0.y + '.',
    'Archive: ' + ISSUES.length + ' monthly issues from ' + CONFIG.startYear + ' to ' + MONTHS_EN[L0.m - 1] + ' ' + L0.y + '. Issues with an online copy (read online or PDF) on this site: ' + onl + '. Other issues are listed but not uploaded yet; send people to Issuu (' + CONFIG.issuu + ') or email.',
    'Topics: ' + CATS.map(c => T['c_' + c].en + ' (' + T['tp_' + c].en + ')').join(' '),
    'Contact: email ' + CONFIG.email + '; location ' + CONFIG.location + '; website ' + CONFIG.website + '; Issuu ' + CONFIG.issuu + '; socials: ' + (soc || 'none'),
    'Newsletter: subscribe with the signup form at the bottom of the Contact page; every email has an unsubscribe link.',
    'Pages: Home, Latest Issue, Archives, About, Contact, Privacy Policy, Terms of Service. Languages: English and Indonesian (EN/ID switch at the top).',
    'Terms: issues can be read and downloaded for personal, non-commercial use; copying or reselling needs written permission.'
  ].join('\n');
}
function memoryNotes() {
  const older = hist.slice(0, -20).filter(m => m.role === 'user').slice(-30).map(m => '- ' + m.content.slice(0, 160)).join('\n').slice(-1800);
  return (MEM.name ? 'Visitor name: ' + MEM.name + '\n' : '') + older;
}
async function askAI(ep) {
  const c = new AbortController(), tm = setTimeout(() => c.abort(), 15000);
  try {
    const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: c.signal, body: JSON.stringify({ messages: hist.slice(-20), memory: memoryNotes(), facts: facts() }) });
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json(); if (!j || !j.reply) throw new Error('empty');
    return String(j.reply);
  } finally { clearTimeout(tm); }
}
function aiParts(txt, r) {
  const parts = [], ids = [];
  txt = txt.replace(/\[\[issue:(\d{4})-(\d{1,2})\]\]/gi, (_, y, m) => { ids.push(y + '-' + (+m)); return ''; }).replace(/\*\*|__|`/g, '');
  txt.split(/\n\s*\n/).map(x => x.trim()).filter(Boolean).slice(0, 3).forEach(x => parts.push({ t: 'p', v: x }));
  [...new Set(ids)].slice(0, 2).forEach(id => { const i = ISSUES.find(z => z.id === id); if (i) parts.push(issue(i)); });
  if (!parts.length) throw new Error('empty');
  if (r && r.kind === 'info') r.parts.filter(p => p.t !== 'p').forEach(p => parts.push(p));
  return parts;
}
async function ask(q) {
  const r = reply(q), ep = aiOn() ? CONFIG.chatEndpoint : '';
  remember('user', q);
  let parts = r.parts;
  if (ep && r.kind !== 'issue' && r.kind !== 'chat' && aiCalls < 40) {
    aiCalls++;
    try { parts = aiParts(await askAI(ep), r); } catch (e) { parts = r.kind === 'none' ? hFallback() : r.parts; }
  }
  remember('assistant', plain(parts) || '(showed results)');
  return parts;
}
function respond(fn) {
  busy = true;
  const d = el('div', 'kb-m kb-bot'), dots = el('div', 'kb-typing'); dots.innerHTML = '<span class="d"><i></i><i></i><i></i></span>'; dots.append(el('span', '', u('typing'))); d.appendChild(dots);
  log.appendChild(d); log.scrollTop = log.scrollHeight;
  const t0 = Date.now();
  Promise.resolve().then(fn).catch(() => { RL = SL(); return hFallback(); }).then(parts => {
    setTimeout(() => { d.remove(); addBot(parts); busy = false; }, Math.max(0, 450 - (Date.now() - t0)));
  });
}
let started = false;
function openChat(quiet) {
  panel.classList.add('open'); fab.classList.add('hide'); fab.setAttribute('aria-expanded', 'true');
  if (!started) { started = true; RL = SL(); addBot(hWelcome()); }
  ST.open = true; save(); log.scrollTop = log.scrollHeight;
  if (quiet !== true) setTimeout(() => inp.focus(), 50);
}
function closeChat() { panel.classList.remove('open'); fab.classList.remove('hide'); fab.setAttribute('aria-expanded', 'false'); ST.open = false; save(); fab.focus(); }
fab.onclick = () => openChat(); xb.onclick = closeChat;
clr.onclick = () => {
  if (busy) return;
  ST.hist.length = 0; ST.log.length = 0; ST.name = ''; MEM.name = ''; try { localStorage.removeItem(KEY); } catch (e) {}
  log.textContent = ''; RL = SL(); addBot(hWelcome()); inp.focus();
};
(function restore() {
  if (!ST.log.length) return;
  started = true;
  ST.log.forEach(e => { if (e.r === 'u') addUser(e.v, true); else addBot(des(e.p), true); });
  log.scrollTop = log.scrollHeight;
  if (ST.open) openChat(true);
})();
panel.addEventListener('keydown', e => { if (e.key === 'Escape') closeChat(); });
fm.onsubmit = e => {
  e.preventDefault(); const q = inp.value.trim(); if (!q || busy) return;
  inp.value = ''; addUser(q); respond(() => ask(q));
};
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.lang button')) setTimeout(applyLang, 0); });
applyLang();
})();
