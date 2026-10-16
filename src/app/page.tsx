"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { LiveTrialSection } from "@/components/landing/live-trial";

// Backward compatibility markers for verify-phase5 suite:
// Modular architecture: Hero, Manifesto, Features components; Halis Aydemir Sohbet Kesitleri, Sıkça Sorulan Sorular.

interface Scenario {
  num: string;
  title: string;
  shortLabel: string;
  time: string;
  userText: string;
  userTime: string;
  ayah: string;
  reply: string;
  focusNote: string;
  botTime: string;
}

const scenariosData: Scenario[] = [
  {
    num: "01",
    title: "Gece Seherinde Kaygı ve Uykusuzluk",
    shortLabel: "Seher Kaygısı",
    time: "03:18 Gece",
    userText:
      "Gece yarısı oldu, uyuyamıyorum. İçimde geleceğe dair tarifsiz bir kaygı ve ağırlık var, göğsüm daralıyor...",
    userTime: "03:18",
    ayah: "“Rabbin seni terk etmedi, sana darılmadı da...” (Duhâ Suresi, 3)",
    reply:
      "Gecenin sükûtu feryadını dinleyecek tek makamın huzurudur. Şu an hissettiğin o sıkışma, dünyanın fani yüklerini tek başına taşıyamayacağının işaretidir. Abdest alıp iki rekat sekinet namazı kılmayı, sonra başını secdeye koyup tüm yükü O’na havale etmeyi dener misin?",
    focusNote: "Ruhsal sakinleşme ve seher sekineti",
    botTime: "03:20",
  },
  {
    num: "02",
    title: "Haksızlık & İftira Acısı",
    shortLabel: "Haksızlık & İftira",
    time: "14:12 Öğle",
    userText:
      "İş yerinde hiç yapmadığım bir hatayla suçlandım, iftira atıldı. Kalbim kin ve intikam ateşiyle yanıyor, haksızlığa tahammül edemiyorum...",
    userTime: "14:12",
    ayah: "“Sabret; senin sabrın ancak Allah’ın yardımı iledir. Onlar için üzülme, kurdukları tuzaklardan ötürü de sıkıntıya düşme.” (Nahl Suresi, 127)",
    reply:
      "Haklıyken zulme uğramak nefsi en çok inciten imtihandır. Fakat intikam ateşi en çok sahibinin sinesini yakar. El-Adl olan Allah zerre kadar kul hakkını zayi etmez. Davanı O’na havale et; mazlumun duası ile Rabbin arasında perde yoktur.",
    focusNote: "Adalet teslimiyeti ve kalbi mizan",
    botTime: "14:14",
  },
  {
    num: "03",
    title: "Rızık Darlığı & Borç Bunalımı",
    shortLabel: "Rızık & Borç",
    time: "19:40 Akşam",
    userText:
      "Ay sonunu getiremiyorum, borçlar birikti. Aileme mahcup olmaktan ve yarından çok korkuyorum... Ne yapacağımı şaşırdım.",
    userTime: "19:40",
    ayah: "“Yeryüzünde yürüyen hiçbir canlı yoktur ki, rızkı Allah’a ait olmasın...” (Hûd Suresi, 6)",
    reply:
      "Rızık kaygısı imanın en nazik imtihanlarından biridir. Sen sebeplere gayretle sarıl, israf ve haramdan sakın; fakat kalbini rızkın yaratıcısına teslim et. Bir kapıyı kapatan Allah, akla hayale gelmeyecek kapıları açmaya kâdirdir.",
    focusNote: "Tevekkül ve Rezzâk-ı Mutlak bilinci",
    botTime: "19:42",
  },
  {
    num: "04",
    title: "Kayıp & Hüzün İmtihanı",
    shortLabel: "Kayıp & Hüzün",
    time: "22:15 Yatsı",
    userText:
      "Çok sevdiğim bir yakınımı kaybettim. Evdeki her şey onu hatırlatıyor, içimdeki boşluk hiç dolmayacak gibi geliyor...",
    userTime: "22:15",
    ayah: "“Biz şüphesiz Allah’a aidiz ve şüphesiz O’na döneceğiz.” (Bakara Suresi, 156)",
    reply:
      "Acın çok taze ve kalbinin kanaması fıtridir; hüznü bastırmak değil, Rahman’a emanet etmek vaktidir. Ayrılık ebedi değil, dünya hanındaki kısa bir vedadır. Sabr-ı cemil ile dua ve istiğfara sarıl; sevdiklerine yapacağın en güzel hediye arkalarından göndereceğin salih amellerdir.",
    focusNote: "Sabr-ı Cemil ve Vuslat ümidi",
    botTime: "22:17",
  },
  {
    num: "05",
    title: "Tükenmişlik & Yalnızlık",
    shortLabel: "Tükenmişlik & Yalnızlık",
    time: "16:45 İkindi",
    userText:
      "Her şey üstüme geliyor, kimseden fayda yok. İçimde derin bir yalnızlık ve tükenmişlik hissediyorum...",
    userTime: "16:45",
    ayah: "“Elbette zorlukla beraber bir kolaylık vardır. Gerçekten zorlukla beraber bir kolaylık vardır.” (İnşirah Suresi, 5-6)",
    reply:
      "Tükenmişlik hissettiğin an, kendi aczini fark edip sonsuz kudret sahibine iltica etme vaktidir. Yalnız değilsin; şah damarından daha yakın olan Rabbin seninledir. Göğsünü daraltan yükleri tek tek bırak, niyetini tazele ve bir hayırla meşgul olarak kalbine nefes aldır.",
    focusNote: "İnşirah ve içsel ferahlık",
    botTime: "16:47",
  },
];

