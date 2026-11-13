import { test } from "node:test";
import assert from "node:assert/strict";
import { cumlelereAyir, metniBloklaraAyir, paragrafiBol, UZUN_PARAGRAF } from "../../src/lib/sohbet/metin-bicim";

const birlestir = (parcalar: string[]) => parcalar.join(" ").replace(/\s+/g, " ").trim();

test("Kısa paragrafa dokunulmaz", () => {
  const metin = "Kardeşim, sabır bir nefestir. Allah seninle.";
  assert.deepEqual(metniBloklaraAyir(metin), [{ tur: "paragraf", metin }]);
});

test("Boş satır ve tek satır sonu paragraf sınırıdır", () => {
  const b = metniBloklaraAyir("Birinci paragraf.\n\nİkinci paragraf.\nÜçüncü satır.");
  assert.equal(b.length, 3);
  assert.ok(b.every((x) => x.tur === "paragraf"));
});

test("Uzun paragraf cümle sınırından bölünür, metin kaybolmaz", () => {
  const cumle = "Sabır, insanın imtihan anında kalbini Allah'a bağlı tutmasıdır ve bu bir anda olmaz.";
  const uzun = Array.from({ length: 8 }, () => cumle).join(" ");
  assert.ok(uzun.length > UZUN_PARAGRAF);
  const parcalar = paragrafiBol(uzun);
  assert.ok(parcalar.length >= 2, "en az iki parça");
  assert.equal(birlestir(parcalar), uzun);
  for (const p of parcalar) assert.ok(p.endsWith("."), `parça cümle ortasında bitmiş: ${p}`);
});

test("Kısaltmalar ve sayılar bölünmez", () => {
  const c = cumlelereAyir("Hz. Ömer böyle dedi. Peygamberimiz s.a.v. Medine'deydi. Bakara 2. ayet. Sonra döndü.");
  assert.deepEqual(c, ["Hz. Ömer böyle dedi.", "Peygamberimiz s.a.v. Medine'deydi.", "Bakara 2. ayet.", "Sonra döndü."]);
});

test("Tırnak, parantez ve vurgu içindeki nokta bölünmez", () => {
  const c = cumlelereAyir('Şöyle buyrulur: "Sabret. Allah sabredenlerle beraberdir." Bu bir müjdedir. (Bakara. 153) Devam.');
  assert.equal(c[0], 'Şöyle buyrulur: "Sabret. Allah sabredenlerle beraberdir."');
  assert.ok(c.includes("(Bakara. 153) Devam."));
  const v = cumlelereAyir("*Rabbim. Kolaylaştır.* Böyle dua et. Sonra dinlen.");
  assert.equal(v[0], "*Rabbim. Kolaylaştır.* Böyle dua et.");
});

test("Küçük harfle devam eden yerde bölmez", () => {
  assert.equal(cumlelereAyir("Bu böyle. ama şöyle de olur.").length, 1);
});

test("Dengesiz yıldız bütün bölmeyi durdurmaz", () => {
  const c = cumlelereAyir("Not * işareti tek. İkinci cümle. Üçüncü cümle.");
  assert.equal(c.length, 3);
});

test("Madde işaretli ve numaralı satırlar listeye döner", () => {
  const b = metniBloklaraAyir(
    "Şunları dene:\n- Abdest al\n- İki rekat kıl\n\n1. İstiğfar\n2) Salavat\n*Vurgu* ile başlayan satır."
  );
  assert.equal(b[0].tur, "paragraf");
  assert.deepEqual(b[1], { tur: "liste", sirali: false, maddeler: ["Abdest al", "İki rekat kıl"] });
  assert.deepEqual(b[2], { tur: "liste", sirali: true, maddeler: ["İstiğfar", "Salavat"] });
  assert.deepEqual(b[3], { tur: "paragraf", metin: "*Vurgu* ile başlayan satır." });
});

test("Boş ve tanımsız girdi güvenli", () => {
  assert.deepEqual(metniBloklaraAyir(""), []);
  assert.deepEqual(metniBloklaraAyir(undefined as unknown as string), []);
  assert.deepEqual(metniBloklaraAyir("\r\n\r\n"), []);
});
