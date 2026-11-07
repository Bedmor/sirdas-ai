import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/db/prisma";
import {
  JevAnalysisResult,
  NafsTrap,
  SpiritualStage,
  TonePreference,
} from "./jev-taxonomy";
import { TURKISH_PROVINCES, PROMINENT_DISTRICTS } from "./pii-anonymizer";

export interface SemanticTriageResult {
  nafsTrap: NafsTrap;
  spiritualStage: SpiritualStage;
  distressLevel: number;
  recommendedTone: TonePreference;
  underlyingNeed: string;
  spiritualDiagnosis: string;
  preferredName?: string | null;
  roles?: string[];
  persistentFacts?: string[];
}

export interface ExtractedUserProfileFacts {
  preferred_name?: string;
  roles: string[];
  known_facts: string[];
  biological_energy?: string[];
  progressed_stage?: SpiritualStage;
  progressed_tone?: TonePreference;
}

export interface SpiritualStageHistoryItem {
  stage: SpiritualStage;
  updatedAt: string;
}

export interface PersistentUserProfile {
  preferred_name?: string;
  roles: string[];
  known_facts: string[];
  spiritual_trials: string[];
  biological_energy: string[];
  tone_preference: TonePreference;
  spiritual_stage: SpiritualStage;
  interaction_count: number;
  onboarding_step: number;
  onboarding_completed: boolean;
  profile_completion: number;
  stage_history?: SpiritualStageHistoryItem[];
  account_type?: "REGISTERED_MEMBER" | "WEB_MEMBER";
  updated_at?: string;
  [key: string]: unknown;
}

const NON_NAME_STOPWORDS = new Set([
  "çok",
  "cok",
  "bir",
  "bu",
  "şu",
  "su",
  "o",
  "de",
  "da",
  "ki",
  "mi",
  "mı",
  "mu",
  "mü",
  "hep",
  "hiç",
  "hic",
  "artık",
  "artik",
  "sadece",
  "zaten",
  "şimdi",
  "simdi",
  "bugün",
  "bugun",
  "dün",
  "dun",
  "yarın",
  "yarin",
  "burada",
  "orada",
  "şurada",
  "evli",
  "evliyim",
  "bekar",
  "bekarım",
  "esnaf",
  "esnafım",
  "öğrenci",
  "öğrenciyim",
  "ogrenci",
  "ogrenciyim",
  "memur",
  "memurum",
  "öğretmen",
  "öğretmenim",
  "doktor",
  "mühendis",
  "işsiz",
  "işsizim",
  "issiz",
  "issizim",
  "hasta",
  "hastayım",
  "yorgun",
  "yorgunum",
  "yalnız",
  "yalnızım",
  "bıktım",
  "biktim",
  "tükendim",
  "tukendim",
  "korkuyorum",
  "üzgünüm",
  "uzgunum",
  "mutsuzum",
  "pişmanım",
  "pismanim",
  "aslında",
  "aslinda",
  "gerçekten",
  "gercekten",
  "maalesef",
  "kuru",
  "yeni",
  "eski",
  "büyük",
  "küçük",
  "kendi",
  "kendim",
  "sana",
  "size",
  "böyle",
  "öyle",
  "ne",
  "neydi",
  "nedir",
  "ney",
  "kim",
  "kimdi",
  "kimdir",
  "hatırlıyor",
  "hatirliyor",
  "unuttun",
  "biliyor",
  "acaba",
  "peki",
  "yok",
  "değil",
  "degil",
  "depresyon",
  "depresyondayım",
  "anksiyete",
  "anksiyetem",
  "panik",
  "kaygı",
  "kaygım",
  "okb",
  "vesvese",
  "travma",
  "uykusuzluk",
  "emekli",
  "emekliyim",
  "hamile",
  "hamileyim",
  "boşandım",
  ...TURKISH_PROVINCES,
  ...PROMINENT_DISTRICTS,
]);

function normalizeCapitalizedName(raw: string): string | undefined {
  const cleaned = raw.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ]/g, "").trim();
  if (cleaned.length < 2 || cleaned.length > 18) return undefined;
  const lower = cleaned.toLocaleLowerCase("tr-TR");
  if (NON_NAME_STOPWORDS.has(lower)) return undefined;
  // Yaygın fiil/sıfat/soru çekim ekleriyle biten kelimeleri ele
  if (
    /(?:iyorum|ıyorum|uyorum|üyorum|ceğim|cağım|mişim|mışım|yim|yım|yum|yüm|dim|dım|dum|düm|tim|tım|ydi|ydı|ydü|ydu|dir|dır|dür|dur)$/i.test(
      lower
    )
  ) {
    return undefined;
  }
  return (
    cleaned.charAt(0).toLocaleUpperCase("tr-TR") +
    cleaned.slice(1).toLocaleLowerCase("tr-TR")
  );
}

/**
 * 0ms senkron ayrıştırıcı:
 * Kullanıcının mesajından hitap ismini ("Adım Ahmet", "Ben Elif", "İsmim Murat"),
 * toplumsal rollerini ("ESNAF", "EVLI", "EBEVEYN", "OGRENCI") ve kalıcı yaşam
 * olgularını ("Annesi ameliyat sürecinde", "Maddi darlık / borç imtihanı") çıkarır.
 */