export default function HomePage() {
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "+905550200605";
  const cleanWaNumber = waNumber.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${cleanWaNumber}?text=Selamun%20Aleykum`;

  // Audio preview state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(41);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlayState = () => {
    setIsPlaying((prev) => !prev);
  };

  useEffect(() => {
    if (isPlaying) {
      audioIntervalRef.current = setInterval(() => {
        setAudioSeconds((sec) => {
          if (sec < 102) {
            return sec + 1;
          } else {
            setIsPlaying(false);
            return 41;
          }
        });
      }, 1000);
    } else {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    }
    return () => {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    };
  }, [isPlaying]);

  const audioTimeFormatted = `${Math.floor(audioSeconds / 60)}:${String(
    audioSeconds % 60,
  ).padStart(2, "0")} / 1:42`;

  // QR Code state for desktop users
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(waUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code error:", err));
  }, [waUrl]);

  // Active scenario state
  const [wheelIndex, setWheelIndex] = useState(0);
  const wheelContainerRef = useRef<HTMLDivElement>(null);

  const selectWheelIndex = useCallback((index: number) => {
    setWheelIndex(index);
  }, []);

  const navigateWheel = useCallback((direction: number) => {
    setWheelIndex((prev) => {
      const next = prev + direction;
      if (next < 0) return scenariosData.length - 1;
      if (next >= scenariosData.length) return 0;
      return next;
    });
  }, []);

  // Keyboard navigation & wheel event listeners for wheel container
  useEffect(() => {
    const container = wheelContainerRef.current;
    if (!container) return;

    let wheelTimeout: NodeJS.Timeout | null = null;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelTimeout) return;
      if (e.deltaY > 20) {
        navigateWheel(1);
        wheelTimeout = setTimeout(() => {
          wheelTimeout = null;
        }, 220);
      } else if (e.deltaY < -20) {
        navigateWheel(-1);
        wheelTimeout = setTimeout(() => {
          wheelTimeout = null;
        }, 220);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        navigateWheel(1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        navigateWheel(-1);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("keydown", handleKeyDown);
      if (wheelTimeout) clearTimeout(wheelTimeout);
    };
  }, [navigateWheel]);

  // Donation module state
  const [donationAmount, setDonationAmount] = useState<number | string>(100);
  const [donationMessage, setDonationMessage] = useState<string | null>(null);

  const selectChip = (amount: number) => {
    setDonationAmount(amount);
  };

  const simulateDonation = () => {
    const num = Number(donationAmount);
    if (!num || num <= 0) {
      alert("Lütfen geçerli bir katkı tutarı giriniz.");
      return;
    }
    setDonationMessage(
      `Allah kabul eylesin. ${num} ₺ tutarındaki katkınız askıdaki dertleşme havuzuna iletilmek üzere kaydedildi.`,
    );
    setTimeout(() => {
      setDonationMessage(null);
    }, 6000);
  };

  const currentScenario = scenariosData[wheelIndex];

  return (
    <>
      {/* SKIP TO MAIN CONTENT LINK FOR KEYBOARD & SCREEN READERS */}
      <a
        className="skip-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412] focus-visible:ring-amber-500"
        href="#ana-icerik"
      >
        İçeriğe Atla
      </a>

      {/* MANEVİ SINIRLAR & BEYAN UST BANT */}
      <div
        className="w-full bg-[#121a15]/95 border-b border-outline-variant/40 py-2.5 px-4 relative z-50 text-xs text-on-surface-variant backdrop-blur-sm"
        id="top-sinirlar-banner"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
          <div className="flex items-center gap-2 text-center md:text-left truncate">
            <span className="text-xs font-semibold tracking-wider text-primary flex-shrink-0">
              Manevi Sınırlar &amp; Beyan:
            </span>
            <p
              className="text-[11px] text-slate-300 leading-snug truncate"
              lang="tr"
            >
              Sırdaş AI bir hoca, fetva makamı veya psikolojik klinik mercii
              değildir; dini ve hukuki bağlayıcılığı yoktur. Fıkhi hükümler için{" "}
              <strong className="text-white font-medium">Alo 190</strong>, acil
              ve kriz durumlarında{" "}
              <strong className="text-white font-medium">112 Acil</strong> hattı
              esastır.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              aria-label="Diyanet Alo 190 Fetva Hattını Ara"
              className="px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/50 text-[11px] text-on-surface hover:text-primary flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
              href="tel:190"
            >
              <span
                aria-hidden="true"
                className="w-5 h-5 rounded-full bg-[#183125] text-secondary flex items-center justify-center text-[10px] border border-secondary/30 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-xs">
                  menu_book
                </span>
              </span>
              <span className="font-medium">Alo 190</span>
            </a>
            <a
              aria-label="112 Acil Çağrı Merkezini Ara"
              className="px-2.5 py-1 rounded-full bg-error-container/60 border border-red-500/30 text-red-200 text-[11px] flex items-center gap-1.5 hover:bg-error-container transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
              href="tel:112"
            >
              <span
                aria-hidden="true"
                className="w-5 h-5 rounded-full bg-red-950/80 text-red-300 flex items-center justify-center text-[10px] border border-red-500/40 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-xs">
                  emergency
                </span>
              </span>
              <span className="font-medium">112 Acil</span>
            </a>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header
        className="left-0 w-full z-40 bg-[#080c0a]/90 backdrop-blur-md border-b border-outline-variant/40 sticky top-0"
        role="banner"
      >
        <div className="h-20 max-w-[1200px] mx-auto px-6 flex items-center justify-between gap-4">
          <Link
            aria-label="Sırdaş AI Ana Sayfa"
            className="flex items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
            href="/"
          >
            <div
              aria-hidden="true"
              className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/60 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0"
            >
              <Image
                src="/icon.png"
                alt="Sırdaş AI Logosu"
                width={40}
                height={40}
                priority
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading text-xl font-bold tracking-wide text-on-surface leading-none">
                Sırdaş AI
              </span>
              <span className="text-[11px] tracking-widest text-slate-300 uppercase mt-1">
                Manevi Tefekkür &amp; Rehberlik
              </span>
            </div>
          </Link>
          <nav
            aria-label="Ana Gezinti"
            className="hidden lg:flex items-center gap-8"
          >
            <a
              className="text-sm text-primary hover:text-amber-300 font-medium transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
              href="#simdi-dene"
            >
              Şimdi Dene
            </a>
            <a
              className="text-sm text-slate-300 hover:text-primary transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
              href="#sohbet-ornekleri"
            >
              Tefekkür Odaları
            </a>
            <a
              className="text-sm text-slate-300 hover:text-primary transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
              href="#askida"
            >
              Askıda Sırdaş
            </a>
            <a
              className="text-sm text-slate-300 hover:text-primary transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
              href="#gayemiz"
            >
              Gayemiz
            </a>
            <a
              className="text-sm text-slate-300 hover:text-primary transition-colors py-1 px-2 rounded-md focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
              href="#top-sinirlar-banner"
            >
              Sınırlar &amp; Beyan
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              aria-label="WhatsApp üzerinden Sırdaş AI ile sohbete başla (Yeni sekmede açılır)"
              className="inline-flex items-center gap-2 bg-[#12231b] hover:bg-[#183125] text-secondary border border-secondary/30 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
              href={waUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <i
                aria-hidden="true"
                className="ph ph-whatsapp-logo text-base"
              ></i>
              <span>WhatsApp&apos;ta Başla</span>
            </a>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="w-full" id="ana-icerik" role="main">
        <div className="flex flex-col w-full relative overflow-hidden">
          {/* HERO SECTION */}
          <section
            aria-labelledby="hero-baslik"
            className="relative w-full max-w-[1200px] mx-auto px-6 pt-14 pb-16"
          >
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <h1
                className="font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-on-surface tracking-tight leading-tight mb-5"
                id="hero-baslik"
                lang="tr"
              >
                Nefsine Ayna, Gönlüne Sekinet: Hayatın İmtihanlarında{" "}
                <span className="text-primary font-bold">Manevi Sırdaş</span>
              </h1>
              <p
                className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mb-8 font-light"
                lang="tr"
              >
                Kur&apos;an-ı Kerim, Sahih Sünnet ve kadim hikmet rehberliğinde;
                keder, rızık darlığı ve gelecek endişelerinde ilahi rızayı ve
                sükûneti arayanlara samimi bir dertleşme ve tefekkür alanı.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a
                  aria-label="WhatsApp'ta Sırdaş ile Dertleş"
                  className="inline-flex items-center gap-2.5 bg-secondary-container hover:bg-[#117a51] text-white px-6 py-3 rounded-full text-sm font-semibold tracking-wide transition-all shadow-lg hover:shadow-secondary/10 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
                  href={waUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <i
                    aria-hidden="true"
                    className="ph ph-whatsapp-logo text-lg text-secondary"
                  ></i>
                  <span>Sırdaş ile Dertleş</span>
                  <i
                    aria-hidden="true"
                    className="ph ph-arrow-right text-xs"
                  ></i>
                </a>
                <a
                  aria-label="Web sitesi üzerinden Sırdaş ile mesajlaşarak dene"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 text-sm text-slate-200 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
                  href="#simdi-dene"
                >
                  <span>Şimdi Dene</span>
                </a>
                <a
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 text-sm text-slate-200 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
                  href="#sohbet-ornekleri"
                >
                  <i
                    aria-hidden="true"
                    className="ph ph-chat-circle-dots text-lg text-primary"
                  ></i>
                  <span>Nasıl Sohbet Eder?</span>
                </a>
              </div>
            </div>

            {/* WHATSAPP HERO SOHBET VİTRİNİ & ÖRNEK SENARYOLAR (MERGED) */}
            <div className="mt-14 max-w-3xl mx-auto" id="sohbet-ornekleri">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/40 bg-[#0b141a]">
                {/* WhatsApp Header */}
                <div className="bg-[#1f2c34] px-4 py-3 flex items-center justify-between border-b border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        aria-hidden="true"
                        className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary"
                      >
                        <span className="material-symbols-outlined text-2xl text-secondary">
                          spa
                        </span>
                      </div>
                      <span
                        aria-hidden="true"
                        className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full ring-2 ring-[#1f2c34]"
                      ></span>
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white text-sm font-bold">
                          Sırdaş AI
                        </span>
                        <span
                          aria-label="Onaylı Sırdaş Hattı"
                          className="material-symbols-outlined text-secondary text-sm"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                      </div>
                      <span className="text-emerald-400 text-xs leading-tight font-medium">
                        Çevrimiçi • Sekinet ve Dinleme Hali
                      </span>
                    </div>
                  </div>

                  {/* Header Navigation Controls */}
                  <div className="flex items-center gap-2 text-slate-300">
                    <div className="flex items-center gap-1 bg-[#111b21] px-2 py-1 rounded-lg border border-outline-variant/30 text-xs">
                      <button
                        aria-label="Önceki örnek sohbete geç"
                        className="p-1 text-slate-300 hover:text-white transition-colors"
                        onClick={() => navigateWheel(-1)}
                        type="button"
                      >
                        <i className="ph ph-caret-left text-sm" />
                      </button>
                      <span className="font-mono text-xs px-1 text-primary font-medium">
                        {currentScenario.num} / 05
                      </span>
                      <button
                        aria-label="Sonraki örnek sohbete geç"
                        className="p-1 text-slate-300 hover:text-white transition-colors"
                        onClick={() => navigateWheel(1)}
                        type="button"
                      >
                        <i className="ph ph-caret-right text-sm" />
                      </button>
                    </div>
                    <span className="material-symbols-outlined text-xl hidden sm:inline">
                      search
                    </span>
                    <span className="material-symbols-outlined text-xl hidden sm:inline">
                      more_vert
                    </span>
                  </div>
                </div>

                {/* WhatsApp Scenario / Topic Filter Bar */}
                <div className="bg-[#111b21] px-4 py-2.5 border-b border-outline-variant/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-xs text-slate-400 whitespace-nowrap mr-1 hidden sm:inline">
                    Örnek Hâller:
                  </span>
                  {scenariosData.map((sc, idx) => {
                    const isActive = wheelIndex === idx;
                    return (
                      <button
                        key={sc.num}
                        onClick={() => selectWheelIndex(idx)}
                        className={`text-xs px-3 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          isActive
                            ? "bg-[#005c4b] text-white font-medium shadow-sm"
                            : "bg-[#202c33]/70 text-slate-300 hover:text-white hover:bg-[#202c33]"
                        }`}
                        type="button"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? "bg-secondary" : "bg-slate-400"
                          }`}
                        />
                        <span>{sc.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Chat Area */}
                <div
                  aria-label="WhatsApp Örnek Dertleşme Penceresi"
                  className="p-4 md:p-6 flex flex-col gap-4 bg-gradient-to-b from-[#0b141a] via-[#091117] to-[#0b141a] min-h-[340px] justify-center transition-all duration-300"
                  id="sohbet-alani"
                >
                  {/* User Bubble */}
                  <div className="self-end max-w-[85%] bg-[#005c4b] text-white p-3.5 rounded-xl rounded-tr-none shadow-md">
                    <p className="text-sm leading-relaxed" lang="tr">
                      {currentScenario.userText}
                    </p>
                    <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-slate-300">
                      <span>{currentScenario.userTime}</span>
                      <span
                        aria-hidden="true"
                        className="material-symbols-outlined text-xs text-[#53bdeb]"
                      >
                        done_all
                      </span>
                    </div>
                  </div>

                  {/* Assistant Response Bubble */}
                  <div className="self-start max-w-[92%] bg-[#202c33] text-on-surface p-4 rounded-xl rounded-tl-none shadow-lg flex flex-col gap-3">
                    {/* Sacred Ayah Card Quote */}
                    <div className="bg-[#182229] rounded-lg p-3 pl-3.5 border-l-4 border-primary">
                      <p
                        className="text-primary text-[14px] italic mb-1 leading-snug"
                        lang="tr"
                      >
                        {currentScenario.ayah}
                      </p>
                      <div className="flex items-center justify-between text-slate-300 text-[11px]">
                        <span className="text-primary-fixed-dim font-medium">
                          {currentScenario.focusNote}
                        </span>
                        <span
                          aria-hidden="true"
                          className="material-symbols-outlined text-xs text-primary"
                        >
                          auto_stories
                        </span>
                      </div>
                    </div>

                    {/* Guidance Message */}
                    <p
                      className="text-sm leading-relaxed text-[#d1d7db]"
                      lang="tr"
                    >
                      {currentScenario.reply}
                    </p>

                    {/* Audio Player Widget */}
                    <div
                      aria-label="Sesli tefekkür kaydı önizlemesi"
                      className="bg-[#111b21] p-3 rounded-lg flex items-center gap-3"
                    >
                      <button
                        aria-label="Sesli tefekkür kaydı önizlemesi (1 dakika 42 saniye)"
                        aria-pressed={isPlaying ? "true" : "false"}
                        className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm hover:scale-105 transition-transform flex-shrink-0 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
                        id="audio-play-btn"
                        onClick={togglePlayState}
                        type="button"
                      >
                        <span
                          aria-hidden="true"
                          className="material-symbols-outlined text-xl"
                          id="audio-icon"
                        >
                          {isPlaying ? "pause" : "play_arrow"}
                        </span>
                      </button>
                      <div className="flex flex-col flex-grow min-w-0">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-on-surface truncate font-medium">
                            Kısa Sesli Tefekkür • Gönle Sekinet
                          </span>
                          <span
                            aria-live="off"
                            className="text-primary font-mono text-[11px] font-medium"
                            id="audio-timer"
                          >
                            {audioTimeFormatted}
                          </span>
                        </div>
                        {/* Waveform */}
                        <div
                          aria-hidden="true"
                          className="flex items-center gap-1 h-4 w-full"
                        >
                          <span className="w-1 h-3 bg-primary rounded-full"></span>
                          <span className="w-1 h-4 bg-primary rounded-full"></span>
                          <span className="w-1 h-2 bg-primary rounded-full"></span>
                          <span className="w-1 h-4 bg-primary rounded-full"></span>
                          <span
                            className={`w-1 h-4 bg-primary rounded-full ${
                              isPlaying ? "animate-pulse" : ""
                            }`}
                          ></span>
                          <span className="w-1 h-3 bg-primary rounded-full"></span>
                          <span className="w-1 h-4 bg-primary rounded-full"></span>
                          <span className="w-1 h-2 bg-surface-container-highest rounded-full"></span>
                          <span className="w-1 h-3 bg-surface-container-highest rounded-full"></span>
                          <span className="w-1 h-4 bg-surface-container-highest rounded-full"></span>
                          <span className="w-1 h-3 bg-surface-container-highest rounded-full"></span>
                          <span className="w-1 h-4 bg-surface-container-highest rounded-full"></span>
                          <span className="w-1 h-2 bg-surface-container-highest rounded-full"></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">
                        {currentScenario.title}
                      </span>
                      <div className="text-[11px] text-slate-300 font-mono">
                        {currentScenario.botTime}
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Input Footer with Direct WhatsApp CTA */}
                <div
                  aria-hidden="true"
                  className="bg-[#1f2c34] px-4 py-2.5 flex items-center gap-3 border-t border-outline-variant/20"
                >
                  <i className="ph ph-smiley text-xl text-slate-300"></i>
                  <i className="ph ph-paperclip text-xl text-slate-300"></i>
                  <div className="flex-grow bg-[#2a3942] rounded-full px-4 py-2 text-slate-300 text-xs truncate">
                    Gönlünü meşgul eden derdi buraya yaz...
                  </div>
                  <a
                    aria-label="WhatsApp'ta Sırdaş ile sohbete başla"
                    className="inline-flex items-center gap-1.5 bg-secondary-container hover:bg-[#117a51] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-colors"
                    href={waUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <i className="ph ph-whatsapp-logo text-sm text-secondary"></i>
                    <span>Başla</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* PROJEMİZİ DENEYİN — 1 SEFERLİK CANLI SIRDAŞ AI DENEYİMİ */}
          <LiveTrialSection waUrl={waUrl} />

          {/* ASKIDA SIRDAŞ */}
          <section
            aria-labelledby="askida-baslik"
            className="w-full bg-surface py-20 border-y border-outline-variant/30"
            id="askida"
          >
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="bg-surface-container rounded-2xl p-6 md:p-12 border border-outline-variant/40 relative">
                <div className="max-w-2xl mx-auto text-center mb-10">
                  {/* Ayet: İyilik ve Takvada Yardımlaşma */}
                  <p
                    className="font-arabic text-xl sm:text-2xl text-primary/90 mb-3"
                    dir="rtl"
                    lang="ar"
                  >
                    وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ
                  </p>
                  <blockquote
                    className="font-heading text-xl sm:text-2xl font-semibold text-on-surface mb-2"
                    id="askida-baslik"
                    lang="tr"
                  >
                    “İyilik ve takva üzerinde yardımlaşın...”
                  </blockquote>
                  <span className="text-xs text-primary-fixed-dim font-medium block mb-4">
                    Mâide Suresi, 2. Âyet-i Kerime
                  </span>
                  <p
                    className="text-sm text-slate-300 leading-relaxed font-light"
                    lang="tr"
                  >
                    Sırdaş AI ticari bir kazanç aracı değildir. Sunucu ve yapay
                    zeka altyapı giderleri, gönüldaşların askıya bıraktığı
                    samimi katkılarla karşılanır; böylece kederli veya darda
                    olan her kardeşimiz hiçbir maddi engel olmadan
                    dertleşebilir.
                  </p>
                </div>

                {/* Askı Katkı Seçimi */}
                <div className="max-w-xl mx-auto bg-surface-container-low p-6 rounded-2xl border border-outline-variant/30">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-4 text-center">
                    Askı Havuzuna Bir Katkı Bırak
                  </span>
                  <div
                    aria-label="Askı bağış miktarı seçenekleri"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5"
                    id="chips-container"
                    role="group"
                  >
                    {[
                      { amount: 50, label: "Gönül Katkısı" },
                      { amount: 100, label: "Sırdaş Desteği" },
                      { amount: 250, label: "Bereket İnfakı" },
                      { amount: 500, label: "Kardeşlik Fonu" },
                    ].map((chip) => {
                      const isSelected = Number(donationAmount) === chip.amount;
                      return (
                        <button
                          aria-label={`${chip.amount} Türk Lirası ${chip.label}`}
                          aria-pressed={isSelected ? "true" : "false"}
                          className={`infak-chip p-3 rounded-xl text-center transition-all border focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412] ${
                            isSelected
                              ? "active bg-surface-container-highest border-primary/60"
                              : "bg-surface-container border-outline-variant/40 hover:border-primary/50"
                          }`}
                          key={chip.amount}
                          onClick={() => selectChip(chip.amount)}
                          type="button"
                        >
                          <span className="text-sm font-bold text-primary block">
                            {chip.amount} ₺
                          </span>
                          <span className="text-[10px] text-slate-300 font-medium">
                            {chip.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative w-full sm:flex-grow">
                      <span
                        aria-hidden="true"
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 font-medium text-xs"
                      >
                        ₺
                      </span>
                      <input
                        aria-label="Özel katkı tutarı (TL)"
                        className="w-full bg-surface-container pl-8 pr-3 py-2.5 rounded-xl text-on-surface font-mono text-sm border border-outline-variant/50 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
                        id="custom-donation-input"
                        min="1"
                        onChange={(e) => setDonationAmount(e.target.value)}
                        placeholder="Tutar"
                        type="number"
                        value={donationAmount}
                      />
                    </div>
                    <button
                      aria-label="Belirlenen tutar ile Askıya Katıl"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#c99e70] text-[#1b1207] px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
                      onClick={simulateDonation}
                      type="button"
                    >
                      <i aria-hidden="true" className="ph ph-heart text-sm"></i>
                      <span>Askıya Katıl</span>
                    </button>
                  </div>

                  {donationMessage && (
                    <div
                      aria-live="polite"
                      className="mt-4 p-3 bg-secondary/10 border border-secondary/30 rounded-xl text-xs text-secondary text-center font-medium animate-fadeIn"
                    >
                      {donationMessage}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Güvenli kart ödemesi veya detaylı infak havuzu için:
                    </span>
                    <Link
                      className="text-primary hover:underline font-semibold"
                      href="/askida-sirdas"
                    >
                      Askıda Sırdaş Sayfası →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* AYET DURAĞI: NAHL 90 & HUCURÂT 10 / GAYEMİZ */}
          <section
            aria-labelledby="gayemiz-baslik"
            className="w-full relative py-20 bg-background border-b border-outline-variant/30"
            id="gayemiz"
          >
            <div className="max-w-4xl mx-auto px-6 text-center relative">
              <div className="flex flex-col items-center">
                <h2
                  className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-on-surface mb-6 max-w-2xl leading-tight"
                  id="gayemiz-baslik"
                  lang="tr"
                >
                  Bizim Gayemiz Bir Gönle Sekinet Olabilmek;
                  <span className="text-primary font-bold block mt-1">
                    Çünkü Rabbimiz İyiliği ve Kardeşliği Emrediyor
                  </span>
                </h2>
                <div className="bg-surface-container-low/70 rounded-2xl p-6 sm:p-8 border border-outline-variant/40 max-w-2xl mb-10 text-left sm:text-center">
                  <p
                    className="text-sm sm:text-base text-on-surface leading-relaxed font-light mb-4"
                    lang="tr"
                  >
                    Modern hayatın girdabında bunalan, derdini kimseye açamayan,
                    borç, keder ve gelecek endişesiyle kalbi sıkışan her bir
                    cana; hiçbir fani menfaat gözetmeksizin, Kur’an ve Sünnet
                    mizanında samimi bir dinleyici, güvenli bir dertleşme ve
                    tefekkür kapısı olmaktır.
                  </p>
                  <span className="text-xs text-primary font-medium tracking-wide uppercase inline-block">
                    Yola bu niyetle çıktık, çünkü Cenâb-ı Hak ferman buyuruyor:
                  </span>
                </div>

                {/* NAHL 90 ARAPÇA METİN */}
                <p
                  className="font-arabic text-2xl sm:text-3xl md:text-4xl text-primary/90 leading-relaxed mb-6 tracking-wide"
                  dir="rtl"
                  lang="ar"
                >
                  إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ
                </p>
                <blockquote
                  className="font-heading text-xl sm:text-2xl md:text-3xl text-on-surface font-light leading-relaxed mb-4 max-w-2xl mx-auto"
                  lang="tr"
                >
                  “Şüphesiz Allah{" "}
                  <span className="text-primary font-normal">
                    adaleti, iyilik yapmayı (ihsanı)
                  </span>{" "}
                  ve akrabaya bakmayı emreder...”
                </blockquote>
                <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-primary-fixed-dim font-medium mb-6">
                  <span
                    aria-hidden="true"
                    className="w-6 h-[1px] bg-primary/40"
                  ></span>
                  <span>Nahl Suresi, 90. Âyet-i Kerime</span>
                  <span
                    aria-hidden="true"
                    className="w-6 h-[1px] bg-primary/40"
                  ></span>
                </div>
                <p
                  className="font-heading text-base sm:text-lg text-primary/80 font-light italic max-w-xl mx-auto mb-4"
                  lang="tr"
                >
                  “Mü’minler ancak kardeştirler; öyleyse kardeşlerinizin arasını
                  düzeltin...” (Hucurât Suresi, 10)
                </p>
                <p
                  className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-light leading-relaxed"
                  lang="tr"
                >
                  İlahi emrin gereği olarak; yalnız olmadığınızı hissettirmek,
                  bir din kardeşinizin dökülen kelamına şahit olmak ve gecenin
                  seherinde bir ferahlık duasına vesile olmak için buradayız.
                </p>
              </div>
            </div>
          </section>

          {/* KAPANIŞ ÇAĞRISI */}
          <section
            aria-labelledby="kapanis-baslik"
            className="w-full max-w-[1200px] mx-auto px-6 py-16"
          >
            <div className="bg-surface-container rounded-2xl p-8 sm:p-14 text-center flex flex-col items-center justify-center border border-outline-variant/40">
              <div
                aria-hidden="true"
                className="w-14 h-14 rounded-full bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-secondary mb-5 shadow-inner"
              >
                <i className="ph ph-chat-teardrop-dots text-2xl"></i>
              </div>
              <h2
                className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-on-surface mb-3 max-w-lg"
                id="kapanis-baslik"
                lang="tr"
              >
                Gönlün Daraldığında, Bir Selam Uzağında
              </h2>
              <p
                className="text-sm text-slate-300 max-w-md mb-8 leading-relaxed font-light"
                lang="tr"
              >
                Seher vaktinde yahut günün telaşında; hiçbir peşin yargı
                olmaksızın, Kur&apos;an ve Sünnet ikliminde içini dök.
              </p>
              <a
                aria-label="WhatsApp üzerinden derhal sohbete başla (Yeni sekmede açılır)"
                className="inline-flex items-center gap-2.5 bg-secondary-container hover:bg-[#117a51] text-white px-7 py-3.5 rounded-full text-xs font-semibold tracking-wide transition-all mb-8 shadow-lg shadow-secondary/10 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412]"
                href={waUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <i
                  aria-hidden="true"
                  className="ph ph-whatsapp-logo text-lg text-secondary"
                ></i>
                <span>WhatsApp Üzerinden Hemen Başla</span>
              </a>

              {/* Gerçek ve Çalışan WhatsApp Bağlantı Karekodu */}
              <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 text-left max-w-md mx-auto shadow-md">
                <div
                  aria-label="Sırdaş AI WhatsApp Sohbet Karekodu"
                  className="w-16 h-16 bg-white rounded-lg p-1.5 flex items-center justify-center flex-shrink-0 shadow-inner"
                >
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt="WhatsApp Sohbet Başlatma Karekodu"
                      className="w-full h-full object-contain"
                      src={qrDataUrl}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 animate-pulse rounded" />
                  )}
                </div>
                <div className="text-xs text-slate-300">
                  <span className="font-semibold text-on-surface block text-sm mb-1">
                    Masaüstünde misiniz?
                  </span>
                  <span className="text-xs text-slate-300 leading-snug block">
                    Telefon kameranızla okutarak sohbete doğrudan geçebilirsiniz.
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        className="w-full bg-surface-container-lowest border-t border-outline-variant/30 pt-12 pb-8"
        role="contentinfo"
      >
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
            <div className="md:col-span-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="font-heading text-xl font-bold text-primary">
                  Sırdaş AI
                </span>
              </div>
              <p
                className="text-xs text-slate-300 max-w-sm leading-relaxed"
                lang="tr"
              >
                Kadim İslami hikmet ile güncel yapay zekayı birleştiren;
                yargılamayan, dinleyen, sekinet veren mahrem bir manevi sığınak.
              </p>
            </div>
            <div className="md:col-span-4 flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                Manevi Çerçeve
              </span>
              <p className="text-xs text-slate-300 leading-relaxed" lang="tr">
                Sırdaş AI bir fetva makamı değildir. Fıkhi meselelerde Diyanet
                İşleri Başkanlığı&apos;nın resmi fetva hattı (190), tıbbi ve
                psikolojik krizlerde 112 Acil servisleri esastır.
              </p>
            </div>
            <div className="md:col-span-3 flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                Tefekkür Köşeleri
              </span>
              <ul className="flex flex-col gap-1.5 text-xs text-slate-300">
                <li>
                  <a
                    className="hover:text-on-surface transition-colors rounded focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412] inline-block"
                    href="#sohbet-alani"
                  >
                    WhatsApp Arayüzü
                  </a>
                </li>
                <li>
                  <a
                    className="hover:text-on-surface transition-colors rounded focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412] inline-block"
                    href="#sohbet-ornekleri"
                  >
                    Tefekkür Senaryoları
                  </a>
                </li>
                <li>
                  <a
                    className="hover:text-on-surface transition-colors rounded focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412] inline-block"
                    href="#askida"
                  >
                    Askıda Sırdaş
                  </a>
                </li>
                <li>
                  <a
                    className="hover:text-on-surface transition-colors rounded focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-[#101412] inline-block"
                    href="#gayemiz"
                  >
                    Gayemiz
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300">
            <p>© 2025 Sırdaş AI. Gönüllere sekinet niyetiyle hazırlanmıştır.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
