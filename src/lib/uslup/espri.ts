/**
 * Hafif espri kapısı: sohbet hafif ve neşeliyken modele ara sıra tek satırlık,
 * sıcak bir nükte izni verir. Kapı deterministiktir (rastgelelik yok), yerel çalışır
 * ve model çağrısı yapmaz.
 *
 * Kaynak: Adnan Bey isteği ("Bizim yapay zekâ bazen esprili şeyler de yazsın, hep bir
 * ciddiyet olmasın").
 *
 * Kapı yalnızca şu üçü birlikte sağlanınca açılır:
 *  1. Mesajda hafiflik işareti var (gülme, şaka, emoji/gülen yüz, kahve/trafik gibi gündelik
 *     küçük bir konu, iyi ruh hâli veya kısa bir selamlaşma).
 *  2. Mesajda ve son kullanıcı mesajlarında hiçbir hassas işaret yok (güvenlik süzgeci,
 *     hoca cevabı, kriz, yas, hastalık, şiddet, borç, fetva/dini konu, olumsuz duygu, çocuk,
 *     siyaset/etnik konu, kurgu, nezahete aykırı konu).
 *  3. Sıklık sınırı: bir önceki kullanıcı mesajı da hafif idiyse (önceki cevapta izin
 *     verilmiş sayılır) bu tur kapı kapalı kalır; böylece art arda iki cevapta espri olmaz.
 */
import { buildMatchVariants, runSafetyTriage } from "../safety/triage";
import type { SessionMood } from "../ai/jev-taxonomy";
import { hocaCevabiBul } from "./hoca-cevaplari";
import {
  gecmisYukuTespit,
  kurguMizahTespit,
  sessizKarartmaTespit,
  yalnizlastirmaTespit,
} from "./siniflandirici";

/** Hafif mesaj sayılacak azami kelime sayısı (uzun anlatım genellikle dertleşmedir). */
export const ESPRI_AZAMI_KELIME = 60;
/** Selamlaşmanın tek başına hafiflik işareti sayıldığı azami kelime sayısı. */
export const ESPRI_SELAM_AZAMI_KELIME = 12;
/** Bu değer ve üstündeki sıkıntı seviyesinde kapı kapalıdır. */
export const ESPRI_SIKINTI_SINIRI = 5;
/** Geçmişte hassas işaret aranan son kullanıcı mesajı sayısı. */
export const ESPRI_GECMIS_PENCERESI = 3;

/** Espriye izin veren oturum ruh hâlleri (geri kalanlarda kapı kapalı). */
const UYGUN_RUH_HALLERI: ReadonlySet<SessionMood> = new Set<SessionMood>([
  "SAKIN_VE_DENGELI",
  "KARARLI_VE_GAYRETLI",
]);

// ---------------------------------------------------------------------------
// Hafiflik işaretleri
// ---------------------------------------------------------------------------

/** Ham metinde: gülen yüz ve neşeli emoji. */
const HAFIF_HAM: ReadonlyArray<RegExp> = [
  /(?:^|\s)(?::-?\)|:-?D|;-?\)|=\)|xD)(?=\s|$|[.,!?])/u,
  /[\u{1F600}-\u{1F606}\u{1F60A}\u{1F60B}\u{1F642}\u{1F923}\u{1F639}\u{2615}]/u,
];

/** Katlanmış metinde: gülme, şaka, iyi ruh hâli, gündelik küçük konular. */
const HAFIF_KATLANMIS: ReadonlyArray<RegExp> = [
  /\b(?:ha){2,}h?\b|\b(?:he){2,}\b|\bahah\p{L}*|\bkahkaha\p{L}*|\blol\b/u,
  /\b(?:guldum|gulduk|gulmekten|gulumse\p{L}*|gulesim\p{L}*)\b/u,
  /\b(?:saka|sakasi|sakayla|sakadan|espri\p{L}*|takiliyorum)\b/u,
  /\b(?:keyfim\s*yerinde|keyifliyim|neseliyim|nesem\s*yerinde|mutluyum|cok\s*sevindim|moralim\s*(?:cok\s*)?iyi|guzel\s*bir\s*gun|harika\s*bir\s*gun)\b/u,
  /\b(?:kahve|cay|simit|trafik|pazartesi|hafta\s*sonu|alarm|otobus|metro|diyet|yagmur|mesai|toplanti|bulasik|camasir|kumanda|terlik|kedim|kopegim)\p{L}*/u,
];

