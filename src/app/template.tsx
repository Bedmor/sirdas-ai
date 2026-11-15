import React from "react";

/**
 * Her sayfa geçişinde yeniden kurulur: içerik hafifçe belirir (yalnız saydamlık; konum değişmez,
 * böylece sabit konumlu sohbet paneli ve alt çubuklar etkilenmez). Hareket azaltma tercihine uyar.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="mp-sayfa-gecis">{children}</div>;
}
