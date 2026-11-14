import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALIM_ESERI_ETIKETI,
  KAYNAK_ATIF_BOLUMU,
  YANLIS_ATIFLAR,
  alimEseriKaynagiMi,
  nebeviGirisMi,
  yanlisAtifBul,
} from "../../src/lib/uslup/kaynak-atif";
import { CikisSuzgeci, cikisSuzgeciUygula } from "../../src/lib/gizlilik/cikis-suzgeci";
import {
  SIRDAS_ILIM_VE_SIYER_INSTRUCTION,
  SIRDAS_MANEVI_AYNA_INSTRUCTION,
  SIRDAS_SAFETY_PRIORITY_RULES,
} from "../../src/lib/ai/constitution";
import { formatRagContext } from "../../src/lib/ai/gemini-client";

const OMER = YANLIS_ATIFLAR.find((k) => k.kod === "HESABA_CEKIN_HZ_OMER")!;

// --- İstem kuralı --------------------------------------------------------------

test("atıf bölümü her iki modda var ve güvenlik sırasından önce gelir", () => {
  for (const talimat of [SIRDAS_MANEVI_AYNA_INSTRUCTION, SIRDAS_ILIM_VE_SIYER_INSTRUCTION]) {
    const i = talimat.indexOf(KAYNAK_ATIF_BOLUMU);
    const g = talimat.indexOf(SIRDAS_SAFETY_PRIORITY_RULES);
    assert.ok(i > 0, "atıf bölümü eksik");
    assert.ok(g > i, "güvenlik öncelik sırası sonda kalmalı");
  }
});

test("atıf bölümü listedeki her sözü, hükmünü ve dayanağını içerir", () => {
  assert.match(KAYNAK_ATIF_BOLUMU, /büyüklerimizin güzel bir sözü/);
  assert.match(KAYNAK_ATIF_BOLUMU, /uydurma/);
  for (const k of YANLIS_ATIFLAR) {
    assert.ok(KAYNAK_ATIF_BOLUMU.includes(k.soz.replace(/\.$/, "")), k.kod);
    assert.ok(KAYNAK_ATIF_BOLUMU.includes(k.dayanak), k.kod);
  }
  assert.match(KAYNAK_ATIF_BOLUMU, /Hz\. Ömer/);
  assert.ok(!/[—–]/.test(KAYNAK_ATIF_BOLUMU), "uzun tire");
});

// --- Kaynak bağlamı etiketi ----------------------------------------------------

test("İhyâ ve akaid kayıtları kaynak bağlamında hadis değil diye etiketlenir", () => {
  const ihya = {
    id: "ihya_005",
    sourceType: "HADITH",
    sourceTitle: "İmam Gazalî - İhyâ: Kitâbu'l-Murâkabe ve'l-Muhâsebe",
    content: 'Ahlak ve Kalp Ameli: "Hesaba çekilmeden önce kendi nefsinizi hesaba çekiniz."',
  };
  const hadis = {
    id: "hadis_093",
    sourceType: "HADITH",
    sourceTitle: "Sünen-i Tirmizî (Kitâbu Sıfati'l-Kıyâme) - Bab 25",
    content: 'Resûlullah (s.a.v.) buyurdu: "Akıllı kimse nefsini hesaba çekendir."',
  };
  const akaid = {
    id: "akaid_1",
    sourceType: "HADITH",
    sourceTitle: "el-Fıkhü'l-Ekber: Tevhid",
    content: 'İtikad Esası: "Allah birdir."',
  };
  assert.equal(alimEseriKaynagiMi(ihya), true);
  assert.equal(alimEseriKaynagiMi(akaid), true);
  assert.equal(alimEseriKaynagiMi(hadis), false);
  assert.equal(alimEseriKaynagiMi({ ...ihya, sourceType: "QURAN" }), false);

  const baglam = formatRagContext([ihya, hadis]);
  assert.ok(baglam.includes(`[KAYNAK 1 | ${ALIM_ESERI_ETIKETI} | İmam Gazalî`));
  assert.ok(baglam.includes("[KAYNAK 2 | HADITH | Sünen-i Tirmizî"));
});

// --- Yanlış atıf tespiti -------------------------------------------------------

test("canlıdaki olay: Hz. Ömer sözü Peygamberimiz'e atfedilince yakalanır", () => {
  for (const cumle of [
    'Peygamber Efendimiz (s.a.v.) *"Hesaba çekilmeden önce kendinizi hesaba çekin"* buyurmuştur.',
    'Nebevi bir öğüt olarak "Hesaba çekilmeden evvel nefsinizi hesaba çekiniz" sözü kalbimize ışık tutar.',
    'Hadis-i şerifte _"Hesaba çekilmeden önce kendi nefsinizi hesaba çekin."_ buyrulur.',
    'Resulullah\'ın "hesaba çekilmeden önce kendinizi hesaba çekin" tavsiyesi ne güzeldir.',
  ]) {
    assert.equal(yanlisAtifBul(cumle)?.kod, "HESABA_CEKIN_HZ_OMER", cumle);
  }
});

test("diğer listedeki sözler nebevi atıfla geçince yakalanır", () => {
  const ornekler: Array<[string, string]> = [
    ['Peygamberimiz "Beşikten mezara kadar ilim öğreniniz" buyurmuştur.', "BESIKTEN_MEZARA_ILIM"],
    ['Efendimiz\'in "İlim Çin\'de de olsa arayınız" hadisi bize yol gösterir.', "ILIM_CINDE_DE_OLSA"],
    ['Hadis-i şerifte "Vatan sevgisi imandandır" buyrulur.', "VATAN_SEVGISI_IMANDANDIR"],
    ['Resûlullah "Hubbü\'l-vatan mine\'l-iman" buyurmuştur.', "VATAN_SEVGISI_IMANDANDIR"],
  ];
  for (const [cumle, kod] of ornekler) {
    assert.equal(yanlisAtifBul(cumle)?.kod, kod, cumle);
  }
});