/** Kısa selamlaşma ve hâl hatır sorma. */
const SELAM_DESENI =
  /^(?:selam\p{L}*|merhaba\p{L}*|gunaydin|iyi\s*(?:aksamlar|gunler|geceler)|hayirli\s*(?:sabahlar|aksamlar|gunler)|nasilsin\p{L}*|naber|ne\s*haber)\b/u;

// ---------------------------------------------------------------------------
// Hassas işaretler (biri bile varsa kapı kapalı)
// ---------------------------------------------------------------------------

/** Katlanmış metinde aranan hassas konular. */
const HASSAS_KATLANMIS: ReadonlyArray<{ ad: string; desen: RegExp }> = [
  { ad: "yas ve kayıp", desen: /\b(?:vefat|cenaze|rahmetli|merhum|taziye|kaybett\p{L}*|kaybim|kaybimiz|mezar\p{L}*|kabir\p{L}*|sehit\p{L}*|yas\s*tut\p{L}*|basin\s*sag)/u },
  { ad: "hastalık", desen: /\b(?:hasta\p{L}*|kanser|tumor|ameliyat\p{L}*|kemoterapi|yogun\s*bakim|teshis|agri\p{L}*|doktor\p{L}*|ilac\p{L}*)/u },
  { ad: "kriz", desen: /\b(?:intihar\p{L}*|kendimi\s*(?:oldur|as|kes)\p{L}*|yasamak\s*istemiyorum|dayanamiyorum)/u },
  { ad: "şiddet ve istismar", desen: /\b(?:siddet\p{L}*|dov(?:uyor|du|er|ul)\p{L}*|taciz\p{L}*|tecavuz\p{L}*|istismar\p{L}*|darp\p{L}*|tehdit\p{L}*)/u },
  { ad: "borç ve geçim", desen: /\b(?:borc\p{L}*|kredi\p{L}*|icra\p{L}*|haciz\p{L}*|iflas\p{L}*|faiz\p{L}*|issiz\p{L}*|kovuldum|gecinemiyor\p{L}*)/u },
  {
    ad: "fetva ve dini konu",
    desen: /\b(?:haram|helal|caiz|gunah\p{L}*|sevap\p{L}*|fetva\p{L}*|hukm\p{L}*|hukum\p{L}*|farz\p{L}*|vacip|sunnet\p{L}*|mekruh|mubah|bidat|kufur|allah\p{L}*|rabb\p{L}*|peygamber\p{L}*|resul\p{L}*|nebi\p{L}*|sahabe\p{L}*|ayet\p{L}*|hadis\p{L}*|kuran\p{L}*|namaz\p{L}*|oruc\p{L}*|abdest\p{L}*|ibadet\p{L}*|dua\b|dualar\p{L}*|zekat\p{L}*|hac\b|umre\p{L}*|cuma\p{L}*|ezan\p{L}*|cami\p{L}*|mezhep\p{L}*|tevbe\p{L}*|tesettur\p{L}*)/u,
  },
  {
    ad: "olumsuz duygu",
    desen: /\b(?:agli\p{L}*|agladim|bunal\p{L}*|uzgun\p{L}*|uzuldum|mutsuz\p{L}*|depres\p{L}*|kaygi\p{L}*|endise\p{L}*|panik\p{L}*|kork\p{L}*|sinir\p{L}*|ofke\p{L}*|kizgin\p{L}*|kizdim|yalniz\p{L}*|caresiz\p{L}*|umutsuz\p{L}*|pisman\p{L}*|stres\p{L}*|bikt\p{L}*|tuken\p{L}*|kirgin\p{L}*|kirildim|nefret\p{L}*|sikinti\p{L}*|sikkin\p{L}*|dert\p{L}*|huzun\p{L}*|aci\s*cek\p{L}*|perisan\p{L}*)/u,
  },
  { ad: "aile kırgınlığı", desen: /\b(?:bosan\p{L}*|aldat\p{L}*|ihanet\p{L}*|kavga\p{L}*)/u },
  { ad: "çocuk", desen: /\b(?:cocug\p{L}*|cocuk\p{L}*|bebeg\p{L}*|bebek\p{L}*|oglum\p{L}*|kizim\p{L}*|evlad\p{L}*)/u },
  { ad: "siyaset", desen: /\b(?:siyaset\p{L}*|siyasi|secim\p{L}*|parti\p{L}*|hukumet\p{L}*|cumhurbaskan\p{L}*|milletvekil\p{L}*)/u },
];

