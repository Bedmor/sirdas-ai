import { test } from "node:test";
import assert from "node:assert/strict";
import {
  kartMetniSec,
  satirlaraBol,
  kartDuzeniHesapla,
  kartDosyaAdi,
  KART_KARAKTER_SINIRI,
} from "../../src/lib/sohbet/gonul-karti";

// Sahte ölçücü: her harf puntonun yarısı kadar yer kaplar (Türkçe harfler tek harf sayılır)
const olc = (t: string, punto: number) => Array.from(t).length * punto * 0.5;

test("gönül kartı: kısa cevap aynen alınır, vurgu işaretleri temizlenir", () => {
  const r = kartMetniSec("Sabır, **imanın yarısıdır**. Rabbin seni unutmaz.");
  assert.equal(r.metin, "Sabır, imanın yarısıdır. Rabbin seni unutmaz.");
  assert.equal(r.kisaltildi, false);
});

test("gönül kartı: uzun cevapta tam cümleler alınır, cümle ortasından kesilmez", () => {
  const cumle = "Gönlünü daraltan her şeyi Rabbine emanet et ve ümidini hiç kesme.";
  const uzun = Array.from({ length: 12 }, () => cumle).join(" ");
  const r = kartMetniSec(uzun);
  assert.ok(r.kisaltildi);
  assert.ok(r.metin.length <= KART_KARAKTER_SINIRI);
  assert.ok(r.metin.endsWith("kesme."), "son cümle tam olmalı");
  assert.ok(uzun.startsWith(r.metin), "metin değiştirilmeden baştan alınmalı");
});

test("gönül kartı: kısa selamlama paragrafından sonra ilk anlamlı paragraf da gelir", () => {
  const ham =
    "Değerli kardeşim,\n\nRızık kaygısı insanın kalbini yorar; fakat rızkı veren Allah'tır ve O, kulunu asla unutmaz. Sen elinden gelen gayreti göster, gerisini O'na bırak.\n\nÜçüncü paragraf burada başlar ve karta girmemelidir.";
  const r = kartMetniSec(ham);
  assert.match(r.metin, /^Değerli kardeşim,\nRızık kaygısı/);
  assert.doesNotMatch(r.metin, /Üçüncü paragraf/);
  assert.equal(r.kisaltildi, true);
});

test("gönül kartı: tek cümle bile sığmıyorsa kelime sınırından kesilip üç nokta konur", () => {
  const tekCumle = "Sabır " + "ve şükür ".repeat(80) + "son.";
  const r = kartMetniSec(tekCumle, 100);
  assert.ok(r.metin.endsWith("…"));
  assert.ok(r.metin.length <= 101);
  assert.doesNotMatch(r.metin, /\s…$/);
});

test("gönül kartı: madde işaretleri karttan düşer", () => {
  const r = kartMetniSec("- İstiğfar et.\n- Sabret.");
  assert.equal(r.metin, "İstiğfar et.\nSabret.");
});

test("satır kırma: genişliği aşmaz, Türkçe kelimeleri bölmez", () => {
  const satirlar = satirlaraBol("Şükür ğüzel ıssız öğüt çiçek İstanbul ışığı", 300, 40, olc);
  for (const s of satirlar) assert.ok(olc(s, 40) <= 300, s);
  assert.equal(satirlar.join(" "), "Şükür ğüzel ıssız öğüt çiçek İstanbul ışığı");
});

test("satır kırma: tek başına sığmayan kelime harf harf bölünür", () => {
  const satirlar = satirlaraBol("https://ornek.example/çok-uzun-bağlantı-adresi", 200, 40, olc);
  assert.ok(satirlar.length > 1);
  for (const s of satirlar) assert.ok(olc(s, 40) <= 200, s);
  assert.equal(satirlar.join(""), "https://ornek.example/çok-uzun-bağlantı-adresi");
});

test("kart düzeni: kısa metin büyük puntoyla, uzun metin küçülerek sığar", () => {
  const kisa = kartDuzeniHesapla("Allah sabredenlerle beraberdir.", olc, { genislik: 800, yukseklik: 1100 });
  assert.equal(kisa.punto, 64);
  assert.equal(kisa.kesildi, false);
  const uzunMetin = "Gönlünü daraltan her şeyi Rabbine emanet et. ".repeat(8).trim();
  const uzun = kartDuzeniHesapla(uzunMetin, olc, { genislik: 800, yukseklik: 1100 });
  assert.ok(uzun.punto < 64);
  assert.ok(uzun.yukseklik <= 1100);
  assert.equal(uzun.kesildi, false);
});

test("kart düzeni: en küçük puntoda da taşan metin kesilir, son satıra üç nokta konur", () => {
  const cokUzun = "Sabır ve şükür kalbin iki kanadıdır. ".repeat(60).trim();
  const d = kartDuzeniHesapla(cokUzun, olc, { genislik: 800, yukseklik: 600, enKucukPunto: 38 });
  assert.equal(d.kesildi, true);
  assert.ok(d.yukseklik <= 600);
  assert.ok(d.satirlar[d.satirlar.length - 1].endsWith("…"));
  for (const s of d.satirlar) assert.ok(olc(s, d.punto) <= 800, s);
});

test("kart düzeni: paragraf arası boş satır olarak korunur", () => {
  const d = kartDuzeniHesapla("Birinci.\nİkinci.", olc, { genislik: 800, yukseklik: 1100 });
  assert.deepEqual(d.satirlar, ["Birinci.", "", "İkinci."]);
});

test("kart dosya adı tarihlidir", () => {
  assert.equal(kartDosyaAdi(new Date(2026, 10, 18, 9, 5)), "gonul-karti-20261118-0905.png");
});
