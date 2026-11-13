/**
 * Cuma hutbesi testleri. Örnekler 13.11.2026'da Diyanet İşleri Başkanlığı Din
 * Hizmetleri Genel Müdürlüğü'nün gerçek hutbe sayfasından kaydedildi
 * (tests/cuma-hutbesi/ornekler). Ağ isteği yapılmaz.
 */
import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  HUTBE_LISTE_ADRESI,
  cumaHutbeleriniSec,
  diyanetAdresi,
  hutbeListesiniAyristir,
  noktaliTarihiCoz,
  pdfMetniniAyristir,
  tarihiYaz,
  turkiyeBugunIso,
} from "../../src/lib/araclar/cuma-hutbesi";
import {
  hutbeDurumunuSifirla,
  hutbeleriGosterimeHazirla,
  hutbeleriTopla,
  pdfSayfalariniOku,
  sonBasariliIleGetir,
  type HutbeVerisi,
} from "../../src/lib/araclar/cuma-hutbesi-kaynak";
import { CumaHutbesi } from "../../src/components/araclar/cuma-hutbesi";

const klasor = path.join(path.dirname(fileURLToPath(import.meta.url)), "ornekler");
const LISTE = fs.readFileSync(path.join(klasor, "diyanet-hutbe-listesi-2026-11-13.html"), "utf8");
const PDF_DIJITAL = new Uint8Array(fs.readFileSync(path.join(klasor, "dijital-mecrada-ahlak-2026-11-13.pdf")));
const PDF_IBADET = new Uint8Array(fs.readFileSync(path.join(klasor, "ibadet-2026-11-06.pdf")));

const gercekFetch = globalThis.fetch;
let istekler: string[] = [];
beforeEach(() => {
  istekler = [];
  hutbeDurumunuSifirla();
});
afterEach(() => {
  globalThis.fetch = gercekFetch;
});

function fetchTaklidi(yanit: (url: string) => Response) {
  globalThis.fetch = (async (girdi: string | URL | Request) => {
    const url = String(girdi instanceof Request ? girdi.url : girdi);
    istekler.push(url);
    return yanit(url);
  }) as typeof fetch;
}

/* ---------------- Liste ayrıştırma ---------------- */

test("liste: gerçek Diyanet sayfasından 30 hutbe, en yenisi 13.11.2026 Dijital Mecrada Ahlak", () => {
  const k = hutbeListesiniAyristir(LISTE);
  assert.equal(k.length, 30);
  assert.equal(k[0].tarih, "2026-11-13");
  assert.equal(k[0].baslik, "Dijital Mecrada Ahlak");
  assert.equal(k[0].pdf, "https://dinhizmetleri.diyanet.gov.tr/Documents/Dijital%20Mecrada%20Ahlak.pdf");
  assert.equal(k[0].ses, "https://dinhizmetleri.diyanet.gov.tr/Documents/Sesli%20Hutbe%20(Dijital%20Mecrada%20Ahlak).mp3");
  assert.ok(k[0].word?.endsWith(".doc"));
  assert.equal(k[1].baslik, "İbadet");
});

