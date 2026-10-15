import React from "react";
import { BookOpen, Users, Volume2, ShieldCheck, Lock, HeartHandshake } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Features() {
  const features = [
    {
      title: "Çelik Kasa RAG Mimarisi",
      desc: "Doğrudan Kur'an mealleri, Kütüb-i Sitte sahih hadisleri ve Halis Aydemir hoca sohbet kesitlerinden oluşan doğrulanmış manevi kütüphane. Halüsinasyon sıfırlanır.",
      icon: BookOpen,
      badge: "Supabase pgvector (768d)",
    },
    {
      title: "4 Bloklu Dijital İkiz Künyesi",
      desc: "Kullanıcının rolleri (evli, esnaf, talebe), manevi imtihanları (rızık kaygısı, ani öfke), biyolojik enerjisi ve üslup tercihiyle şekillenen şefkatli muhataplık.",
      icon: Users,
      badge: "Kişiselleştirilmiş Hikmet",
    },
    {
      title: "Halis Aydemir Sesli Sohbet Kesitleri",
      desc: "Dertleşme anında sadece metin değil, Cloudflare R2 üzerinden yüksek kaliteli .ogg (libopus 32k) ses kesitleriyle kulun kalbine doğrudan seslenen teskin.",
      icon: Volume2,
      badge: "WhatsApp Doğrudan Ses",
    },
    {
      title: "Riba (Faiz) Kalkanı",
      desc: "Kullanıcı borç ve geçim darlığında faize meylettiğinde, Bakara 275-279 hakikatiyle faizin manevi yıkımını ve tövbe ile gelen bereketi samimiyetle hatırlatır.",
      icon: ShieldCheck,
      badge: "Bakara 275-279 Kalkanı",
    },
    {
      title: "Fetva ve Hüküm Yasağı",
      desc: "Miras, boşanma, nikah veya helal/haram fıkhi konularda asla fetva vermez; kullanıcıyı hürmetle Diyanet Alo 190 ve il/ilçe müftülüklerine yönlendirir.",
      icon: Lock,
      badge: "Alo 190 Yönlendirmesi",
    },
    {
      title: "Askıda Sırdaş İnfak Modeli",
      desc: "Kullanıcıdan hiçbir abonelik veya mesaj ücreti talep edilmez. Sunucu ve yapay zeka maliyetleri hayırseverlerin 'Askıda Sırdaş' infak havuzuyla karşılanır.",
      icon: HeartHandshake,
      badge: "Tamamen Ücretsiz & Reklamsız",
    },
  ];

  return (
    <section id="ozellikler" className="relative py-24 bg-[#0a0f0d] border-y border-emerald-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-20">
          <Badge variant="emerald" className="text-xs uppercase tracking-wider px-3.5 py-1">
            Mühendislik &amp; Hikmet Uyumu
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold font-serif tracking-tight text-white leading-tight">
            Çelik Kasa RAG ve İkili Bilişsel Mimari
          </h2>
          <p className="text-base sm:text-lg text-emerald-100/75 leading-relaxed font-light">
            Yapay zekanın serbest tahmin yapmasına asla izin verilmez. Sistem
            1 (Jev) ile anlık niyet ve kriz teşhisi yapılır; System 2 (Gemini
            2.5 Flash) Çelik Kasa RAG kaynaklarını kullanarak muhatabına
            özel şifa sunar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {features.map((feat) => {
            const IconComp = feat.icon;
            return (
              <div
                key={feat.title}
                className="group relative p-8 rounded-2xl bg-gradient-to-b from-[#0e1713]/90 via-[#0a110e]/90 to-[#070c09]/95 border border-emerald-900/60 hover:border-amber-500/40 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_40px_-5px_rgba(5,150,105,0.18)] flex flex-col justify-between backdrop-blur-md"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-950 to-emerald-900/70 border border-emerald-700/40 flex items-center justify-center text-emerald-300 group-hover:scale-105 group-hover:text-amber-300 transition-all duration-300 shadow-inner">
                      <IconComp className="h-6 w-6 stroke-[1.8]" />
                    </div>
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300/90 border border-emerald-800/40">
                      {feat.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white font-serif tracking-tight">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-emerald-100/75 leading-relaxed font-light">
                      {feat.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-emerald-900/40 text-[11px] text-emerald-400/60 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Doğrulanmış Sırdaş Mimarisi</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

