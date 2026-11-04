/**
 * Manevi Pusula — Akıllı Niyet Yönlendirmesi (Intent Routing) Doğrulama Testi
 *
 * Test kapsamı:
 * 1. Niyet Sınıflandırma (detectChatIntent)
 *    - Dert / İmtihan / İçsel Hâl -> MANEVI_AYNA (Sırdaş / Manevi Ayna Modu)
 *    - Siyer / Tarih / İlim Sorusu -> ILIM_VE_SIYER (Vakur İlim & Hikmet Modu)
 *    - Karmaşık sınır durumları (kişisel ıstırap içinde tarihi analoji geçmesi)
 * 2. RAG Alma (retrieveCelikKasaContext & searchLocalKnowledgeCorpus)
 *    - İlim/Siyer modunda ilgili tarihi vakaların ve sahih metinlerin getirilmesi
 * 3. Yanıt Üretimi ve Üslup Bütünlüğü (generateSirdasReply & runMockGeminiReply)
 *    - ILIM_VE_SIYER: Net, ansiklopedik ama ruhu olan berrak dil, kuru teselliye boğmama
 *    - MANEVI_AYNA: Şefkatli, kalbe inşirah veren manevi ayna
 */

import { detectChatIntent } from "../src/lib/ai/intent-router";
import { searchLocalKnowledgeCorpus } from "../src/lib/db/local-corpus";
import { retrieveCelikKasaContext } from "../src/lib/ai/rag-pipeline";
import { generateSirdasReply, runMockGeminiReply } from "../src/lib/ai/gemini-client";
import { analyzeWithJev } from "../src/lib/ai/jev-client";

