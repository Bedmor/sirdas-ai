/**
 * Sohbeti bilgisayara/telefona düz metin (.txt) olarak kaydetme.
 * Kaynak: Adnan Bey 19.11 isteği ("kullanıcı sohbetin yedeğini kendi PC'sine kopyalayabilsin").
 *
 * Gizlilik: metin yalnız kullanıcının cihazında oluşturulur, sunucuya gitmez.
 */
import { vurguIsaretleriniTemizle } from "./paylas";

export interface DisaAktarilacakMesaj {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface DisaAktarilacakSohbet {
  title: string;
  messages: ReadonlyArray<DisaAktarilacakMesaj>;
}

function tarihSaat(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const iki = (n: number) => String(n).padStart(2, "0");
  return `${iki(d.getDate())}.${iki(d.getMonth() + 1)}.${d.getFullYear()} ${iki(d.getHours())}:${iki(d.getMinutes())}`;
}

/** Sohbeti okunaklı düz metne çevirir. */
export function sohbetMetni(sohbet: DisaAktarilacakSohbet, simdi: Date = new Date()): string {
  const satirlar: string[] = [
    "Manevi Pusula - Sohbet Kaydı",
    `Konu: ${sohbet.title || "Sohbet"}`,
    `Kaydedilme: ${tarihSaat(simdi.toISOString())}`,
    "",
  ];
  for (const m of sohbet.messages) {
    const metin = vurguIsaretleriniTemizle(m.content ?? "").trim();
    if (!metin) continue;
    const kim = m.role === "user" ? "Siz" : "Sırdaş";
    const zaman = tarihSaat(m.createdAt);
    satirlar.push(`${kim}${zaman ? ` (${zaman})` : ""}:`, metin, "");
  }
  satirlar.push(
    "Not: Bu kayıt yalnız sizin cihazınızda oluşturuldu. Sırdaş bir yapay zekâdır; fıkhi hükümler için Diyanet İşleri Başkanlığı Alo 190 Fetva Hattı'na danışınız."
  );
  return satirlar.join("\n");
}

/** Dosya adı: manevi-pusula-sohbet-GG-AA-YYYY.txt */
export function sohbetDosyaAdi(simdi: Date = new Date()): string {
  const iki = (n: number) => String(n).padStart(2, "0");
  return `manevi-pusula-sohbet-${iki(simdi.getDate())}-${iki(simdi.getMonth() + 1)}-${simdi.getFullYear()}.txt`;
}

/** Tarayıcıda .txt dosyasını indirir. */
export function sohbetiIndir(sohbet: DisaAktarilacakSohbet): void {
  if (typeof document === "undefined") return;
  const blob = new Blob(["﻿" + sohbetMetni(sohbet)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = sohbetDosyaAdi();
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
