"use client";

/** Kök düzende hata olursa (en kötü durum) sade, kendi başına çalışan hata ekranı. */
export default function KokHata({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="tr" translate="no">
      <body style={{ margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b1714", color: "#e7efe9", fontFamily: "system-ui, sans-serif", padding: 20 }}>
        <div style={{ maxWidth: 420, textAlign: "center", lineHeight: 1.6 }}>
          <h1 style={{ fontSize: 22 }}>Manevi Pusula açılırken bir sorun oldu</h1>
          <p style={{ fontSize: 15, opacity: 0.85 }}>
            Çoğu zaman sebep tarayıcıdaki bir eklentidir. Eklentileri bu site için kapatın, gizli sekmede açın ya da başka bir tarayıcı deneyin.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ marginTop: 12, padding: "10px 22px", borderRadius: 999, border: 0, background: "#d4b062", color: "#1b1405", fontWeight: 600, fontSize: 15 }}
          >
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
