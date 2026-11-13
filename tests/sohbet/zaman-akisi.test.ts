import { test } from "node:test";
import assert from "node:assert/strict";
import { turkiyeAni, zamanAkisi } from "../../src/lib/sohbet/zaman-akisi";
import { saattenDilim } from "../../src/lib/araclar/vakit-ayeti";

// Türkiye UTC+3 (yaz saati yok). 13.11.2026 cuma, 12.11.2026 perşembe.
const utc = (iso: string) => new Date(iso);

test("Türkiye saati cihaz saat diliminden bağımsız hesaplanır", () => {
  const t = turkiyeAni(utc("2026-11-13T05:30:00Z"));
  assert.equal(t.saat, 8);
  assert.equal(t.dakika, 30);
  assert.equal(t.haftaGunu, 5);
  assert.deepEqual([t.yil, t.ay, t.gun], [2026, 11, 13]);
});

test("Gece yarısında gün Türkiye takvimine göre döner", () => {
  const t = turkiyeAni(utc("2026-11-12T21:30:00Z")); // TR 13.11 00:30
  assert.equal(t.gun, 13);
  assert.equal(t.saat, 0);
});

test("Dilimler vakit ayeti kartıyla aynı", () => {
  for (let saat = 0; saat < 24; saat++) {
    const an = new Date(Date.UTC(2026, 10, 10, saat - 3, 15)); // TR saat = UTC + 3
    assert.equal(zamanAkisi(an).dilim, saattenDilim(saat), `saat ${saat}`);
  }
});

test("Karşılamalar saate göre", () => {
  assert.equal(zamanAkisi(utc("2026-11-10T04:00:00Z")).selam, "Hayırlı sabahlar"); // 07:00
  assert.equal(zamanAkisi(utc("2026-11-10T10:00:00Z")).selam, "Hayırlı günler"); // 13:00
  assert.equal(zamanAkisi(utc("2026-11-10T15:30:00Z")).selam, "Hayırlı akşamlar"); // 18:30
  assert.equal(zamanAkisi(utc("2026-11-10T19:00:00Z")).selam, "Hayırlı geceler"); // 22:00
  assert.equal(zamanAkisi(utc("2026-11-10T01:00:00Z")).selam, "Seher vaktin hayırlı olsun"); // 04:00
});

test("Cuma günü ve perşembe akşamı (cuma gecesi) notu", () => {
  assert.equal(zamanAkisi(utc("2026-11-13T07:00:00Z")).gunNotu, "Hayırlı cumalar"); // cuma 10:00
  assert.match(zamanAkisi(utc("2026-11-13T07:00:00Z")).oneri, /cuma/i);
  assert.equal(zamanAkisi(utc("2026-11-12T16:00:00Z")).gunNotu, "Cuma gecen mübarek olsun"); // perşembe 19:00
  assert.equal(zamanAkisi(utc("2026-11-12T10:00:00Z")).gunNotu, null); // perşembe 13:00
  assert.equal(zamanAkisi(utc("2026-11-11T07:00:00Z")).gunNotu, null); // çarşamba
});

test("Gece yarısından sonra dinlenme notu", () => {
  const a = zamanAkisi(utc("2026-11-10T22:30:00Z")); // 01:30
  assert.equal(a.geceGec, true);
  assert.match(a.oneri, /geç/);
  assert.equal(zamanAkisi(utc("2026-11-10T18:00:00Z")).geceGec, false); // 21:00
});

test("Metinlerde emoji ve uzun tire yok", () => {
  for (let s = 0; s < 24; s++) {
    for (const gun of [10, 12, 13]) {
      const a = zamanAkisi(new Date(Date.UTC(2026, 10, gun, s)));
      const tum = [a.selam, a.oneri, a.gunNotu ?? ""].join(" ");
      assert.doesNotMatch(tum, /[–—]|\p{Extended_Pictographic}/u);
    }
  }
});
