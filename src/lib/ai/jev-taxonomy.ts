export interface JevAnalysisRequest {
  userMessage: string;
  userContextSnippet?: string;
  sessionHistory?: ReadonlyArray<{ role: string; content: string }>;
}

export type NafsTrap =
  // Temel Tuzaklar
  | "FAKIRLIK_KORKUSU_VESVESESI"
  | "FAIRLIK_KORKUSU_VESVESESI"
  | "GIZLI_KIBIR_HAKLILIK"
  | "UMITSIZLIK_KARAMSARLIK"
  | "INTIKAM_VE_HASET"
  | "ELALEM_NE_DER_RIYA"
  | "REHAVET_TEMBELLIK"
  // A. İlahi Adalet & Kader Çatışmaları
  | "KADERE_ITIRAZ_VE_ISYAN"
  | "ACELECI_TALEPLER_VE_ISTIACAL"
  | "ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK"
  // B. Nefsin Gizli Putları & Benlik İllüzyonları
  | "UCUB_VE_AMELINE_GUVENME"
  | "KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK"
  | "GIZLI_SIRK_VE_SAHTE_SIGINAKLAR"
  // C. İkili İlişkiler & Sosyal Nefis
  | "SUI_ZAN_VE_TECESSUS"
  | "MINNET_VE_BASA_KAKMA"
  | "KAYITSIZLIK_VE_MERHAMETSIZLIK"
  // D. İmtihan Karşısındaki Ruh Halleri
  | "GECMISIN_PISMANLIK_GIRDABI"
  | "TUL_I_EMEL_VE_GAYETSIZLIK"
  | "VESVESE_VE_GUSUL_ABDEST_EVHAMI"
  // Ek Manevi Zafiyetler
  | "KOLAY_KAZANC_HIRSI"
  | "CIMRILIK_VE_MAL_HIRSI"
  | "HAYIR_DIYEMEME_ZAAFI"
  | "DUNYALIK_KAYGI";

export type RagCategory =
  // Mevcut 7 Genel Alan
  | "RIZIK_VE_TICARET"
  | "SABIR_VE_MUSIBET"
  | "OFKE_VE_AHLAK"
  | "AILE_VE_SILA_I_RAHIM"
  | "KUL_HAKKI_VE_ADALET"
  | "TEVEKKUL_VE_MURAKABE"
  | "SIYER_ORNEKLERI"
  // Yeni Odak Alanları
  | "KADER_VE_KAZA_HIKMETI"
  | "DUA_VE_ILCA_USULU"
  | "TEVBE_VE_INABE"
  | "KALP_AMELLELI_VE_IHLAS"
  | "KALP_AMELLERI_VE_IHLAS"
  | "FANILIK_VE_TAZIYE"
  | "FITNE_VE_AHIR_ZAMAN_AHLAKI"
  | "ISRAF_VE_IKTISAT_FIKHI"
  | "SIYERDE_DARLIK_DONEMLERI"
  | "TESKIN_VE_TESELLI";

export type TonePreference =
  | "SEFKATLI_TESKIN"
  | "SAKINLESTIRICI_VE_VAKUR"
  | "DIRILIS_VE_GAYRET"
  | "NET_VE_MUALLIM"
  | "HIKMETLI_SUKUT"
  | "TAVIZSIZ_MUALLIM";

export type SessionMood =
  | "HUZUNLU_VE_KIRGIN"
  | "OFKELI_VE_GERGIN"
  | "KAYGILI_VE_DARALMIS"
  | "YORGUN_VE_TUKENMIS"
  | "PISMAN_VE_MAHCUP"
  | "KARARLI_VE_GAYRETLI"
  | "SAKIN_VE_DENGELI";

export type SpiritualStage =
  | "ARAYIS_VE_BASLANGIC"
  | "DARLIK_VE_BUNALIM"
  | "DERINLESMIS_SALIK"
  | "ISTIKAMET_VE_INSA"
  | "MUHASEBE_VE_TEVBE";

