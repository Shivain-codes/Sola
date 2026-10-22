// Sola i18n — safety-critical strings only (emergency UI + footer directory).
// Language auto-detects from the device (navigator.language); the user can
// override in the footer. Full-site translation is out of scope for now.

export type LangCode =
  | "en" | "hi" | "ta" | "bn" | "zh"
  | "ms" | "th" | "vi" | "id" | "my";

export const LANGS: { code: LangCode; native: string }[] = [
  { code: "en", native: "English" },
  { code: "hi", native: "हिन्दी" },
  { code: "ta", native: "தமிழ்" },
  { code: "bn", native: "বাংলা" },
  { code: "zh", native: "中文" },
  { code: "ms", native: "Bahasa Melayu" },
  { code: "th", native: "ไทย" },
  { code: "vi", native: "Tiếng Việt" },
  { code: "id", native: "Bahasa Indonesia" },
  { code: "my", native: "မြန်မာ" },
];

type Key =
  | "emgTitle" | "emgDesc" | "emgShare" | "emgLocating"
  | "emgWa" | "emgSms" | "emgCopy" | "emgCopied"
  | "emgNoGps" | "emgRetry" | "emgNoGeo" | "emgDenied" | "emgFixFail"
  | "emgMsg" | "emgNoLoc"
  | "emgDirTitle" | "emgDirDesc"
  | "emgGeneral" | "emgPolice" | "emgAmbulance" | "emgFire"
  | "langLabel" | "langAuto";

const en: Record<Key, string> = {
  emgTitle: "🚨 In an emergency",
  emgDesc:
    "One tap sends your live GPS location to whoever you choose — so someone can find you. Nothing is tracked or stored.",
  emgShare: "Share my location now",
  emgLocating: "Getting your GPS location…",
  emgWa: "Send via WhatsApp",
  emgSms: "Send via SMS",
  emgCopy: "Copy location link",
  emgCopied: "Link copied ✓",
  emgNoGps: "WhatsApp without GPS",
  emgRetry: "Try GPS again",
  emgNoGeo:
    "This browser can't read GPS. You can still send an alert without it.",
  emgDenied:
    "Location permission was denied. Allow it in your browser settings, or send an alert without GPS.",
  emgFixFail:
    "Couldn't get a GPS fix. Try again in the open, or send an alert without GPS.",
  emgMsg:
    "🚨 EMERGENCY — I need help.\nI'm a {job} working in {city}.\nMy location: {loc}\n— sent from Sola",
  emgNoLoc: "(GPS unavailable — I'm in {city}, please call me)",
  emgDirTitle: "Emergency numbers",
  emgDirDesc: "One tap calls emergency services. Select a country:",
  emgGeneral: "General",
  emgPolice: "Police",
  emgAmbulance: "Ambulance",
  emgFire: "Fire",
  langLabel: "Language",
  langAuto: "Auto-detected from your device",
};

