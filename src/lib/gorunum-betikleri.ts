/**
 * Sayfa boyanmadan önce <head> içinde çalışan küçük betikler (yazı boyutu + tema).
 * Bu dosya "use client" DEĞİLDİR: sunucu bileşeni olan layout metni doğrudan okuyabilsin.
 * (İstemci dosyasından alınan sabit, sunucuda gerçek metin yerine istemci referansına dönüşür.)
 */
export const YAZI_ANAHTAR = "mp-yazi-boyutu";
export const YAZI_KADEME_SAYISI = 4;
export const TEMA_ANAHTAR = "mp-tema";

export const yaziBoyutuBetigi = `(function(){try{var k=localStorage.getItem("${YAZI_ANAHTAR}");if(k!==null&&/^[0-${YAZI_KADEME_SAYISI - 1}]$/.test(k)){document.documentElement.setAttribute("data-yazi",k);}}catch(e){}})();`;

export const temaBetigi = `(function(){try{var t=localStorage.getItem("${TEMA_ANAHTAR}");if(t==="gunduz"||t==="yuksek"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;