export interface JevAnalysisResult {
  is_fiqh_fatwa_request: number;
  is_debt_or_riba_related: number;
  needs_audio_snippet: number;
  nafs_trap: NafsTrap;
  rag_category: RagCategory;
  distress_level: number;
  recommended_tone?: TonePreference;
  session_mood?: SessionMood;
  spiritual_stage?: SpiritualStage;
  is_violence_or_abuse?: number;
  violence_type?: "perpetrator" | "victim";
  is_extreme_crisis?: number;
}

export const NAFS_TRAP_CRITERIA: Record<string, string> = {
  FAKIRLIK_KORKUSU_VESVESESI: "Fakirlikle korkutma ve rızık endişesi (Bakara 268)",
  FAIRLIK_KORKUSU_VESVESESI: "Fakirlikle korkutma ve rızık endişesi (Bakara 268)",
  GIZLI_KIBIR_HAKLILIK: "Kendini haklı görme, karşı tarafı suçlama ve gizli kibir",
  UMITSIZLIK_KARAMSARLIK: "Çaresizlik, bataklık hissi ve ümitsizlik",
  INTIKAM_VE_HASET: "Öfke, kin, intikam veya kıskançlık",
  ELALEM_NE_DER_RIYA: "İnsanların onayını arama, elalem putu ve riya",
  REHAVET_TEMBELLIK: "Erteleme, tembellik ve mesuliyetten kaçış",
  KADERE_ITIRAZ_VE_ISYAN:
    '"Neden hep benim başıma geliyor?", ilahi takdiri sorgulama, gizli kadere rıza zafiyeti',
  ACELECI_TALEPLER_VE_ISTIACAL:
    "Duanın hemen kabul edilmesini isteme, vakti gelmemiş netice için hayıflanma (Enbiya 37)",
  ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK:
    "Sebepleri ilahlaştırma; patronu, parayı, torpili rızkın veya şifanın tek kaynağı zannedip Müsebbibü'l-Esbâb'ı (Allah'ı) unutma",
  UCUB_VE_AMELINE_GUVENME:
    "Kendi ibadetini, dürüstlüğünü veya ahlakını beğenme; Allah'ın lütfunu kendi liyakati sanma",
  KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK:
    "Her şeyi kendi iradesiyle kontrol edebileceğini sanıp aşırı kaygı ve evham üretme (tevekkül eksikliği)",
  GIZLI_SIRK_VE_SAHTE_SIGINAKLAR:
    "Keder anında teselliyi haramda, uyuşturucu meşgalelerde, dedikoduda veya fani şeylerde arama",
  SUI_ZAN_VE_TECESSUS:
    "İnsanlar hakkında sürekli kötü niyet arama, kuruntu ve komplo vesvesesi (Hucurât 12)",
  MINNET_VE_BASA_KAKMA:
    "Yaptığı iyiliği veya fedakarlığı muhatabının yüzüne vurma, ecrini iptal etme (Bakara 264)",
  KAYITSIZLIK_VE_MERHAMETSIZLIK:
    "Başkalarının derdine ve mazlumlara karşı kalbin katılaşması (Kasvetü'l-Kalb)",
  GECMISIN_PISMANLIK_GIRDABI:
    "Tövbe edip affı ummak yerine geçmiş günah/hata içinde kendini hırpalayıp geleceği felç etme (Şeytanın hüzün taktiği)",
  TUL_I_EMEL_VE_GAYETSIZLIK:
    "Hiç ölmeyecekmiş gibi dünyaya bağlanma, ahiret şuurunu ve ölümü unutma",
  VESVESE_VE_GUSUL_ABDEST_EVHAMI:
    "İbadetlerde, temizlikte veya inançta sürekli şüphe ve obsesyon döngüsüne girme",
  KOLAY_KAZANC_HIRSI:
    "Emeksiz veya haram yoldan hızla zenginleşme ve dünyalık biriktirme hırsı",
  CIMRILIK_VE_MAL_HIRSI:
    "Malın eksileceği korkusuyla infaktan kaçınma ve dünyalık biriktirme tutkusu",
  HAYIR_DIYEMEME_ZAAFI:
    "İnsanları kırmamak veya dışlanmamak adına kendi sınırlarını ve hakkı çiğnetme",
  DUNYALIK_KAYGI: "Gelecek kaygısı, dünyevi endişeler ve rızık darlığı evhamı",
};

