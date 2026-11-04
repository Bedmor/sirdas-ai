import { sanitizeIncomingUserMessage, hashPhoneNumberBlindIndex } from "../src/lib/ai/pii-anonymizer";

console.log("=== SIRDAŞ AI PII ANONYMIZER DOĞRULAMA TESTİ ===\n");

const testCases = [
  {
    name: "Kullanıcı Senaryosu 1: Serdivan + Dükkan + Ahmet",
    input: "Serdivan'daki dükkanımda oğlum Ahmet'e kızdım.",
    expectedTerms: ["dükkanımda", "oğluma", "kızdım"],
    forbiddenTerms: ["Serdivan", "Ahmet"],
  },
  {
    name: "Kullanıcı Senaryosu 2: Sakarya Serdivan İl-İlçe + İsim İfşası",
    input: "Ben Sakarya Serdivan'da kuru temizlemeciyim, 21 yaşında üniversiteye yeni başlayan bir oğlum var, adı da Ahmet...",
    expectedTerms: ["kuru temizlemeciyim", "üniversiteye"],
    forbiddenTerms: ["Sakarya", "Serdivan", "Ahmet"],
  },
  {
    name: "Kutsal İsim ve Mekan Muafiyeti (Beyaz Liste Koruması)",
    input: "Hz. Ali efendimizin adaleti ve Mekke'deki günleri hakkında Halis Aydemir hocamızın sohbetini dinledim.",
    expectedTerms: ["Hz. Ali", "Mekke'deki", "Halis Aydemir"],
    forbiddenTerms: ["[KONUM]", "[TC_NO]", "bulunduğum yerdeki"],
  },
  {
    name: "Doğrudan PII (TCKN, Telefon, IBAN, E-posta)",
    input: "TC numaram 12345678901, telefonum 0532 999 88 77, iban TR120006100511123456789012 ve mailim test@example.com",
    expectedTerms: ["[TC_NO]", "[TELEFON]", "[IBAN]", "[EPOSTA]"],
    forbiddenTerms: ["12345678901", "0532 999 88 77", "TR120006100511123456789012", "test@example.com"],
  },
  {
    name: "Ailevi Yakınlık ve Çekim Ekleri",
    input: "Kızım Zeynep'le tartıştık, eşim Murat'a çok kırıldım, babam Hasan'a dua ediyorum.",
    expectedTerms: ["Kızımla tartıştık", "eşime", "babam Hasan'a dua ediyorum"], // Hasan kutsal beyaz listede olduğu için korunur
    forbiddenTerms: ["Zeynep'le", "Murat'a"],
  }
];

let allPassed = true;

for (const tc of testCases) {
  console.log(`--- Test: ${tc.name} ---`);
  console.log(`Giriş : "${tc.input}"`);
  const result = sanitizeIncomingUserMessage(tc.input);
  console.log(`Çıkış : "${result.sanitizedText}"`);
  console.log(`Kategoriler: ${result.redactedCategories.join(", ") || "Yok"}`);
  console.log(`Maskelenen Adet: ${result.redactedEntitiesCount}`);

  let tcPassed = true;
  for (const exp of tc.expectedTerms) {
    if (!result.sanitizedText.toLowerCase().includes(exp.toLowerCase())) {
      console.error(`❌ HATA: Beklenen terim bulunamadı: "${exp}"`);
      tcPassed = false;
      allPassed = false;
    }
  }

  for (const forb of tc.forbiddenTerms) {
    if (result.sanitizedText.toLowerCase().includes(forb.toLowerCase())) {
      console.error(`❌ HATA: Yasaklı/temizlenmesi gereken terim metinde kaldı: "${forb}"`);
      tcPassed = false;
      allPassed = false;
    }
  }

  if (tcPassed) {
    console.log("✅ Başarılı!\n");
  } else {
    console.log("❌ Başarısız!\n");
  }
}

console.log("--- Test: Blind Index Hash Doğrulaması ---");
const testPhone = "+90 532 123 45 67";
const hash1 = hashPhoneNumberBlindIndex(testPhone);
const hash2 = hashPhoneNumberBlindIndex("05321234567");
console.log(`Telefon 1 Hash: ${hash1}`);
console.log(`Telefon 2 Hash: ${hash2}`);
if (hash1 === hash2) {
  console.log("✅ Blind Index Başarılı: Farklı formatlardaki aynı telefon aynı hash'i üretti!\n");
} else {
  console.error("❌ Hata: Blind Index eşleşmedi!");
  allPassed = false;
}

if (allPassed) {
  console.log("🎉 TÜM METİN TEMİZLEME VE GİZLİLİK TESTLERİ BAŞARIYLA GEÇTİ!");
  process.exit(0);
} else {
  console.error("💥 BAZI TESTLER BAŞARISIZ OLDU!");
  process.exit(1);
}