const STRINGS: Record<LangCode, Record<Key, string>> = {
  en,
  hi: {
    emgTitle: "🚨 आपातकाल में",
    emgDesc:
      "एक टैप में आपकी लाइव GPS लोकेशन आपके चुने हुए व्यक्ति को भेजी जाएगी — ताकि कोई आपको ढूंढ सके। कुछ भी ट्रैक या स्टोर नहीं होता।",
    emgShare: "अभी मेरी लोकेशन शेयर करें",
    emgLocating: "आपकी GPS लोकेशन ली जा रही है…",
    emgWa: "WhatsApp से भेजें",
    emgSms: "SMS से भेजें",
    emgCopy: "लोकेशन लिंक कॉपी करें",
    emgCopied: "लिंक कॉपी हो गया ✓",
    emgNoGps: "बिना GPS WhatsApp करें",
    emgRetry: "GPS फिर से आज़माएं",
    emgNoGeo:
      "यह ब्राउज़र GPS नहीं पढ़ सकता। आप बिना इसके भी अलर्ट भेज सकते हैं।",
    emgDenied:
      "लोकेशन की अनुमति नहीं दी गई। ब्राउज़र सेटिंग में अनुमति दें, या बिना GPS अलर्ट भेजें।",
    emgFixFail:
      "GPS सिग्नल नहीं मिला। खुले में फिर से कोशिश करें, या बिना GPS अलर्ट भेजें।",
    emgMsg:
      "🚨 आपातकाल — मुझे मदद चाहिए।\nमैं {city} में {job} हूँ।\nमेरी लोकेशन: {loc}\n— Sola से भेजा गया",
    emgNoLoc: "(GPS उपलब्ध नहीं — मैं {city} में हूँ, कृपया मुझे कॉल करें)",
    emgDirTitle: "आपातकालीन नंबर",
    emgDirDesc: "एक टैप में आपातकालीन सेवा को कॉल करें। देश चुनें:",
    emgGeneral: "सामान्य",
    emgPolice: "पुलिस",
    emgAmbulance: "एम्बुलेंस",
    emgFire: "दमकल",
    langLabel: "भाषा",
    langAuto: "आपके डिवाइस से स्वतः पहचानी गई",
  },
  ta: {
    emgTitle: "🚨 அவசர நிலையில்",
    emgDesc:
      "ஒரே தட்டலில் உங்கள் நேரடி GPS இருப்பிடம் நீங்கள் தேர்ந்த நபருக்கு அனுப்பப்படும் — யாராவது உங்களைக் கண்டுபிடிக்க. எதுவும் கண்காணிக்கவோ சேமிக்கவோ படாது.",
    emgShare: "என் இருப்பிடத்தை இப்போது பகிர்",
    emgLocating: "GPS இருப்பிடம் பெறப்படுகிறது…",
    emgWa: "WhatsApp மூலம் அனுப்பு",
    emgSms: "SMS மூலம் அனுப்பு",
    emgCopy: "இருப்பிட இணைப்பை நகலெடு",
    emgCopied: "இணைப்பு நகலெடுக்கப்பட்டது ✓",
    emgNoGps: "GPS இல்லாமல் WhatsApp",
    emgRetry: "GPS-ஐ மீண்டும் முயல்",
    emgNoGeo:
      "இந்த உலாவியால் GPS-ஐப் படிக்க முடியாது. அது இல்லாமலும் எச்சரிக்கை அனுப்பலாம்.",
    emgDenied:
      "இருப்பிட அனுமதி மறுக்கப்பட்டது. உலாவி அமைப்புகளில் அனுமதிக்கவும், அல்லது GPS இல்லாமல் அனுப்பவும்.",
    emgFixFail:
      "GPS சிக்னல் கிடைக்கவில்லை. திறந்த வெளியில் மீண்டும் முயலவும், அல்லது GPS இல்லாமல் அனுப்பவும்.",
    emgMsg:
      "🚨 அவசரம் — எனக்கு உதவி வேண்டும்.\nநான் {city}-இல் {job} ஆக பணிபுரிகிறேன்.\nஎன் இருப்பிடம்: {loc}\n— Sola-விலிருந்து அனுப்பப்பட்டது",
    emgNoLoc: "(GPS கிடைக்கவில்லை — நான் {city}-இல் இருக்கிறேன், தயவுசெய்து அழைக்கவும்)",
    emgDirTitle: "அவசர எண்கள்",
    emgDirDesc: "ஒரே தட்டலில் அவசர சேவையை அழைக்கவும். நாட்டைத் தேர்ந்தெடுக்கவும்:",
    emgGeneral: "பொது",
    emgPolice: "காவல்",
    emgAmbulance: "ஆம்புலன்ஸ்",
    emgFire: "தீயணைப்பு",
    langLabel: "மொழி",
    langAuto: "உங்கள் சாதனத்திலிருந்து தானாகக் கண்டறியப்பட்டது",
  },
  bn: {
    emgTitle: "🚨 জরুরি অবস্থায়",
    emgDesc:
      "এক ট্যাপে আপনার লাইভ GPS অবস্থান আপনার পছন্দের ব্যক্তির কাছে পাঠানো হবে — যাতে কেউ আপনাকে খুঁজে পায়। কিছুই ট্র্যাক বা সংরক্ষণ করা হয় না।",
    emgShare: "এখনই আমার অবস্থান শেয়ার করুন",
    emgLocating: "GPS অবস্থান নেওয়া হচ্ছে…",
    emgWa: "WhatsApp-এ পাঠান",
    emgSms: "SMS-এ পাঠান",
    emgCopy: "অবস্থানের লিংক কপি করুন",
    emgCopied: "লিংক কপি হয়েছে ✓",
    emgNoGps: "GPS ছাড়াই WhatsApp",
    emgRetry: "আবার GPS চেষ্টা করুন",
    emgNoGeo:
      "এই ব্রাউজার GPS পড়তে পারে না। এটি ছাড়াও সতর্কতা পাঠাতে পারেন।",
    emgDenied:
      "অবস্থানের অনুমতি দেওয়া হয়নি। ব্রাউজার সেটিংসে অনুমতি দিন, অথবা GPS ছাড়াই পাঠান।",
    emgFixFail:
      "GPS সিগন্যাল পাওয়া যায়নি। খোলা জায়গায় আবার চেষ্টা করুন, অথবা GPS ছাড়াই পাঠান।",
    emgMsg:
      "🚨 জরুরি — আমার সাহায্য দরকার।\nআমি {city}-তে {job} হিসেবে কাজ করি।\nআমার অবস্থান: {loc}\n— Sola থেকে পাঠানো",
    emgNoLoc: "(GPS পাওয়া যায়নি — আমি {city}-তে আছি, দয়া করে কল করুন)",
    emgDirTitle: "জরুরি নম্বর",
    emgDirDesc: "এক ট্যাপে জরুরি সেবায় কল করুন। দেশ বেছে নিন:",
    emgGeneral: "সাধারণ",
    emgPolice: "পুলিশ",
    emgAmbulance: "অ্যাম্বুলেন্স",
    emgFire: "দমকল",
    langLabel: "ভাষা",
    langAuto: "আপনার ডিভাইস থেকে স্বয়ংক্রিয়ভাবে শনাক্ত",
  },
  zh: {
    emgTitle: "🚨 紧急情况",
    emgDesc:
      "一键将您的实时 GPS 位置发送给您选择的人——以便有人能找到您。不会追踪或存储任何信息。",
    emgShare: "立即分享我的位置",
    emgLocating: "正在获取 GPS 位置…",
    emgWa: "通过 WhatsApp 发送",
    emgSms: "通过短信发送",
    emgCopy: "复制位置链接",
    emgCopied: "链接已复制 ✓",
    emgNoGps: "无 GPS 用 WhatsApp",
    emgRetry: "重试 GPS",
    emgNoGeo: "此浏览器无法读取 GPS。您仍可在无 GPS 的情况下发送求助信息。",
    emgDenied: "位置权限被拒绝。请在浏览器设置中允许，或在无 GPS 的情况下发送。",
    emgFixFail: "无法获取 GPS 信号。请到开阔处重试，或在无 GPS 的情况下发送。",
    emgMsg:
      "🚨 紧急情况——我需要帮助。\n我是{job}，在{city}工作。\n我的位置：{loc}\n—— 来自 Sola",
    emgNoLoc: "（无 GPS——我在{city}，请给我打电话）",
    emgDirTitle: "紧急电话",
    emgDirDesc: "一键拨打紧急服务。请选择国家：",
    emgGeneral: "通用",
    emgPolice: "警察",
    emgAmbulance: "救护车",
    emgFire: "消防",
    langLabel: "语言",
    langAuto: "已从您的设备自动识别",
  },
  ms: {
    emgTitle: "🚨 Dalam kecemasan",
    emgDesc:
      "Satu ketikan menghantar lokasi GPS langsung anda kepada orang pilihan anda — supaya seseorang boleh menemui anda. Tiada apa yang dijejak atau disimpan.",
    emgShare: "Kongsi lokasi saya sekarang",
    emgLocating: "Mendapatkan lokasi GPS anda…",
    emgWa: "Hantar melalui WhatsApp",
    emgSms: "Hantar melalui SMS",
    emgCopy: "Salin pautan lokasi",
    emgCopied: "Pautan disalin ✓",
    emgNoGps: "WhatsApp tanpa GPS",
    emgRetry: "Cuba GPS lagi",
    emgNoGeo:
      "Pelayar ini tidak boleh membaca GPS. Anda masih boleh menghantar amaran tanpanya.",
    emgDenied:
      "Kebenaran lokasi ditolak. Benarkan dalam tetapan pelayar, atau hantar tanpa GPS.",
    emgFixFail:
      "Tidak dapat isyarat GPS. Cuba lagi di kawasan terbuka, atau hantar tanpa GPS.",
    emgMsg:
      "🚨 KECEMASAN — Saya perlukan bantuan.\nSaya {job} yang bekerja di {city}.\nLokasi saya: {loc}\n— dihantar dari Sola",
    emgNoLoc: "(GPS tiada — saya di {city}, sila telefon saya)",
    emgDirTitle: "Nombor kecemasan",
    emgDirDesc: "Satu ketikan untuk menghubungi perkhidmatan kecemasan. Pilih negara:",
    emgGeneral: "Umum",
    emgPolice: "Polis",
    emgAmbulance: "Ambulans",
    emgFire: "Bomba",
    langLabel: "Bahasa",
    langAuto: "Dikesan automatik daripada peranti anda",
  },
  th: {
    emgTitle: "🚨 ในกรณีฉุกเฉิน",
    emgDesc:
      "แตะครั้งเดียวเพื่อส่งตำแหน่ง GPS สดของคุณไปยังคนที่คุณเลือก — เพื่อให้มีคนหาคุณเจอ ไม่มีการติดตามหรือจัดเก็บใดๆ",
    emgShare: "แชร์ตำแหน่งของฉันเลย",
    emgLocating: "กำลังดึงตำแหน่ง GPS…",
    emgWa: "ส่งทาง WhatsApp",
    emgSms: "ส่งทาง SMS",
    emgCopy: "คัดลอกลิงก์ตำแหน่ง",
    emgCopied: "คัดลอกลิงก์แล้ว ✓",
    emgNoGps: "WhatsApp แบบไม่มี GPS",
    emgRetry: "ลอง GPS อีกครั้ง",
    emgNoGeo: "เบราว์เซอร์นี้อ่าน GPS ไม่ได้ คุณยังส่งการแจ้งเตือนโดยไม่มี GPS ได้",
    emgDenied:
      "ถูกปฏิเสธสิทธิ์ตำแหน่ง อนุญาตในการตั้งค่าเบราว์เซอร์ หรือส่งโดยไม่มี GPS",
    emgFixFail:
      "รับสัญญาณ GPS ไม่ได้ ลองอีกครั้งในที่โล่ง หรือส่งโดยไม่มี GPS",
    emgMsg:
      "🚨 ฉุกเฉิน — ฉันต้องการความช่วยเหลือ\nฉันเป็น{job} ทำงานที่{city}\nตำแหน่งของฉัน: {loc}\n— ส่งจาก Sola",
    emgNoLoc: "(ไม่มี GPS — ฉันอยู่ที่{city} กรุณาโทรหาฉัน)",
    emgDirTitle: "เบอร์ฉุกเฉิน",
    emgDirDesc: "แตะครั้งเดียวเพื่อโทรหาบริการฉุกเฉิน เลือกประเทศ:",
    emgGeneral: "ทั่วไป",
    emgPolice: "ตำรวจ",
    emgAmbulance: "รถพยาบาล",
    emgFire: "ดับเพลิง",
    langLabel: "ภาษา",
    langAuto: "ตรวจจับอัตโนมัติจากอุปกรณ์ของคุณ",
  },
  vi: {
    emgTitle: "🚨 Trong trường hợp khẩn cấp",
    emgDesc:
      "Một chạm để gửi vị trí GPS trực tiếp của bạn cho người bạn chọn — để ai đó có thể tìm thấy bạn. Không theo dõi hay lưu trữ gì cả.",
    emgShare: "Chia sẻ vị trí của tôi ngay",
    emgLocating: "Đang lấy vị trí GPS…",
    emgWa: "Gửi qua WhatsApp",
    emgSms: "Gửi qua SMS",
    emgCopy: "Sao chép liên kết vị trí",
    emgCopied: "Đã sao chép liên kết ✓",
    emgNoGps: "WhatsApp không cần GPS",
    emgRetry: "Thử GPS lại",
    emgNoGeo:
      "Trình duyệt này không đọc được GPS. Bạn vẫn có thể gửi cảnh báo mà không cần nó.",
    emgDenied:
      "Quyền vị trí bị từ chối. Hãy cho phép trong cài đặt trình duyệt, hoặc gửi mà không cần GPS.",
    emgFixFail:
      "Không bắt được tín hiệu GPS. Hãy thử lại ở nơi thoáng, hoặc gửi mà không cần GPS.",
    emgMsg:
      "🚨 KHẨN CẤP — Tôi cần giúp đỡ.\nTôi là {job} đang làm việc tại {city}.\nVị trí của tôi: {loc}\n— gửi từ Sola",
    emgNoLoc: "(Không có GPS — tôi đang ở {city}, vui lòng gọi cho tôi)",
    emgDirTitle: "Số điện thoại khẩn cấp",
    emgDirDesc: "Một chạm để gọi dịch vụ khẩn cấp. Chọn quốc gia:",
    emgGeneral: "Chung",
    emgPolice: "Cảnh sát",
    emgAmbulance: "Cấp cứu",
    emgFire: "Cứu hỏa",
    langLabel: "Ngôn ngữ",
    langAuto: "Tự động nhận diện từ thiết bị của bạn",
  },
  id: {
    emgTitle: "🚨 Dalam keadaan darurat",
    emgDesc:
      "Satu ketukan mengirim lokasi GPS langsung Anda ke orang pilihan Anda — agar seseorang bisa menemukan Anda. Tidak ada yang dilacak atau disimpan.",
    emgShare: "Bagikan lokasi saya sekarang",
    emgLocating: "Mendapatkan lokasi GPS Anda…",
    emgWa: "Kirim via WhatsApp",
    emgSms: "Kirim via SMS",
    emgCopy: "Salin tautan lokasi",
    emgCopied: "Tautan disalin ✓",
    emgNoGps: "WhatsApp tanpa GPS",
    emgRetry: "Coba GPS lagi",
    emgNoGeo:
      "Browser ini tidak bisa membaca GPS. Anda tetap bisa mengirim peringatan tanpanya.",
    emgDenied:
      "Izin lokasi ditolak. Izinkan di pengaturan browser, atau kirim tanpa GPS.",
    emgFixFail:
      "Tidak dapat sinyal GPS. Coba lagi di tempat terbuka, atau kirim tanpa GPS.",
    emgMsg:
      "🚨 DARURAT — Saya butuh bantuan.\nSaya {job} yang bekerja di {city}.\nLokasi saya: {loc}\n— dikirim dari Sola",
    emgNoLoc: "(GPS tidak tersedia — saya di {city}, tolong telepon saya)",
    emgDirTitle: "Nomor darurat",
    emgDirDesc: "Satu ketukan untuk menelepon layanan darurat. Pilih negara:",
    emgGeneral: "Umum",
    emgPolice: "Polisi",
    emgAmbulance: "Ambulans",
    emgFire: "Pemadam kebakaran",
    langLabel: "Bahasa",
    langAuto: "Terdeteksi otomatis dari perangkat Anda",
  },
  my: {
    emgTitle: "🚨 အရေးပေါ်အခြေအနေတွင်",
    emgDesc:
      "တစ်ချက်နှိပ်ရုံနဲ့ သင့်ရဲ့ GPS တည်နေရာအမှန်ကို သင်ရွေးတဲ့သူဆီ ပို့ပေးမယ် — တစ်ယောက်ယောက် သင့်ကိုရှာနိုင်အောင်။ ဘာကိုမှ ခြေရာခံတာ၊ သိမ်းတာမရှိဘူး။",
    emgShare: "ကျွန်တော့်တည်နေရာကို အခုမျှဝေမယ်",
    emgLocating: "GPS တည်နေရာ ရယူနေသည်…",
    emgWa: "WhatsApp နဲ့ပို့မယ်",
    emgSms: "SMS နဲ့ပို့မယ်",
    emgCopy: "တည်နေရာလင့်ခ် ကူးယူမယ်",
    emgCopied: "လင့်ခ် ကူးယူပြီးပါပြီ ✓",
    emgNoGps: "GPS မပါဘဲ WhatsApp",
    emgRetry: "GPS ထပ်စမ်းမယ်",
    emgNoGeo:
      "ဒီဘရောက်ဇာက GPS ဖတ်လို့မရဘူး။ မပါဘဲ သတိပေးချက်ပို့နိုင်သေးတယ်။",
    emgDenied:
      "တည်နေရာခွင့်ပြုချက် ငြင်းပယ်ခံရတယ်။ ဘရောက်ဇာဆက်တင်မှာ ခွင့်ပြုပါ၊ ဒါမှမဟုတ် GPS မပါဘဲပို့ပါ။",
    emgFixFail:
      "GPS signal မရဘူး။ လွတ်တဲ့နေရာမှာ ထပ်စမ်းပါ၊ ဒါမှမဟုတ် GPS မပါဘဲပို့ပါ။",
    emgMsg:
      "🚨 အရေးပေါ် — အကူအညီလိုတယ်။\nကျွန်တော်က {city}မှာ {job} လုပ်နေတာ။\nကျွန်တော့်တည်နေရာ: {loc}\n— Sola ကနေပို့တာ",
    emgNoLoc: "(GPS မရဘူး — ကျွန်တော် {city}မှာရှိတယ်၊ ဖုန်းဆက်ပေးပါ)",
    emgDirTitle: "အရေးပေါ်ဖုန်းနံပါတ်များ",
    emgDirDesc:
      "တစ်ချက်နှိပ်ရုံနဲ့ အရေးပေါ်ဝန်ဆောင်မှုကို ခေါ်နိုင်တယ်။ နိုင်ငံရွေးပါ:",
    emgGeneral: "အထွေထွေ",
    emgPolice: "ရဲ",
    emgAmbulance: "လူနာတင်ယာဉ်",
    emgFire: "မီးသတ်",
    langLabel: "ဘာသာစကား",
    langAuto: "သင့်စက်ကနေ အလိုအလျောက်သိထားတာ",
  },
};