export const RAG_CATEGORY_CRITERIA: Record<string, string> = {
  RIZIK_VE_TICARET: "Rızık, iş, ticaret ve bereket",
  SABIR_VE_MUSIBET: "Musibet, dert, hastalık ve sabır",
  OFKE_VE_AHLAK: "Öfke kontrolü, ahlak ve nefs terbiyesi",
  AILE_VE_SILA_I_RAHIM: "Aile, evlilik, anne-baba ve akraba ilişkileri",
  KUL_HAKKI_VE_ADALET: "Kul hakkı, adalet ve emanet",
  TEVEKKUL_VE_MURAKABE: "Tevekkül, murakabe ve Allah ile irtibat",
  SIYER_ORNEKLERI: "Peygamberimiz ve ashabın hayatından ibretler",
  KADER_VE_KAZA_HIKMETI:
    "Şerrin içindeki gizli hayır, musibetlerin günahlara kefaret olması, Hz. Musa - Hızır (a.s.) kıssası hikmetleri",
  DUA_VE_ILCA_USULU:
    "İcabet vakitleri (seher, yağmur, secde), esmâ-i hüsnâ ile isteme, kabulün gecikmesindeki lütuf",
  TEVBE_VE_INABE:
    "Günahın ağırlığından arınma, nasuh tövbesi, umut kapısının kapanmazlığı (Zümer 53)",
  KALP_AMELLELI_VE_IHLAS:
    "Huşu, murakabe, niyet tashihleri, kalbi hastalıklardan (hased, kin, nifak) arındırma",
  KALP_AMELLERI_VE_IHLAS:
    "Huşu, murakabe, niyet tashihleri, kalbi hastalıklardan (hased, kin, nifak) arındırma",
  FANILIK_VE_TAZIYE:
    "Ölüm tefekkürü, vuslat bilinci, kabir hayatı, dünyadan hicret eden yakınların ardından yapılacak salih ameller",
  FITNE_VE_AHIR_ZAMAN_AHLAKI:
    "Dijital çağın kirliliği, göz ve kulak mahremiyeti, yalnızlaşma, kalabalıklar içinde istikamet",
  ISRAF_VE_IKTISAT_FIKHI:
    "Zaman israfı, nimet şükrü, kanaat tükenmez hazinedir şuuru",
  SIYERDE_DARLIK_DONEMLERI:
    "Şi'b-i Ebi Talib boykotu, Taif taşlanması, Uhud sarsıntısı, Hendek açlığı gibi somut sahabe imtihanları",
  TESKIN_VE_TESELLI: "Gönlü daralanlara teskin ve manevi ferahlık",
};

export const TONE_PREFERENCE_CRITERIA: Record<TonePreference, string> = {
  SEFKATLI_TESKIN:
    "Hüzünlü, kırgın ve yaralı gönüllere yavaş tempolu, yumuşak, şefkatli ve İnşirah esintili teselli dili",
  SAKINLESTIRICI_VE_VAKUR:
    "Öfkeli, gergin ve feveran halindeki muhataba ateşi söndüren, serinkanlı, sakinleştirici ve nebevi vakar taşıyan dengeleyici üslup",
  DIRILIS_VE_GAYRET:
    "Uyuşukluk, atalet veya niyet aşamasındakilere sorumluluk ve ümit aşılayan dinamik üslup",
  NET_VE_MUALLIM:
    "Hakkı dosdoğru, tavizsiz ve eğip bükmeden berrakça ortaya koyan vakar",
  HIKMETLI_SUKUT:
    "Çok konuşmak yerine az, öz bir ayet ve derin bir tefekkürle düşündüren arifane dil",
  TAVIZSIZ_MUALLIM:
    "Nefsle doğrudan yüzleştiren tavizsiz ve vakur muallim üslubu",
};

export const SESSION_MOOD_DIRECTIVES: Record<
  SessionMood,
  {
    label: string;
    recommendedTone: TonePreference;
    pacingInstruction: string;
  }
