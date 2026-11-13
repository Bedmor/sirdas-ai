import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DUA_EN_UZUN,
  DUA_GUNLUK_SINIR,
  DUA_SURE_MS,
  GIZLENDI,
  duaMetniniDenetle,
  duaMetniniMaskele,
} from "../../src/lib/dua-havuzu/kurallar";
import { BellekDuaDeposu } from "../../src/lib/dua-havuzu/depo";
import {
  allahYardimcinOlsun,
  duaHavuzunuGetir,
  duaIstegiBirak,
  duaIsteginiKaldir,
  kimlikOzetiCikar,
  suresiGecenDualariTemizle,
} from "../../src/lib/dua-havuzu/servis";
import { bellekKullanilsinMi } from "../../src/lib/dua-havuzu/depo-secimi";

const BASLANGIC = new Date("2026-11-13T09:00:00.000Z");
const saatSonra = (s: number) => new Date(BASLANGIC.getTime() + s * 60 * 60 * 1000);
const A = kimlikOzetiCikar("cihaz-a-1234");
const B = kimlikOzetiCikar("cihaz-b-5678");
const C = kimlikOzetiCikar("cihaz-c-9012");

function kabul(metin: string) {
  const s = duaMetniniDenetle(metin);
  assert.equal(s.tamam, true, `kabul edilmeliydi: ${metin} -> ${JSON.stringify(s)}`);
  return s as { tamam: true; metin: string; gizlendi: boolean };
}

function reddet(metin: string, sebep: string) {
  const s = duaMetniniDenetle(metin);
  assert.equal(s.tamam, false, `reddedilmeliydi: ${metin}`);
  assert.equal((s as { sebep: string }).sebep, sebep, `sebep: ${metin}`);
  return s as { tamam: false; sebep: string; mesaj: string; notice?: { kind: string; hotlines: { number: string }[] } };
}

// ---------------------------------------------------------------------------
// Gizleme (maskeleme)
// ---------------------------------------------------------------------------

test("dua havuzu: telefon, TC, e-posta ve IBAN yayımlanmadan gizlenir", () => {
  const s = kabul("Annem için şifa duası istiyorum, beni 0532 123 45 67 numarasından arayın, mail ali.veli@ornek.com");
  assert.ok(!s.metin.includes("0532"));
  assert.ok(!s.metin.includes("ornek.com"));
  assert.ok(s.metin.includes(GIZLENDI));
  assert.equal(s.gizlendi, true);

  const tc = duaMetniniMaskele("TC kimlik numaram 10000000146 olan babam için dua edin");
  assert.ok(!tc.metin.includes("10000000146"));
});

test("dua havuzu: isim, akraba adı ve sosyal medya adı gizlenir", () => {
  const s = kabul("Kızım Zeynep'in sınavı için dua eder misiniz, instagramda @zeynep.yilmaz34");
  assert.ok(!s.metin.includes("Zeynep"));
  assert.ok(!s.metin.includes("@zeynep"));

  const m = duaMetniniMaskele("Benim adım Mehmet, kardeşim Ahmet Yılmaz hastanede yatıyor.");
  assert.ok(!m.metin.includes("Mehmet"));
  assert.ok(!m.metin.includes("Ahmet"));
  assert.ok(!m.metin.includes("Yılmaz"));

  const cumleBasi = duaMetniniMaskele("Ayşe'nin ameliyatı yarın, Rabbim kolaylık versin.");
  assert.ok(!cumleBasi.metin.includes("Ayşe"));
});

test("dua havuzu: Allah, Rabbim, Hz. ve dini kelimeler gizlenmez", () => {
  const m = duaMetniniMaskele("Allah'ım, Peygamber Efendimiz hürmetine annemin Kâbe'yi görmesini nasip et. Hz. Ali gibi sabırlı olalım. Âmin.");
  assert.equal(m.gizlendi, false, m.metin);
  assert.ok(m.metin.includes("Allah'ım"));
  assert.ok(m.metin.includes("Kâbe'yi"));
  assert.ok(m.metin.includes("Hz. Ali"));
});

