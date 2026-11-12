import { test } from "node:test";
import assert from "node:assert/strict";
import { aciFarki, kabeyeUzaklikKm, kibleAcisi, yonAdi } from "../../src/lib/araclar/kible";

const araliktaMi = (deger: number, alt: number, ust: number) =>
  assert.ok(deger >= alt && deger <= ust, `${deger.toFixed(2)} beklenen aralıkta değil [${alt}, ${ust}]`);

test("İstanbul kıble açısı ≈ 151-152°", () => {
  araliktaMi(kibleAcisi(41.0082, 28.9784), 151, 152.5);
});

// Not: Ankara için büyük daire (coğrafi kuzey) açısı ≈ 160,2°'dir; elle bağımsız
// hesapla doğrulandı. Diyanet sayfası manyetik kuzeye göre ~155° gösterir.
test("Ankara kıble açısı ≈ 160° (coğrafi kuzey)", () => {
  araliktaMi(kibleAcisi(39.9334, 32.8597), 159.5, 160.8);
});

test("Bursa ve İzmir mantıklı aralıkta", () => {
  araliktaMi(kibleAcisi(40.1885, 29.061), 150, 153);
  araliktaMi(kibleAcisi(38.4237, 27.1428), 143, 145);
});

test("Doğu/batı uç örnekler: Cakarta ~295°, Londra ~119°", () => {
  araliktaMi(kibleAcisi(-6.2088, 106.8456), 294, 296);
  araliktaMi(kibleAcisi(51.5074, -0.1278), 118, 120);
});

test("Açı daima 0-360 aralığında", () => {
  for (const [lat, lng] of [[0, 0], [-33.9, 18.4], [64.1, -21.9], [35.7, 139.7]]) {
    const a = kibleAcisi(lat, lng);
    assert.ok(a >= 0 && a < 360);
  }
});

test("Kâbe'ye uzaklık: İstanbul ≈ 2400 km", () => {
  araliktaMi(kabeyeUzaklikKm(41.0082, 28.9784), 2300, 2500);
});

test("Yön adları", () => {
  assert.equal(yonAdi(0), "Kuzey");
  assert.equal(yonAdi(151.6), "Güney-güneydoğu");
  assert.equal(yonAdi(157.8), "Güney-güneydoğu");
  assert.equal(yonAdi(359), "Kuzey");
  assert.equal(yonAdi(90), "Doğu");
});

test("Açı farkı en kısa yönü verir", () => {
  assert.equal(aciFarki(10, 350), 20);
  assert.equal(aciFarki(350, 10), -20);
  assert.equal(aciFarki(151, 151), 0);
  assert.equal(aciFarki(180, 0), 180);
});