> = {
  HUZUNLU_VE_KIRGIN: {
    label: "Hüzünlü / Kırgın (Yavaş & Şefkatli Tonlama)",
    recommendedTone: "SEFKATLI_TESKIN",
    pacingInstruction:
      "Muhatap şu an hüzünlü, kırgın veya kederli bir ruh halinde. Cümle ritmini YAVAŞLAT; dingin, acele etmeyen, yumuşak geçişli ve çok şefkatli bir ton kullan. Hemen çözüm veya ödev dayatma; önce acısını ve kırgınlığını sessiz bir merhametle sar, ardından şefkatle teselli et.",
  },
  OFKELI_VE_GERGIN: {
    label: "Öfkeli / Gergin (Sakinleştirici & Vakur Tonlama)",
    recommendedTone: "SAKINLESTIRICI_VE_VAKUR",
    pacingInstruction:
      "Muhatap şu an öfkeli, kızgın veya haksızlık karşısında hararetli bir ruh halinde. SAKİNLEŞTİRİCİ VE VAKUR bir ton kullan: ne öfkesini körükleyip yangına körükle git, ne de üstten parmak sallayıp yargıla. Serinkanlı, ağırbaşlı, tansiyonu düşüren ve derin bir nefes aldıran itidal diliyle konuş; nebevi hilm ve öfke anında sükûnet sünnetini vakurca hatırlat.",
  },
  KAYGILI_VE_DARALMIS: {
    label: "Kaygılı / Daralmış (Emniyet Veren Dingin Tonlama)",
    recommendedTone: "SEFKATLI_TESKIN",
    pacingInstruction:
      "Muhatap şu an kaygılı ve daralmış durumda. Panik ve telaş havasını dağıtan tane tane, emniyet telkin eden, yavaş ve güven veren şefkatli bir tonlama kullan.",
  },
  YORGUN_VE_TUKENMIS: {
    label: "Yorgun / Tükenmiş (Yormayan & Saran Tonlama)",
    recommendedTone: "SEFKATLI_TESKIN",
    pacingInstruction:
      "Muhatap ruhen ve zihnen yorgun/tükenmiş durumda. Zihni uzun kurallarla yormayan, omuzdan yük indiren, dinlendirici, yavaş ve sarıp sarmalayan bir şefkat dili kullan.",
  },
  PISMAN_VE_MAHCUP: {
    label: "Pişman / Muhasebede (Kuşatıcı & Ümitvar Tonlama)",
    recommendedTone: "SEFKATLI_TESKIN",
    pacingInstruction:
      "Muhatap pişmanlık ve mahcubiyet içinde. Kınamayan, utandırmayan; tevbe kapısının genişliğini ve İlahi rahmeti yumuşak bir vakarla hissettiren ümitvar bir ton kullan.",
  },
  KARARLI_VE_GAYRETLI: {
    label: "Niyetli / Gayretli (Canlandırıcı & İstikamet Veren Tonlama)",
    recommendedTone: "DIRILIS_VE_GAYRET",
    pacingInstruction:
      "Muhatap hayırlı bir niyet ve gayret içinde. Bu güzel yönelişi destekleyen, ümit ve azim aşılayan sıcak ve diriltici bir üslup kullan.",
  },
  SAKIN_VE_DENGELI: {
    label: "Sakin / Dengeli (Doğal & Hikmetli Tonlama)",
    recommendedTone: "SEFKATLI_TESKIN",
    pacingInstruction:
      "Muhatap dengeli bir tefekkür ve sohbet halinde. Samimi, duru ve vakur bir hasbihal ritmi kullan.",
  },
};

export const SPIRITUAL_STAGE_CRITERIA: Record<SpiritualStage, string> = {
  ARAYIS_VE_BASLANGIC:
    "Temel kavramlara yabancı, ağır dini terimlerle boğulmaması gereken kullanıcı",
  DARLIK_VE_BUNALIM:
    'Felsefi izah istemeyen, sadece "Elimden tut" diyen acil teselli modu',
  DERINLESMIS_SALIK:
    "Tasavvufi, murakabe ve derin hikmet kesitlerini kaldırabilecek olgun zihin",
  ISTIKAMET_VE_INSA:
    "Temel şuura sahip, günlük ibadet ve ahlak nizamını istikrarlı kılmaya çalışan seviye",
  MUHASEBE_VE_TEVBE:
    "Geçmiş hatalarıyla yüzleşip samimi bir arınma ve nasuh tövbesi eşiğinde olan gönül",
};

