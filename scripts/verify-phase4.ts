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
  console.log("   SIRDAŞ AI - PHASE 4 WHATSAPP WEBHOOK & ONBOARDING TEST");
  console.log("=======================================================\n");

  const { prisma } = await import("../src/lib/db/prisma");
  const { verifyMetaSignature } = await import("../src/lib/whatsapp/security");
  const { WhatsAppClient } = await import("../src/lib/whatsapp/client");
  const {
    handleOnboardingMessage,
    parseRolesFromText,
    parseTrialsFromText,
    parseEnergyFromText
  } = await import("../src/lib/whatsapp/onboarding");
  const webhookRoute = await import("../src/app/api/webhook/whatsapp/route");
  const { processIncomingMessage } = await import("../src/lib/ai/orchestrator");

  // 1. Webhook Security & Signature Verification
  console.log("[1] Testing Meta Webhook HMAC-SHA256 Signature Verification...");
  const secret = "test_meta_app_secret_phase4_xyz";
  const payloadStr = JSON.stringify({ entry: [{ id: "wh_test_1" }] });
  const validHmac = crypto.createHmac("sha256", secret).update(payloadStr).digest("hex");
  const validHeader = `sha256=${validHmac}`;

  assert(verifyMetaSignature(payloadStr, validHeader, secret) === true, "verifyMetaSignature accepts valid HMAC-SHA256");
  assert(verifyMetaSignature(payloadStr + "tampered", validHeader, secret) === false, "verifyMetaSignature rejects tampered body");
  assert(verifyMetaSignature(payloadStr, validHeader, "wrong_secret") === false, "verifyMetaSignature rejects mismatched secret");
  assert(verifyMetaSignature(payloadStr, "sha256=invalidhex", secret) === false, "verifyMetaSignature rejects invalid hex signature");
  assert(verifyMetaSignature(payloadStr, null, secret) === false, "verifyMetaSignature rejects null signature");

  // 2. Hub Challenge Verification (GET)
  console.log("\n[2] Testing Webhook Verification Hub Challenge (GET)...");
  const testVerifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || "test_verify_token_123";

  // 2a: Valid challenge
  const validGetReq = new NextRequest(
    `http://localhost:3000/api/webhook/whatsapp?hub.mode=subscribe&hub.challenge=challenge_token_9999&hub.verify_token=${testVerifyToken}`
  );
  const validGetRes = await webhookRoute.GET(validGetReq);
  assert(validGetRes.status === 200, "Valid verify token returns 200 OK");
  const challengeBody = await validGetRes.text();
  assert(challengeBody === "challenge_token_9999", "Returns exact hub.challenge payload");

  // 2b: Invalid token
  process.env.META_WEBHOOK_VERIFY_TOKEN = "expected_token_secure";
  const invalidGetReq = new NextRequest(
    "http://localhost:3000/api/webhook/whatsapp?hub.mode=subscribe&hub.challenge=challenge_token_9999&hub.verify_token=wrong_token"
  );
  const invalidGetRes = await webhookRoute.GET(invalidGetReq);
  assert(invalidGetRes.status === 403, "Mismatched verify token returns 403 Forbidden");

  // 3. WhatsApp Client Capabilities
  console.log("\n[3] Testing WhatsApp Client Service...");
  const wa = new WhatsAppClient();
  const testPhone = "+905559998877";

  const textMsgId = await wa.sendTextMessage(testPhone, "Test manevi mesajı.");
  assert(typeof textMsgId === "string" && textMsgId.length > 0, "sendTextMessage dispatches text message and returns messageId");

  const audioMsgId = await wa.sendAudioMessage(testPhone, "https://r2.sirdas.ai/halis_aydemir/sohbet_1.ogg");
  assert(typeof audioMsgId === "string" && audioMsgId.length > 0, "sendAudioMessage dispatches audio note and returns messageId");

  await wa.markAsRead("wamid_test_12345");
  assert(true, "markAsRead executes cleanly without error");

  // 4. Onboarding NLP Text Parsers
  console.log("\n[4] Testing Onboarding NLP Text Parsers with Complex Phrasings...");
  
  // 4a: Roles
  const roles1 = parseRolesFromText("Evliyim, 3 çocuğum var, küçük esnafım.");
  assert(roles1.includes("EVLI") && roles1.includes("COCUK_SAHIBI") && roles1.includes("ESNAF"), "parseRoles extracts EVLI, COCUK_SAHIBI, ESNAF");
  
  const roles2 = parseRolesFromText("Bekarım, üniversite öğrencisiyim, hasta babama bakıyorum.");
  assert(roles2.includes("BEKAR") && roles2.includes("OGRENCI") && roles2.includes("HASTA_BAKIMI"), "parseRoles extracts BEKAR, OGRENCI, HASTA_BAKIMI");

  // 4b: Spiritual Trials
  const trials1 = parseTrialsFromText("Çok çabuk parlıyorum, ani öfkem var, bir de yarın ne olacak rızık kaygısı çekiyorum.");
  assert(trials1.includes("ANI_OFKE"), "parseTrials extracts ANI_OFKE");
  assert(trials1.includes("RIZIK_VE_GELECEK_KAYGISI"), "parseTrials extracts RIZIK_VE_GELECEK_KAYGISI");

  const trials2 = parseTrialsFromText("İnsanlar ne der diye kilitleniyorum, kimseye hayır diyemiyorum.");
  assert(trials2.includes("ELALEM_NE_DER_RIYA"), "parseTrials extracts ELALEM_NE_DER_RIYA");
  assert(trials2.includes("HAYIR_DIYEMEME"), "parseTrials extracts HAYIR_DIYEMEME");

  // 4c: Biological Energy
  const energy1 = parseEnergyFromText("Sabahları uyanamıyorum, kronik yorgunluk var üzerimde.");
  assert(energy1.includes("SABAH_ZOR_UYANMA"), "parseEnergy extracts SABAH_ZOR_UYANMA");
  assert(energy1.includes("KRONIK_YORGUNLUK"), "parseEnergy extracts KRONIK_YORGUNLUK");

  const energy2 = parseEnergyFromText("Şükür dinç uyanıyorum, enerjim yerinde.");
  assert(energy2.includes("DINÇ_ENERJIK"), "parseEnergy extracts DINÇ_ENERJIK");

  // 5. 4-Stage Digital Twin State Machine
  console.log("\n[5] Testing 4-Stage Digital Twin State Machine (Live User Flow)...");
  const onboardingPhone = `+90555123${Math.floor(1000 + Math.random() * 9000)}`;

  // Step 0: User creates on initial message
  let obUser = await prisma.user.create({
    data: {
      phoneNumber: onboardingPhone,
      onboardingStep: 1,
      onboardingCompleted: false,
      profileMetadata: {}
    }
  });
  assert(obUser.onboardingStep === 1 && obUser.onboardingCompleted === false, "New user starts at onboardingStep: 1");

  // Step 1: Greeting doesn't advance step, provides welcome
  await handleOnboardingMessage(obUser, "Selamun Aleykum", "ob_msg_0", wa);
  obUser = (await prisma.user.findUnique({ where: { id: obUser.id } }))!;
  assert(obUser.onboardingStep === 1, "Greeting on Step 1 keeps user on Step 1 with welcoming prompt");

  // Step 1 -> Step 2: User provides roles
  await handleOnboardingMessage(obUser, "Evliyim, 2 evladım var, marangoz esnafıyım", "ob_msg_1", wa);
  obUser = (await prisma.user.findUnique({ where: { id: obUser.id } }))!;
  assert(obUser.onboardingStep === 2, "Providing roles advances user to onboardingStep: 2");
  const meta1 = obUser.profileMetadata as any;
  assert(meta1.roles.includes("EVLI") && meta1.roles.includes("COCUK_SAHIBI"), "Roles saved to profileMetadata");

  // Step 2 -> Step 3: User provides spiritual trials
  await handleOnboardingMessage(obUser, "Rızık kaygısı ve ani öfke beni çok yoruyor", "ob_msg_2", wa);
  obUser = (await prisma.user.findUnique({ where: { id: obUser.id } }))!;
  assert(obUser.onboardingStep === 3, "Providing trials advances user to onboardingStep: 3");
  const meta2 = obUser.profileMetadata as any;
  assert(meta2.spiritual_trials.includes("RIZIK_VE_GELECEK_KAYGISI"), "Trials saved to profileMetadata");

  // Step 3 -> Step 4: User provides energy state
  await handleOnboardingMessage(obUser, "Sabah zor kalkıyorum, hep halsizim", "ob_msg_3", wa);
  obUser = (await prisma.user.findUnique({ where: { id: obUser.id } }))!;
  assert(obUser.onboardingStep === 4, "Providing energy state advances user to onboardingStep: 4");

  // Step 4 -> Complete: User chooses tone
  await handleOnboardingMessage(obUser, "B - Tavizsiz muallim diliyle konuş", "ob_msg_4", wa);
  obUser = (await prisma.user.findUnique({ where: { id: obUser.id } }))!;
  assert(obUser.onboardingCompleted === true, "Selecting tone completes onboarding (onboardingCompleted: true)");
  const meta4 = obUser.profileMetadata as any;
  assert(meta4.tone_preference === "TAVIZSIZ_MUALLIM", "tone_preference is saved as TAVIZSIZ_MUALLIM");

  // 6. Non-Text Message Handling & Delivery Statuses
  console.log("\n[6] Testing Non-Text Messages and Delivery Status Webhook Handling...");

  // 6a: Audio / Voice note sent by user
  const audioWebhookBody = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        id: "entry_audio",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "+905550001122", phone_number_id: "phone_123" },
              messages: [
                {
                  from: onboardingPhone,
                  id: `wamid_audio_${Date.now()}`,
                  timestamp: "1729000000",
                  type: "audio",
                  audio: { id: "audio_id_123", mime_type: "audio/ogg" }
                }
              ]
            }
          }
        ]
      }
    ]
  });

  const appSecret = process.env.META_APP_SECRET || "mock_meta_app_secret";
  const audioHmac = crypto.createHmac("sha256", appSecret).update(audioWebhookBody).digest("hex");

  const audioReq = new NextRequest("http://localhost:3000/api/webhook/whatsapp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hub-signature-256": `sha256=${audioHmac}`
    },
    body: audioWebhookBody
  });
  const audioRes = await webhookRoute.POST(audioReq);
  assert(audioRes.status === 200, "Audio message returns 200 OK");
  const audioJson = await audioRes.json();
  assert(audioJson.status === "media_not_supported", "Audio message returns status: media_not_supported");

  // 6b: Message Status update (delivered, read) ignored gracefully
  const statusWebhookBody = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [
      {
        id: "entry_status",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "+905550001122", phone_number_id: "phone_123" },
              statuses: [
                {
                  id: "wamid_status_123",
                  status: "read",
                  timestamp: "1729000010",
                  recipient_id: onboardingPhone
                }
              ]
            }
          }
        ]
      }
    ]
  });

  const statusHmac = crypto.createHmac("sha256", appSecret).update(statusWebhookBody).digest("hex");

  const statusReq = new NextRequest("http://localhost:3000/api/webhook/whatsapp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hub-signature-256": `sha256=${statusHmac}`
    },
    body: statusWebhookBody
  });
  const statusRes = await webhookRoute.POST(statusReq);
  assert(statusRes.status === 200, "Status update returns 200 OK");
  const statusJson = await statusRes.json();
  assert(statusJson.status === "ignored", "Status update is gracefully ignored (status: ignored)");

  // 7. Idempotency & Retry Storm Protection
  console.log("\n[7] Testing Idempotency & Retry Storm Protection...");
  const stormMessageId = `wamid_storm_${Date.now()}`;

  const res1 = await processIncomingMessage({
    phoneNumber: onboardingPhone,
    text: "Gönlüm çok daralıyor, borçlarım var.",
    messageId: stormMessageId
  });
  assert(res1.status === "processed", "First delivery of message is processed");

  const res2 = await processIncomingMessage({
    phoneNumber: onboardingPhone,
    text: "Gönlüm çok daralıyor, borçlarım var.",
    messageId: stormMessageId
  });
  assert(res2.status === "idempotent_skipped", "Duplicate delivery with same waMessageId is skipped (idempotent_skipped)");

  console.log("\n=======================================================");
  console.log(`PHASE 4 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Unhandled error in Phase 4 test runner:", err);
  process.exit(1);
});
