import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cihazdanTemizle,
  yeniCihazKimligiUret,
  THREADS_STORAGE_KEY,
  PROFILE_STORAGE_KEY,
  CLIENT_ID_STORAGE_KEY,
  CONSENT_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  HAFIZA_STORAGE_KEY,
  CIHAZDAN_SILINECEK_ANAHTARLAR,
  type AnahtarDeposu,
} from "../../src/lib/cihaz-temizle";
import { BOS_HAFIZA, hafizaOku, hafizaYaz } from "../../src/lib/hafiza";
import { TEMA_ANAHTAR, YAZI_ANAHTAR } from "../../src/lib/gorunum-betikleri";

class SahteDepo implements AnahtarDeposu {
  veri = new Map<string, string>();
  getItem(k: string) {
    return this.veri.has(k) ? (this.veri.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.veri.set(k, v);
  }
  removeItem(k: string) {
    this.veri.delete(k);
  }
}

function doluDepo(): SahteDepo {
  const d = new SahteDepo();
  d.setItem(THREADS_STORAGE_KEY, JSON.stringify([{ id: "t1", title: "Eski sohbet", messages: [] }]));
  d.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ preferred_name: "Ahmet" }));
  d.setItem(CLIENT_ID_STORAGE_KEY, "eski-kimlik-123456");
  hafizaYaz(d, {
    ...BOS_HAFIZA,
    emanetler: [{ id: "e1", tur: "ZIKIR", metin: "Hasbünallah ve nimel vekil", eklenme: new Date().toISOString() }],
  });
  d.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ accepted: true }));
  d.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ttlHours: 0 }));
  d.setItem(TEMA_ANAHTAR, "gunduz");
  d.setItem(YAZI_ANAHTAR, "2");
  d.setItem("manevi-pusula:zikirmatik:v1", JSON.stringify({ sayac: 33 }));
  d.setItem("manevi-pusula:namaz-vakitleri:secim:v1", JSON.stringify({ il: "Bursa" }));
  return d;
}

test("sohbet geçmişi ve profil önbelleği silinir", () => {
  const d = doluDepo();
  cihazdanTemizle(d, () => "yeni-kimlik-abcdef");
  assert.equal(d.getItem(THREADS_STORAGE_KEY), null);
  assert.equal(d.getItem(PROFILE_STORAGE_KEY), null);
});

test("tema, yazı boyu, gizlilik ayarı, KVKK onayı ve araç seçimleri korunur", () => {
  const d = doluDepo();
  cihazdanTemizle(d, () => "yeni-kimlik-abcdef");
  assert.equal(d.getItem(TEMA_ANAHTAR), "gunduz");
  assert.equal(d.getItem(YAZI_ANAHTAR), "2");
  assert.equal(d.getItem(SETTINGS_STORAGE_KEY), JSON.stringify({ ttlHours: 0 }));
  assert.equal(d.getItem(CONSENT_STORAGE_KEY), JSON.stringify({ accepted: true }));
  assert.equal(d.getItem("manevi-pusula:zikirmatik:v1"), JSON.stringify({ sayac: 33 }));
  assert.equal(d.getItem("manevi-pusula:namaz-vakitleri:secim:v1"), JSON.stringify({ il: "Bursa" }));
});

test("yeni cihaz kimliği üretilir ve yazılır", () => {
  const d = doluDepo();
  const yeni = cihazdanTemizle(d, () => "yeni-kimlik-abcdef");
  assert.equal(yeni, "yeni-kimlik-abcdef");
  assert.equal(d.getItem(CLIENT_ID_STORAGE_KEY), "yeni-kimlik-abcdef");
  assert.notEqual(d.getItem(CLIENT_ID_STORAGE_KEY), "eski-kimlik-123456");
});

test("varsayılan kimlik üretici her seferinde farklı ve sunucunun kabul ettiği biçimde", () => {
  const a = yeniCihazKimligiUret();
  const b = yeniCihazKimligiUret();
  assert.notEqual(a, b);
  for (const k of [a, b]) {
    // Sunucu: yalnız harf, rakam, _ ve -; en az 8 karakter (better-auth-ready.ts)
    assert.match(k, /^[a-zA-Z0-9_-]{8,64}$/);
  }
  const d = doluDepo();
  const yeni = cihazdanTemizle(d);
  assert.notEqual(yeni, "eski-kimlik-123456");
});

test("depo hata verse de çökmez (gizli sekme)", () => {
  const bozuk: AnahtarDeposu = {
    getItem: () => null,
    setItem: () => {
      throw new Error("kota");
    },
    removeItem: () => {
      throw new Error("erişim yok");
    },
  };
  assert.equal(cihazdanTemizle(bozuk, () => "kimlik-12345678"), "kimlik-12345678");
});

test("boş depoda da çalışır", () => {
  const d = new SahteDepo();
  cihazdanTemizle(d, () => "kimlik-12345678");
  assert.equal(d.getItem(CLIENT_ID_STORAGE_KEY), "kimlik-12345678");
  assert.equal(d.veri.size, 1);
});

test("Hafızam (emanetler) da bu cihazdan silinir", () => {
  assert.ok(CIHAZDAN_SILINECEK_ANAHTARLAR.includes(HAFIZA_STORAGE_KEY));
  assert.equal(HAFIZA_STORAGE_KEY, "sirdas_hafiza_v1");
  const d = doluDepo();
  assert.equal(hafizaOku(d).emanetler.length, 1);
  cihazdanTemizle(d, () => "yeni-kimlik-abcdef");
  assert.equal(d.getItem(HAFIZA_STORAGE_KEY), null);
  // Temizlikten sonra okunan hafıza boş başlar
  assert.equal(hafizaOku(d).emanetler.length, 0);
});
