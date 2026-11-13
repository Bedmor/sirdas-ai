/**
 * Cevabın altındaki hızlı yönlendirme düğmeleri.
 * Model çağrısına ve sistem talimatına dokunmaz: düğmeye basınca yalnızca
 * `gonderilecek` metin kullanıcı yazmış gibi gönderilir.
 *
 * Güvenlik: kriz, sağlık ve çocuk uyarısı olan cevaplarda düğme çıkmaz;
 * oradaki tek yönlendirme uyarı kutusundaki arama hatlarıdır (112, 183, 182).
 * Fetva sınırında Diyanet hattı (ALO 190) uyarı kutusunda kalır; düğmeler
 * yalnızca manevi yöne ve konu değiştirmeye çağırır.
 *
 * Üslup kurallarıyla uyum (uslup paketi):
 * - Gece geç saatte (00:30-04:59, üslup süzgecinin "gece yorgunluğu" aralığı)
 *   "Bugün ne yapabilirim?" ve "Biraz daha anlat" gösterilmez; sohbeti uzatmayan
 *   yatmadan önceki dua ve yarına küçük adım düğmeleri çıkar.
 * - Kullanıcı vedalaştıysa (kapanış iyiliği kuralı) düğme çıkmaz; uygulamada
 *   daha çok kalmaya teşvik eden kanca kurulmaz.
 */
import { geceGecSaatMi, kapanisTespit } from "../uslup/siniflandirici";

export type HizliYanit = { etiket: string; gonderilecek: string };

export type HizliYanitGirdisi = {
  icerik: string;
  intentMode?: "MANEVI_AYNA" | "ILIM_VE_SIYER";
  guvenlikTuru?: "crisis" | "health" | "child" | "fatwa" | null;
  status?: "processed" | "fatwa_blocked" | "crisis_redirected";
  /** Kullanıcının yerel saatiyle gece geç vakit mi (üslup süzgeciyle aynı aralık) */
  geceGec?: boolean;
  /** Bu cevaptan önce kullanıcının yazdığı son mesaj (vedalaşma tespiti için) */
  kullaniciSonMesaj?: string;
};

const DAHA: HizliYanit = { etiket: "Biraz daha anlat", gonderilecek: "Bunu biraz daha açar mısın?" };
const DUA: HizliYanit = { etiket: "Bir dua öner", gonderilecek: "Bu hâlime uygun kısa bir dua önerir misin?" };
const ADIM: HizliYanit = {
  etiket: "Bugün ne yapabilirim?",
  gonderilecek: "Bugün atabileceğim küçük bir adım söyler misin?",
};
const UYGULA: HizliYanit = {
  etiket: "Hayatıma nasıl uygularım?",
  gonderilecek: "Bunu günlük hayatıma nasıl uygulayabilirim?",
};
const DUA_ANLAM: HizliYanit = {
  etiket: "Duanın anlamı",
  gonderilecek: "Bu duanın anlamını biraz açar mısın?",
};
const MANEVI: HizliYanit = {
  etiket: "Manevi yönünü anlat",
  gonderilecek: "Bu konunun manevi yönünü anlatır mısın?",
};
const DEGISTIR: HizliYanit = {
  etiket: "Konuyu değiştir",
  gonderilecek: "Başka bir konu hakkında konuşmak istiyorum.",
};

const GECE_DUA: HizliYanit = {
  etiket: "Uyumadan önce bir dua",
  gonderilecek: "Uyumadan önce okuyabileceğim kısa bir dua önerir misin?",
};
const YARIN_ADIM: HizliYanit = {
  etiket: "Yarın ne yapabilirim?",
  gonderilecek: "Yarın atabileceğim küçük bir adım söyler misin?",
};

/** Cihaz saatine göre gece geç vakit mi (00:30-04:59). */
export function geceGecMi(an: Date = new Date()): boolean {
  return geceGecSaatMi(an.getHours(), an.getMinutes());
}

/** Cevapta zaten bir dua verilmiş mi (kaba işaretler). */
export function duaIceriyorMu(metin: string): boolean {
  return /(Allah['’]?[ıi]m|Rabbim|Rabbimiz|Ya Rab|duas[ıi]n[ıi]|şöyle dua|dua edebilirsin)/iu.test(metin);
}

export function hizliYanitlar(g: HizliYanitGirdisi): HizliYanit[] {
  if (!g.icerik || !g.icerik.trim()) return [];
  if (g.status === "crisis_redirected") return [];
  if (g.guvenlikTuru === "crisis" || g.guvenlikTuru === "health" || g.guvenlikTuru === "child") return [];
  if (g.guvenlikTuru === "fatwa" || g.status === "fatwa_blocked") return [MANEVI, DEGISTIR];

  if (g.kullaniciSonMesaj && kapanisTespit(g.kullaniciSonMesaj)) return [];

  const duaVar = duaIceriyorMu(g.icerik);
  if (g.intentMode === "ILIM_VE_SIYER") {
    return g.geceGec ? [UYGULA, DEGISTIR] : [DAHA, UYGULA, DEGISTIR];
  }
  if (g.geceGec) {
    return [duaVar ? DUA_ANLAM : GECE_DUA, YARIN_ADIM];
  }
  return [DAHA, duaVar ? DUA_ANLAM : DUA, ADIM, DEGISTIR];
}