export function tr(lang: LangCode, key: Key): string {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key];
}

/** Fill {job} / {city} / {loc} placeholders in a template string. */
export function fill(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

const LANG_KEY = "sola-lang";

export function detectLanguage(): LangCode {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && (LANGS as { code: string }[]).some((l) => l.code === saved))
      return saved as LangCode;
    const nav = (navigator.language || "en").toLowerCase();
    const base = nav.split("-")[0];
    if ((LANGS as { code: string }[]).some((l) => l.code === base))
      return base as LangCode;
  } catch {
    /* storage unavailable — fall through */
  }
  return "en";
}

export function saveLanguage(code: LangCode) {
  try {
    localStorage.setItem(LANG_KEY, code);
  } catch {
    /* ignore */
  }
}

/* ---------------- Emergency numbers directory ---------------- */

export type EmgService = "general" | "police" | "ambulance" | "fire";

export interface CountryEmg {
  country: string;
  code: string;
  numbers: { service: EmgService; number: string }[];
}

export const EMERGENCY_NUMBERS: CountryEmg[] = [
  { country: "Singapore", code: "SG", numbers: [
    { service: "police", number: "999" }, { service: "ambulance", number: "995" }, { service: "fire", number: "995" } ] },
  { country: "Malaysia", code: "MY", numbers: [
    { service: "general", number: "999" } ] },
  { country: "Thailand", code: "TH", numbers: [
    { service: "police", number: "191" }, { service: "ambulance", number: "1669" } ] },
  { country: "Indonesia", code: "ID", numbers: [
    { service: "general", number: "112" } ] },
  { country: "Vietnam", code: "VN", numbers: [
    { service: "police", number: "113" }, { service: "ambulance", number: "115" }, { service: "fire", number: "114" } ] },
  { country: "Philippines", code: "PH", numbers: [
    { service: "general", number: "911" } ] },
  { country: "India", code: "IN", numbers: [
    { service: "general", number: "112" }, { service: "ambulance", number: "102" } ] },
  { country: "Bangladesh", code: "BD", numbers: [
    { service: "general", number: "999" } ] },
  { country: "Myanmar", code: "MM", numbers: [
    { service: "police", number: "199" }, { service: "ambulance", number: "192" }, { service: "fire", number: "191" } ] },
  { country: "Sri Lanka", code: "LK", numbers: [
    { service: "police", number: "119" }, { service: "ambulance", number: "1990" } ] },
  { country: "Nepal", code: "NP", numbers: [
    { service: "police", number: "100" }, { service: "ambulance", number: "102" } ] },
  { country: "Pakistan", code: "PK", numbers: [
    { service: "police", number: "15" }, { service: "ambulance", number: "1122" } ] },
  { country: "China", code: "CN", numbers: [
    { service: "police", number: "110" }, { service: "ambulance", number: "120" }, { service: "fire", number: "119" } ] },
  { country: "Japan", code: "JP", numbers: [
    { service: "police", number: "110" }, { service: "ambulance", number: "119" }, { service: "fire", number: "119" } ] },
  { country: "South Korea", code: "KR", numbers: [
    { service: "police", number: "112" }, { service: "ambulance", number: "119" }, { service: "fire", number: "119" } ] },
  { country: "UAE", code: "AE", numbers: [
    { service: "police", number: "999" }, { service: "ambulance", number: "998" }, { service: "fire", number: "997" } ] },
  { country: "Saudi Arabia", code: "SA", numbers: [
    { service: "general", number: "911" } ] },
  { country: "Qatar", code: "QA", numbers: [
    { service: "general", number: "999" } ] },
  { country: "Australia", code: "AU", numbers: [
    { service: "general", number: "000" } ] },
  { country: "United States", code: "US", numbers: [
    { service: "general", number: "911" } ] },
  { country: "Canada", code: "CA", numbers: [
    { service: "general", number: "911" } ] },
  { country: "United Kingdom", code: "GB", numbers: [
    { service: "general", number: "999" } ] },
  { country: "Germany", code: "DE", numbers: [
    { service: "general", number: "112" } ] },
  { country: "France", code: "FR", numbers: [
    { service: "general", number: "112" }, { service: "ambulance", number: "15" }, { service: "police", number: "17" } ] },
  { country: "Spain", code: "ES", numbers: [
    { service: "general", number: "112" } ] },
  { country: "Italy", code: "IT", numbers: [
    { service: "general", number: "112" } ] },
  { country: "Brazil", code: "BR", numbers: [
    { service: "police", number: "190" }, { service: "ambulance", number: "192" }, { service: "fire", number: "193" } ] },
  { country: "South Africa", code: "ZA", numbers: [
    { service: "police", number: "10111" }, { service: "ambulance", number: "10177" } ] },
];

export function serviceLabel(lang: LangCode, s: EmgService): string {
  switch (s) {
    case "general": return tr(lang, "emgGeneral");
    case "police": return tr(lang, "emgPolice");
    case "ambulance": return tr(lang, "emgAmbulance");
    case "fire": return tr(lang, "emgFire");
  }
}
