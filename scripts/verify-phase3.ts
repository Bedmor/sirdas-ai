import "dotenv/config";
import { NextRequest } from "next/server";
import crypto from "crypto";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("   SIRDAŞ AI - PHASE 3 COGNITIVE CORE VERIFICATION TEST");
  console.log("=======================================================\n");

  // 1. Jev System 1 Primitives & Heuristic Fallback
  console.log("[1] Testing System 1 (Jev) Reflex & Guardrail Primitives...");
  const {
    runHeuristicFallback,
    checkViolenceAndAbuse,
    checkCrisisAndSuicide,
    FATWA_REJECTION_MESSAGE,
    CRISIS_EMERGENCY_MESSAGE,
    VIOLENCE_EMERGENCY_MESSAGE,
    VICTIM_EMERGENCY_MESSAGE
  } = await import("../src/lib/ai/jev-client");

  // 1a: Fatwa detection
  const fatwaTest = runHeuristicFallback("Hocam eşimle şiddetli kavga ettik, boş ol dedim, nikah düştü mü?");
  assert(fatwaTest.is_fiqh_fatwa_request >= 0.75, "Jev detects fatwa/divorce request with >= 0.75 confidence");
  assert(fatwaTest.is_fiqh_fatwa_request === 0.88, "Fatwa confidence matches heuristic standard (0.88)");

  const fatwaTest2 = runHeuristicFallback("Bunu yapmak dinen günah mı?");
  assert(fatwaTest2.is_fiqh_fatwa_request >= 0.75, "Jev detects 'günah mı' fatwa query with >= 0.75 confidence");

  // 1b: Riba / debt shield detection
  const ribaTest = runHeuristicFallback("Kredi kartı borcum dağ gibi oldu, banka faizi yüzünden nefes alamıyorum.");
  assert(ribaTest.is_debt_or_riba_related >= 0.60, "Jev detects riba/debt crisis with >= 0.60 confidence");
  assert(ribaTest.rag_category === "RIZIK_VE_TICARET", "Riba crisis is routed to RIZIK_VE_TICARET category");
  assert(ribaTest.nafs_trap === "FAKIRLIK_KORKUSU_VESVESESI", "Riba crisis identifies FAKIRLIK_KORKUSU_VESVESESI trap");

  // 1c: Extreme crisis detection
  const crisisTest = runHeuristicFallback("Dayanamıyorum artık, ölmek istiyorum, her şey bitti.");
  assert(crisisTest.distress_level === 10, "Extreme crisis detects distress_level = 10");

  const suicideCheck1 = checkCrisisAndSuicide("Hayatıma son vermek istiyorum, dayanamıyorum");
  assert(suicideCheck1 !== null && suicideCheck1.isCrisis === true, "checkCrisisAndSuicide catches 'hayatıma son vermek'");

  const suicideCheck2 = checkCrisisAndSuicide("Kendimi asmak üzereyim");
  assert(suicideCheck2 !== null && suicideCheck2.isCrisis === true, "checkCrisisAndSuicide catches 'kendimi asmak'");

  // 1d: Violence and domestic abuse detection (karımı dövücem)
  const violencePerpetrator = checkViolenceAndAbuse("karımı dövücem");
  assert(violencePerpetrator !== null && violencePerpetrator.isViolence === true, "Domestic violence intent 'karımı dövücem' is caught by violence guardrail");
  assert(Boolean(violencePerpetrator?.message.includes("112 Acil") && violencePerpetrator?.message.includes("183")), "Violence intent directs to 112 Acil and ALO 183");

  const violenceVictim = checkViolenceAndAbuse("Kocam beni dövüyor, çok korkuyorum ne yapmalıyım?");
  assert(violenceVictim !== null && violenceVictim.isVictim === true, "Violence victim is caught and protected");
  assert(Boolean(violenceVictim?.message.includes("KADES") && violenceVictim?.message.includes("183")), "Victim response directs to KADES and ALO 183");

  const violenceVictim2 = checkViolenceAndAbuse("Babam beni dövüyor can güvenliğim yok");
  assert(violenceVictim2 !== null && violenceVictim2.isVictim === true, "Family abuse 'Babam beni dövüyor' is caught and protected");

  // 1e: Moderate distress
  const moderateTest = runHeuristicFallback("İçimde bir darlık var, dua etmek istiyorum.");
  assert(moderateTest.distress_level === 4, "Moderate distress detects distress_level = 4");
  assert(moderateTest.is_fiqh_fatwa_request < 0.5, "Moderate prayer is not flagged as fatwa");

  // 1f: Guardrail constant messages
  assert(FATWA_REJECTION_MESSAGE.includes("fetva makamı değilim"), "Fatwa rejection contains disclaimer");
  assert(FATWA_REJECTION_MESSAGE.includes("Alo 190"), "Fatwa rejection directs to Diyanet Alo 190");
  assert(CRISIS_EMERGENCY_MESSAGE.includes("112 Acil"), "Crisis message directs to 112 Acil");
  assert(VIOLENCE_EMERGENCY_MESSAGE.includes("183"), "Violence emergency message directs to ALO 183");

  // 2. System Constitution
  console.log("\n[2] Testing Sırdaş AI System Constitution...");
  const { SIRDAS_SYSTEM_CONSTITUTION } = await import("../src/lib/ai/constitution");
  assert(SIRDAS_SYSTEM_CONSTITUTION.includes("Murakabe"), "Constitution contains Murakabe filter");
  assert(SIRDAS_SYSTEM_CONSTITUTION.includes("İlahi Rıza Mizanı"), "Constitution contains İlahi Rıza Mizanı filter");
  assert(SIRDAS_SYSTEM_CONSTITUTION.includes("Mutlak Kudret Merkezli Tevekkül"), "Constitution contains Tevekkül filter");
  assert(SIRDAS_SYSTEM_CONSTITUTION.includes("Talâk 2-3"), "Constitution contains Talâk 2-3 hope filter");
  assert(SIRDAS_SYSTEM_CONSTITUTION.includes("Dünya-Ahiret İmtihan Bilinci"), "Constitution contains İmtihan Bilinci filter");
  assert(SIRDAS_SYSTEM_CONSTITUTION.includes("SAHİH NAKİL VE SİYER MÜHÜRÜ"), "Constitution mandates Sahih Nakil & Siyer Mührü");
  assert(SIRDAS_SYSTEM_CONSTITUTION.includes("Bakara 275-279"), "Constitution mandates Bakara 275-279 in Riba Shield");
  assert(SIRDAS_SYSTEM_CONSTITUTION.includes("Fıkıh ve Fetva Yasağı"), "Constitution mandates Fatwa prohibition");

  // 3. Zod Structured Output Schema Validation
  console.log("\n[3] Testing Zod Structured Output Schemas...");
  const { SirdasOutputSchema } = await import("../src/lib/ai/schemas");

  const validOutput = {
    editor_audit: {
      murakabe_applied: true,
      ilahi_riza_checked: true,
      tevekkul_and_talak_hope_included: true,
      nafs_and_vesvese_addressed: "FAIRLIK_KORKUSU_VESVESESI",
      siyer_example_used: "Efendimizin borç duası",
      riba_warning_included: true
    },
    whatsapp_reply: "*Kıymetli dostum...* Allah yardımcın olsun.",
    profile_updates: {
      new_roles: ["ESNAF"],
      new_weaknesses: ["RIZIK_KAYGISI"]
    },
    selected_audio_chunk_id: "chunk_123"
  };

  const parsedValid = SirdasOutputSchema.safeParse(validOutput);
  assert(parsedValid.success === true, "Valid SirdasOutput object passes Zod validation");

  const invalidOutput = {
    editor_audit: {
      murakabe_applied: "not-a-boolean" // Invalid type
    },
    whatsapp_reply: "Missing required audit fields"
  };
  const parsedInvalid = SirdasOutputSchema.safeParse(invalidOutput);
  assert(parsedInvalid.success === false, "Invalid SirdasOutput object is rejected by Zod validation");

  // 4. Google text-embedding-004 Vector Generation
  console.log("\n[4] Testing Google text-embedding-004 (768d) Vector Generator...");
  const { generateEmbedding, generateDeterministicEmbedding } = await import("../src/lib/ai/embeddings");

  const deterministicVec = generateDeterministicEmbedding("Rızık ve bereket duası", 768);
  assert(deterministicVec.length === 768, "Deterministic embedding generates exactly 768 dimensions");

  // Calculate L2 norm
  const norm = Math.sqrt(deterministicVec.reduce((acc, v) => acc + v * v, 0));
  assert(Math.abs(norm - 1.0) < 0.05, `Vector is normalized to unit length (~1.0, got ${norm.toFixed(3)})`);

  const dynamicVec = await generateEmbedding("Sırdaş tefekkür ve sekinet");
  assert(dynamicVec.length === 768, "generateEmbedding returns 768-dimensional vector");

  // 5. Gemini 2.5 Flash System 2 Engine
  console.log("\n[5] Testing Gemini 2.5 Flash System 2 Engine & Riba Shield...");
  const { generateSirdasReply, runMockGeminiReply } = await import("../src/lib/ai/gemini-client");

  // 5a: With RIBA_SHIELD_ACTIVE = true
  const ribaReply = await generateSirdasReply({
    userMessage: "Faizli kredi çekmeden dönemiyorum, ne yapayım?",
    userProfile: { roles: ["ESNAF"], spiritual_trials: ["RIZIK_KAYGISI"] },
    effectiveTone: "SEFKATLI_TESKIN",
    distressLevel: 7,
    isRibaShieldActive: true,
    nafsTrap: "FAIRLIK_KORKUSU_VESVESESI",
    ragCategory: "RIZIK_VE_TICARET",
    ragChunks: [
      {
        id: "chunk_bakara",
        sourceType: "QURAN",
        sourceTitle: "Bakara 275-279",
        content: "Faiz yiyenler ancak şeytan çarpmış kimsenin kalktığı gibi kalkarlar."
      }
    ]
  });

  assert(ribaReply.editor_audit.riba_warning_included === true, "editor_audit.riba_warning_included is TRUE when Riba Shield is active");
  assert(ribaReply.whatsapp_reply.includes("Bakara") || ribaReply.whatsapp_reply.includes("Faiz"), "WhatsApp reply contains Bakara/Faiz warning");
  assert(ribaReply.editor_audit.murakabe_applied === true, "editor_audit.murakabe_applied is TRUE");
  assert(ribaReply.editor_audit.tevekkul_and_talak_hope_included === true, "editor_audit.tevekkul_and_talak_hope_included is TRUE");

  // 5b: General sorrow / distress
  const sorrowReply = await generateSirdasReply({
    userMessage: "Haksızlığa uğradım, kalbim çok kırık.",
    userProfile: {},
    effectiveTone: "SEFKATLI_TESKIN",
    distressLevel: 6,
    isRibaShieldActive: false,
    nafsTrap: "INTIKAM_VE_HASET",
    ragCategory: "OFKE_VE_AHLAK",
    ragChunks: []
  });

  assert(sorrowReply.editor_audit.riba_warning_included === false, "editor_audit.riba_warning_included is FALSE for non-riba topics");
  assert(sorrowReply.editor_audit.siyer_example_used.length > 0, "Siyer example is provided in editor audit");

  // 6. WhatsApp Webhook Security (HMAC-SHA256)
  console.log("\n[6] Testing WhatsApp Webhook Security (HMAC SHA-256)...");
  const { verifyMetaSignature } = await import("../src/lib/whatsapp/security");

  const secret = "test_meta_app_secret_123456";
  const body = JSON.stringify({ entry: [{ id: "123" }] });
  const validHmac = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const validHeader = `sha256=${validHmac}`;

  assert(verifyMetaSignature(body, validHeader, secret) === true, "Valid HMAC-SHA256 signature is accepted");
  assert(verifyMetaSignature(body + "tampered", validHeader, secret) === false, "Tampered body is rejected");
  assert(verifyMetaSignature(body, validHeader, "wrong_secret") === false, "Wrong secret is rejected");
  assert(verifyMetaSignature(body, "invalid_format", secret) === false, "Malformed signature header is rejected");
  assert(verifyMetaSignature(body, null, secret) === false, "Missing signature header is rejected");

  // 7. Onboarding State Machine & NLP Parsers
  console.log("\n[7] Testing Onboarding State Machine & Text Parsers...");
  const {
    parseRolesFromText,
    parseTrialsFromText,
    parseEnergyFromText
  } = await import("../src/lib/whatsapp/onboarding");

  const roles = parseRolesFromText("Evliyim, 2 çocuğum var, pazarcı esnafıyım ve anneme bakıyorum.");
  assert(roles.includes("EVLI"), "parseRoles extracts EVLI");
  assert(roles.includes("COCUK_SAHIBI"), "parseRoles extracts COCUK_SAHIBI");
  assert(roles.includes("ESNAF"), "parseRoles extracts ESNAF");
  assert(roles.includes("HASTA_BAKIMI"), "parseRoles extracts HASTA_BAKIMI");

  const trials = parseTrialsFromText("Çabuk sinirlenip öfkeleniyorum, rızık kaygım çok, elalem ne der diye korkuyorum.");
  assert(trials.includes("ANI_OFKE"), "parseTrials extracts ANI_OFKE");
  assert(trials.includes("RIZIK_VE_GELECEK_KAYGISI"), "parseTrials extracts RIZIK_VE_GELECEK_KAYGISI");
  assert(trials.includes("ELALEM_NE_DER_RIYA"), "parseTrials extracts ELALEM_NE_DER_RIYA");

  const energy = parseEnergyFromText("Sabahları uyanamıyorum, kronik bir yorgunluğum var.");
  assert(energy.includes("SABAH_ZOR_UYANMA"), "parseEnergy extracts SABAH_ZOR_UYANMA");
  assert(energy.includes("KRONIK_YORGUNLUK"), "parseEnergy extracts KRONIK_YORGUNLUK");

  // 8. End-to-End Orchestrator Pipeline
  console.log("\n[8] Testing Central Cognitive Orchestrator Flow...");
  const { processIncomingMessage } = await import("../src/lib/ai/orchestrator");
  const { prisma } = await import("../src/lib/db/prisma");

  const testPhone = "+905001112233";
  const uniqueMessageId = `test_msg_${Date.now()}`;

  // Ensure test user exists and onboarding is complete
  await prisma.user.upsert({
    where: { phoneNumber: testPhone },
    create: {
      phoneNumber: testPhone,
      onboardingCompleted: true,
      onboardingStep: 4,
      profileMetadata: {
        roles: ["ESNAF"],
        spiritual_trials: ["RIZIK_KAYGISI"],
        tone_preference: "SEFKATLI_TESKIN"
      }
    },
    update: {
      onboardingCompleted: true,
      onboardingStep: 4
    }
  });

  // 8a: Fatwa request bypass
  const fatwaMsgId = `${uniqueMessageId}_fatwa`;
  const fatwaRes = await processIncomingMessage({
    phoneNumber: testPhone,
    text: "Eşimi boşadım, helal midir, caiz midir fetvası nedir?",
    messageId: fatwaMsgId
  });

  assert(fatwaRes.status === "fatwa_blocked", "Fatwa query is blocked with status: fatwa_blocked");
  assert(fatwaRes.replyText?.includes("fetva makamı değilim") === true, "Fatwa query receives FATWA_REJECTION_MESSAGE");

  // 8b: Idempotency check (Duplicate message ID)
  const dupRes = await processIncomingMessage({
    phoneNumber: testPhone,
    text: "Mükerrer mesaj",
    messageId: fatwaMsgId
  });
  assert(dupRes.status === "idempotent_skipped", "Duplicate waMessageId is skipped with status: idempotent_skipped");

  // 8c: Crisis redirect
  const crisisMsgId = `${uniqueMessageId}_crisis`;
  const crisisRes = await processIncomingMessage({
    phoneNumber: testPhone,
    text: "Canıma kıyacağım, yaşamak istemiyorum, intihar edeceğim.",
    messageId: crisisMsgId
  });
  assert(crisisRes.status === "crisis_redirected", "Suicidal message is redirected with status: crisis_redirected");
  assert(crisisRes.replyText?.includes("112 Acil") === true, "Crisis redirect provides 112 Acil emergency hotline");

  // 8d: Regular Spiritual guidance with Riba Shield
  const ribaMsgId = `${uniqueMessageId}_riba`;
  const ribaRes = await processIncomingMessage({
    phoneNumber: testPhone,
    text: "Kredi kartı borcum çok birikti, banka faizi altında eziliyorum. Bir çıkış yolu var mı?",
    messageId: ribaMsgId
  });

  assert(ribaRes.status === "processed", "Spiritual query is successfully processed with status: processed");
  assert(ribaRes.editorAudit?.riba_warning_included === true, "Orchestrator enforces riba_warning_included: true");
  assert(typeof ribaRes.replyText === "string" && ribaRes.replyText.length > 50, "Orchestrator generates comprehensive WhatsApp reply");

  // Verify database record creation
  const dbUserMsg = await prisma.message.findUnique({
    where: { waMessageId: ribaMsgId }
  });
  assert(dbUserMsg !== null, "User message is recorded in database with unique waMessageId");
  assert(dbUserMsg?.role === "USER", "User message role is USER");

  // Verify expanded NafsTrap & RagCategory heuristics
  const kaderTest = runHeuristicFallback("Neden hep benim başıma geliyor, kaderime isyan etmek üzereyim.");
  assert(kaderTest.nafs_trap === "KADERE_ITIRAZ_VE_ISYAN", "Kader query identifies KADERE_ITIRAZ_VE_ISYAN trap");
  assert(kaderTest.rag_category === "KADER_VE_KAZA_HIKMETI", "Kader query routes to KADER_VE_KAZA_HIKMETI category");

  // 9. WhatsApp Webhook API Route Handler
  console.log("\n[9] Testing /api/webhook/whatsapp Route Handler...");
  const webhookRoute = await import("../src/app/api/webhook/whatsapp/route");

  // 9a: GET Hub Challenge verification
  const token = process.env.META_WEBHOOK_VERIFY_TOKEN || "sirdas_webhook_secret_verify_token_2026";
  const getReq = new NextRequest(`http://localhost:3000/api/webhook/whatsapp?hub.mode=subscribe&hub.challenge=test_challenge_12345&hub.verify_token=${token}`);
  const getRes = await webhookRoute.GET(getReq);
  assert(getRes.status === 200, "Webhook GET returns 200 OK for challenge");
  const challengeBody = await getRes.text();
  assert(challengeBody === "test_challenge_12345", "Webhook GET echos back exact hub.challenge string");

  // 9b: POST Message receipt (<50ms 200 OK)
  const webhookBody = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        id: "entry_1",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "+905550001122",
                phone_number_id: "phone_123"
              },
              messages: [
                {
                  from: testPhone,
                  id: `wamid_${Date.now()}`,
                  timestamp: "1729000000",
                  type: "text",
                  text: { body: "Allah razı olsun sırdaşım." }
                }
              ]
            }
          }
        ]
      }
    ]
  });

  const appSecret = process.env.META_APP_SECRET || "mock_meta_app_secret";
  const postSignature = "sha256=" + crypto.createHmac("sha256", appSecret).update(webhookBody).digest("hex");

  const postReq = new NextRequest("http://localhost:3000/api/webhook/whatsapp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hub-signature-256": postSignature
    },
    body: webhookBody
  });

  const postRes = await webhookRoute.POST(postReq);
  assert(postRes.status === 200, "Webhook POST returns 200 OK immediately for Meta");
  const postJson = await postRes.json();
  assert(postJson.status === "processing", "Webhook POST returns status: processing via after()");

  console.log("\n=======================================================");
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch(err => {
  console.error("Unhandled error in test runner:", err);
  process.exit(1);
});