export function extractUserProfileFactsFromText(
  rawText: string
): ExtractedUserProfileFacts {
  if (!rawText || typeof rawText !== "string") {
    return { roles: [], known_facts: [] };
  }

  let preferredName: string | undefined;
  const roles = new Set<string>();
  const knownFacts = new Set<string>();
  const biologicalEnergy = new Set<string>();
  let progressedStage: SpiritualStage | undefined;
  let progressedTone: TonePreference | undefined;

  // 1. Hitap İsmi Yakalama ("adım Ahmet", "benim ismim Zeynep", "bana Murat diyebilirsin", "ben Elif")
  const explicitNameMatch =
    rawText.match(
      /\b(?:benim\s+ad[ıi]m|ad[ıi]m|benim\s+ismim|ismim)\s+([A-ZÇĞİÖŞÜa-zçğıöşü]{2,18})\b/iu
    ) ||
    rawText.match(
      /\bbana\s+([A-ZÇĞİÖŞÜa-zçğıöşü]{2,18})\s+(?:diyebilirsin|deyin|diyebilirsiniz|de)\b/iu
    );

  if (explicitNameMatch?.[1]) {
    preferredName = normalizeCapitalizedName(explicitNameMatch[1]);
  } else {
    const selfIntroMatch = rawText.match(
      /(?:^|[.,!?;]\s+)(?:merhaba\s+|selam\s+|selam[üu]n\s*aleyk[üu]m\s+|iyi\s+g[üu]nler\s+|iyi\s+geceler\s+)?ben\s+([A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,17})\b/u
    );
    if (selfIntroMatch?.[1]) {
      preferredName = normalizeCapitalizedName(selfIntroMatch[1]);
    }
  }

  const lower = rawText.toLocaleLowerCase("tr-TR");

  // 2. Toplumsal Roller
  if (/\b(?:evliyim|eşim|kocam|hanımım|nikahlıyım|eşimle|ailemle)\b/i.test(lower)) {
    roles.add("EVLI");
  } else if (/\b(?:bekar[ıi]m|hiç\s*evlenmedim|nişanlıyım|evlilik\s*hazırlığı)\b/i.test(lower)) {
    roles.add("BEKAR");
  }

  if (
    /\b(?:çocuğum|oğlum|kızım|evladım|çocuklarım|bebeğim|anne\s+oldum|baba\s+oldum|hamileyim|gebeyim|lohusayım)\b/i.test(
      lower
    )
  ) {
    roles.add("EBEVEYN");
  }

  if (
    /\b(?:esnaf[ıi]m|dükkan[ıi]m|ticaretle|kuru\s*temizlemeciyim|iş\s*yerim|şirketim|müşteri|satış)\b/i.test(
      lower
    )
  ) {
    roles.add("ESNAF");
  }

  if (
    /\b(?:öğrenciyim|üniversite|sınav|yks|kpss|tus|ales|okulda|fakülte|mezuna\s*kaldım|ders\s*çalış|vize|final|tez|yurtta)\b/i.test(
      lower
    )
  ) {
    roles.add("OGRENCI");
  }

  if (
    /\b(?:yazılımcı|mühendis|kod\s*yaz|bilgisayar|teknoloji|developer|tasarımcı)\b/i.test(
      lower
    )
  ) {
    roles.add("YAZILIMCI_MUHENDIS");
  }

  if (/\b(?:öğretmenim|öğretmenlik|hoca|eğitimci|öğrencilerim)\b/i.test(lower)) {
    roles.add("OGRETMEN");
  }

  if (/\b(?:doktorum|hemşireyim|sağlık\s*çalışanı|nöbetteyim|hastanede\s*çalış)\b/i.test(lower)) {
    roles.add("SAGLIK_CALISANI");
  }

  if (
    /\b(?:memurum|işçiyim|çalışanım|mesai|patronum|müdürüm|maaşım|iş\s*yerinde|ofiste)\b/i.test(
      lower
    )
  ) {
    roles.add("CALISAN");
  }

  if (
    /\b(?:hastama\s*bakıyorum|anneme\s*bakıyorum|babama\s*bakıyorum|bakımını\s*üstlendim)\b/i.test(
      lower
    )
  ) {
    roles.add("HASTA_BAKIMI");
  }

  if (/\b(?:emekliyim|emekli\s+oldum)\b/i.test(lower)) {
    roles.add("EMEKLI");
  }

  if (/\b(?:ev\s+hanımıyım|ev\s+kadınıyım)\b/i.test(lower)) {
    roles.add("EV_HANIMI");
  }

  if (/\b(?:gurbetteyim|yurt\s*dışında\s*yaşıyorum|gurbetçiyim)\b/i.test(lower)) {
    roles.add("GURBETCI");
  }

  // 3. Kalıcı Yaşam Olguları & Psikolojik/Ruhsal/Sağlık Hassasiyetleri (Known Facts)

  // 3A. Psikolojik & Ruhsal Hassasiyetler
  const hasDepression =
    /\b(?:depresyon[a-zçğıöşü]*|antidepresan[a-zçğıöşü]*|majör\s*depresif|ruhsal\s*çökkünlük)\b/i.test(
      lower
    );
  const hasAnxiety =
    /\b(?:anksiyete[a-zçğıöşü]*|kaygı\s*bozuklu[ğg][a-zçğıöşü]*|yaygın\s*anksiyete|bunaltı\s*bozuklu[ğg]u)\b/i.test(
      lower
    );
  if (hasDepression && hasAnxiety) {
    knownFacts.add("Depresyon ve anksiyete süreciyle mücadele ediyor");
  } else if (hasDepression) {
    knownFacts.add("Depresyon süreciyle mücadele ediyor");
  } else if (hasAnxiety) {
    knownFacts.add("Anksiyete ve yoğun kaygı hassasiyeti yaşıyor");
  }

  if (
    /\b(?:panik\s*atak[a-zçğıöşü]*|panik\s*bozuklu[ğg][a-zçğıöşü]*|kalbim\s*sıkışıyor\s*nefes\s*alamıyorum)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Panik atak hassasiyeti yaşıyor");
  }

  if (
    /\b(?:okb|obsesif|takıntı\s*hastalı[ğg]ı|(?:abdest|gusül|namaz|temizlik|iman|küfür)\s*vesvese[a-zçğıöşü]*|aşırı\s*vesvese[a-zçğıöşü]*|takıntılarım\s*var)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("OKB / yoğun vesvese ve takıntı hassasiyeti var");
  }

  if (
    /\b(?:tükenmişlik\s*sendromu|burnout|mental\s*olarak\s*(?:tükendim|bittim)|ruhsal\s*olarak\s*tükendim|hiçbir\s*şeye\s*gücüm\s*kalmadı)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Zihinsel ve ruhsal tükenmişlik (burnout) yaşıyor");
  }

  if (
    /\b(?:uyuyamıyorum|uykusuzluk\s*(?:çekiyorum|sorunu|var)|insomnia|uyku\s*(?:bozuklu[ğg]u|düzenim\s*bozuldu)|geceleri\s*kabus)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Uyku düzensizliği ve uykusuzluk sorunu yaşıyor");
  }

  if (
    /\b(?:travma[a-zçğıöşü]*|tssb|çocukluk\s*yaralar[ıi]|geçmişimi\s*unutamıyorum|şiddet\s*gördüm)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Geçmişten gelen duygusal travma hassasiyeti var");
  }

  if (
    /\b(?:terapiye\s*(?:gidiyorum|başladım)|psikolo[ğg]a\s*gidiyorum|psikiyatrist[a-zçğıöşü]*|psikiyatri\s*(?:tedavisi|ilacı))\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Psikolojik destek / tedavi sürecine devam ediyor");
  }

  if (
    /\b(?:yapayalnızım|kimsem\s*yok|sosyal\s*fobi[a-zçğıöşü]*|değersiz\s*hissediyorum|özgüven\s*eksikli[ğg]i)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Derin yalnızlık ve anlaşılma ihtiyacı içinde");
  }

  if (
    /\b(?:öfke\s*kontrol[üu]|çok\s*çabuk\s*(?:sinirleniyorum|öfkeleniyorum)|öfkeme\s*yeniliyorum)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Öfke kontrolü ve sabır mücadelesi veriyor");
  }

  // 3B. Yas, Vefat, Boşanma & Kayıp Süreçleri
  if (
    /\b(?:(?:annemi|annem)(?:\s+\S+){0,3}\s+(?:kaybettim|vefat\s*etti)|rahmetli\s*annem)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Annesinin vefatı sebebiyle yas sürecinde");
  }
  if (
    /\b(?:(?:babamı|babam)(?:\s+\S+){0,3}\s+(?:kaybettim|vefat\s*etti)|rahmetli\s*babam)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Babasının vefatı sebebiyle yas sürecinde");
  }
  if (
    /\b(?:(?:eşimi|eşim|kocamı|kocam|hanımımı|hanımım)(?:\s+\S+){0,3}\s+(?:kaybettim|vefat\s*etti))\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Eşinin vefatı sebebiyle yas sürecinde");
  }
  if (
    /\b(?:(?:evladımı|çocuğumu|oğlumu|kızımı|bebeğimi)(?:\s+\S+){0,3}\s+(?:kaybettim|vefat\s*etti))\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Evlat kaybı / ağır yas imtihanında");
  } else if (
    /\b(?:(?:kardeşimi|dedemi|anneannemi|babaannemi|yakınımı|dostumu)(?:\s+\S+){0,3}\s+(?:kaybettim|vefat\s*etti)|yas\s*sürecindeyim)\b/i.test(
      lower
    ) &&
    !knownFacts.has("Annesinin vefatı sebebiyle yas sürecinde") &&
    !knownFacts.has("Babasının vefatı sebebiyle yas sürecinde") &&
    !knownFacts.has("Eşinin vefatı sebebiyle yas sürecinde")
  ) {
    knownFacts.add("Yakın kaybı ve yas sürecinden geçiyor");
  }

  if (
    /\b(?:boşandım|boşanma\s*(?:aşamasındayım|davası|sürecindeyim)|eşimden\s*ayrıldım|nişanlımdan\s*ayrıldım|nişan\s*attık|terk\s*edildim|aldatıldım)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Boşanma / ayrılık sonrası kalp onarımı sürecinde");
  }

  if (
    /\b(?:çocuğumuz\s*olmuyor|evlat\s*hasreti|tüp\s*bebek|düşük\s*yaptım)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Evlat hasreti / sağlıkla evlat duası sürecinde");
  }

  // 3C. Fiziksel Sağlık, Hamilelik & Yakın Hastalıkları
  const childrenCountMatch = lower.match(/\b(\d+)\s*(?:tane\s*)?çocuğum\s*var\b/i);
  if (childrenCountMatch?.[1]) {
    knownFacts.add(`${childrenCountMatch[1]} çocuk sahibi`);
  }

  if (/\b(?:hamileyim|gebeyim|doğum\s*yaklaştı|lohusayım|yeni\s*doğum\s*yaptım)\b/i.test(lower)) {
    knownFacts.add("Hamilelik / anneliğe hazırlık sürecinde");
  }

  if (
    /\b(?:kronik\s*hastalı[ğg]ım|kanser\s*tedavisi\s*görüyorum|ameliyat\s*olaca[ğg]ım|ameliyat\s*oldum|engelliyim|hastanedeyim\s*yatıyorum|tedavi\s*görüyorum)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Kendi sağlık ve şifa sürecinden geçiyor");
  }

  if (
    /\bannem[a-zçğıöşü]*\s+(?:ağır\s+|çok\s+|yarın\s+)?(?:hasta|ameliyat|hastanede|yoğun\s*bakım|kanser|tedavi)/i.test(
      lower
    )
  ) {
    knownFacts.add("Annesi sağlık/ameliyat sürecinde");
  }

  if (
    /\bbabam[a-zçğıöşü]*\s+(?:ağır\s+|çok\s+|yarın\s+)?(?:hasta|ameliyat|hastanede|yoğun\s*bakım|kanser|tedavi)/i.test(
      lower
    )
  ) {
    knownFacts.add("Babası sağlık/ameliyat sürecinde");
  }

  if (
    /\beşim[a-zçğıöşü]*\s+(?:ağır\s+|çok\s+|yarın\s+)?(?:hasta|ameliyat|hastanede|yoğun\s*bakım|kanser|tedavi)/i.test(
      lower
    )
  ) {
    knownFacts.add("Eşi sağlık/tedavi sürecinde");
  }

  if (
    /\b(?:çocuğum|oğlum|kızım|evladım|bebeğim)[a-zçğıöşü]*\s+(?:ağır\s+|çok\s+|yarın\s+)?(?:hasta|ameliyat|hastanede|yoğun\s*bakım|tedavi)/i.test(
      lower
    )
  ) {
    knownFacts.add("Evladı sağlık/tedavi sürecinde");
  }

  // 3D. Alışkanlık Bırakma & Nefis / Bağımlılık Mücadelesi
  if (
    /\b(?:kumar[a-zçğıöşü]*|bahis\s*(?:bata[ğg]ı|oynadım|bağımlılı[ğg]ı)|kaldıraçlı\s*işlem[a-zçğıöşü]*\s*kaybettim)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Kumar/bahis alışkanlığından kurtulma mücadelesinde");
  } else if (
    /\b(?:bağımlılı[ğg]ım\s*var|sigarayı\s*bırakmak|alkolü\s*bırakmak|ekran\s*bağımlılı[ğg]ı|haram\s*alışkanlı[ğg]ı|irademe\s*hakim\s*olamıyorum|aynı\s*günaha\s*düşüyorum)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Zararlı alışkanlığı bırakma ve irade inşası sürecinde");
  }

  // 3E. Aile, Gurbet, Sınav, Evlilik, İş & Geçim Durumları
  if (
    /\b(?:borcum|borçlar|kredi\s*borcu|icra|haciz|iflas\s*ettim|geçim\s*sıkıntısı)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Maddi darlık / borç imtihanı yaşıyor");
  }

  if (
    /\b(?:işsizim|işten\s*çıkarıldım|iş\s*bulamıyorum|rızık\s*arayışı|rızık\s*telaşı|gelecek\s*kaygısı)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Rızık ve gelecek kaygısıyla mücadele ediyor");
  }

  if (
    /\b(?:haksızlığa\s*uğradım|hakkım\s*yendi|mobbing|iftira)\b/i.test(lower)
  ) {
    knownFacts.add("İş/sosyal çevrede haksızlık imtihanı yaşadı");
  }

  if (
    /\b(?:eşimle\s*(?:tartıştık|kavga|sorun|anlaşamıyoruz|küsüz|ayrılma)|evde\s*huzur)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Aile içi huzur ve iletişim imtihanı yaşıyor");
  }

  if (
    /\b(?:kayınvalidem|kaynanam|ailem\s*baskı\s*yapıyor|babamla\s*anlaşamıyoruz|annemle\s*tartıştık|miras\s*kavgası)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Aile büyükleri/akrabalarla iletişim imtihanında");
  }

  if (/\b(?:ortağımla|ortaklık|ticari\s*anlaşmazlık)\b/i.test(lower)) {
    knownFacts.add("İş yerinde ortaklık/ticaret imtihanı var");
  }

  if (
    /\b(?:evlenmek\s*istiyorum|hayırlı\s*kısmet|düğün\s*hazırlı[ğg]ı|evlilik\s*korkusu|görücü\s*usulü)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Hayırlı evlilik ve yuva kurma arayışında");
  }

  if (
    /\b(?:yks|kpss|tus|ales|tez\s*yazıyorum|atama\s*bekliyorum|mülakatım\s*var|sınav\s*stresi)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Önemli bir sınav / atama hazırlık sürecinde");
  }

  if (
    /\b(?:gurbetteyim|yurt\s*dışında\s*yaşıyorum|ailemden\s*uzaktayım|yurtta\s*kalıyorum|yeni\s*taşındım)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Gurbette / ailesinden uzakta yaşıyor");
  }

  // 3F. Manevi Hedefler & Kalbi Arayış
  if (
    /\b(?:namaza\s*başlamak|sabah\s*namazına\s*(?:kalkmak|kalkamıyorum)|namazlarımı\s*aksatıyorum|kaza\s*namazlar[ıi]m)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Namaz istikameti ve ibadet düzeni kurma gayretinde");
  } else if (
    /\b(?:namaz|huşu|ibadet|dua\s*ediyorum|tevekkül|sabretmeye)\b/i.test(lower)
  ) {
    knownFacts.add("İbadetlerinde huşu ve tevekkül arayışında");
  }

  if (
    /\b(?:kuran\s*öğreniyorum|kur'an\s*öğreniyorum|hatim|tesettüre\s*girmek|tesettür\s*mücadelesi)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Kur'an ve manevi pratiklerde derinleşme niyetinde");
  }

  if (
    /\b(?:manevi\s*boşluk|kalbim\s*katılaştı|imanımı\s*güçlendirmek|inanç\s*sorgulaması|şüphelerim\s*var|hayatın\s*anlamı)\b/i.test(
      lower
    )
  ) {
    knownFacts.add("Manevi boşluktan çıkış ve kalbi huzur arayışında");
  }

  // 4. Ruhi & Biyolojik Enerji Hali (Arka plan bağlamı için)
  if (/\b(?:yoruldum|yorgunum|tükendim|uyuyamıyorum|uykusuz|bitkinim|halsizim)\b/i.test(lower)) {
    biologicalEnergy.add("YORGUN_VE_ARGUN");
  }
  if (/\b(?:daralıyor|bunalıyorum|sıkışıyor|kaygı|anksiyete|panik|stres|korkuyorum|endişe)\b/i.test(lower)) {
    biologicalEnergy.add("KAYGILI_VE_DARALMIS");
  }
  if (/\b(?:depresyon|kırgın|üzgün|ağladım|hüzün|yalnız|incindim|vefat|kaybettim)\b/i.test(lower)) {
    biologicalEnergy.add("HUZUNLU_VE_KIRGIN");
  }
  if (/(?<![\p{L}\p{N}])(?:öfke[\p{L}]*|sinir[\p{L}]*|kızgın[\p{L}]*|kızdım|çileden\s*çıktım|patlayaca[ğg]ım|tahammülüm\s*kalmadı)(?![\p{L}\p{N}])/iu.test(lower)) {
    biologicalEnergy.add("OFKELI_VE_GERGIN");
  }
  if (/\b(?:rahatlatıyor|ferahladım|şükür|elhamdülillah|huzur|iyi\s*geldi|inşallah)\b/i.test(lower)) {
    biologicalEnergy.add("DINGIN_VE_ACIK");
  }
  if (/\b(?:ne\s*yapmalıyım|nasıl\s*yaparım|tavsiye|yol\s*göster|çözüm)\b/i.test(lower)) {
    biologicalEnergy.add("COZUM_VE_ISTIKAMET_ARAYISI");
  }

  // 5. Manevi Aşama ve AI Dinamik Üslup Ayarı
  const hasPsychologicalOrGriefVulnerability =
    hasDepression ||
    hasAnxiety ||
    /\b(?:panik\s*atak|okb|travma|vefat|kaybettim|boşandım|tükendim|yapayalnızım)\b/i.test(
      lower
    );

  if (hasPsychologicalOrGriefVulnerability) {
    progressedTone = "SEFKATLI_TESKIN";
  } else if (
    /(?<![\p{L}\p{N}])(?:öfke[\p{L}]*|sinir[\p{L}]*|kızgın[\p{L}]*|kızdım|çileden\s*çıktım|patlayaca[ğg]ım|tahammülüm\s*kalmadı)(?![\p{L}\p{N}])/iu.test(
      lower
    )
  ) {
    progressedTone = "SAKINLESTIRICI_VE_VAKUR";
  } else if (
    /\b(?:tövbe|tevbe|pişmanım|hatamı|nefsim|kusurum|affeder\s*mi|günah)\b/i.test(
      lower
    )
  ) {
    progressedStage = "MUHASEBE_VE_TEVBE";
    progressedTone = "SEFKATLI_TESKIN";
  } else if (
    /\b(?:tefekkür|murakabe|ihlas|hikmet|rabıta|marifet|sır|hakikat)\b/i.test(
      lower
    )
  ) {
    progressedStage = "DERINLESMIS_SALIK";
    progressedTone = "HIKMETLI_SUKUT";
  } else if (
    /\b(?:namazlarımda|huşu|tevekkül\s*etmek|sabretmeye\s*çalışıyorum|dua\s*ediyorum|istikamet|gayret|başladım|niyet\s*ettim)\b/i.test(
      lower
    )
  ) {
    progressedStage = "ISTIKAMET_VE_INSA";
    progressedTone = "DIRILIS_VE_GAYRET";
  }

  return {
    ...(preferredName ? { preferred_name: preferredName } : {}),
    roles: Array.from(roles),
    known_facts: Array.from(knownFacts),
    biological_energy: Array.from(biologicalEnergy),
    ...(progressedStage ? { progressed_stage: progressedStage } : {}),
    ...(progressedTone ? { progressed_tone: progressedTone } : {}),
  };
}

/**
 * Benzer veya iç içe geçmiş kalıcı notları tekilleştirir (ör. ayrı ayrı depresyon/anksiyete
 * notu ile birleşik "Depresyon ve anksiyete..." notunun üst üste binmesini önler).
 */
export function deduplicateKnownFacts(rawFacts: string[]): string[] {
  const cleaned = rawFacts
    .map((f) => (typeof f === "string" ? f.trim() : ""))
    .filter((f) => f.length >= 3);

  const hasCombinedDepAnx = cleaned.some(
    (f) =>
      f.toLocaleLowerCase("tr-TR").includes("depresyon") &&
      f.toLocaleLowerCase("tr-TR").includes("anksiyete")
  );

  const result: string[] = [];
  const tokenSets: Set<string>[] = [];

  for (const item of cleaned) {
    const lower = item.toLocaleLowerCase("tr-TR");
    if (
      hasCombinedDepAnx &&
      ((lower.includes("depresyon") && !lower.includes("anksiyete")) ||
        (lower.includes("anksiyete") && !lower.includes("depresyon")))
    ) {
      continue;
    }

    const canonicalLower = lower
      .replace(/\b(?:terapi\w*|psikolo\w*|psikiyatr\w*)\b/g, "psikolojik destek tedavi")
      .replace(/\b(?:uykusuz\w*|insomnia)\b/g, "uyku duzensizligi");

    const tokens = new Set(
      canonicalLower
        .replace(/[^a-z0-9çğıöşü\s]/gi, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !["sürecinde", "sürecinden", "mücadele", "ediyor", "yaşıyor", "geçiyor", "sahibi", "olan", "içinde", "devam"].includes(w))
    );

    let isDuplicate = false;
    for (let i = 0; i < result.length; i++) {
      if (result[i].toLocaleLowerCase("tr-TR") === lower) {
        isDuplicate = true;
        break;
      }
      const existingTokens = tokenSets[i];
      if (tokens.size >= 2 && existingTokens.size >= 2) {
        let overlap = 0;
        for (const t of tokens) {
          if (existingTokens.has(t)) overlap++;
        }
        const minSize = Math.min(tokens.size, existingTokens.size);
        if (overlap / minSize >= 0.75) {
          // Daha kapsayıcı olan cümleyi tut
          if (item.length > result[i].length) {
            result[i] = item;
            tokenSets[i] = tokens;
          }
          isDuplicate = true;
          break;
        }
      }
    }

    if (!isDuplicate) {
      result.push(item);
      tokenSets.push(tokens);
    }
  }

  return result.slice(-15);
}

const STAGE_RANK: Record<SpiritualStage, number> = {
  DARLIK_VE_BUNALIM: 1,
  ARAYIS_VE_BASLANGIC: 2,
  MUHASEBE_VE_TEVBE: 3,
  ISTIKAMET_VE_INSA: 4,
  DERINLESMIS_SALIK: 5,
};

/**
 * Mevcut User.profileMetadata JSON kaydını yeni yakalanan isim, rol ve olgularla birleştirir.
 * Web kullanıcılarını da normal kullanıcılar gibi gerçek rolleri ve her mesajda gelişen
 * kalıcı hafızasıyla ele alır.
 */
export function mergeUserProfileMetadata(params: {
  existingMeta?: Record<string, unknown> | null;
  extractedFacts?: ExtractedUserProfileFacts;
  jevResult?: JevAnalysisResult | null;
}): PersistentUserProfile {
  const base = params.existingMeta || {};
  const facts = params.extractedFacts || { roles: [], known_facts: [] };
  const jev = params.jevResult;

  const prevInteractionCount =
    typeof base.interaction_count === "number" && base.interaction_count > 0
      ? base.interaction_count
      : 0;
  const interactionCount = prevInteractionCount + 1;

  const preferredName =
    facts.preferred_name ||
    (typeof base.preferred_name === "string" && base.preferred_name.trim()
      ? base.preferred_name.trim()
      : undefined);

  const existingRoles = Array.isArray(base.roles)
    ? (base.roles as unknown[]).filter(
        (r): r is string =>
          typeof r === "string" &&
          r !== "WEB_KULLANICI" &&
          r !== "MISAFIR_KULLANICI"
      )
    : [];
  const mergedRoles = Array.from(new Set([...existingRoles, ...facts.roles]));

  const existingFacts = Array.isArray(base.known_facts)
    ? (base.known_facts as unknown[]).filter(
        (f): f is string => typeof f === "string" && f.trim().length > 0
      )
    : [];
  const mergedFacts = deduplicateKnownFacts([
    ...existingFacts,
    ...facts.known_facts,
  ]);

  const existingTrials = Array.isArray(base.spiritual_trials)
    ? (base.spiritual_trials as unknown[]).filter(
        (t): t is string => typeof t === "string" && t.trim().length > 0
      )
    : [];
  const mergedTrials = Array.from(
    new Set([
      ...existingTrials,
      ...(jev?.nafs_trap ? [jev.nafs_trap] : []),
    ])
  ).slice(-6);

  const existingEnergy = Array.isArray(base.biological_energy)
    ? (base.biological_energy as unknown[]).filter(
        (e): e is string => typeof e === "string" && e.trim().length > 0
      )
    : [];
  const inferredEnergy =
    facts.biological_energy && facts.biological_energy.length > 0
      ? facts.biological_energy
      : jev?.distress_level && jev.distress_level >= 7
        ? ["KAYGILI_VE_DARALMIS"]
        : ["SAMIMI_ARAYIS"];
  const mergedEnergy = Array.from(
    new Set([...existingEnergy, ...inferredEnergy])
  ).slice(-4);

  // Üslup Tercihi: Oturum içi anlık ruh haline (öfkeliye sakinleştirici/vakur, hüzünlüye şefkatli)
  // ve derin triyajdan gelen üsluba göre dinamik güncelleme
  const baseTone = base.tone_preference as TonePreference | undefined;
  let tonePreference: TonePreference = "SEFKATLI_TESKIN";
  if (jev?.session_mood === "OFKELI_VE_GERGIN") {
    tonePreference = "SAKINLESTIRICI_VE_VAKUR";
  } else if (
    jev?.session_mood === "HUZUNLU_VE_KIRGIN" ||
    (jev?.distress_level && jev.distress_level >= 8)
  ) {
    tonePreference = "SEFKATLI_TESKIN";
  } else if (facts.progressed_tone) {
    tonePreference = facts.progressed_tone;
  } else if (
    jev?.recommended_tone &&
    jev.recommended_tone !== "SEFKATLI_TESKIN"
  ) {
    tonePreference = jev.recommended_tone;
  } else if (baseTone) {
    tonePreference = baseTone;
  }

  // Manevi Seyir Aşaması Evrimi:
  // Kriz >= 8 ise geçici olarak DARLIK_VE_BUNALIM; değilse kullanıcının kazandığı aşamayı
  // koru ve sohbet ilerledikçe (etkileşim + niyet) bir üst basamağa taşı
  const baseStage = base.spiritual_stage as SpiritualStage | undefined;
  let spiritualStage: SpiritualStage = baseStage || "ARAYIS_VE_BASLANGIC";

  if (jev?.distress_level && jev.distress_level >= 8) {
    spiritualStage = "DARLIK_VE_BUNALIM";
  } else {
    const candidateStages: SpiritualStage[] = [];
    if (baseStage && baseStage !== "DARLIK_VE_BUNALIM") {
      candidateStages.push(baseStage);
    }
    if (facts.progressed_stage) {
      candidateStages.push(facts.progressed_stage);
    }
    if (
      jev?.spiritual_stage &&
      jev.spiritual_stage !== "ARAYIS_VE_BASLANGIC" &&
      jev.spiritual_stage !== "DARLIK_VE_BUNALIM"
    ) {
      candidateStages.push(jev.spiritual_stage);
    }
    // Sohbet ilerledikçe organik gelişim (kullanıcı 3+ mesajdır istikrarlı dertleşiyorsa)
    if (interactionCount >= 6 && (!jev || jev.distress_level <= 5)) {
      candidateStages.push("DERINLESMIS_SALIK");
    } else if (interactionCount >= 3 && (!jev || jev.distress_level <= 6)) {
      candidateStages.push("ISTIKAMET_VE_INSA");
    } else if (interactionCount >= 2 && mergedTrials.length >= 1) {
      candidateStages.push("MUHASEBE_VE_TEVBE");
    }

    if (candidateStages.length > 0) {
      candidateStages.sort(
        (a, b) => (STAGE_RANK[b] || 0) - (STAGE_RANK[a] || 0)
      );
      spiritualStage = candidateStages[0];
    } else if (jev?.distress_level && jev.distress_level >= 7) {
      spiritualStage = "DARLIK_VE_BUNALIM";
    } else {
      spiritualStage = "ARAYIS_VE_BASLANGIC";
    }
  }

  // 4 Adımlı Onboarding & Profil Olgunluk Hesabı
  let filledBlocks = 1; // Manevi imtihan & aşama her zaman aktif
  if (mergedRoles.length > 0 || preferredName) filledBlocks++;
  if (mergedFacts.length > 0) filledBlocks++;
  if (interactionCount >= 3 || STAGE_RANK[spiritualStage] >= 3) filledBlocks++;

  const onboardingStep = Math.min(4, Math.max(1, filledBlocks));
  const onboardingCompleted = onboardingStep >= 3;

  const rawCompletion =
    20 +
    (preferredName ? 20 : 0) +
    Math.min(20, mergedRoles.length * 10) +
    Math.min(20, mergedFacts.length * 10) +
    Math.min(20, interactionCount * 5);
  const profileCompletion = Math.min(100, rawCompletion);

  const prevHistory = Array.isArray(base.stage_history)
    ? (base.stage_history as SpiritualStageHistoryItem[])
    : [];
  const lastRecordedStage = prevHistory[prevHistory.length - 1]?.stage;
  const nowIso = new Date().toISOString();
  const stageHistory =
    lastRecordedStage === spiritualStage
      ? prevHistory
      : [...prevHistory, { stage: spiritualStage, updatedAt: nowIso }].slice(
          -6
        );

  return {
    ...base,
    ...(preferredName ? { preferred_name: preferredName } : {}),
    roles: mergedRoles,
    known_facts: mergedFacts,
    spiritual_trials: mergedTrials,
    biological_energy: mergedEnergy,
    tone_preference: tonePreference,
    spiritual_stage: spiritualStage,
    interaction_count: interactionCount,
    onboarding_step: onboardingStep,
    onboarding_completed: onboardingCompleted,
    profile_completion: profileCompletion,
    stage_history: stageHistory,
    account_type: "REGISTERED_MEMBER",
    updated_at: nowIso,
  };
}

let aiClient: GoogleGenAI | null = null;
let triageOfflineUntil = 0;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "mock_gemini_key_for_testing_and_verification") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/**
 * Asynchronous deep semantic triage using gemini-3.5-flash-lite.
 * Runs non-blocking / fire-and-forget so user TTFT is 0ms affected.
 */
