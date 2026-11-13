/**
 * Cevabın altındaki hızlı yönlendirme düğmeleri.
 * Model çağrısına ve sistem talimatına dokunmaz: düğmeye basınca yalnızca
 * `gonderilecek` metin kullanıcı yazmış gibi gönderilir.
 *
 * Güvenlik: kriz, sağlık ve çocuk uyarısı olan cevaplarda düğme çıkmaz;
 * oradaki tek yönlendirme uyarı kutusundaki arama hatlarıdır (112, 183, 182).
 * Fetva sınırında Diyanet hattı (ALO 190) uyarı kutusunda kalır; düğmeler
 * yalnızca manevi yöne ve konu değiştirmeye çağırır.
 */

export type HizliYanit = { etiket: string; gonderilecek: string };

export type HizliYanitGirdisi = {
  icerik: string;
  intentMode?: "MANEVI_AYNA" | "ILIM_VE_SIYER";
  guvenlikTuru?: "crisis" | "health" | "child" | "fatwa" | null;
  status?: "processed" | "fatwa_blocked" | "crisis_redirected";
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

/** Cevapta zaten bir dua verilmiş mi (kaba işaretler). */
export function duaIceriyorMu(metin: string): boolean {
  return /(Allah['’]?[ıi]m|Rabbim|Rabbimiz|Ya Rab|duas[ıi]n[ıi]|şöyle dua|dua edebilirsin)/iu.test(metin);
}

export function hizliYanitlar(g: HizliYanitGirdisi): HizliYanit[] {
  if (!g.icerik || !g.icerik.trim()) return [];
  if (g.status === "crisis_redirected") return [];
  if (g.guvenlikTuru === "crisis" || g.guvenlikTuru === "health" || g.guvenlikTuru === "child") return [];
  if (g.guvenlikTuru === "fatwa" || g.status === "fatwa_blocked") return [MANEVI, DEGISTIR];

  const duaVar = duaIceriyorMu(g.icerik);
  if (g.intentMode === "ILIM_VE_SIYER") {
    return [DAHA, UYGULA, DEGISTIR];
  }
  return [DAHA, duaVar ? DUA_ANLAM : DUA, ADIM, DEGISTIR];
}
