import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+905550200605";
  const cleanWaNumber = waNumber.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${cleanWaNumber}?text=Selamun%20Aleykum`;

  return (
    <footer
      className="w-full bg-surface-container-lowest border-t border-outline-variant/30 pt-12 pb-8"
      role="contentinfo"
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
          {/* Brand & Philosophy */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant/60 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
                <Image
                  src="/icon.png"
                  alt="Sırdaş AI Logosu"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-heading text-xl font-bold text-primary">Sırdaş AI</span>
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            </div>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed" lang="tr">
              Kadim İslami hikmet ile güncel yapay zekayı birleştiren; yargılamayan, dinleyen,
              sekinet veren mahrem bir manevi sığınak.
            </p>
            <div className="pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-secondary hover:text-emerald-300 transition-colors"
              >
                <i aria-hidden="true" className="ph ph-whatsapp-logo text-base"></i>
                <span>WhatsApp ile Doğrudan Bağlan</span>
              </a>
            </div>
          </div>

          {/* Legal / Spiritual Frame */}
          <div className="md:col-span-4 flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              Manevi Çerçeve &amp; Sınırlar
            </span>
            <p className="text-xs text-slate-300 leading-relaxed" lang="tr">
              Sırdaş AI bir fetva makamı veya tıbbi tedavi mercii değildir. Fıkhi meselelerde
              Diyanet İşleri Başkanlığı&apos;nın resmi fetva hattı (Alo 190), acil durumlarda 112
              Acil Çağrı servisleri esastır.
            </p>
            <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
              <Link
                href="/sorumluluk-reddi"
                className="hover:text-primary transition-colors underline underline-offset-4"
              >
                Sorumluluk Reddi
              </Link>
              <Link
                href="/gizlilik-politikasi"
                className="hover:text-primary transition-colors underline underline-offset-4"
              >
                Gizlilik Politikası (KVKK)
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              Tefekkür Köşeleri
            </span>
            <ul className="flex flex-col gap-1.5 text-xs text-slate-300">
              <li>
                <Link
                  className="hover:text-on-surface transition-colors rounded focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                  href="/#sohbet-alani"
                >
                  WhatsApp Arayüzü
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-on-surface transition-colors rounded focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                  href="/#sohbet-ornekleri"
                >
                  Tefekkür Senaryoları
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-on-surface transition-colors rounded focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                  href="/askida-sirdas"
                >
                  Askıda Sırdaş
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-on-surface transition-colors rounded focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                  href="/#gayemiz"
                >
                  Gayemiz
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-on-surface transition-colors rounded focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none text-primary/80"
                  href="/admin"
                >
                  Yönetim Konsolu
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
          <p>© {currentYear} Sırdaş AI. Gönüllere sekinet niyetiyle hazırlanmıştır.</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Sekinet Hali Aktif
            </span>
            <span aria-hidden="true">•</span>
            <span>Seher &amp; Gece Tefekkürü</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
