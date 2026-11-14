import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeIncomingUserMessage } from "../../src/lib/ai/pii-anonymizer";

// Hata (14.11): sıradan Türkçe kelimeler ("yarın", "okulda", "bugün"...) özel isim
// veya konum sanılıp modele giden metinden siliniyordu. Kişisel veri olmayan cümle
// birebir aynı kalmalı; gerçek kişisel veri maskelenmeye devam etmeli.

function temizle(metin: string) {
  return sanitizeIncomingUserMessage(metin);
}

function degismemeli(metin: string) {
  const r = temizle(metin);
  assert.equal(r.sanitizedText, metin);
  assert.equal(r.redactedEntitiesCount, 0);
  assert.deepEqual(r.redactedCategories, []);
}

test("pii: sıradan cümleler değişmeden geçer", () => {
  for (const metin of [
    "Yarın okulda sınavım var, çok stresliyim",
    "Bugün evde annemle kavga ettim",
    "Akşam işte patronum bağırdı",
    "Çok yalnızım ve gece uyuyamıyorum",
    "Sabah namazına kalkamıyorum",
  ]) {
    degismemeli(metin);
  }
});

test("pii: yakınlık kelimesinden sonra gelen sıradan kelime isim sanılmaz", () => {
  for (const metin of [
    "Kardeşim yarın gelecek, çok heyecanlıyım",
    "Arkadaşım okulda bana güldü",
    "Annem bugün çok yorgun",
    "Eşim akşam geç geldi",
    "Oğlum ders çalışmıyor",
    "babam hasta, adı geçen doktora gittik",
    "ismi bile aklımda değil",
  ]) {
    degismemeli(metin);
  }
});

test("pii: büyük harfle başlayan sıradan kelimeyle başlayan cümle değişmez", () => {
  degismemeli("Okulda herkes bana kötü davranıyor");
  degismemeli("Ordu'da büyüdüm ama ordudan döndükten sonra her şey değişti");
  degismemeli("Kartal gibi özgür olmak istiyorum");
  degismemeli("Kars gibi soğuk bir yerde yaşamak zor");
});

test("pii: tek başına il adı kişisel veri değildir, korunur", () => {
  degismemeli("İstanbul'da yaşıyorum");
  degismemeli("Kızım İzmir'e gitti, özledim");
});

test("pii: telefon maskelenir", () => {
  const r = temizle("Telefonum 0532 123 45 67, arar mısınız?");
  assert.equal(r.sanitizedText, "Telefonum [TELEFON], arar mısınız?");
  assert.ok(r.hasDirectPii);
  assert.ok(r.redactedCategories.includes("TELEFON"));
});

test("pii: e-posta maskelenir", () => {
  const r = temizle("Mailim ornek.kisi@example.com, yazabilirsiniz");
  assert.equal(r.sanitizedText, "Mailim [EPOSTA], yazabilirsiniz");
  assert.ok(r.redactedCategories.includes("EPOSTA"));
});

test("pii: 11 haneli TC kimlik numarası maskelenir", () => {
  const r = temizle("TC numaram 10000000146 lütfen kaydedin");
  assert.equal(r.sanitizedText, "TC numaram [TC_NO] lütfen kaydedin");
  assert.ok(r.redactedCategories.includes("TCKN"));
});

test("pii: IBAN maskelenir", () => {
  const r = temizle("IBAN'ım TR12 0006 1005 1112 3456 7890 12 bu hesaba");
  assert.ok(r.sanitizedText.includes("[IBAN]"));
  assert.ok(!r.sanitizedText.includes("0006 1005"));
  assert.ok(r.sanitizedText.endsWith("bu hesaba"));
});

test("pii: açık adres maskelenir, cümlenin kalanı korunur", () => {
  const r = temizle("Adresim Atatürk Mahallesi Gül Sokak No: 5 Kat 2, gelir misiniz?");
  assert.equal(r.sanitizedText, "Adresim [ADRES], gelir misiniz?");
  assert.ok(r.redactedCategories.includes("ADRES"));
});

test("pii: kendini tanıtma cümlesinde geri kalan kelimeler silinmez", () => {
  // Modül kullanıcının kendi adını maskelemez (hitap için kullanılır); cümle bozulmamalı.
  degismemeli("Benim adım Ahmet Yılmaz, yarın okulda sınavım var");
});

test("pii: yakının adı kaldırılır, ek doğru taşınır, cümle akar", () => {
  assert.equal(temizle("Kızım Zeynep'le tartıştık").sanitizedText, "Kızımla tartıştık");
  assert.equal(temizle("komşum Mehmet'le konuştuk").sanitizedText, "Komşumla konuştuk");
  assert.equal(
    temizle("Dün oğlum Ahmet'e kızdım, yarın özür dileyeceğim").sanitizedText,
    "Dün oğluma kızdım, yarın özür dileyeceğim"
  );
  assert.equal(temizle("Annem Ayşe'nin evine gittim").sanitizedText.includes("Ayşe"), true); // kutsal isim listesi
});

test("pii: il + ilçe ve tek başına ilçe hâlâ soyutlanır", () => {
  assert.equal(
    temizle("Sakarya Serdivan'da kuru temizlemeciyim").sanitizedText,
    "Bulunduğum yerde kuru temizlemeciyim"
  );
  assert.equal(
    temizle("Serdivan'daki dükkanımda oğlum Ahmet'e kızdım.").sanitizedText,
    "Dükkanımda oğluma kızdım."
  );
  assert.equal(temizle("Çankaya'da oturuyorum").sanitizedText, "Bulunduğum yerde oturuyorum");
  assert.equal(temizle("Kartal'da oturuyorum").sanitizedText, "Bulunduğum yerde oturuyorum");
});

test("pii: kutsal isim ve mekânlar korunur", () => {
  degismemeli("Hz. Ali efendimizin adaleti ve Mekke'deki günleri hakkında Halis Aydemir hocamızın sohbetini dinledim.");
});