test("dua havuzu: kişisel bilgi içermeyen metin aynen kalır", () => {
  const metin = "Babam yarın ameliyata girecek, şifa bulması için dua eder misiniz?";
  const s = kabul(metin);
  assert.equal(s.metin, metin);
  assert.equal(s.gizlendi, false);
});

// ---------------------------------------------------------------------------
// Süzgeç ve sınırlar
// ---------------------------------------------------------------------------

test("dua havuzu: kriz işareti olan istek havuza düşmez, 112/183 yönlendirmesi döner", async () => {
  const r = reddet("Artık yaşamak istemiyorum, intihar etmeyi düşünüyorum", "KRIZ");
  assert.equal(r.notice?.kind, "crisis");
  const hatlar = r.notice!.hotlines.map((h) => h.number);
  assert.ok(hatlar.includes("112") && hatlar.includes("183"));

  const depo = new BellekDuaDeposu();
  const s = await duaIstegiBirak(depo, { kimlikOzeti: A, metin: "Kendimi öldürmek istiyorum, dua edin", simdi: BASLANGIC });
  assert.equal(s.tamam, false);
  assert.equal((await duaHavuzunuGetir(depo, { kimlikOzeti: B, simdi: BASLANGIC })).istekler.length, 0);
});

test("dua havuzu: çocuk ve fetva süzgeci de uygulanır", () => {
  assert.equal(reddet("Ben 9 yaşındayım, annem için dua eder misiniz", "COCUK").notice?.kind, "child");
  reddet("Faizli kredi çekmek caiz mi, hükmü nedir söyler misiniz", "FETVA");
});

test("dua havuzu: hastalık için şifa duası kabul edilir", () => {
  kabul("Annem kanser tedavisi görüyor, şifa bulması için dua eder misiniz");
});

test("dua havuzu: küfür, hakaret ve beddua reddedilir; masum kelimeler geçer", () => {
  reddet("Komşum şerefsiz adam, onun için dua edin", "KUFUR");
  reddet("Siktir git diyen patronum için dua", "KUFUR");
  reddet("Bana zulmeden adamın Allah belasını versin", "BEDDUA");
  kabul("Sık sık sıkıntı çekiyorum, gönlüm ferahlasın diye dua edin");
  kabul("Sik sik sikinti cekiyorum, gonlum ferahlasin diye dua edin");
  kabul("Götürdüğüm emanetler sahibine ulaşsın, yolculuğum hayırlı olsun");
});

test("dua havuzu: bağlantı ve reklam reddedilir", () => {
  reddet("Dua edin ve sitemize bakın https://ornek.com", "BAGLANTI");
  reddet("www.firsatlar.net için dua", "BAGLANTI");
  reddet("Dükkanımızda büyük indirim var, takip edin bereket olsun", "REKLAM");
});

test("dua havuzu: boş, çok kısa ve 300 harften uzun metin reddedilir", () => {
  reddet("   ", "BOS");
  reddet("dua et", "KISA");
  reddet("a".repeat(DUA_EN_UZUN + 1), "UZUN");
  kabul("Rabbim hepimize hayırlı kapılar açsın. " + "Ailemize huzur versin. ".repeat(5));
});

test("dua havuzu: günlük sınır ve aynı metnin tekrarı", async () => {
  const depo = new BellekDuaDeposu();
  for (let i = 0; i < DUA_GUNLUK_SINIR; i++) {
    const s = await duaIstegiBirak(depo, { kimlikOzeti: A, metin: `Hayırlı bir iş bulmam için dua eder misiniz ${["bir", "iki", "üç", "dört"][i]}`, simdi: saatSonra(i) });
    assert.equal(s.tamam, true);
  }
  const tekrar = await duaIstegiBirak(depo, { kimlikOzeti: A, metin: "Hayırlı bir iş bulmam için dua eder misiniz bir", simdi: saatSonra(4) });
  assert.equal((tekrar as { sebep: string }).sebep, "TEKRAR");
  const fazla = await duaIstegiBirak(depo, { kimlikOzeti: A, metin: "Evimize huzur ve bereket gelsin diye dua edin", simdi: saatSonra(4) });
  assert.equal((fazla as { sebep: string }).sebep, "GUNLUK_SINIR");
  // Başka cihaz etkilenmez
  assert.equal((await duaIstegiBirak(depo, { kimlikOzeti: B, metin: "Evimize huzur ve bereket gelsin diye dua edin", simdi: saatSonra(4) })).tamam, true);
  // 24 saat dolunca yeniden bırakılabilir
  assert.equal((await duaIstegiBirak(depo, { kimlikOzeti: A, metin: "Evimize huzur ve bereket gelsin diye dua edin", simdi: saatSonra(25) })).tamam, true);
});

