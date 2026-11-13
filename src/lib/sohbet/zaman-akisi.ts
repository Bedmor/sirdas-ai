/**
 * Saat ve tarihe göre ilk ekran akışı (Türkiye saati, Europe/Istanbul).
 * Gün dilimleri vakit ayeti kartıyla aynı fonksiyondan gelir (saattenDilim),
 * böylece karşılama ile vakit ayeti hep aynı dilimi söyler.
 *
 * Yalnızca doğrulanabilir takvim bilgisi kullanılır: haftanın günü (cuma ve
 * perşembe akşamı = cuma gecesi). Kandil ve dini gün bilgisi projede doğrulanmış
 * bir kaynakta olmadığı için eklenmedi.
 */
import { saattenDilim, type DilimAnahtari } from "@/lib/araclar/vakit-ayeti";

export const TURKIYE_SAAT_DILIMI = "Europe/Istanbul";

export type TurkiyeAni = { saat: number; dakika: number; haftaGunu: number; yil: number; ay: number; gun: number };

/** haftaGunu: 0 pazar ... 5 cuma, 6 cumartesi (Türkiye takvimine göre) */
export function turkiyeAni(an: Date): TurkiyeAni {
  const parcalar = new Intl.DateTimeFormat("en-GB", {
    timeZone: TURKIYE_SAAT_DILIMI,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(an);
  const al = (t: string) => parcalar.find((p) => p.type === t)?.value ?? "";
  const gunler = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    saat: Number(al("hour")) % 24,
    dakika: Number(al("minute")),
    haftaGunu: Math.max(0, gunler.indexOf(al("weekday"))),
    yil: Number(al("year")),
    ay: Number(al("month")),
    gun: Number(al("day")),
  };
}

export type ZamanAkisi = {
  dilim: DilimAnahtari;
  /** Kısa karşılama, ör. "Hayırlı akşamlar" */
  selam: string;
  /** İlk ekranda tek cümlelik öneri */
  oneri: string;
  /** Cuma günü veya cuma gecesi notu */
  gunNotu: string | null;
  /** Gece yarısından sonra (00:00-03:00) dinlenmeye çağıran nazik not */
  geceGec: boolean;
};

const SELAMLAR: Record<DilimAnahtari, string> = {
  seher: "Seher vaktin hayırlı olsun",
  sabah: "Hayırlı sabahlar",
  kusluk: "Hayırlı günler",
  ikindi: "Hayırlı günler",
  aksam: "Hayırlı akşamlar",
  gece: "Hayırlı geceler",
};

const ONERILER: Record<DilimAnahtari, string> = {
  seher: "Seher, istiğfar ve dua vaktidir. Gönlünden geçeni sessizce yazabilirsin.",
  sabah: "Güne bir niyetle başlamak güzeldir. Bugün için içinde ne var?",
  kusluk: "Günün telaşı başlamadan kısa bir nefes al. Aklını meşgul eden ne?",
  ikindi: "Günün ortasında bir durak. İçini daraltan bir şey varsa paylaşabilirsin.",
  aksam: "Akşam, günün muhasebesi için güzel bir vakittir. Bugün seni ne yordu?",
  gece: "Gecenin sükûnetinde gönlünü dinlendirebilirsin. Ne düşünüyorsun?",
};

export function zamanAkisi(an: Date): ZamanAkisi {
  const t = turkiyeAni(an);
  const dilim = saattenDilim(t.saat);
  const cuma = t.haftaGunu === 5;
  // Hicri gün akşamla başlar: perşembe akşamından sonrası cuma gecesidir.
  const cumaGecesi = t.haftaGunu === 4 && t.saat >= 18;
  const geceGec = t.saat >= 0 && t.saat < 3;
  let gunNotu: string | null = null;
  if (cuma) gunNotu = "Hayırlı cumalar";
  else if (cumaGecesi) gunNotu = "Cuma gecen mübarek olsun";
  let oneri = ONERILER[dilim];
  if (geceGec) {
    oneri = "Saat epey geç oldu. Kısaca konuşalım; sonra dinlenmeyi ihmal etme.";
  } else if (cuma && (dilim === "kusluk" || dilim === "ikindi")) {
    oneri = "Bugün cuma. Kalbinden geçen bir duayı birlikte düşünebiliriz.";
  }
  return { dilim, selam: SELAMLAR[dilim], oneri, gunNotu, geceGec };
}