export const FATWA_REJECTION_MESSAGE =
  "Ben bir yapay zekâyım ve fetva mercii değilim; durumunuzun özel şartlarını eksik değerlendirmiş veya yanlış bilgi vermiş olabilirim. Bu sorunuzun şer'i/fıkhi hükmü (ibadet sıhhati, helal/haram, caiz, boşanma, miras vb.) için lütfen Diyanet İşleri Başkanlığı'nı (Alo 190 Fetva Hattı) arayınız veya ehliyetli müftülüklere danışınız.\n\n" +
  "Ancak bu sürecin ruhunuzda, ailenizde veya iç dünyanızda oluşturduğu ağırlık, imtihan ve tevekkül boyutu üzerine dertleşebiliriz.";

export const CRISIS_EMERGENCY_MESSAGE =
  "İnsan bazen öyle bir acıya ve çaresizliğe düşer ki her şey üstüne geliyormuş gibi olur aziz kardeşim. Şu an hiçbir yükü tek başınıza omuzlamak zorunda değilsiniz.\n\n" +
  "Lütfen hemen 112 Acil Çağrı Merkezini arayarak uzman bir destek alınız. Yanınızda olan, sizi dinlemeye hazır insanlar ve her an sizinle olan Rahman bir Rabbiniz var. Canınız mukaddes bir emanettir, lütfen yardım almaktan çekinmeyiniz.";

export const VIOLENCE_EMERGENCY_MESSAGE =
  "İslam dini ve hukukumuz; eşe, kadına, çocuğa veya herhangi bir insana fiziksel ya da psikolojik şiddet uygulanmasına, dövülmesine veya zarar verilmesine ASLA cevaz vermez. Şiddet ve darp; açık bir zulüm, ağır bir kul hakkı ve kanunen suçtur.\n\n" +
  "Öfkenizin sizi hem dünyada hapis ve cezaya, hem de ahirette ağır bir vebale sürüklemesine izin vermeyin. Ortamı derhal terk edin ve sakinleşin.\n\n" +
  "Acil durumlarda ve kriz anında lütfen resmi mercilere başvurun:\n" +
  "• 112 Acil Çağrı Merkezi (Polis / Jandarma)\n" +
  "• ALO 183 Aile ve Sosyal Hizmetler / Şiddetle Mücadele Hattı";

export const VICTIM_EMERGENCY_MESSAGE =
  "Yaşadığınız durum kabul edilemez; hiçbir insan şiddeti, darp edilmeyi veya eziyet görmeyi hak etmez. Can ve beden emniyetiniz her şeyin üzerindedir.\n\n" +
  "Lütfen derhal güvenli bir alana geçin ve vakit kaybetmeden resmi yardım kanallarına başvurun:\n" +
  "• 112 Acil Çağrı Merkezi (Acil Polis / Jandarma Müdahalesi)\n" +
  "• ALO 183 Şiddetle Mücadele ve Sosyal Destek Hattı\n" +
  "• KADES (Kadın Acil Destek İhbar Uygulaması)\n\n" +
  "Yalnız değilsiniz; can emniyetiniz için resmi mercilerden derhal destek alınız.";