/**
 * Ham (yalnızca küçük harfe çevrilmiş) metinde aranan hassas konular.
 * "öldü" katlanınca "oldu" olur; etnik adlar da katlanınca başka kelimelerle karışır.
 */
const HASSAS_HAM: ReadonlyArray<{ ad: string; desen: RegExp }> = [
  { ad: "ölüm", desen: /(?<![\p{L}])öl(?:dü|üm|en|mek|ecek|müş|se|eceğ)\p{L}*/u },
  { ad: "etnik konu", desen: /(?<![\p{L}])(?:kürt|ermeni|suriyeli|yahudi|çingene|laz|gürcü|arap|rum)(?![\p{L}])/u },
];

function hafiflikIsaretiVar(mesaj: string, varyantlar: ReadonlyArray<string>, kelimeSayisi: number): boolean {
  if (HAFIF_HAM.some((d) => d.test(mesaj))) return true;
  if (HAFIF_KATLANMIS.some((d) => varyantlar.some((v) => d.test(v)))) return true;
  return kelimeSayisi <= ESPRI_SELAM_AZAMI_KELIME && varyantlar.some((v) => SELAM_DESENI.test(v));
}

/** Mesajdaki ilk hassas işaretin adını döndürür; yoksa null. */
export function espriHassasIsaret(mesaj: string): string | null {
  if (!mesaj || !mesaj.trim()) return null;
  if (runSafetyTriage(mesaj)) return "güvenlik süzgeci";
  const varyantlar = buildMatchVariants(mesaj);
  const katlanmis = HASSAS_KATLANMIS.find(({ desen }) => varyantlar.some((v) => desen.test(v)));
  if (katlanmis) return katlanmis.ad;
  const ham = mesaj.toLocaleLowerCase("tr-TR");
  const hamEslesme = HASSAS_HAM.find(({ desen }) => desen.test(ham));
  if (hamEslesme) return hamEslesme.ad;
  if (sessizKarartmaTespit(mesaj)) return "nezahete aykırı konu";
  if (gecmisYukuTespit(mesaj)) return "geçmişin yükü";
  if (yalnizlastirmaTespit(mesaj)) return "yalnızlaştırma";
  return null;
}

export interface EspriTekMesajSonucu {
  hafif: boolean;
  neden: string;
}