async function runTests() {
  console.log("=== MANEVİ PUSULA AKILLI NİYET YÖNLENDİRMESİ TESTİ ===\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ ${message}`);
    } else {
      console.error(`  ✗ BAŞARISIZ: ${message}`);
      process.exitCode = 1;
    }
  }

  // 1. NİYET SINIFLANDIRMA TESTLERİ
  console.log("1. Niyet Sınıflandırma (Intent Routing) Testleri:");

  const testCases = [
    // A. Kullanıcının İstediği Örnekler
    {
      text: "Çok bunaldım, borçlarım var, nefsimle baş edemiyorum",
      expectedMode: "MANEVI_AYNA",
      description: "Kullanıcı Örneği 1 (Dert/İmtihan/Borç)",
    },
    {
      text: "Hicret neden oldu?",
      expectedMode: "ILIM_VE_SIYER",
      description: "Kullanıcı Örneği 2 (Hicret Siyer Sorusu)",
    },
    {
      text: "Uhud'da ne oldu?",
      expectedMode: "ILIM_VE_SIYER",
      description: "Kullanıcı Örneği 3 (Uhud Gazvesi Sorusu)",
    },
    // B. Ek Siyer ve Tarih Soruları
    {
      text: "Bedir savaşının sebepleri nelerdir?",
      expectedMode: "ILIM_VE_SIYER",
      description: "Siyer / Tarih Sorusu (Bedir)",
    },
    {
      text: "Mus'ab bin Umeyr kimdir?",
      expectedMode: "ILIM_VE_SIYER",
      description: "Sahabe Biyografisi (Mus'ab bin Umeyr)",
    },
    {
      text: "Veda Hutbesi'nde Peygamberimiz neler söyledi?",
      expectedMode: "ILIM_VE_SIYER",
      description: "Siyer / Hadis Vakası (Veda Hutbesi)",
    },
    {
      text: "İlk vahiy Hira mağarasında nasıl indi?",
      expectedMode: "ILIM_VE_SIYER",
      description: "Vahiy Başlangıcı İlim Sorusu",
    },
    // C. Dert, Hüzün ve İçsel Haller
    {
      text: "İçim çok daralıyor, kimseye derdimi anlatamıyorum, yalnızım",
      expectedMode: "MANEVI_AYNA",
      description: "İçsel Daralma ve Yalnızlık Hâli",
    },
    {
      text: "Namazlarımı kılamıyorum, sürekli erteliyorum, nefsim çok tembel",
      expectedMode: "MANEVI_AYNA",
      description: "İbadet ve Nefis Tembelliği Mücadelesi",
    },
    {
      text: "Büyük bir günah işledim, çok pişmanım, Allah beni affeder mi?",
      expectedMode: "MANEVI_AYNA",
      description: "Tevbe ve Günah Pişmanlığı Hâli",
    },
    // D. Zorlayıcı Sınır Vakası (Tarihi olay zikredilerek yapılan kişisel dert anlatımı)
    {
      text: "Uhud'daki okçular gibi dünyaya aldandım, borç batağındayım çok bunaldım",
      expectedMode: "MANEVI_AYNA",
      description: "Uhud Analojisi İçeren Kişisel Dert (Öncelik: MANEVI_AYNA)",
    },
  ];

  for (const tc of testCases) {
    const result = detectChatIntent(tc.text);
    assert(
      result.mode === tc.expectedMode,
      `[${result.mode}] "${tc.text}" -> ${tc.description} (${result.reason})`
    );
  }

  // 2. RAG ALMA VE BİLGİ KAYNAĞI TESTLERİ
  console.log("\n2. RAG Alma ve Tarihi Korpus Eşleşme Testleri:");

  const uhudRag = searchLocalKnowledgeCorpus({
    userMessage: "Uhud'da ne oldu?",
    intentMode: "ILIM_VE_SIYER",
    filterCategory: "SIYER_ORNEKLERI",
    matchCount: 4,
  });

  const hasUhudSiyer = uhudRag.some(
    (c) =>
      c.sourceType === "SIYER" &&
      /uhud/i.test(`${c.sourceTitle} ${c.content}`)
  );
  assert(
    hasUhudSiyer,
    `Uhud sorusunda Siyer korpusundan Uhud gazvesi chunk'ı getirildi (${uhudRag.find(c => /uhud/i.test(c.sourceTitle))?.sourceTitle})`
  );

  const hicretRag = searchLocalKnowledgeCorpus({
    userMessage: "Hicret neden oldu?",
    intentMode: "ILIM_VE_SIYER",
    filterCategory: "SIYER_ORNEKLERI",
    matchCount: 4,
  });

  const hasHicretContext = hicretRag.some(
    (c) =>
      /hicret|sevr|habe[şs]istan|medine/i.test(`${c.sourceTitle} ${c.content}`)
  );
  assert(
    hasHicretContext,
    `Hicret sorusunda Sevr/Hicret/Habeşistan bağlamı getirildi (${hicretRag[0]?.sourceTitle})`
  );

  // 3. RETRIEVE CELIK KASA CONTEXT PIPELINE TESTİ
  console.log("\n3. Çelik Kasa RAG Entegrasyon Testi:");

  const jevIlim = await analyzeWithJev({ userMessage: "Uhud'da ne oldu?" });
  const ragContext = await retrieveCelikKasaContext({
    userMessage: "Uhud'da ne oldu?",
    queryEmbedding: new Array(768).fill(0),
    jevResult: jevIlim,
    intentMode: "ILIM_VE_SIYER",
  });

  assert(
    ragContext.chunks.length > 0,
    `retrieveCelikKasaContext başarıyla ${ragContext.chunks.length} kaynak döndürdü`
  );
  assert(
    ragContext.chunks.some((c) => c.sourceType === "SIYER"),
    "En az bir adet Siyer-i Nebî kaynağı en başa dahil edildi"
  );

  // 4. CEVAP ÜRETİMİ VE ÜSLUP VAKARI TESTLERİ
  console.log("\n4. Yanıt Üretimi ve Vakur Üslup Testleri:");

  // A. Siyer / İlim Modu Yanıtı
  const mockSiyerReply = runMockGeminiReply({
    userMessage: "Uhud'da ne oldu?",
    userProfile: { roles: ["WEB_KULLANICI"] },
    effectiveTone: "NET_VE_MUALLIM",
    distressLevel: 2,
    isRibaShieldActive: false,
    nafsTrap: "DUNYALIK_KAYGI",
    ragCategory: "SIYER_ORNEKLERI",
    ragChunks: ragContext.chunks,
    intentMode: "ILIM_VE_SIYER",
  });

  assert(
    Boolean(mockSiyerReply.reply_text || mockSiyerReply.whatsapp_reply),
    "Siyer yanıtı başarıyla üretildi"
  );
  const siyerText = mockSiyerReply.reply_text || mockSiyerReply.whatsapp_reply;
  assert(
    !/üzülme aziz kardeşim|kalbindeki bu kederi/i.test(siyerText),
    "İlim modunda gereksiz psikolojik teselli veya yas dili kullanılmadı"
  );
  assert(
    /hadise|siyer|uhud|tarih|ders/i.test(siyerText),
    "İlim modunda vakur, ansiklopedik ve hikmet dolu bir anlatım sunuldu"
  );
  assert(
    mockSiyerReply.editor_audit.intent_mode === "ILIM_VE_SIYER",
    "Editor audit intent_mode değeri 'ILIM_VE_SIYER' olarak kaydedildi"
  );

  // B. Dert / Manevi Ayna Modu Yanıtı
  const jevDert = await analyzeWithJev({
    userMessage: "Çok bunaldım, borçlarım var, nefsimle baş edemiyorum",
  });
  const mockAynaReply = runMockGeminiReply({
    userMessage: "Çok bunaldım, borçlarım var, nefsimle baş edemiyorum",
    userProfile: { roles: ["WEB_KULLANICI"] },
    effectiveTone: "SEFKATLI_TESKIN",
    distressLevel: 8,
    isRibaShieldActive: true,
    nafsTrap: "FAKIRLIK_KORKUSU_VESVESESI",
    ragCategory: "RIZIK_VE_TICARET",
    ragChunks: [
      {
        id: "chunk-riba-1",
        sourceType: "QURAN",
        sourceTitle: "Bakara Suresi 275-279",
        content: "Allah faizi tüketir, sadakaları ise bereketlendirir...",
      },
    ],
    intentMode: "MANEVI_AYNA",
  });

  const aynaText = mockAynaReply.reply_text || mockAynaReply.whatsapp_reply;
  assert(
    /kalbimde hissediyorum|rabbimiz|tevekkül|ferah/i.test(aynaText),
    "Manevi ayna modunda şefkatli, teskin edici ve tevekkül merkezli üslup korundu"
  );
  assert(
    mockAynaReply.editor_audit.intent_mode === "MANEVI_AYNA",
    "Editor audit intent_mode değeri 'MANEVI_AYNA' olarak kaydedildi"
  );

  console.log("\n=======================================================");
  console.log(`Sonuç: ${passedTests}/${totalTests} test başarıyla geçti.`);
  if (passedTests === totalTests) {
    console.log("🏆 AKILLI NİYET YÖNLENDİRMESİ MİMARİSİ BAŞARIYLA DOĞRULANDI!");
  } else {
    console.error("⚠️ Bazı testler başarısız oldu!");
  }
}

runTests().catch((err) => {
  console.error("Test icra hatası:", err);
  process.exit(1);
});