// ---------------------------------------------------------------------------
// Tek basış, sayaç, istek sahibi görünümü
// ---------------------------------------------------------------------------

test("dua havuzu: aynı cihaz bir isteğe yalnız bir kez basar, sayaç doğru artar", async () => {
  const depo = new BellekDuaDeposu();
  const s = await duaIstegiBirak(depo, { kimlikOzeti: A, metin: "Oğlumun askerliği hayırla bitsin diye dua edin", simdi: BASLANGIC });
  assert.equal(s.tamam, true);
  const id = (s as { istek: { id: string } }).istek.id;

  assert.deepEqual(await allahYardimcinOlsun(depo, { kimlikOzeti: B, duaId: id, simdi: saatSonra(1) }), { durum: "eklendi", sayac: 1 });
  assert.deepEqual(await allahYardimcinOlsun(depo, { kimlikOzeti: B, duaId: id, simdi: saatSonra(2) }), { durum: "zaten", sayac: 1 });
  assert.deepEqual(await allahYardimcinOlsun(depo, { kimlikOzeti: C, duaId: id, simdi: saatSonra(2) }), { durum: "eklendi", sayac: 2 });
  // İstek sahibi kendi isteğine basamaz (sayacı şişirmesin)
  assert.deepEqual(await allahYardimcinOlsun(depo, { kimlikOzeti: A, duaId: id, simdi: saatSonra(2) }), { durum: "kendi" });
  assert.deepEqual(await allahYardimcinOlsun(depo, { kimlikOzeti: C, duaId: "olmayan-kimlik-1", simdi: saatSonra(2) }), { durum: "bulunamadi" });

  const bGorunum = await duaHavuzunuGetir(depo, { kimlikOzeti: B, simdi: saatSonra(3) });
  assert.equal(bGorunum.istekler[0].sayac, 2);
  assert.equal(bGorunum.istekler[0].dedim, true);
  assert.equal(bGorunum.istekler[0].benim, false);
  assert.equal(bGorunum.benimkiler.length, 0);
});

test("dua havuzu: istek sahibi kendi isteğine kaç kişinin dua ettiğini görür", async () => {
  const depo = new BellekDuaDeposu();
  const s = await duaIstegiBirak(depo, { kimlikOzeti: A, metin: "Borçlarımdan kurtulmam için dua eder misiniz", simdi: BASLANGIC });
  const id = (s as { istek: { id: string } }).istek.id;
  await allahYardimcinOlsun(depo, { kimlikOzeti: B, duaId: id, simdi: saatSonra(1) });
  await allahYardimcinOlsun(depo, { kimlikOzeti: C, duaId: id, simdi: saatSonra(1) });

  const aGorunum = await duaHavuzunuGetir(depo, { kimlikOzeti: A, simdi: saatSonra(2) });
  assert.equal(aGorunum.benimkiler.length, 1);
  assert.equal(aGorunum.benimkiler[0].sayac, 2);
  assert.equal(aGorunum.benimkiler[0].benim, true);
  // Kendi isteği genel listede tekrar görünmez
  assert.equal(aGorunum.istekler.length, 0);
  // Yazanın kimliği hiçbir görünümde yer almaz
  assert.ok(!JSON.stringify(aGorunum).includes(A));
});

