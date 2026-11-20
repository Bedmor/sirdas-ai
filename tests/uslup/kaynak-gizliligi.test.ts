import { test } from "node:test";
import assert from "node:assert/strict";
import {
  KAYNAK_GIZLILIGI_BOLUMU,
  KAYNAK_SORUSU_CEVABI,
  TUZAK_SORU_CEVABI,
  kaynakMetniniTemizle,
} from "../../src/lib/uslup/kaynak-gizliligi";
import { cikisSuzgeciUygula, CikisSuzgeci } from "../../src/lib/gizlilik/cikis-suzgeci";
import { SIRDAS_ILIM_VE_SIYER_INSTRUCTION, SIRDAS_MANEVI_AYNA_INSTRUCTION } from "../../src/lib/ai/constitution";
import { formatRagContext } from "../../src/lib/ai/gemini-client";
import { ALIM_GORUSU_BOLUMU } from "../../src/lib/uslup/alim-gorusu";

test("kaynak gizliliği: bölüm her iki modun talimatında, kalıp cümleler yazılı", () => {
  assert.ok(SIRDAS_MANEVI_AYNA_INSTRUCTION.includes(KAYNAK_GIZLILIGI_BOLUMU));
  assert.ok(SIRDAS_ILIM_VE_SIYER_INSTRUCTION.includes(KAYNAK_GIZLILIGI_BOLUMU));
  assert.ok(KAYNAK_GIZLILIGI_BOLUMU.includes(KAYNAK_SORUSU_CEVABI));
  assert.ok(KAYNAK_GIZLILIGI_BOLUMU.includes(TUZAK_SORU_CEVABI));
  assert.match(KAYNAK_GIZLILIGI_BOLUMU, /KİŞİLER HAKKINDA KONUŞMA/);
  assert.match(KAYNAK_GIZLILIGI_BOLUMU, /BİLGİ KAYNAĞI DÜRÜSTLÜĞÜ/);
  // Âlim görüşü kuralı artık "bazı hocalarımız" diye kişiye atıf önermez.
  assert.ok(!ALIM_GORUSU_BOLUMU.includes("bazı hocalarımız şöyle buyurur"));
});

test("kaynak gizliliği: canlıdaki gerçek cevap cümleleri ekrana düşmez (19.11 Adnan Bey dosyası)", () => {
  const cevap = [
    "Evet kardeşim, Halis Aydemir hocayı bilirim; kendisi mühendislik kökeniyle analitik düşünceye aşina bir ilim insanıdır.",
    "Akıl idrak etmekle mükelleftir ama mutlak hüküm sahibi yalnız Cenâb-ı Hak'tır.",
    "Halis hocanın hangi tahlili senin zihninde bu kapıyı araladı?",
    "Halis Aydemir hoca gibi ilim erbabına dair malumatım şahsi bir tanışıklıktan gelmiyor.",
    "Benim istifade ettiğim zemin; Halis hocanın kamuya açık makaleleri ve ders kayıtlarının metin dökümleridir.",
  ].join(" ");
  const r = cikisSuzgeciUygula(cevap);
  assert.ok(!/halis\s+(aydemir|hoca)/i.test(r.metin), r.metin);
  assert.ok(!/aydemir/i.test(r.metin), r.metin);
  assert.ok(r.metin.includes("mutlak hüküm sahibi"), "ilgisiz cümle korunur");
  const olay = r.olaylar.find((o) => o.kuralKodu === "CIKIS_KAYNAK_SAHIS");
  assert.equal(olay?.adet, 4);
});

test("kaynak gizliliği: akışta parça parça gelse de isim sızmaz", () => {
  const s = new CikisSuzgeci();
  let cikti = "";
  for (const p of ["Bu konuda Ha", "lis Ay", "demir hocanın görüşü şöyledir. ", "Rabbim kalbine ferahlık versin. "]) {
    cikti += s.ekle(p);
  }
  cikti += s.bitir();
  assert.ok(!/aydemir/i.test(cikti), cikti);
  assert.ok(cikti.includes("Rabbim kalbine ferahlık versin."));
});

test("kaynak gizliliği: 'halis niyet', 'dini Allah'a halis kılarak' gibi gündelik kullanım süzülmez", () => {
  for (const c of [
    "Niyetini halis tut kardeşim.",
    "De ki: Dini Allah'a halis kılarak O'na kulluk etmekle emrolundum.",
    "Halis bir kalple dua et.",
  ]) {
    const r = cikisSuzgeciUygula(c);
    assert.equal(r.metin, c);
    assert.equal(r.olaylar.length, 0, c);
  }
});

test("kaynak gizliliği: modele giden hoca kaydı isimden ve ders dilinden temizlenir", () => {
  const ham =
    "Arkadaşlar, geçen hafta derste konuşmuştuk. Prof. Dr. Halis Aydemir Sahîh-i Buhârî Dersleri 80. Ders kaydında tevekkülü anlatır. Drive'daki ders kayıtlarında da geçer. Tevekkül, sebebe sarılıp sonucu Allah'a bırakmaktır.";
  const temiz = kaynakMetniniTemizle(ham);
  assert.ok(!/halis|aydemir|drive|arkadaşlar|geçen hafta/i.test(temiz), temiz);
  assert.ok(temiz.includes("Tevekkül, sebebe sarılıp sonucu Allah'a bırakmaktır."));

  const baglam = formatRagContext([
    { sourceType: "HALIS_AYDEMIR", sourceTitle: "Dr. Halis Aydemir - Tevekkül", content: ham } as never,
  ]);
  assert.ok(!/halis|aydemir/i.test(baglam), baglam);
});

test("kaynak gizliliği: ayet ve hadis kaynağı temizlenmez", () => {
  const baglam = formatRagContext([
    { sourceType: "QURAN", sourceTitle: "Zümer 2", content: "Dini Allah'a halis kılarak O'na kulluk et." } as never,
  ]);
  assert.ok(baglam.includes("Dini Allah'a halis kılarak O'na kulluk et."));
});
