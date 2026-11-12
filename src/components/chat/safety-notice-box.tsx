import React from "react";

export interface SafetyNoticeHotline {
  number: string;
  label: string;
  description?: string;
}

export interface SafetyNoticeData {
  kind: "crisis" | "health" | "child" | "fatwa";
  title: string;
  message: string;
  hotlines: SafetyNoticeHotline[];
}

const KIND_STYLES: Record<
  SafetyNoticeData["kind"],
  { box: string; title: string; button: string }
> = {
  crisis: {
    box: "mp-kriz bg-red-950/60 border-red-500/50",
    title: "text-red-100",
    button:
      "bg-[#b91c1c] hover:bg-[#991b1b] text-[#fff] border-red-400/60",
  },
  health: {
    box: "bg-blue-950/90 border-blue-400/40",
    title: "text-blue-100",
    button:
      "bg-[#1d4ed8] hover:bg-[#1e40af] text-[#fff] border-blue-400/50",
  },
  child: {
    box: "bg-amber-950/60 border-amber-400/40",
    title: "text-amber-100",
    button:
      "bg-[#b45309] hover:bg-[#92400e] text-[#fff] border-amber-300/50",
  },
  fatwa: {
    box: "bg-secondary-container/80 border-secondary/40",
    title: "text-on-surface",
    button:
      "bg-surface-container-high hover:bg-surface-container-highest text-on-surface border-outline-variant/60",
  },
};

export function isSafetyNoticeData(value: unknown): value is SafetyNoticeData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    (v.kind === "crisis" ||
      v.kind === "health" ||
      v.kind === "child" ||
      v.kind === "fatwa") &&
    typeof v.title === "string" &&
    typeof v.message === "string" &&
    Array.isArray(v.hotlines)
  );
}

/**
 * Kriz, sağlık, çocuk veya fetva sınırı durumlarında yanıtın altında görünen
 * uyarı kutusu. Hat numaraları tek dokunuşla arama (tel:) bağlantısıdır.
 */
export function SafetyNoticeBox({ notice }: { notice: SafetyNoticeData }) {
  const style = KIND_STYLES[notice.kind] ?? KIND_STYLES.crisis;
  const isUrgent = notice.kind === "crisis";

  return (
    <aside
      aria-label={notice.title}
      role={isUrgent ? "alert" : "note"}
      className={`rounded-[22px] border px-4 py-3.5 shadow-m3-1 ${style.box}`}
      lang="tr"
    >
      <p className={`text-sm font-semibold ${style.title}`}>{notice.title}</p>
      <p className="mt-1 text-[13px] leading-snug text-slate-200">
        {notice.message}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {notice.hotlines
          .filter((h) => /^\d{3}$/.test(h.number))
          .map((h) => (
            <a
              key={h.number}
              href={`tel:${h.number}`}
              aria-label={`${h.label} hattını ara`}
              title={h.description}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${style.button}`}
            >
              <span aria-hidden="true" className="text-base leading-none">
                &#9742;
              </span>
              <span>{h.label}</span>
            </a>
          ))}
      </div>
    </aside>
  );
}
