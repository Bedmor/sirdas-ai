/**
 * Adnan Bey'in "BAKIŞ AÇILARI" düz metin kılavuzunu merceklere ayırır ve tekrarları ayıklar.
 * Yalnızca derleme betiği (scripts/bakis-acilari-ayristir.ts) ve testler kullanır; çalışma
 * anında sohbet akışında kullanılmaz.
 *
 * Biçim (her mercek ~10 satır):
 *   N. MERCEK: Başlık
 *   1. Mercek / Bakış Açısı Adı: ...
 *   2. RAG Etiketi (Dolap Gözü): [a, b, c]
 *   3. Tetikleyici Anahtar Kelimeler: x, y, z
 *   4. Arka Planda Çalışacak Teşhis Kuralı: ...
 *   5. Sistem Yanıt Tonu ve Sentez Kalıbı:
 *   Giriş: ... / Hakiki İrtibat: ... / Pusula Notu: ...
 *   6. Yasaklı / Engellenecek Haller: ...
 */

export interface HamMercek {
  no: number | null;
  kaynakSatir: number;
  ad: string;
  etiketler: string[];
  tetikleyiciler: string[];
  teshis: string;
  giris: string;
  irtibat: string;
  pusulaNotu: string;
  yasaklar: string;
  birlesenler?: number[];
}

export interface BozukParca {
  kaynakSatir: number;
  no: number | null;
  eksik: string[];
  fazla: string[];
}

export interface Tekrar {
  no: number | null;
  ad: string;
  esiNo: number | null;
  esiAd: string;
  adBenzerlik: number;
  icerikBenzerlik: number;
  birebir: boolean;
  tur: "otomatik" | "ayni_konu";
}

export interface AyristirmaSonucu {
  toplamBlok: number;
  net: HamMercek[];
  tekrarlar: Tekrar[];
  bozuk: BozukParca[];
}

/**
 * Otomatik eşikle yakalanmayan ama aynı (ya da neredeyse aynı) başlıkla aynı konuyu
 * ikinci kez anlatan çiftler: [korunan no, düşen no]. Elle incelendi (13.11.2026).
 */
export const AYNI_KONU_CIFTLERI: ReadonlyArray<readonly [number, number]> = [
  [247, 284],
  [248, 275],
  [249, 283],
  [254, 285],
  [245, 254],
  [256, 288],
  [251, 281],
  [257, 289],
];

const ALANLAR = ["ad", "etiketler", "tetikleyiciler", "teshis", "giris", "irtibat", "pusulaNotu", "yasaklar"] as const;

function sonrasi(satir: string): string {
  const i = satir.indexOf(":");
  return i >= 0 ? satir.slice(i + 1).trim() : "";
}