test("doğru atıf, düzeltme cümlesi veya atıfsız kullanım dokunulmadan kalır", () => {
  for (const cumle of [
    'Hz. Ömer (r.a.) "Hesaba çekilmeden önce kendinizi hesaba çekin" buyurmuştur.',
    "Hz. Ömer'e nispet edilen bir söz vardır: hesaba çekilmeden önce kendinizi hesaba çekin.",
    '"Vatan sevgisi imandandır" sözü hadis olarak sabit değildir.',
    '"İlim Çin\'de de olsa arayınız" rivayeti zayıf kabul edilir.',
    'Halk arasında hadis diye bilinen "Beşikten mezara kadar ilim öğreniniz" sözü güzel bir öğüttür.',
    "Büyüklerimizin dediği gibi, hesaba çekilmeden önce kendimizi hesaba çekmeliyiz.",
    "Hesaba çekilmeden önce kendinizi hesaba çekin; bu söz her akşam muhasebe yapmaya davettir.",
    'Peygamberimiz "Akıllı kimse nefsini hesaba çekendir" buyurmuştur.',
  ]) {
    assert.equal(yanlisAtifBul(cumle), null, cumle);
  }
});

test("önceki cümle nebevi alıntı girişiyse sonraki cümledeki söz de yakalanır", () => {
  assert.equal(nebeviGirisMi("Peygamber Efendimiz (s.a.v.) şöyle buyurur:"), true);
  assert.equal(nebeviGirisMi("Resulullah buyuruyor ki:"), true);
  assert.equal(nebeviGirisMi("Bugün biraz dinlenmelisin."), false);
  assert.equal(yanlisAtifBul('_"Hesaba çekilmeden önce kendinizi hesaba çekin."_', true)?.kod, OMER.kod);
  assert.equal(yanlisAtifBul('_"Hesaba çekilmeden önce kendinizi hesaba çekin."_', false), null);
});

// --- Çıkış süzgeci (akış ve tek parça) -----------------------------------------

test("tek parça cevapta yanlış atıflı cümle doğru atıfla değiştirilir ve olay kaydı düşer", () => {
  const cevap =
    "Kardeşim, gün sonunda kendine dönmek kıymetlidir. " +
    'Peygamber Efendimiz (s.a.v.) *"Hesaba çekilmeden önce kendinizi hesaba çekin"* buyurmuştur. ' +
    "Her akşam kısa bir muhasebe yapabilirsin.";
  const r = cikisSuzgeciUygula(cevap);
  assert.ok(r.metin.includes("Hz. Ömer'e (r.a.) nispet edilen"));
  assert.ok(!/Efendimiz \(s\.a\.v\.\) \*"Hesaba/.test(r.metin));
  assert.ok(r.metin.startsWith("Kardeşim, gün sonunda kendine dönmek kıymetlidir."));
  assert.ok(r.metin.endsWith("Her akşam kısa bir muhasebe yapabilirsin."));
  const olay = r.olaylar.find((o) => o.kuralKodu === "CIKIS_YANLIS_ATIF");
  assert.deepEqual(olay, { kuralKodu: "CIKIS_YANLIS_ATIF", eylem: "DEGISTIRILDI", adet: 1 });
});

test("akışta parça parça gelen yanlış atıf ekrana hiç düşmez", () => {
  const s = new CikisSuzgeci();
  const parcalar = [
    "Nefsini sorgulamak güzel bir adımdır.\n\n",
    "Peygamber Efendimiz (s.a.v.) şöyle buyurur:\n\n",
    '_"Hesaba çekilmeden önce ',
    'kendinizi hesaba çekin."_\n\n',
    "Rabbim kolaylık versin.",
  ];
  let gonderilen = "";
  for (const p of parcalar) gonderilen += s.ekle(p);
  gonderilen += s.bitir();
  assert.equal(gonderilen, s.metin);
  assert.ok(gonderilen.includes("Bu söz hadis değildir; Hz. Ömer'e (r.a.) nispet edilen bir söz olarak bilinir."));
  assert.equal((gonderilen.match(/Hesaba çekilmeden önce kendinizi hesaba çekin/g) || []).length, 1);
  assert.ok(gonderilen.endsWith("Rabbim kolaylık versin."));
  assert.ok(s.tetiklenenler.some((o) => o.kuralKodu === "CIKIS_YANLIS_ATIF"));
  // Yedek cevaba düşmez
  assert.ok(!s.tetiklenenler.some((o) => o.kuralKodu === "CIKIS_YEDEK_CEVAP"));
});

test("sahih hadis ve doğru atıflı cevap süzgeçten değişmeden geçer", () => {
  const cevap =
    'Peygamber Efendimiz (s.a.v.) *"Gerçek pehlivan, öfkelendiğinde nefsine hâkim olandır"* buyurmuştur (Buhârî, Edeb 76). ' +
    'Hz. Ömer (r.a.) de *"Hesaba çekilmeden önce kendinizi hesaba çekin"* der.';
  const r = cikisSuzgeciUygula(cevap);
  assert.equal(r.metin, cevap);
  assert.equal(r.degisti, false);
});

test("düzeltme metinleri yeniden süzülünce yine yanlış atıf sayılmaz", () => {
  for (const k of YANLIS_ATIFLAR) {
    const r = cikisSuzgeciUygula(k.yerine);
    assert.ok(!r.olaylar.some((o) => o.kuralKodu === "CIKIS_YANLIS_ATIF"), k.kod);
    assert.ok(!/[—–]/.test(k.yerine), `${k.kod}: uzun tire`);
  }
});
