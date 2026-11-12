import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bolgeZamani,
  kalanSureMetni,
  kalanSureSaat,
  noktaliTarihtenIso,
  siradakiVakit,
  type GunlukVakit,
} from "../../src/lib/araclar/namaz-vakitleri";

// Diyanet, İstanbul, 12-13 Kasım 2026 (namazvakitleri.diyanet.gov.tr ile karşılaştırıldı)
const gunler: GunlukVakit[] = [
  { tarih: "2026-11-12", imsak: "06:13", gunes: "07:41", ogle: "12:53", ikindi: "15:31", aksam: "17:56", yatsi: "19:18" },
  { tarih: "2026-11-13", imsak: "06:14", gunes: "07:42", ogle: "12:53", ikindi: "15:30", aksam: "17:55", yatsi: "19:17" },
];
const saniye = (s: string) => {
  const [h, m, sn = "0"] = s.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(sn);
};

test("Öğleden sonra sıradaki vakit ikindi, mevcut öğle", () => {
  const r = siradakiVakit(gunler, { tarih: "2026-11-12", saniye: saniye("14:00") });
  assert.ok(r);
  assert.equal(r.anahtar, "ikindi");
  assert.equal(r.mevcut, "ogle");
  assert.equal(r.kalanSaniye, saniye("01:31"));
});

test("İmsaktan önce sıradaki vakit bugünün imsakı, mevcut yok", () => {
  const r = siradakiVakit(gunler, { tarih: "2026-11-12", saniye: saniye("03:00") });
  assert.ok(r);
  assert.equal(r.anahtar, "imsak");
  assert.equal(r.tarih, "2026-11-12");
  assert.equal(r.mevcut, null);
  assert.equal(r.kalanSaniye, saniye("03:13"));
});

test("Yatsıdan sonra sıradaki vakit yarının imsakı (gece yarısını geçer)", () => {
  const r = siradakiVakit(gunler, { tarih: "2026-11-12", saniye: saniye("22:30:15") });
  assert.ok(r);
  assert.equal(r.anahtar, "imsak");
  assert.equal(r.tarih, "2026-11-13");
  assert.equal(r.mevcut, "yatsi");
  // 22:30:15 -> 24:00 = 1:29:45, + 06:14 = 7:43:45
  assert.equal(r.kalanSaniye, saniye("07:43:45"));
});

test("Tam vakit anında bir sonraki vakte geçer", () => {
  const r = siradakiVakit(gunler, { tarih: "2026-11-12", saniye: saniye("12:53") });
  assert.ok(r);
  assert.equal(r.anahtar, "ikindi");
  assert.equal(r.mevcut, "ogle");
});

test("Yarının verisi yoksa yatsıdan sonra null döner", () => {
  assert.equal(siradakiVakit([gunler[0]], { tarih: "2026-11-12", saniye: saniye("23:00") }), null);
});

test("Gün sırası karışık gelse de doğru çalışır", () => {
  const r = siradakiVakit([gunler[1], gunler[0]], { tarih: "2026-11-12", saniye: saniye("18:00") });
  assert.equal(r?.anahtar, "yatsi");
});

test("Kalan süre biçimleri", () => {
  assert.equal(kalanSureSaat(saniye("07:43:45")), "07:43:45");
  assert.equal(kalanSureSaat(-5), "00:00:00");
  assert.equal(kalanSureMetni(saniye("02:14:30")), "2 saat 14 dakika");
  assert.equal(kalanSureMetni(saniye("00:14:59")), "14 dakika");
  assert.equal(kalanSureMetni(saniye("03:00")), "3 saat");
  assert.equal(kalanSureMetni(30), "1 dakikadan az");
});

test("Bölge zamanı İstanbul saatine çevrilir (UTC+3)", () => {
  const bz = bolgeZamani(new Date("2026-11-12T21:30:00Z"), "Europe/Istanbul");
  assert.deepEqual(bz, { tarih: "2026-11-13", saniye: saniye("00:30") });
});

test("Noktalı tarih ISO biçimine çevrilir", () => {
  assert.equal(noktaliTarihtenIso("12.11.2026"), "2026-11-12");
});