export function normalizeEt(metin: string): string[] {
  return (metin || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/merceği?/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Kelime dizileri için benzerlik oranı: 2 * LCS / (|a| + |b|). */
export function benzerlik(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  const m = a.length;
  const n = b.length;
  let onceki = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    const simdi = new Array<number>(n + 1).fill(0);
    for (let j = 1; j <= n; j++) {
      simdi[j] = a[i - 1] === b[j - 1] ? onceki[j - 1] + 1 : Math.max(onceki[j], simdi[j - 1]);
    }
    onceki = simdi;
  }
  return (2 * onceki[n]) / (m + n);
}

function govde(m: HamMercek): string[] {
  return normalizeEt([m.teshis, m.giris, m.irtibat, m.pusulaNotu].join(" "));
}

function birlestir(korunan: HamMercek, dusen: HamMercek): void {
  for (const alan of ["etiketler", "tetikleyiciler"] as const) {
    const var_ = new Set(korunan[alan].map((x) => x.toLocaleLowerCase("tr-TR")));
    for (const t of dusen[alan]) {
      if (!var_.has(t.toLocaleLowerCase("tr-TR"))) {
        korunan[alan].push(t);
        var_.add(t.toLocaleLowerCase("tr-TR"));
      }
    }
  }
  korunan.birlesenler = [...(korunan.birlesenler ?? []), dusen.no ?? -1, ...(dusen.birlesenler ?? [])];
}

export function blokAyristir(metin: string): { bloklar: HamMercek[]; bozuk: BozukParca[] } {
  const satirlar = metin.replace(/^﻿/, "").split(/\r?\n/);
  const adSatirlari = satirlar.flatMap((s, i) => (s.includes("Bakış Açısı Adı") ? [i] : []));
  const bloklar: HamMercek[] = [];
  const bozuk: BozukParca[] = [];

  adSatirlari.forEach((i, k) => {
    const son = k + 1 < adSatirlari.length ? adSatirlari[k + 1] - 1 : satirlar.length;
    const baslik = (satirlar[i - 1] || "").trim();
    const eslesme = baslik.match(/^(\d+)\.\s*(?:MERCEK|Mercek)\s*:/);
    const no = eslesme ? Number(eslesme[1]) : null;
    const parca = satirlar.slice(i, son).map((s) => s.trim()).filter(Boolean);
    const bul = (onek: string): string => {
      const s = parca.find((l) => new RegExp(`^\\d\\.\\s*${onek}`).test(l) || l.startsWith(onek));
      return s ? sonrasi(s) : "";
    };
    const etiketHam = bul("RAG Etiketi").replace(/^\s*etiket\s*:/i, "");
    const m: HamMercek = {
      no,
      kaynakSatir: i + 1,
      ad: sonrasi(parca[0]),
      etiketler: etiketHam.replace(/[[\]]/g, "").split(",").map((t) => t.trim()).filter(Boolean),
      tetikleyiciler: bul("Tetikleyici").split(",").map((t) => t.trim().replace(/\.$/, "")).filter(Boolean),
      teshis: bul("Arka Planda"),
      giris: bul("Giriş"),
      irtibat: bul("Hakiki İrtibat"),
      pusulaNotu: bul("Pusula Notu"),
      yasaklar: bul("Yasaklı"),
    };
    const eksik = ALANLAR.filter((a) => (Array.isArray(m[a]) ? m[a].length === 0 : !m[a]));
    const fazla = parca.filter(
      (l) => !/^(\d\.\s|Giriş:|Hakiki İrtibat:|Pusula Notu:|BAKIŞ AÇILARI VE MERCEKLER KILAVUZU)/.test(l)
    );
    if (eksik.length || fazla.length || no === null) {
      bozuk.push({ kaynakSatir: i + 1, no, eksik: [...eksik], fazla: fazla.slice(0, 3) });
    }
    bloklar.push(m);
  });
  return { bloklar, bozuk };
}

export function ayristir(metin: string): AyristirmaSonucu {
  const { bloklar, bozuk } = blokAyristir(metin);
  const net: HamMercek[] = [];
  const tekrarlar: Tekrar[] = [];

  for (const m of bloklar) {
    const g = govde(m);
    const a = normalizeEt(m.ad);
    let es: { k: HamMercek; sa: number; sb: number } | null = null;
    for (const k of net) {
      const sa = benzerlik(a, normalizeEt(k.ad));
      const sb = benzerlik(g, govde(k));
      if ((sa >= 0.6 && sb >= 0.6) || sb >= 0.8) {
        es = { k, sa, sb };
        break;
      }
    }
    if (es) {
      tekrarlar.push({
        no: m.no,
        ad: m.ad,
        esiNo: es.k.no,
        esiAd: es.k.ad,
        adBenzerlik: Math.round(es.sa * 100) / 100,
        icerikBenzerlik: Math.round(es.sb * 100) / 100,
        birebir: g.join(" ") === govde(es.k).join(" "),
        tur: "otomatik",
      });
      birlestir(es.k, m);
    } else {
      net.push(m);
    }
  }

  for (const [korunanNo, dusenNo] of AYNI_KONU_CIFTLERI) {
    const korunan = net.find((m) => m.no === korunanNo);
    const dusenIdx = net.findIndex((m) => m.no === dusenNo);
    if (!korunan || dusenIdx < 0) continue;
    const [dusen] = net.splice(dusenIdx, 1);
    birlestir(korunan, dusen);
    tekrarlar.push({
      no: dusen.no,
      ad: dusen.ad,
      esiNo: korunan.no,
      esiAd: korunan.ad,
      adBenzerlik: Math.round(benzerlik(normalizeEt(dusen.ad), normalizeEt(korunan.ad)) * 100) / 100,
      icerikBenzerlik: Math.round(benzerlik(govde(dusen), govde(korunan)) * 100) / 100,
      birebir: false,
      tur: "ayni_konu",
    });
  }

  net.sort((x, y) => (x.no ?? 0) - (y.no ?? 0));
  return { toplamBlok: bloklar.length, net, tekrarlar, bozuk };
}
