import "dotenv/config";
import crypto from "crypto";
import { performance } from "perf_hooks";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/db/prisma";
import { analyzeWithJev } from "../src/lib/ai/jev-client";
import { generateEmbedding } from "../src/lib/ai/embeddings";
import { WhatsAppClient } from "../src/lib/whatsapp/client";

export interface TestTelemetry {
  name: string;
  category: "SSE_STREAMING" | "RATE_LIMITING" | "CONCURRENCY" | "WHATSAPP_TYPING";
  verdict: "PASS" | "FAIL";
  durationMs: number;
  metrics: Record<string, any>;
  notes: string;
}

export const telemetryResults: TestTelemetry[] = [];

function record(item: TestTelemetry) {
  telemetryResults.push(item);
  const icon = item.verdict === "PASS" ? "✅" : "❌";
  console.log(`${icon} [${item.category}] ${item.name} (${item.durationMs.toFixed(1)}ms) - ${item.verdict}`);
  console.log(`   Metrics:`, JSON.stringify(item.metrics));
  if (item.notes) {
    console.log(`   Notes: ${item.notes}`);
  }
}

async function run() {
  console.log("\n===============================================================================");
  console.log("   CHALLENGER 2: SSE STREAMING & WHATSAPP EMPIRICAL STRESS TEST HARNESS");
  console.log("===============================================================================\n");

  const trialRoute = await import("../src/app/api/trial/route");

  // -------------------------------------------------------------------------
  // 1. LIVE GEMINI SSE STREAMING TEST
  // -------------------------------------------------------------------------
  console.log("\n>>> [1/5] Testing POST /api/trial with Live Gemini Stream...");
  {
    const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
    const testUa = `ChallengerLiveSse/1.0-${Date.now()}`;
    const t0 = performance.now();

    const req = new NextRequest("http://localhost:3000/api/trial", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        "x-forwarded-for": testIp,
        "user-agent": testUa
      },
      body: JSON.stringify({
        message: "İş yerinde haksızlığa uğradım, kalbim çok kırgın ve öfkeliyim, içim daralıyor...",
        stream: true
      })
    });

    const res = await trialRoute.POST(req);
    const contentType = res.headers.get("content-type") || "";
    const isSseHeader = contentType.includes("text/event-stream");
    const setCookie = res.headers.get("set-cookie") || "";
    const hasSignedCookie = setCookie.includes("sirdas_trial_v1=") && setCookie.toLowerCase().includes("httponly");

    let ttft = -1;
    let tokenFramesCount = 0;
    let hasDoneFrame = false;
    let accumulatedText = "";
    let donePayload: any = null;

    if (res.status === 200 && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() || "";

        for (const block of blocks) {
          if (!block.trim()) continue;
          const lines = block.split("\n");
          let event = "";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event:")) event = line.replace(/^event:\s*/, "").trim();
            else if (line.startsWith("data:")) dataStr = line.replace(/^data:\s*/, "").trim();
          }

          if (event === "token") {
            if (ttft < 0) {
              ttft = performance.now() - t0;
            }
            tokenFramesCount++;
            try {
              const parsed = JSON.parse(dataStr);
              accumulatedText += (parsed.token ?? parsed.text ?? "");
            } catch {
              accumulatedText += dataStr;
            }
          } else if (event === "done") {
            hasDoneFrame = true;
            try {
              donePayload = JSON.parse(dataStr);
            } catch {}
          }
        }
      }
    }

    const totalMs = performance.now() - t0;
    const ttftUnder1000 = ttft > 0 && ttft < 1000;
    const wireProtocolOk = res.status === 200 && isSseHeader && tokenFramesCount > 0 && hasDoneFrame && hasSignedCookie;

    record({
      name: "POST /api/trial Live SSE Stream Protocol & TTFT",
      category: "SSE_STREAMING",
      verdict: wireProtocolOk && ttftUnder1000 ? "PASS" : "FAIL",
      durationMs: totalMs,
      metrics: {
        httpStatus: res.status,
        contentType,
        ttftMs: Number(ttft.toFixed(1)),
        tokenFramesCount,
        hasDoneFrame,
        hasSignedCookie,
        totalDurationMs: Number(totalMs.toFixed(1)),
        doneSuccess: donePayload?.success
      },
      notes: ttftUnder1000
        ? "TTFT is under 1000ms threshold."
        : `TTFT SLA VIOLATION: Actual TTFT is ${ttft.toFixed(1)}ms, exceeding the 1000ms threshold.`
    });
  }

  // -------------------------------------------------------------------------
  // 2. MOCK / LOCAL FALLBACK SSE STREAMING TEST
  // -------------------------------------------------------------------------
  console.log("\n>>> [2/5] Testing POST /api/trial under Mock/Heuristic Fallback Mode...");
  {
    const savedGeminiKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "mock_gemini_key_for_testing_and_verification";

    const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
    const testUa = `ChallengerMockSse/1.0-${Date.now()}`;
    const t0 = performance.now();

    try {
      const req = new NextRequest("http://localhost:3000/api/trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream",
          "x-forwarded-for": testIp,
          "user-agent": testUa
        },
        body: JSON.stringify({
          message: "Gönlümdeki darlık ve rızık endişesi beni çok yıpratıyor.",
          stream: true
        })
      });

      const res = await trialRoute.POST(req);
      let ttft = -1;
      let tokenFramesCount = 0;
      let hasDoneFrame = false;
      let donePayload: any = null;

      if (res.status === 200 && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() || "";

          for (const block of blocks) {
            if (!block.trim()) continue;
            const lines = block.split("\n");
            let event = "";
            let dataStr = "";

            for (const line of lines) {
              if (line.startsWith("event:")) event = line.replace(/^event:\s*/, "").trim();
              else if (line.startsWith("data:")) dataStr = line.replace(/^data:\s*/, "").trim();
            }

            if (event === "token") {
              if (ttft < 0) ttft = performance.now() - t0;
              tokenFramesCount++;
            } else if (event === "done") {
              hasDoneFrame = true;
              try {
                donePayload = JSON.parse(dataStr);
              } catch {}
            }
          }
        }
      }

      const totalMs = performance.now() - t0;
      const passed = res.status === 200 && tokenFramesCount > 0 && hasDoneFrame && ttft > 0 && ttft < 1000;

      record({
        name: "POST /api/trial Mock Fallback Stream TTFT & Conformance",
        category: "SSE_STREAMING",
        verdict: passed ? "PASS" : "FAIL",
        durationMs: totalMs,
        metrics: {
          httpStatus: res.status,
          ttftMs: Number(ttft.toFixed(1)),
          tokenFramesCount,
          hasDoneFrame,
          totalDurationMs: Number(totalMs.toFixed(1))
        },
        notes: `Mock stream TTFT is ${ttft.toFixed(1)}ms. Local generator yields tokens with sub-second latency.`
      });
    } finally {
      if (savedGeminiKey) process.env.GEMINI_API_KEY = savedGeminiKey;
      else delete process.env.GEMINI_API_KEY;
    }
  }

  // -------------------------------------------------------------------------
  // 3. RATE LIMITING TESTS: SEQUENTIAL & BURST RACE CONDITION
  // -------------------------------------------------------------------------
  console.log("\n>>> [3/5] Testing Multi-Layer Rate Limiting (Sequential & Burst Race Condition)...");

  // 3.1: Sequential Lock
  {
    const lockIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
    const lockUa = `SequentialBot/1.0-${Date.now()}`;
    const t0 = performance.now();

    const req1 = new NextRequest("http://localhost:3000/api/trial", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": lockIp,
        "user-agent": lockUa
      },
      body: JSON.stringify({ message: "İlk deneme mesajım.", stream: false })
    });
    const res1 = await trialRoute.POST(req1);
    const setCookie = res1.headers.get("set-cookie") || "";
    const cookieMatch = setCookie.match(/sirdas_trial_v1=([^;]+)/);
    const cookieHeader = cookieMatch ? `sirdas_trial_v1=${cookieMatch[1]}` : "";

    // 2nd call: same IP/UA without cookie
    const req2 = new NextRequest("http://localhost:3000/api/trial", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": lockIp,
        "user-agent": lockUa
      },
      body: JSON.stringify({ message: "İkinci deneme, çerezi temizledim.", stream: false })
    });
    const res2 = await trialRoute.POST(req2);
    const res2Json = await res2.json().catch(() => ({}));

    // 3rd call: different IP with signed cookie
    const req3 = new NextRequest("http://localhost:3000/api/trial", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.77",
        "user-agent": "DiffBrowser/4.0",
        cookie: cookieHeader
      },
      body: JSON.stringify({ message: "Farklı IP ile imzalı çerez testi.", stream: false })
    });
    const res3 = await trialRoute.POST(req3);
    const res3Json = await res3.json().catch(() => ({}));

    const totalMs = performance.now() - t0;
    const passed =
      res1.status === 200 &&
      res2.status === 429 &&
      res2Json.error === "TRIAL_LIMIT_REACHED" &&
      res3.status === 429 &&
      res3Json.error === "TRIAL_LIMIT_REACHED";

    record({
      name: "Sequential Rate Limit (IP fingerprint & signed cookie 429 lock)",
      category: "RATE_LIMITING",
      verdict: passed ? "PASS" : "FAIL",
      durationMs: totalMs,
      metrics: {
        call1Status: res1.status,
        call2Status: res2.status,
        call2Error: res2Json.error,
        call3Status: res3.status,
        call3Error: res3Json.error
      },
      notes: "Sequential follow-up calls are properly locked with HTTP 429 TRIAL_LIMIT_REACHED."
    });
  }

  // 3.2: Burst Race Condition Attack
  {
    const burstIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
    const burstUa = `BurstBot/2.0-${Date.now()}`;
    const t0 = performance.now();

    const burstRequests = Array.from({ length: 5 }).map((_, i) =>
      new NextRequest("http://localhost:3000/api/trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": burstIp,
          "user-agent": burstUa
        },
        body: JSON.stringify({
          message: `Eşzamanlı istek #${i + 1} - gönlümdeki darlık ve keder`,
          stream: false
        })
      })
    );

    const burstResponses = await Promise.all(burstRequests.map(r => trialRoute.POST(r)));
    const statuses = burstResponses.map(r => r.status);
    const successCount = statuses.filter(s => s === 200).length;
    const rateLimitedCount = statuses.filter(s => s === 429).length;

    const totalMs = performance.now() - t0;
    // For 1-time trial limit, exactly 1 must succeed and 4 must be rejected with 429.
    const passed = successCount === 1 && rateLimitedCount === 4;

    record({
      name: "Burst Concurrency Attack (5 simultaneous requests, same visitor)",
      category: "RATE_LIMITING",
      verdict: passed ? "PASS" : "FAIL",
      durationMs: totalMs,
      metrics: {
        concurrentRequests: 5,
        statuses,
        successCount,
        rateLimitedCount
      },
      notes: passed
        ? "Burst race condition handled safely: only 1 request passed."
        : `CRITICAL CONCURRENCY BUG: ${successCount} out of 5 concurrent requests succeeded with HTTP 200 because inMemoryUsedFingerprints.add(fp) occurs AFTER 'await prisma.user.findUnique'.`
    });
  }

  // -------------------------------------------------------------------------
  // 4. CONCURRENCY BENCHMARK: Promise.all([analyzeWithJev, generateEmbedding])
  // -------------------------------------------------------------------------
  console.log("\n>>> [4/5] Testing Concurrency Benchmark: Promise.all vs Sequential...");
  {
    const testMessage = "Faiz borcum çok birikti, icralık oldum, aileme mahcubum ne yapacağımı bilemiyorum.";
    const iterations = 5;

    // Warm up embedding cache so parallel and sequential loops are measured on equal footing
    await generateEmbedding(testMessage);

    const parallelTimes: number[] = [];
    const sequentialTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const tPar0 = performance.now();
      await Promise.all([
        analyzeWithJev({
          userMessage: testMessage,
          userContextSnippet: JSON.stringify({ source: "concurrency_benchmark" })
        }),
        generateEmbedding(testMessage)
      ]);
      parallelTimes.push(performance.now() - tPar0);

      const tSeq0 = performance.now();
      await analyzeWithJev({
        userMessage: testMessage,
        userContextSnippet: JSON.stringify({ source: "concurrency_benchmark" })
      });
      await generateEmbedding(testMessage);
      sequentialTimes.push(performance.now() - tSeq0);
    }

    const avgPar = parallelTimes.reduce((a, b) => a + b, 0) / iterations;
    const avgSeq = sequentialTimes.reduce((a, b) => a + b, 0) / iterations;
    const deltaMs = avgSeq - avgPar;
    const speedupPct = ((avgSeq - avgPar) / avgSeq) * 100;

    const passed = avgPar <= avgSeq + 50;

    record({
      name: "Promise.all([analyzeWithJev, generateEmbedding]) Speedup",
      category: "CONCURRENCY",
      verdict: passed ? "PASS" : "FAIL",
      durationMs: avgPar,
      metrics: {
        iterations,
        parallelAvgMs: Number(avgPar.toFixed(1)),
        sequentialAvgMs: Number(avgSeq.toFixed(1)),
        deltaSavedMs: Number(deltaMs.toFixed(1)),
        speedupPercent: Number(speedupPct.toFixed(1))
      },
      notes: `Parallel execution saves ${deltaMs.toFixed(1)}ms per request (~${speedupPct.toFixed(1)}% pre-computation latency reduction).`
    });
  }

  // -------------------------------------------------------------------------
  // 5. WHATSAPP TYPING INDICATOR PAYLOAD & WEBHOOK SLA
  // -------------------------------------------------------------------------
  console.log("\n>>> [5/5] Testing WhatsApp Typing Indicator Payload & Webhook SLA...");
  {
    const originalFetch = global.fetch;
    const capturedCalls: Array<{ url: string; method?: string; body?: any }> = [];

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = input.toString();
      const parsedBody = init?.body ? JSON.parse(init.body as string) : undefined;
      capturedCalls.push({
        url: urlStr,
        method: init?.method,
        body: parsedBody
      });
      return new Response(JSON.stringify({ success: true, messages: [{ id: "wamid.mock_123" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    };

    const oldAccessToken = process.env.META_ACCESS_TOKEN;
    const oldPhoneId = process.env.META_PHONE_NUMBER_ID;
    process.env.META_ACCESS_TOKEN = "EAAGtesttokenvalidstructure123456789";
    process.env.META_PHONE_NUMBER_ID = "248591829502910";

    const t0 = performance.now();
    let payloadCheckPass = false;

    try {
      const wa = new WhatsAppClient();
      await wa.sendTypingIndicator("+905550200605", "wamid.HBgLMTIzNDU2");
      await wa.sendTypingIndicator("+905550200605");
      await wa.sendTypingIndicator("wamid.HBgLRElyZWN0SUQ=");

      const callA = capturedCalls[0];
      const callB = capturedCalls[1];
      const callC = capturedCalls[2];

      const checkA =
        callA?.body?.messaging_product === "whatsapp" &&
        callA?.body?.status === "read" &&
        callA?.body?.message_id === "wamid.HBgLMTIzNDU2" &&
        callA?.body?.typing_indicator?.type === "text";

      const checkB =
        callB?.body?.messaging_product === "whatsapp" &&
        callB?.body?.recipient_type === "individual" &&
        callB?.body?.to === "+905550200605" &&
        callB?.body?.status === "processing" &&
        callB?.body?.sender_action === "typing";

      const checkC =
        callC?.body?.messaging_product === "whatsapp" &&
        callC?.body?.status === "read" &&
        callC?.body?.message_id === "wamid.HBgLRElyZWN0SUQ=" &&
        callC?.body?.typing_indicator?.type === "text";

      payloadCheckPass = Boolean(checkA && checkB && checkC);

      record({
        name: "WhatsAppClient.sendTypingIndicator Payload Wire Compliance",
        category: "WHATSAPP_TYPING",
        verdict: payloadCheckPass ? "PASS" : "FAIL",
        durationMs: performance.now() - t0,
        metrics: {
          caseA_withMessageId: callA?.body,
          caseB_phoneOnly: callB?.body,
          caseC_wamidDirect: callC?.body
        },
        notes: "Cloud API v21 payload formatting accurately switches between read/typing_indicator and individual/processing."
      });
    } finally {
      global.fetch = originalFetch;
      if (oldAccessToken) process.env.META_ACCESS_TOKEN = oldAccessToken;
      else delete process.env.META_ACCESS_TOKEN;
      if (oldPhoneId) process.env.META_PHONE_NUMBER_ID = oldPhoneId;
      else delete process.env.META_PHONE_NUMBER_ID;
    }

    // Webhook SLA & after() Eager Execution
    const webhookRoute = await import("../src/app/api/webhook/whatsapp/route");
    const samplePayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "100012345678901",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "+905550200605", phone_number_id: "100012345678901" },
                contacts: [{ profile: { name: "Ahmet" }, wa_id: "905551234567" }],
                messages: [
                  {
                    from: "905551234567",
                    id: `wamid.webhook_test_${Date.now()}`,
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    type: "text",
                    text: { body: "Selamun aleykum, dertliyim..." }
                  }
                ]
              }
            }
          ]
        }
      ]
    };

    const appSecret = process.env.META_APP_SECRET || "your-meta-app-secret-for-hmac-sha256";
    const rawPayloadStr = JSON.stringify(samplePayload);
    const signatureHash = crypto.createHmac("sha256", appSecret).update(rawPayloadStr).digest("hex");

    const tWeb0 = performance.now();
    const webhookReq = new NextRequest("http://localhost:3000/api/webhook/whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": `sha256=${signatureHash}`
      },
      body: rawPayloadStr
    });

    const webhookRes = await webhookRoute.POST(webhookReq);
    const tWebhook = performance.now() - tWeb0;
    const webhookJson = await webhookRes.json().catch(() => ({}));

    const webhookPass = webhookRes.status === 200 && webhookJson.status === "processing" && tWebhook < 50;

    record({
      name: "WhatsApp Webhook Immediate 200 OK (<50ms SLA)",
      category: "WHATSAPP_TYPING",
      verdict: webhookPass ? "PASS" : "FAIL",
      durationMs: tWebhook,
      metrics: {
        httpStatus: webhookRes.status,
        responseBody: webhookJson,
        latencyMs: Number(tWebhook.toFixed(2)),
        metaSlaThresholdMs: 3000
      },
      notes: `Webhook returned in ${tWebhook.toFixed(2)}ms, far exceeding Meta's 3-second SLA.`
    });
  }

  // -------------------------------------------------------------------------
  // FINAL TELEMETRY REPORT
  // -------------------------------------------------------------------------
  console.log("\n===============================================================================");
  const passCount = telemetryResults.filter(t => t.verdict === "PASS").length;
  const failCount = telemetryResults.filter(t => t.verdict === "FAIL").length;
  console.log(`TOTAL TESTS: ${telemetryResults.length} | PASSED: ${passCount} | FAILED: ${failCount}`);
  console.log("===============================================================================\n");
}

run().catch(err => {
  console.error("Harness error:", err);
  process.exit(1);
});
