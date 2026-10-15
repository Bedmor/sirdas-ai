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
    <section id="ozellikler" className="py-20 bg-muted/30 border-y border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <Badge variant="emerald" className="text-xs uppercase tracking-wider">
            Mühendislik &amp; Hikmet Uyumu
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-serif tracking-tight text-foreground">
            Çelik Kasa RAG ve İkili Bilişsel Mimari
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Yapay zekanın serbest tahmin yapmasına asla izin verilmez. Sistem
            1 (Jev) ile anlık niyet ve kriz teşhisi yapılır; System 2 (Gemini
            2.5 Flash) Çelik Kasa RAG kaynaklarını kullanarak muhatabına
            özel şifa sunar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat) => {
            const IconComp = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4 hover:border-emerald-600/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground font-serif">
                  {feat.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