export const FATWA_KEYWORDS: ReadonlyArray<string> = [
  "boşan",
  "bosan",
  "talak",
  "nikah düştü",
  "nikah dustu",
  "boş ol",
  "bos ol",
  "miras",
  "haram mı",
  "haram mıdır",
  "helal mi",
  "helal midir",
  "caiz mi",
  "caiz midir",
  "günah mı",
  "günah mıdır",
  "gunah mi",
  "abdest bozulur mu",
  "abdesti bozar mı",
  "abdestimi bozar mı",
  "abdest geçerli mi",
  "abdestim geçerli mi",
  "abdest kabul olur mu",
  "abdestim kabul olur mu",
  "abdest sahih mi",
  "abdestte farz mı",
  "abdestte sünnet mi",
  "orucum bozuldu",
  "orucu bozar mı",
  "orucumu bozar mı",
  "oruç geçerli mi",
  "orucum geçerli mi",
  "oruç kabul olur mu",
  "orucum kabul olur mu",
  "fetva",
  "hükmü nedir",
  "fıkhi hükmü",
  "fıkhen",
  "dinen caiz mi",
  "dinen günah mı",
  "gusül gerekir mi",
  "gusul gerekir mi",
  "gusül geçerli mi",
  "guslüm geçerli mi",
  "gusül kabul olur mu",
  "gusül bozulur mu",
  "burna su",
  "burnuma su",
  "ağza su",
  "ağzıma su",
  "mazmaza",
  "istinşak",
  "özür sahibi",
  "sahib-i özür",
  "özür hali",
  "özür kanı",
  "özür abdesti",
  "istihaze",
  "dişim kanadı",
  "burnum kanadı",
  "zekat",
  "zekât",
  "kefaret",
  "yemin kefareti",
  "sehiv secdesi",
  "namazı bozar mı",
  "namazım bozulur mu",
  "namaz geçerli mi",
  "namazım geçerli mi",
  "namaz kabul olur mu",
  "namazım kabul olur mu",
  "namaz sahih mi",
  "farz mı sünnet mi",
  "sünnet mi farz mı",
  "imam nikahı",
  "mehir",
  "iddet",
  "faiz caiz mi",
  "kredi caiz mi",
];

export const RIBA_KEYWORDS: ReadonlyArray<string> = [
  "kredi",
  "faiz",
  "borç",
  "borc",
  "icra",
  "tefeci",
  "kart borcu",
  "banka faizi",
  "kredi kartı",
  "gecikme faizi",
  "riba",
  "haciz",
  "faiz sarmalı",
  "borç batağı",
  "borçluyum",
  "borcum",
  "borçlar",
  "borca",
  "borcu",
  "taksit",
  "avukatlık oldu",
  "icralık",
  "hacizlik",
  "faizli",
  "faize",
  "faizden",
  "krediler",
  "krediye",
  "batak",
  "iflas",
  "mevduat faizi",
  "vadeli hesap faizi",
  "repo",
  "ödeyemiyorum",
];

export interface HeuristicTopicRule {
  keywords: ReadonlyArray<string>;
  nafsTrap: NafsTrap;
  ragCategory: RagCategory;
  recommendedTone?: TonePreference;
  spiritualStage?: SpiritualStage;
}

/**
 * Declarative lookup table replacing the 207-line 20-branch if/else if chain.
 * Evaluated in exact priority order.
 */
