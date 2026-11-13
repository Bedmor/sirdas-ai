/**
 * Üslup ve süzgeç paketi: mesajı yerel olarak süzer, modele gidecek
 * kısa yönergeleri üretir. Güvenlik ön süzgecinin (safety/triage) yerine geçmez;
 * kriz, sağlık ve çocuk işaretleri her zaman önce gelir.
 */
import { USLUP_YONERGELERI } from "./kurallar";
import { HOCA_SOZLERI_GUVENLIK_YONERGESI } from "./hoca-sozleri";
import {
  donguTespit,
  gecmisYukuTespit,
  guvenlikOncelikliMi,
  kapanisTespit,
  kurguMizahTespit,
  kusakTespit,
  oncekiAcilislar,
  sessizKarartmaTespit,
  yalnizlastirmaTespit,
  type Kusak,
} from "./siniflandirici";

export { USLUP_SISTEM_BOLUMU, USLUP_ILIM_BOLUMU, USLUP_YONERGELERI } from "./kurallar";
export { HOCA_SOZLERI_BOLUMU, HOCA_SOZLERI_GUVENLIK_YONERGESI } from "./hoca-sozleri";
export * from "./siniflandirici";

/** Uzun oturum eşiği (kullanıcı mesajı sayısı). */
export const UZUN_OTURUM_ESIGI = 20;

export interface UslupGirdisi {
  mesaj: string;
  gecmis?: ReadonlyArray<{ role: "user" | "assistant"; content: string }>;
  /** Kullanıcının yerel saatiyle 00:30 - 04:59 arası mı */
  geceGecSaat?: boolean;
  /** Mevcut "gece tatlı fesih" yönergesi zaten devrede mi (uzun gece oturumu) */
  geceFesihAktif?: boolean;
  /** Oturumdaki kullanıcı mesajı sayısı (bu mesaj dahil) */
  oturumMesajSayisi?: number;
  /** "ILIM_VE_SIYER" modunda yalnızca kurgu ve kalıp süzgeci uygulanır */
  ilimModu?: boolean;
}

export interface UslupAnalizi {
  guvenlikOncelikli: boolean;
  kurgu: boolean;
  kurguIsaretleri: string[];
  kurguGercekSoru: boolean;
  yasCeliskisi: boolean;
  dongu: boolean;
  donguBenzerlik: number;
  kalipAcilislar: string[];
  yalnizlastirma: boolean;
  ilkMesaj: boolean;
  kapanis: boolean;
  geceYorgunlugu: boolean;
  uzunOturum: boolean;
  gecmisYuku: boolean;
  sessizKarartma: boolean;
  kusak: Kusak;
}

export function uslupAnalizEt(girdi: UslupGirdisi): UslupAnalizi {
  const mesaj = girdi.mesaj || "";
  const gecmis = girdi.gecmis || [];
  const kullaniciMesajlari = gecmis.filter((t) => t.role === "user").map((t) => t.content);
  const asistanCevaplari = gecmis.filter((t) => t.role === "assistant").map((t) => t.content);

  const guvenlikOncelikli = guvenlikOncelikliMi(mesaj);
  const kurgu = kurguMizahTespit(mesaj);
  const dongu = donguTespit(mesaj, kullaniciMesajlari);
  const kapanis = kapanisTespit(mesaj);
  const mesajSayisi = girdi.oturumMesajSayisi ?? kullaniciMesajlari.length + 1;

  return {
    guvenlikOncelikli,
    kurgu: kurgu.kurgu,
    kurguIsaretleri: kurgu.isaretler,
    kurguGercekSoru: kurgu.gercekDiniSoru,
    yasCeliskisi: kurgu.yasCeliskisi,
    // Kriz/sağlık mesajında döngü kesici devreye girmez: her seferinde tam ilgi gösterilir.
    dongu: dongu.dongu && !guvenlikOncelikli,
    donguBenzerlik: dongu.enYuksekBenzerlik,
    kalipAcilislar: oncekiAcilislar(asistanCevaplari),
    yalnizlastirma: yalnizlastirmaTespit(mesaj),
    ilkMesaj: kullaniciMesajlari.length === 0,
    kapanis,
    geceYorgunlugu: Boolean(girdi.geceGecSaat) && !girdi.geceFesihAktif,
    uzunOturum: !girdi.geceGecSaat && mesajSayisi >= UZUN_OTURUM_ESIGI,
    gecmisYuku: gecmisYukuTespit(mesaj),
    sessizKarartma: sessizKarartmaTespit(mesaj),
    kusak: kusakTespit(mesaj),
  };
}

/**
 * Modele bu mesaj için eklenecek üslup yönergelerini üretir (yoksa boş metin).
 * Sıra: kurgu/döngü (uzunluğu değiştirenler) önce, hitap ve kapanış sonra.
 */
export function uslupYonergesiKur(girdi: UslupGirdisi, analiz = uslupAnalizEt(girdi)): string {
  const satirlar: string[] = [];

  if (analiz.kurgu) {
    satirlar.push(USLUP_YONERGELERI.kurgu(analiz.kurguIsaretleri));
    if (analiz.kurguGercekSoru) satirlar.push(USLUP_YONERGELERI.kurguGercekSoru);
  }
  if (analiz.yasCeliskisi && !analiz.guvenlikOncelikli) {
    satirlar.push(USLUP_YONERGELERI.yasCeliskisi);
  }
  if (analiz.kalipAcilislar.length > 0) {
    satirlar.push(USLUP_YONERGELERI.kalip(analiz.kalipAcilislar));
  }

  if (!girdi.ilimModu) {
    if (analiz.guvenlikOncelikli) satirlar.push(HOCA_SOZLERI_GUVENLIK_YONERGESI);
    if (analiz.dongu && !analiz.kurgu) satirlar.push(USLUP_YONERGELERI.dongu);
    if (analiz.yalnizlastirma) satirlar.push(USLUP_YONERGELERI.yalnizlastirma);
    if (analiz.sessizKarartma && !analiz.guvenlikOncelikli) {
      satirlar.push(USLUP_YONERGELERI.sessizKarartma);
    }
    if (analiz.gecmisYuku && !analiz.guvenlikOncelikli) {
      satirlar.push(USLUP_YONERGELERI.gecmisYuku);
    }
    if (analiz.ilkMesaj && !analiz.guvenlikOncelikli) {
      satirlar.push(USLUP_YONERGELERI.ilkKarsilama);
    }
    if (analiz.kusak === "GENC") satirlar.push(USLUP_YONERGELERI.kusakGenc);
    if (analiz.kusak === "BUYUK") satirlar.push(USLUP_YONERGELERI.kusakBuyuk);
    if (analiz.kapanis && !analiz.ilkMesaj) {
      satirlar.push(USLUP_YONERGELERI.kapanis);
    } else if (!analiz.guvenlikOncelikli) {
      if (analiz.geceYorgunlugu) satirlar.push(USLUP_YONERGELERI.geceYorgunlugu);
      else if (analiz.uzunOturum) satirlar.push(USLUP_YONERGELERI.uzunOturum);
    }
  }

  if (satirlar.length === 0) return "";
  return `[ÜSLUP VE SÜZGEÇ YÖNERGELERİ - güvenlik öncelik sırası her zaman bunlardan önce gelir]:\n${satirlar.map((s) => `- ${s}`).join("\n")}`;
}