test("dua havuzu: istek sahibi kendi isteğini kaldırabilir, başkası kaldıramaz", async () => {
  const depo = new BellekDuaDeposu();
  const s = await duaIstegiBirak(depo, { kimlikOzeti: A, metin: "Eşimle aramız düzelsin diye dua edin", simdi: BASLANGIC });
  const id = (s as { istek: { id: string } }).istek.id;
  assert.equal(await duaIsteginiKaldir(depo, { kimlikOzeti: B, duaId: id }), false);
  assert.equal(await duaIsteginiKaldir(depo, { kimlikOzeti: A, duaId: id }), true);
  assert.equal((await duaHavuzunuGetir(depo, { kimlikOzeti: B, simdi: BASLANGIC })).istekler.length, 0);
});

// ---------------------------------------------------------------------------
// 3 gün süresi
// ---------------------------------------------------------------------------

test("dua havuzu: istek 3 gün sonra listeden düşer ve basılamaz", async () => {
  const depo = new BellekDuaDeposu();
  const s = await duaIstegiBirak(depo, { kimlikOzeti: A, metin: "Yolculuğumuz hayırlı geçsin diye dua edin", simdi: BASLANGIC });
  const istek = (s as { istek: { id: string; bitis: string } }).istek;
  assert.equal(new Date(istek.bitis).getTime() - BASLANGIC.getTime(), DUA_SURE_MS);
  assert.equal(DUA_SURE_MS, 3 * 24 * 60 * 60 * 1000);

  assert.equal((await duaHavuzunuGetir(depo, { kimlikOzeti: B, simdi: saatSonra(71) })).istekler.length, 1);
  assert.equal((await duaHavuzunuGetir(depo, { kimlikOzeti: B, simdi: saatSonra(72) })).istekler.length, 0);
  assert.equal((await duaHavuzunuGetir(depo, { kimlikOzeti: A, simdi: saatSonra(73) })).benimkiler.length, 0);
  assert.deepEqual(await allahYardimcinOlsun(depo, { kimlikOzeti: B, duaId: istek.id, simdi: saatSonra(73) }), { durum: "bulunamadi" });
});

test("dua havuzu: süresi geçenleri temizleme yalnız süresi dolanları siler", async () => {
  const depo = new BellekDuaDeposu();
  await duaIstegiBirak(depo, { kimlikOzeti: A, metin: "Eski istek, hayırlı haber alalım diye dua", simdi: BASLANGIC });
  await duaIstegiBirak(depo, { kimlikOzeti: B, metin: "Yeni istek, sınavımı kazanayım diye dua", simdi: saatSonra(48) });
  assert.equal(await suresiGecenDualariTemizle(depo, saatSonra(73)), 1);
  const kalan = await duaHavuzunuGetir(depo, { kimlikOzeti: C, simdi: saatSonra(73) });
  assert.equal(kalan.istekler.length, 1);
  assert.ok(kalan.istekler[0].metin.startsWith("Yeni istek"));
});

test("dua havuzu: kimlik özeti tek yönlüdür, kimliğin kendisi saklanmaz", () => {
  const ozet = kimlikOzetiCikar("cihaz-a-1234");
  assert.match(ozet, /^[0-9a-f]{64}$/);
  assert.ok(!ozet.includes("cihaz"));
  assert.equal(ozet, kimlikOzetiCikar("cihaz-a-1234"));
  assert.notEqual(ozet, kimlikOzetiCikar("cihaz-a-1235"));
});

test("dua havuzu: veri tabanı adresi yoksa bellek deposu seçilir", () => {
  const onceki = { url: process.env.DATABASE_URL, depo: process.env.DUA_HAVUZU_DEPO };
  try {
    delete process.env.DATABASE_URL;
    delete process.env.DUA_HAVUZU_DEPO;
    assert.equal(bellekKullanilsinMi(), true);
    process.env.DATABASE_URL = "postgresql://ornek";
    assert.equal(bellekKullanilsinMi(), false);
    process.env.DUA_HAVUZU_DEPO = "bellek";
    assert.equal(bellekKullanilsinMi(), true);
  } finally {
    if (onceki.url === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = onceki.url;
    if (onceki.depo === undefined) delete process.env.DUA_HAVUZU_DEPO;
    else process.env.DUA_HAVUZU_DEPO = onceki.depo;
  }
});
