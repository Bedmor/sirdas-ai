import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aciFarki,
  alfadanYon,
  gercekYon,
  kameraYonu,
  kibleAcisi,
  manyetikKibleAcisi,
} from "../../src/lib/araclar/kible";
import { IL_SAPMALARI, manyetikSapma } from "../../src/lib/araclar/manyetik-sapma";
import { ilBul } from "../../src/lib/araclar/iller";

/**
 * Diyanet kıble açıları (tam sayı derece), 13.11.2026'da Diyanet namaz vakitleri
 * il sayfalarından okundu:
 *   https://namazvakitleri.diyanet.gov.tr/tr-TR/9206/ankara-icin-namaz-vakti   -> 155
 *   https://namazvakitleri.diyanet.gov.tr/tr-TR/9541/istanbul-icin-namaz-vakti -> 147
 *   https://namazvakitleri.diyanet.gov.tr/tr-TR/9560/izmir-icin-namaz-vakti    -> 140
 *   https://namazvakitleri.diyanet.gov.tr/tr-TR/9930/van-icin-namaz-vakti      -> 186
 *   https://namazvakitleri.diyanet.gov.tr/tr-TR/9419/edirne-icin-namaz-vakti   -> 143
 *   https://namazvakitleri.diyanet.gov.tr/tr-TR/9905/trabzon-icin-namaz-vakti  -> 174
 *
 * Bu açılar coğrafi kuzeye göre büyük daire açısından 4-6 derece küçüktür; fark
 * doğu yönlü manyetik sapmayla örtüşür, yani Diyanet açıyı (pusulayla kullanılmak
 * üzere) manyetik kuzeye göre verir. Kalan 1-2 derecelik fark, Diyanet'in tam sayıya
 * yuvarlaması ve sapmanın yıllar içinde artmasından (eski model) kaynaklanır.
 */
const DIYANET: Array<[string, number]> = [
  ["506", 155], // Ankara
  ["539", 147], // İstanbul
  ["540", 140], // İzmir
  ["577", 186], // Van
  ["527", 143], // Edirne
  ["574", 174], // Trabzon
];

test("Sapma tablosu 81 ili kapsar ve Türkiye için makul aralıkta", () => {
  assert.equal(IL_SAPMALARI.length, 81);
  for (const [, , , d] of IL_SAPMALARI) assert.ok(d > 4.5 && d < 7.5, `sapma ${d}`);
});

test("Düzeltme öncesi: coğrafi açı Diyanet'ten 3,5 dereceden fazla sapar (şikâyet edilen fark)", () => {
  for (const [id, diyanet] of DIYANET) {
    const il = ilBul(id)!;
    const fark = Math.abs(aciFarki(kibleAcisi(il.lat, il.lng), diyanet));
    assert.ok(fark > 3.5 && fark < 7, `${il.ad}: ${fark.toFixed(1)}`);
  }
});

test("Düzeltme sonrası: pusula (manyetik) açısı Diyanet'le 2,5 derece içinde", () => {
  for (const [id, diyanet] of DIYANET) {
    const il = ilBul(id)!;
    const sapma = manyetikSapma(il.lat, il.lng);
    assert.ok(sapma !== null, `${il.ad} sapması bulunamadı`);
    const pusula = manyetikKibleAcisi(kibleAcisi(il.lat, il.lng), sapma);
    const fark = Math.abs(aciFarki(pusula, diyanet));
    assert.ok(fark <= 2.5, `${il.ad}: hesap ${pusula.toFixed(1)}, Diyanet ${diyanet}, fark ${fark.toFixed(1)}`);
  }
});

test("Sapma ara noktalarda komşu illerin arasında kalır, Türkiye dışında null", () => {
  const ankara = manyetikSapma(39.9208, 32.854)!;
  assert.ok(Math.abs(ankara - 6.17) < 0.01);
  const ara = manyetikSapma(39.5, 33.5)!; // Ankara-Kırşehir arası
  assert.ok(ara > 5.5 && ara < 6.8);
  assert.equal(manyetikSapma(51.5074, -0.1278), null); // Londra
  assert.equal(manyetikSapma(Number.NaN, 30), null);
});

test("Pusula yönü gerçek kuzeye çevrilir", () => {
  // Ankara: telefon (manyetik) 154 gösterirken gerçek yön 160,2 olmalı
  assert.ok(Math.abs(gercekYon(154, 6.17) - 160.17) < 1e-9);
  assert.equal(gercekYon(358, 6), 4);
  assert.equal(gercekYon(100, null), 100);
});

test("Android alpha -> yön (ekran dönüşü dahil)", () => {
  assert.equal(alfadanYon(0), 0);
  assert.equal(alfadanYon(90), 270); // saat yönünün tersine 90 = batıya bakış
  assert.equal(alfadanYon(270), 90);
  assert.equal(alfadanYon(0, 90), 90); // yatay tutulan ekran
});

test("Kamera yönü (telefon dik): W3C formülü", () => {
  const yakin = (a: number | null, b: number) => assert.ok(a !== null && Math.abs(aciFarki(a, b)) < 1e-6, `${a} != ${b}`);
  yakin(kameraYonu(0, 90, 0), 0); // dik, arka kamera kuzeye
  yakin(kameraYonu(90, 90, 0), 270); // batıya
  yakin(kameraYonu(270, 90, 0), 90); // doğuya
  yakin(kameraYonu(180, 90, 0), 180); // güneye
  assert.equal(kameraYonu(0, 0, 0), null); // telefon yerde: kamera yere bakıyor, yön belirsiz
});