export async function runSemanticTriage(params: {
  userMessage: string;
  conversationHistorySnippet?: string;
}): Promise<SemanticTriageResult | null> {
  const client = getAIClient();
  if (!client || Date.now() < triageOfflineUntil) {
    return null;
  }

  const prompt = `Sen İslami irfan ve manevi rehberlik alanında uzman bir manevi triyaj hekimisin.
Kullanıcının yazdığı mesajın ardındaki hakiki derdi, kalbi ihtiyacı, nefis imtihanını ve kullanıcının Sırdaş tarafından ilerleyen sohbetlerde hatırlanması gereken tüm önemli kişisel bağlamını analiz et.

Kullanıcı Mesajı: "${params.userMessage}"
${params.conversationHistorySnippet ? `Önceki Bağlam: ${params.conversationHistorySnippet}` : ""}

ÖNEMLİ "persistentFacts" KURALLARI:
Kullanıcının mesajında aşağıdakilerden herhangi biri geçiyorsa mutlaka saygılı, yargılamayan, şefkatli ve özlü (3-7 kelimelik, 3. tekil şahıs) bir not olarak "persistentFacts" dizisine ekle:
1. Ruhsal ve psikolojik durumlar / hassasiyetler (örn: depresyon, anksiyete, panik atak, OKB/vesvese, tükenmişlik/burnout, uykusuzluk, travma, terapi/ilaç süreci, derin yalnızlık, öfke kontrolü -> örn: "Depresyon ve anksiyete süreciyle mücadele ediyor", "Panik atak hassasiyeti yaşıyor")
2. Fiziksel sağlık ve bakım süreçleri (kendi kronik hastalığı, ameliyat, hamilelik/lohusalık veya anne/baba/eş/evlat hastalığı -> örn: "Annesi ameliyat sürecinde")
3. Kayıp, yas ve ayrılıklar (yakın vefatı, boşanma, ayrılık, evlat hasreti -> örn: "Babasının vefatı sebebiyle yas sürecinde")
4. Aile, meslek, eğitim, gurbet ve geçim durumları (çocuk sayısı, YKS/KPSS/tez sınav hazırlığı, borç/işsizlik, gurbette yaşama, evlilik arayışı)
5. Bırakmaya çalıştığı alışkanlıklar/bağımlılıklar ve manevi hedefleri/niyetleri (kumar/sigara/haram alışkanlığı bırakma, namaza başlama, sabah namazı, Kur'an öğrenme, manevi boşluktan çıkış arayışı)
Eğer mesajda böyle kalıcı/hatırlanmaya değer bir bilgi yoksa boş dizi [] döndür (selamlaşmayı veya sıradan soruları not etme).

Aşağıdaki JSON şemasına harfiyen uygun olarak Türkçe yanıt ver:
{
  "nafsTrap": "Kullanıcının haliyle en çok örtüşen nefis tuzağı. Seçenekler: FAKIRLIK_KORKUSU_VESVESESI, GIZLI_KIBIR_HAKLILIK, UMITSIZLIK_KARAMSARLIK, INTIKAM_VE_HASET, ELALEM_NE_DER_RIYA, REHAVET_TEMBELLIK, KADERE_ITIRAZ_VE_ISYAN, ACELECI_TALEPLER_VE_ISTIACAL, ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK, UCUB_VE_AMELINE_GUVENME, KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK, GIZLI_SIRK_VE_SAHTE_SIGINAKLAR, SUI_ZAN_VE_TECESSUS, MINNET_VE_BASA_KAKMA, KAYITSIZLIK_VE_MERHAMETSIZLIK, GECMISIN_PISMANLIK_GIRDABI, TUL_I_EMEL_VE_GAYETSIZLIK, VESVESE_VE_GUSUL_ABDEST_EVHAMI, KOLAY_KAZANC_HIRSI, CIMRILIK_VE_MAL_HIRSI, HAYIR_DIYEMEME_ZAAFI, DUNYALIK_KAYGI",
  "spiritualStage": "DARLIK_VE_BUNALIM | ARAYIS_VE_BASLANGIC | MUHASEBE_VE_TEVBE | DERINLESMIS_SALIK | ISTIKAMET_VE_INSA",
  "distressLevel": 1-10 arası tamsayı (1: sakin, 5: kaygılı/bunalmış, 10: ağır çaresizlik/çöküş),
  "recommendedTone": "SEFKATLI_TESKIN | SAKINLESTIRICI_VE_VAKUR | DIRILIS_VE_GAYRET | NET_VE_MUALLIM | HIKMETLI_SUKUT | TAVIZSIZ_MUALLIM",
  "underlyingNeed": "Kullanıcının en derin manevi ihtiyacı (1 özlü cümle)",
  "spiritualDiagnosis": "Kısa manevi teşhis özeti (1 duru cümle)",
  "preferredName": "Kullanıcı kendi adını belirttiyse sadece ilk adı (örn: 'Ahmet'), belirtmediyse null",
  "roles": ["Varsa toplumsal roller: EVLI, BEKAR, EBEVEYN, ESNAF, OGRENCI, CALISAN, YAZILIMCI_MUHENDIS, OGRETMEN, SAGLIK_CALISANI, HASTA_BAKIMI, EMEKLI, EV_HANIMI, GURBETCI"],
  "persistentFacts": ["Hatırlanması gereken önemli ruhsal, sağlık, ailevi, mesleki veya manevi notlar"]
}`;

  try {
    const res = await client.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 300,
        abortSignal: AbortSignal.timeout(6000),
      },
    });

    const text = res.text?.trim() || "";
    if (!text) return null;

    const parsed = JSON.parse(text);
    const extractedName =
      typeof parsed.preferredName === "string" &&
      parsed.preferredName !== "null"
        ? normalizeCapitalizedName(parsed.preferredName)
        : null;

    return {
      nafsTrap: parsed.nafsTrap as NafsTrap,
      spiritualStage: parsed.spiritualStage as SpiritualStage,
      distressLevel: Math.min(
        10,
        Math.max(1, Number(parsed.distressLevel) || 5)
      ),
      recommendedTone: parsed.recommendedTone as TonePreference,
      underlyingNeed: String(parsed.underlyingNeed || "").trim(),
      spiritualDiagnosis: String(parsed.spiritualDiagnosis || "").trim(),
      preferredName: extractedName,
      roles: Array.isArray(parsed.roles)
        ? parsed.roles.filter((r: unknown) => typeof r === "string")
        : [],
      persistentFacts: Array.isArray(parsed.persistentFacts)
        ? parsed.persistentFacts.filter((f: unknown) => typeof f === "string")
        : [],
    };
  } catch (err) {
    triageOfflineUntil = Date.now() + 30_000;
    console.warn(
      "[Semantic Triage Warning - Non-blocking fallback triggered]:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

/**
 * Fire-and-forget background dispatcher.
 * Enriches user.profileMetadata and message.editorAudit in PostgreSQL
 * without blocking or delaying the user's active streaming response.
 */
export function dispatchBackgroundTriage(params: {
  userKey: string;
  assistantMessageId?: string;
  userMessageId?: string;
  userMessage: string;
  conversationHistorySnippet?: string;
}): void {
  // Run asynchronously without awaiting in request lifecycle
  Promise.resolve()
    .then(async () => {
      try {
        const triage = await runSemanticTriage({
          userMessage: params.userMessage,
          conversationHistorySnippet: params.conversationHistorySnippet,
        });

        if (!triage) return;

        // 1. Update user profile metadata
        const user = await prisma.user.findUnique({
          where: { phoneNumber: params.userKey },
        });

        if (user) {
          const currentMeta =
            (user.profileMetadata as Record<string, unknown>) || {};
          const existingRoles = Array.isArray(currentMeta.roles)
            ? (currentMeta.roles as string[]).filter(
                (r) => r !== "WEB_KULLANICI" && r !== "MISAFIR_KULLANICI"
              )
            : [];
          const existingFacts = Array.isArray(currentMeta.known_facts)
            ? (currentMeta.known_facts as string[])
            : [];

          const mergedRoles = Array.from(
            new Set([...existingRoles, ...(triage.roles || [])])
          );
          const mergedFacts = deduplicateKnownFacts([
            ...existingFacts,
            ...(triage.persistentFacts || []),
          ]);
          const resolvedName =
            triage.preferredName ||
            (typeof currentMeta.preferred_name === "string"
              ? currentMeta.preferred_name
              : undefined);
          const interactionCount =
            typeof currentMeta.interaction_count === "number"
              ? currentMeta.interaction_count
              : 1;

          // Aşama koruma: Kullanıcı daha ileri bir aşamaya geçtiyse ve yüksek kriz yoksa düşürme
          const prevStage = currentMeta.spiritual_stage as
            | SpiritualStage
            | undefined;
          let nextStage: SpiritualStage = triage.spiritualStage;
          if (
            prevStage &&
            prevStage !== "DARLIK_VE_BUNALIM" &&
            triage.distressLevel < 8 &&
            (STAGE_RANK[prevStage] || 0) > (STAGE_RANK[triage.spiritualStage] || 0)
          ) {
            nextStage = prevStage;
          }

          let filledBlocks = 1;
          if (mergedRoles.length > 0 || resolvedName) filledBlocks++;
          if (mergedFacts.length > 0) filledBlocks++;
          if (interactionCount >= 3 || (STAGE_RANK[nextStage] || 0) >= 3)
            filledBlocks++;
          const onboardingStep = Math.min(4, Math.max(1, filledBlocks));
          const onboardingCompleted = onboardingStep >= 3;

          const rawCompletion =
            20 +
            (resolvedName ? 20 : 0) +
            Math.min(20, mergedRoles.length * 10) +
            Math.min(20, mergedFacts.length * 10) +
            Math.min(20, interactionCount * 5);
          const profileCompletion = Math.min(100, rawCompletion);

          const prevHistory = Array.isArray(currentMeta.stage_history)
            ? (currentMeta.stage_history as SpiritualStageHistoryItem[])
            : [];
          const lastRecordedStage = prevHistory[prevHistory.length - 1]?.stage;
          const nowIso = new Date().toISOString();
          const stageHistory =
            lastRecordedStage === nextStage
              ? prevHistory
              : [...prevHistory, { stage: nextStage, updatedAt: nowIso }].slice(
                  -6
                );

          const updatedMeta = {
            ...currentMeta,
            ...(resolvedName ? { preferred_name: resolvedName } : {}),
            roles: mergedRoles,
            known_facts: mergedFacts,
            spiritual_trials: Array.from(
              new Set([
                ...((currentMeta.spiritual_trials as string[]) || []),
                triage.nafsTrap,
              ])
            ).slice(-6),
            spiritual_stage: nextStage,
            tone_preference: triage.recommendedTone,
            onboarding_step: onboardingStep,
            onboarding_completed: onboardingCompleted,
            profile_completion: profileCompletion,
            stage_history: stageHistory,
            account_type: "REGISTERED_MEMBER",
            updated_at: nowIso,
            latest_deep_triage: {
              ...triage,
              triagedAt: nowIso,
            },
          };

          await prisma.user.update({
            where: { phoneNumber: params.userKey },
            data: {
              onboardingStep,
              onboardingCompleted,
              profileMetadata: JSON.parse(JSON.stringify(updatedMeta)),
            },
          });
        }

        // 2. If assistantMessageId provided, enrich editorAudit & jevMetadata
        if (params.assistantMessageId) {
          const msg = await prisma.message.findUnique({
            where: { id: params.assistantMessageId },
          });

          if (msg) {
            const currentAudit =
              (msg.editorAudit as Record<string, unknown>) || {};
            const currentJev =
              (msg.jevMetadata as Record<string, unknown>) || {};
            await prisma.message.update({
              where: { id: params.assistantMessageId },
              data: {
                editorAudit: JSON.parse(
                  JSON.stringify({
                    ...currentAudit,
                    deepTriage: triage,
                  })
                ),
                jevMetadata: JSON.parse(
                  JSON.stringify({
                    ...currentJev,
                    distress_level: triage.distressLevel,
                    nafs_trap: triage.nafsTrap,
                    spiritual_stage: triage.spiritualStage,
                    recommended_tone: triage.recommendedTone,
                  })
                ),
              },
            });
          }
        }

        // 3. If userMessageId provided, enrich user's jevMetadata & editorAudit
        if (params.userMessageId) {
          const userMsg = await prisma.message.findUnique({
            where: { id: params.userMessageId },
          });

          if (userMsg) {
            const currentJev =
              (userMsg.jevMetadata as Record<string, unknown>) || {};
            await prisma.message.update({
              where: { id: params.userMessageId },
              data: {
                jevMetadata: JSON.parse(
                  JSON.stringify({
                    ...currentJev,
                    distress_level: triage.distressLevel,
                    nafs_trap: triage.nafsTrap,
                    spiritual_stage: triage.spiritualStage,
                    recommended_tone: triage.recommendedTone,
                  })
                ),
                editorAudit: JSON.parse(
                  JSON.stringify({
                    deepTriage: triage,
                  })
                ),
              },
            });
          }
        }
      } catch (err) {
        console.warn("[Background Triage Execution Error]", err);
      }
    })
    .catch(() => {});
}