test("liste: HTML varlıkları çözülür (Kur&#39;an-ı Kerim)", () => {
  const k = hutbeListesiniAyristir(LISTE);
  assert.ok(k.some((h) => h.baslik === "Kur'an-ı Kerim"));
  assert.ok(k.every((h) => !/&#\d+;|&[a-z]+;/.test(h.baslik)));
});

test("liste: tarih sırası yeniden eskiye", () => {
  const k = hutbeListesiniAyristir(LISTE);
  for (let i = 1; i < k.length; i++) assert.ok(k[i - 1].tarih >= k[i].tarih, `${k[i - 1].tarih} >= ${k[i].tarih}`);
});

test("liste: yapı değişirse anlaşılır hata fırlatır", () => {
  assert.throws(() => hutbeListesiniAyristir("<html><body>Bakım çalışması</body></html>"), /bulunamadı/);
  assert.throws(() => hutbeListesiniAyristir('<script>var WPQ1ListData = { "Row" : []};</script>'), /boş/);
  assert.throws(() => hutbeListesiniAyristir('<script>var WPQ1ListData = { "Row" : [{"ID":"1"'), /yarım/);
});

test("tarih ve adres yardımcıları", () => {
  assert.equal(noktaliTarihiCoz("6.11.2026"), "2026-11-06");
  assert.equal(noktaliTarihiCoz("31.02.2026"), null);
  assert.equal(noktaliTarihiCoz("2026-11-06"), null);
  assert.equal(tarihiYaz("2026-11-13"), "13 Kasım 2026");
  assert.equal(diyanetAdresi("https://baska-site.example/x.pdf"), null);
  assert.equal(diyanetAdresi(""), null);
  assert.equal(turkiyeBugunIso(new Date("2026-11-12T21:30:00Z")), "2026-11-13"); // İstanbul'da gece yarısını geçti
});

/* ---------------- Son 5 seçimi ---------------- */

test("son 5: cuma günü bu haftanınki + önceki 4 cuma", () => {
  const s = cumaHutbeleriniSec(hutbeListesiniAyristir(LISTE), "2026-11-13");
  assert.deepEqual(
    s.map((h) => h.tarih),
    ["2026-11-13", "2026-11-06", "2026-10-30", "2026-10-23", "2026-10-16"],
  );
});

test("son 5: perşembe günü yarının hutbesi henüz gösterilmez, geçen cumanınki kalır", () => {
  const s = cumaHutbeleriniSec(hutbeListesiniAyristir(LISTE), "2026-11-12");
  assert.equal(s[0].tarih, "2026-11-06");
  assert.equal(s.length, 5);
  assert.equal(s[4].tarih, "2026-10-09");
});

test("son 5: cuma olmayan bayram hutbesi (27.05.2026 çarşamba) cuma listesine girmez", () => {
  const s = cumaHutbeleriniSec(hutbeListesiniAyristir(LISTE), "2026-05-28");
  assert.deepEqual(
    s.map((h) => h.tarih),
    ["2026-05-22", "2026-05-15", "2026-05-08", "2026-05-01"],
  );
});

test("son 5: karışık sıra ve aynı tarihli kopya düzgün ele alınır", () => {
  const k = hutbeListesiniAyristir(LISTE);
  const karisik = [...k].reverse();
  karisik.push({ ...k[0], baslik: "Kopya" });
  const s = cumaHutbeleriniSec(karisik, "2026-11-20");
  assert.equal(s.length, 5);
  assert.equal(new Set(s.map((h) => h.tarih)).size, 5);
  assert.equal(s[0].tarih, "2026-11-13");
});

/* ---------------- PDF metni ---------------- */

test("PDF: Dijital Mecrada Ahlak metni paragraflara, hitaplara ve dipnotlara ayrılır", async () => {
  const m = pdfMetniniAyristir(await pdfSayfalariniOku(PDF_DIJITAL.slice()));
  assert.ok(m);
  const p = m.paragraflar;
  assert.deepEqual(p[0], { tur: "hitap", metin: "Muhterem Müslümanlar!" });
  assert.ok(p[1].metin.startsWith("İletişim teknolojilerinin büyük bir hızla geliştiği günümüzde,"));
  assert.ok(p.some((x) => x.metin.includes("“Her duyduğunu söylemesi kişiye günah olarak yeter”¹ buyurmaktadır.")));
  assert.ok(p.some((x) => x.metin.includes("sorumludur”² uyarısında bulunmaktadır.")));
  assert.deepEqual(
    p.filter((x) => x.tur === "hitap").map((x) => x.metin),
    ["Muhterem Müslümanlar!", "Sevgili Gençler!", "Kıymetli Anneler ve Babalar!", "Değerli Kardeşlerim!", "Aziz Müminler!", "Kardeşlerim!"],
  );
  assert.deepEqual(p[p.length - 1], { tur: "imza", metin: "Din Hizmetleri Genel Müdürlüğü" });
  assert.deepEqual(m.dipnotlar, [
    { no: "1", metin: "Ebû Dâvûd, Edeb, 80." },
    { no: "2", metin: "İsrâ, 17/36." },
    { no: "3", metin: "Mü’minûn, 23/3." },
  ]);
  assert.equal(m.arapcaAtlandi, false);
  // Üst bilgi ve büyük harfli başlık metne karışmaz
  assert.ok(p.every((x) => !x.metin.startsWith("Tarih:") && x.metin !== "DİJİTAL MECRADA AHLAK"));
});

test("PDF: Arapça bölüm bozuk gösterilmez, işaretlenir; Türkçe metin tam kalır", async () => {
  const m = pdfMetniniAyristir(await pdfSayfalariniOku(PDF_IBADET.slice()));
  assert.ok(m);
  assert.equal(m.arapcaAtlandi, true);
  assert.ok(m.paragraflar.every((x) => !/\p{Script=Arabic}/u.test(x.metin)));
  assert.deepEqual(m.paragraflar[0], { tur: "hitap", metin: "Muhterem Müslümanlar!" });
  assert.ok(m.paragraflar[1].metin.startsWith("Cenâb-ı Hakk’a olan bağlılığımızın en somut göstergesi ibadetlerimizdir."));
  assert.equal(m.dipnotlar.length, 5);
});

test("PDF: metin çıkmayan belge için null (yalnız PDF bağlantısı gösterilir)", () => {
  assert.equal(pdfMetniniAyristir([]), null);
  assert.equal(pdfMetniniAyristir([{ genislik: 595, ogeler: [{ str: "Kısa", transform: [1, 0, 0, 1, 28, 800], height: 12 }] }]), null);
});

/* ---------------- Kaynak ve geri dönüş ---------------- */

function diyanetTaklidi(url: string): Response {
  if (url === HUTBE_LISTE_ADRESI) return new Response(LISTE, { status: 200, headers: { "Content-Type": "text/html" } });
  if (url.endsWith("Dijital%20Mecrada%20Ahlak.pdf")) return new Response(PDF_DIJITAL.slice(), { status: 200 });
  if (url.endsWith("%C4%B0badet.pdf")) return new Response(PDF_IBADET.slice(), { status: 200 });
  return new Response("yok", { status: 404 });
}

test("kaynak: liste + PDF'ler okunur, metni alınamayan hutbe null metinle gelir", async () => {
  fetchTaklidi(diyanetTaklidi);
  const v = await hutbeleriTopla(new Date("2026-11-13T09:00:00Z"));
  assert.equal(v.hutbeler[0].tarih, "2026-11-13");
  assert.ok(v.hutbeler[0].metin);
  assert.ok(v.hutbeler[1].metin);
  assert.equal(v.hutbeler[2].metin, null); // PDF 404: yalnız bağlantı gösterilir
  assert.equal(istekler.filter((u) => u === HUTBE_LISTE_ADRESI).length, 1);
  const g = hutbeleriGosterimeHazirla(v, new Date("2026-11-13T09:00:00Z"));
  assert.equal(g?.buHafta?.baslik, "Dijital Mecrada Ahlak");
  assert.equal(g?.arsiv.length, 4);
});

test("kaynak erişilemezse: hata fırlatır; son başarılı veri kullanılır", async () => {
  fetchTaklidi(() => new Response("İsteğiniz güvenlik kurallarına takılmıştır.", { status: 403 }));
  await assert.rejects(() => hutbeleriTopla(), /yanıt vermedi \(403\)/);

  const iyi: HutbeVerisi = {
    alindi: "2026-11-13T09:00:00.000Z",
    hutbeler: [{ tarih: "2026-11-13", baslik: "Dijital Mecrada Ahlak", pdf: null, word: null, ses: null, metin: null }],
  };
  const t0 = Date.now();
  assert.equal(await sonBasariliIleGetir(async () => iyi, t0), iyi);
  let cagri = 0;
  const bozuk = async () => {
    cagri++;
    throw new Error("Diyanet kapalı");
  };
  assert.equal(await sonBasariliIleGetir(bozuk, t0 + 1000), iyi);
  // Bekleme süresinde Diyanet hiç denenmez
  assert.equal(await sonBasariliIleGetir(bozuk, t0 + 2000), iyi);
  assert.equal(cagri, 1);
});

test("kaynak hiç alınamadıysa sayfa çökmez, sade Türkçe uyarı ve bağlantı gösterir", async () => {
  fetchTaklidi(() => {
    throw new TypeError("fetch failed");
  });
  const v = await sonBasariliIleGetir(() => hutbeleriTopla());
  assert.equal(v, null);
  const html = renderToStaticMarkup(React.createElement(CumaHutbesi, { veri: hutbeleriGosterimeHazirla(v, new Date()) }));
  assert.ok(html.includes("Hutbeye şu an ulaşılamıyor, Diyanet sitesinden okuyabilirsiniz."));
  assert.ok(html.includes(`href="${HUTBE_LISTE_ADRESI}"`));
});

test("gösterim: kaynak adı, özgün bağlantı, ses ve arşiv (4 hafta) görünür", async () => {
  fetchTaklidi(diyanetTaklidi);
  const v = await hutbeleriTopla(new Date("2026-11-13T09:00:00Z"));
  const html = renderToStaticMarkup(
    React.createElement(CumaHutbesi, { veri: hutbeleriGosterimeHazirla(v, new Date("2026-11-13T09:00:00Z")) }),
  );
  assert.ok(html.includes("Kaynak: Diyanet İşleri Başkanlığı"));
  assert.ok(html.includes("Bu haftanın hutbesi · 13 Kasım 2026"));
  assert.ok(html.includes("<audio"));
  assert.equal((html.match(/<details/g) ?? []).length, 4);
  assert.ok(html.includes("Arapça asılları"));
  assert.ok(!/[—]/.test(html), "uzun tire olmamalı");
});