export const HEURISTIC_TOPIC_RULES: ReadonlyArray<HeuristicTopicRule> = [
  {
    keywords: [
      "neden hep ben",
      "neden benim başıma",
      "kaderime",
      "isyan",
      "revâ",
      "reva mı",
      "ilahi adalet",
    ],
    nafsTrap: "KADERE_ITIRAZ_VE_ISYAN",
    ragCategory: "KADER_VE_KAZA_HIKMETI",
    recommendedTone: "HIKMETLI_SUKUT",
  },
  {
    keywords: [
      "duam kabul olmuyor",
      "hemen olsun",
      "kaç kere dua ettim",
      "acele",
      "isti'cal",
    ],
    nafsTrap: "ACELECI_TALEPLER_VE_ISTIACAL",
    ragCategory: "DUA_VE_ILCA_USULU",
    recommendedTone: "SEFKATLI_TESKIN",
  },
  {
    keywords: ["torpil", "patronum olmazsa", "sebepler", "para her kapıyı"],
    nafsTrap: "ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK",
    ragCategory: "TEVEKKUL_VE_MURAKABE",
    recommendedTone: "NET_VE_MUALLIM",
  },
  {
    keywords: [
      "ibadetlerime rağmen",
      "ben bu kadar namaz",
      "herkesten dürüstüm",
      "ben hak ediyorum",
    ],
    nafsTrap: "UCUB_VE_AMELINE_GUVENME",
    ragCategory: "KALP_AMELLELI_VE_IHLAS",
    recommendedTone: "NET_VE_MUALLIM",
  },
  {
    keywords: [
      "her şeyi kontrol",
      "mükemmeliyet",
      "elimde değil kaygı",
      "kontrol edemiyorum",
    ],
    nafsTrap: "KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK",
    ragCategory: "TEVEKKUL_VE_MURAKABE",
    recommendedTone: "SEFKATLI_TESKIN",
  },
  {
    keywords: ["alkol", "kumar", "uyuşturucu", "haramda teselli", "içki"],
    nafsTrap: "GIZLI_SIRK_VE_SAHTE_SIGINAKLAR",
    ragCategory: "TEVBE_VE_INABE",
    recommendedTone: "DIRILIS_VE_GAYRET",
    spiritualStage: "MUHASEBE_VE_TEVBE",
  },
  {
    keywords: [
      "kesin arkamdan",
      "kötü niyet",
      "şüpheleniyorum",
      "gizlice araştır",
      "sui zan",
      "sû-i zan",
    ],
    nafsTrap: "SUI_ZAN_VE_TECESSUS",
    ragCategory: "KALP_AMELLELI_VE_IHLAS",
    recommendedTone: "NET_VE_MUALLIM",
  },
  {
    keywords: [
      "iyilik yaptım",
      "nankör",
      "yüzüne vurdum",
      "benim sayemde",
      "başa kak",
    ],
    nafsTrap: "MINNET_VE_BASA_KAKMA",
    ragCategory: "KALP_AMELLELI_VE_IHLAS",
    recommendedTone: "NET_VE_MUALLIM",
  },
  {
    keywords: [
      "kalbim katı",
      "hiçbir şey hissetmiyorum",
      "umrumda değil",
      "kasvet",
    ],
    nafsTrap: "KAYITSIZLIK_VE_MERHAMETSIZLIK",
    ragCategory: "KALP_AMELLELI_VE_IHLAS",
    recommendedTone: "DIRILIS_VE_GAYRET",
  },
  {
    keywords: [
      "geçmiş günah",
      "beni affetmez",
      "eski hatalarım",
      "tövbe ettim ama",
      "affedilmeyecek",
    ],
    nafsTrap: "GECMISIN_PISMANLIK_GIRDABI",
    ragCategory: "TEVBE_VE_INABE",
    recommendedTone: "SEFKATLI_TESKIN",
    spiritualStage: "MUHASEBE_VE_TEVBE",
  },
  {
    keywords: [
      "ölüm",
      "vefat",
      "cenaze",
      "kabir",
      "taziye",
      "fanilik",
      "kaybettim",
      "toprağa verdim",
      "rahmetli",
      "ayrılık acısı",
    ],
    nafsTrap: "TUL_I_EMEL_VE_GAYETSIZLIK",
    ragCategory: "FANILIK_VE_TAZIYE",
    recommendedTone: "HIKMETLI_SUKUT",
  },
  {
    keywords: ["gusül", "vesvese", "takıntı", "şüphe", "evham"],
    nafsTrap: "VESVESE_VE_GUSUL_ABDEST_EVHAMI",
    ragCategory: "KALP_AMELLELI_VE_IHLAS",
    recommendedTone: "NET_VE_MUALLIM",
  },
  {
    keywords: [
      "sosyal medya",
      "telefon bağımlı",
      "dijital",
      "göz haram",
      "fitne",
      "ahir zaman",
    ],
    nafsTrap: "GIZLI_SIRK_VE_SAHTE_SIGINAKLAR",
    ragCategory: "FITNE_VE_AHIR_ZAMAN_AHLAKI",
    recommendedTone: "DIRILIS_VE_GAYRET",
  },
  {
    keywords: [
      "israf",
      "zamanımı boşa",
      "tembellik",
      "ertele",
      "rehavet",
      "vakit öldür",
    ],
    nafsTrap: "REHAVET_TEMBELLIK",
    ragCategory: "ISRAF_VE_IKTISAT_FIKHI",
    recommendedTone: "DIRILIS_VE_GAYRET",
  },
  {
    keywords: ["kripto", "kolay kazanç", "kısa yoldan zengin", "köşe dön"],
    nafsTrap: "KOLAY_KAZANC_HIRSI",
    ragCategory: "RIZIK_VE_TICARET",
    recommendedTone: "NET_VE_MUALLIM",
  },
  {
    keywords: [
      "cimrilik",
      "infak etmek istemiyorum",
      "mal hırsı",
      "malım eksil",
    ],
    nafsTrap: "CIMRILIK_VE_MAL_HIRSI",
    ragCategory: "ISRAF_VE_IKTISAT_FIKHI",
    recommendedTone: "TAVIZSIZ_MUALLIM",
  },
  {
    keywords: [
      "hayır diyemiyorum",
      "kimseyi kıramıyorum",
      "sınırlarımı çiğn",
      "kullandırıyorum",
    ],
    nafsTrap: "HAYIR_DIYEMEME_ZAAFI",
    ragCategory: "KUL_HAKKI_VE_ADALET",
    recommendedTone: "NET_VE_MUALLIM",
  },
  {
    keywords: [
      "taif",
      "uhud",
      "hendek",
      "boykot",
      "sahabe",
      "şi'b-i ebi talib",
    ],
    nafsTrap: "UMITSIZLIK_KARAMSARLIK",
    ragCategory: "SIYERDE_DARLIK_DONEMLERI",
    recommendedTone: "SEFKATLI_TESKIN",
  },
  {
    keywords: [
      "ameliyat",
      "hastalık",
      "hastane",
      "yoğun bakım",
      "kanser",
      "doktor",
      "şifa",
      "rahatsızlık",
      "ağır hasta",
    ],
    nafsTrap: "UMITSIZLIK_KARAMSARLIK",
    ragCategory: "SABIR_VE_MUSIBET",
    recommendedTone: "SEFKATLI_TESKIN",
    spiritualStage: "DARLIK_VE_BUNALIM",
  },
  {
    keywords: [
      "annemle tartıştık",
      "babamla kavga",
      "eşimle kavga",
      "eşimle anlaşamıyoruz",
      "kaynanamla sorun",
      "aile içi kavga",
      "akrabalarla küs",
      "akraba düşmanlığı",
      "aile huzursuzluğu",
      "boşanmak istiyorum",
      "evi terk",
    ],
    nafsTrap: "INTIKAM_VE_HASET",
    ragCategory: "AILE_VE_SILA_I_RAHIM",
    recommendedTone: "SEFKATLI_TESKIN",
    spiritualStage: "DARLIK_VE_BUNALIM",
  },
  {
    keywords: [
      "annem",
      "babam",
      "eşim",
      "çocuğum",
      "evlat",
      "oğlum",
      "kızım",
      "ailem",
      "kaynanam",
      "akraba",
      "evlilik",
      "sıla-i rahim",
    ],
    nafsTrap: "DUNYALIK_KAYGI",
    ragCategory: "AILE_VE_SILA_I_RAHIM",
    recommendedTone: "SEFKATLI_TESKIN",
    spiritualStage: "DARLIK_VE_BUNALIM",
  },
  {
    keywords: [
      "öfke",
      "sinir",
      "kızgın",
      "kızdım",
      "haksız",
      "kin",
      "nefret",
      "çileden",
      "tahammülüm kalmadı",
    ],
    nafsTrap: "INTIKAM_VE_HASET",
    ragCategory: "OFKE_VE_AHLAK",
    recommendedTone: "SAKINLESTIRICI_VE_VAKUR",
  },
  {
    keywords: ["elalem", "insanlar", "rezil"],
    nafsTrap: "ELALEM_NE_DER_RIYA",
    ragCategory: "KUL_HAKKI_VE_ADALET",
  },
  {
    keywords: ["sabır", "hastalık", "kayıp"],
    nafsTrap: "UMITSIZLIK_KARAMSARLIK",
    ragCategory: "SABIR_VE_MUSIBET",
  },
];
