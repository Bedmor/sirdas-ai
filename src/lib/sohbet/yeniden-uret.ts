/**
 * "Yeniden üret": son asistan cevabını, aynı kullanıcı sorusunu yeniden göndererek yeniler.
 * Kriz yönlendirmesi ve güvenlik uyarısı taşıyan cevaplar yeniden üretilmez
 * (güvenlik akışı her seferinde aynı kalmalı; "zar atar gibi" başka cevap aranmaz).
 */

type MesajBenzeri = {
  role: "user" | "assistant";
  content: string;
  status?: string;
  safety?: { kind?: string } | null;
};

export type YenidenUretPlani<M> = {
  /** Yeniden gönderilecek kullanıcı sorusu (aynen) */
  soru: string;
  /** Sorudan önceki mesajlar: yeni istek bu geçmişle gider */
  oncekiMesajlar: M[];
  /** Soru mesajının kendisi (kimliği korunur) */
  soruMesaji: M;
};

/** Bu cevap için "Yeniden üret" gösterilebilir mi (güvenlik akışları hariç). */
export function yenidenUretilebilirMi(m: MesajBenzeri | undefined): boolean {
  if (!m || m.role !== "assistant" || !m.content.trim()) return false;
  if (m.status === "crisis_redirected") return false;
  if (m.safety && m.safety.kind === "crisis") return false;
  return true;
}

/**
 * Son mesaj asistan cevabı ve hemen öncesi kullanıcı sorusuysa planı döndürür.
 * Arada başka bir mesaj varsa (beklenmez) soru belirsizdir, null döner.
 */
export function yenidenUretPlani<M extends MesajBenzeri>(mesajlar: readonly M[]): YenidenUretPlani<M> | null {
  const i = mesajlar.length - 2;
  if (i < 0 || !yenidenUretilebilirMi(mesajlar[i + 1])) return null;
  const soruMesaji = mesajlar[i];
  if (soruMesaji.role !== "user" || soruMesaji.content.trim().length < 2) return null;
  return { soru: soruMesaji.content.trim(), oncekiMesajlar: mesajlar.slice(0, i), soruMesaji };
}