/** Yalnızca bu mesaja bakarak hafif (espriye uygun) olup olmadığını söyler; geçmişe bakmaz. */
export function espriTekMesaj(mesaj: string): EspriTekMesajSonucu {
  const metin = (mesaj || "").trim();
  if (!metin) return { hafif: false, neden: "boş mesaj" };
  const kelimeSayisi = metin.split(/\s+/).filter(Boolean).length;
  if (kelimeSayisi > ESPRI_AZAMI_KELIME) return { hafif: false, neden: "uzun anlatım" };

  const hassas = espriHassasIsaret(metin);
  if (hassas) return { hafif: false, neden: hassas };
  if (hocaCevabiBul(metin)) return { hafif: false, neden: "hoca cevabı" };
  // Kurguya kendi süzgeci tebessümle karşılık verir; iki yönerge üst üste binmesin.
  if (kurguMizahTespit(metin).kurgu) return { hafif: false, neden: "kurgu süzgeci" };

  const varyantlar = buildMatchVariants(metin);
  if (!hafiflikIsaretiVar(metin, varyantlar, kelimeSayisi)) {
    return { hafif: false, neden: "hafiflik işareti yok" };
  }
  return { hafif: true, neden: "hafif sohbet" };
}

export interface EspriGirdisi {
  mesaj: string;
  gecmis?: ReadonlyArray<{ role: "user" | "assistant"; content: string }>;
  ilimModu?: boolean;
  /** Oturum ruh hâli (jev sınıflandırıcısı); verilmezse bu kontrol atlanır */
  oturumRuhHali?: SessionMood;
  /** 0-10 sıkıntı seviyesi; verilmezse bu kontrol atlanır */
  sikintiSeviyesi?: number;
  /** Riba (faiz) kalkanı devrede mi */
  ribaKalkani?: boolean;
  /** Gece geç saat (00:30-04:59) veya gece tatlı fesih devrede mi */
  geceGecSaat?: boolean;
  geceFesihAktif?: boolean;
}

export interface EspriKarari {
  uygun: boolean;
  neden: string;
}

/**
 * Bu tur cevapta hafif espri izni verilip verilmeyeceğine karar verir.
 * Şüphede kapı kapalı kalır: yalnız açık bir hafiflik işareti ve hiçbir hassas işaret yoksa açılır.
 */
export function espriUygunMu(girdi: EspriGirdisi): EspriKarari {
  if (girdi.ilimModu) return { uygun: false, neden: "İlim modu" };
  if (girdi.ribaKalkani) return { uygun: false, neden: "riba kalkanı" };
  if (girdi.geceGecSaat || girdi.geceFesihAktif) return { uygun: false, neden: "gece geç saat" };
  if (typeof girdi.sikintiSeviyesi === "number" && girdi.sikintiSeviyesi >= ESPRI_SIKINTI_SINIRI) {
    return { uygun: false, neden: "sıkıntı seviyesi" };
  }
  if (girdi.oturumRuhHali && !UYGUN_RUH_HALLERI.has(girdi.oturumRuhHali)) {
    return { uygun: false, neden: "oturum ruh hâli" };
  }

  const tek = espriTekMesaj(girdi.mesaj);
  if (!tek.hafif) return { uygun: false, neden: tek.neden };

  const gecmis = girdi.gecmis || [];
  const kullaniciMesajlari = gecmis.filter((t) => t.role === "user").map((t) => t.content);
  const sonKullanici = kullaniciMesajlari.slice(-ESPRI_GECMIS_PENCERESI);
  if (sonKullanici.some((m) => espriHassasIsaret(m) !== null)) {
    return { uygun: false, neden: "yakın geçmişte hassas konu" };
  }

  // Sıklık sınırı: önceki kullanıcı mesajı da hafif idi ve cevaplandıysa bu tur espri yok.
  const sonKullaniciIndeksi = gecmis.map((t) => t.role).lastIndexOf("user");
  const oncekiCevaplandi =
    sonKullaniciIndeksi >= 0 &&
    gecmis.slice(sonKullaniciIndeksi + 1).some((t) => t.role === "assistant");
  if (oncekiCevaplandi && espriTekMesaj(gecmis[sonKullaniciIndeksi].content).hafif) {
    return { uygun: false, neden: "sıklık sınırı" };
  }

  return { uygun: true, neden: "hafif sohbet" };
}
