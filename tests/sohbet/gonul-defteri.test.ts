import test from "node:test";
import assert from "node:assert/strict";
import {
  GONUL_DEFTERI_ANAHTAR,
  GONUL_DEFTERI_SINIR,
  defterDegistir,
  defteriOku,
  deftereEkleListe,
  defterdeMi,
} from "../../src/lib/sohbet/gonul-defteri";
import { okunacakMetin, okunacakParcalar, PARCA_SINIRI } from "../../src/lib/sohbet/sesli-okuma";
import { kalanSureKisa, vakteKalanEtiketi } from "../../src/lib/araclar/namaz-vakitleri";

function bellekDepo() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

const kayit = (id: string) => ({ id, metin: `metin ${id}`, eklenme: "2026-11-15T10:00:00.000Z" });

test("Gönül Defteri: ekle, tekrar eklemez, çıkar", () => {
  const d = bellekDepo();
  assert.deepEqual(defteriOku(d), []);
  defterDegistir(d, { tur: "ekle", kayit: kayit("a") });
  defterDegistir(d, { tur: "ekle", kayit: kayit("b") });
  const { liste } = defterDegistir(d, { tur: "ekle", kayit: kayit("a") });
  assert.deepEqual(liste.map((k) => k.id), ["b", "a"], "en yeni üstte, aynı cevap iki kez yok");
  assert.ok(defterdeMi(defteriOku(d), "a"));
  defterDegistir(d, { tur: "cikar", id: "a" });
  assert.deepEqual(defteriOku(d).map((k) => k.id), ["b"]);
});

test("Gönül Defteri: bozuk kayıt ve kapalı depo güvenli", () => {
  const d = bellekDepo();
  d.m.set(GONUL_DEFTERI_ANAHTAR, "{bozuk");
  assert.deepEqual(defteriOku(d), []);
  d.m.set(GONUL_DEFTERI_ANAHTAR, JSON.stringify([{ id: 5 }, kayit("x")]));
  assert.deepEqual(defteriOku(d).map((k) => k.id), ["x"]);
  assert.deepEqual(defteriOku(null), []);
  const kapali = { getItem: () => null, setItem: () => { throw new Error("dolu"); } };
  const r = defterDegistir(kapali, { tur: "ekle", kayit: kayit("y") });
  assert.equal(r.yazildi, false);
  assert.deepEqual(r.liste, []);
});

test("Gönül Defteri: üst sınır aşılınca en eski düşer", () => {
  let l = [] as ReturnType<typeof defteriOku>;
  for (let i = 0; i < GONUL_DEFTERI_SINIR + 5; i++) l = deftereEkleListe(l, kayit(String(i)));
  assert.equal(l.length, GONUL_DEFTERI_SINIR);
  assert.equal(l[0].id, String(GONUL_DEFTERI_SINIR + 4));
});

test("Sesli okuma: biçim işaretleri ayıklanır, parçalar sınırı aşmaz", () => {
  assert.equal(okunacakMetin("**Sabır** _güzeldir_. [Kaynak](https://x.y)"), "Sabır güzeldir. Kaynak");
  const uzun = "Bu bir cümledir, ve biraz uzundur. ".repeat(40);
  const p = okunacakParcalar(uzun);
  assert.ok(p.length > 1);
  assert.ok(p.every((x) => x.length <= PARCA_SINIRI + 1));
  assert.equal(p.join(" ").replace(/\s+/g, " "), okunacakMetin(uzun));
  assert.deepEqual(okunacakParcalar("   "), []);
});

test("Vakit şeridi: etiket ve kısa süre", () => {
  assert.equal(vakteKalanEtiketi("ikindi"), "İkindiye kalan");
  assert.equal(vakteKalanEtiketi("aksam"), "Akşama kalan");
  assert.equal(vakteKalanEtiketi("yatsi"), "Yatsıya kalan");
  assert.equal(kalanSureKisa(6120), "01:42");
  assert.equal(kalanSureKisa(30), "00:01");
  assert.equal(kalanSureKisa(0), "00:00");
});

test("Bu cihazdan temizle Gönül Defterini de siler", async () => {
  const { CIHAZDAN_SILINECEK_ANAHTARLAR } = await import("../../src/lib/cihaz-temizle");
  assert.ok(CIHAZDAN_SILINECEK_ANAHTARLAR.includes(GONUL_DEFTERI_ANAHTAR));
});
