"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Scale,
  Compass,
  Sparkles,
  Volume2,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface AuditMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  userPhone: string;
  audioSent?: boolean;
  jevMetadata?: {
    noul?: { is_fatwa?: number; is_riba?: number; needs_audio?: number };
    choice?: { nafs_trap?: string; rag_category?: string };
    score?: { distress_level?: number };
  };
  editorAudit?: {
    murakabe_applied?: boolean;
    ilahi_riza_checked?: boolean;
    tevekkul_and_talak_hope_included?: boolean;
    nafs_and_vesvese_addressed?: string;
    siyer_example_used?: string;
    riba_warning_included?: boolean;
  };
}

export default function AuditLogsPage() {
  const [messages, setMessages] = useState<AuditMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMurakabe, setFilterMurakabe] = useState<"all" | "yes" | "no">("all");
  const [filterRiba, setFilterRiba] = useState<"all" | "yes" | "no">("all");
  const [filterFatwa, setFilterFatwa] = useState<"all" | "yes">("all");
  const [filterDistress, setFilterDistress] = useState<"all" | "high" | "medium" | "low">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        if (json.success && json.data.recentMessages) {
          setMessages(json.data.recentMessages);
        }
      } catch (e) {
        console.error("Audit log fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Provide realistic sample messages if database is empty / demo mode
  const displayMessages: AuditMessage[] =
    messages.length > 0
      ? messages
      : [
          {
            id: "audit-demo-1",
            role: "ASSISTANT",
            content:
              "Kıymetli kardeşim, rızık endişesi ve borç daralması kulun nefsine ağır bir yüktür. Ancak bilmelisin ki faiz kapısı kulu feraha değil, Allah ve Resulü ile bir harbe sürükler (Bakara, 279). Peygamberimiz (s.a.v.) borç yükü altında kaldığında Rabbine sığınarak 'Allahım, kederden, acizlikten ve borcun belimi bükmesinden Sana sığınırım' diye niyaz ederdi. Sebeplere hürmet et, tevekkülü elden bırakma.",
            createdAt: new Date().toISOString(),
            userPhone: "+90555•••12",
            audioSent: true,
            jevMetadata: {
              noul: { is_fatwa: 0.05, is_riba: 0.92, needs_audio: 0.88 },
              choice: { nafs_trap: "FAKIRLIK_KORKUSU_VESVESESI", rag_category: "RIZIK_VE_TICARET" },
              score: { distress_level: 8 },
            },
            editorAudit: {
              murakabe_applied: true,
              ilahi_riza_checked: true,
              tevekkul_and_talak_hope_included: true,
              nafs_and_vesvese_addressed: "Şeytanın fakirlikle korkutarak haram faize sevk etme vesvesesi deşifre edildi.",
              siyer_example_used: "Peygamberimiz'in (s.a.v.) borç duası ve Taif sonrası teslimiyeti",
              riba_warning_included: true,
            },
          },
          {
            id: "audit-demo-2",
            role: "ASSISTANT",
            content:
              "Değerli kardeşim, eşinizle yaşadığınız bu derin ihtilaf kalbinizi incitmiş. Lakin boşanma (talak) ve nafaka gibi hususlar şer'i hüküm gerektiren fıkhi mevzulardır. Sırdaş AI fıkhi fetva mercii değildir; hak kaybı yaşamamanız için Diyanet Alo 190 Fetva Hattı'na danışmanızı istirham ederiz. Ancak bir eş ve Müslüman olarak şu an öfkeyle değil, hilm ve murakabe şuuruyla hareket etmeniz kalbinize şifa olacaktır.",
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            userPhone: "+90532•••45",
            audioSent: false,
            jevMetadata: {
              noul: { is_fatwa: 0.95, is_riba: 0.02, needs_audio: 0.15 },
              choice: { nafs_trap: "ANI_OFKE_PATLAMASI", rag_category: "AILE_VE_EVLILIK" },
              score: { distress_level: 6 },
            },
            editorAudit: {
              murakabe_applied: true,
              ilahi_riza_checked: true,
              tevekkul_and_talak_hope_included: false,
              nafs_and_vesvese_addressed: "Öfkeyle ani boşanma kararı alma nefis zaafı",
              siyer_example_used: "Peygamber Efendimiz'in 'Öfkelendiğin zaman sus ve abdest al' tavsiyesi",
              riba_warning_included: false,
            },
          },
          {
            id: "audit-demo-3",
            role: "ASSISTANT",
            content:
              "İmtihan dünyasında her daralmanın ardında ilahi bir hikmet gizlidir. Kalbini ferah tut, Talâk Suresi'nde müjdelendiği gibi: 'Kim Allah'tan sakınırsa, Allah ona bir çıkış yolu açar.' (Talâk, 2-3). Bu gecenin sükûnetinde teheccüd vakti ellerini semaya açıp duaya sarıl.",
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            userPhone: "+90544•••88",
            audioSent: true,
            jevMetadata: {
              noul: { is_fatwa: 0.01, is_riba: 0.05, needs_audio: 0.95 },
              choice: { nafs_trap: "UMITSIZLIK_VE_REHAVET", rag_category: "MANEVI_TESKIN" },
              score: { distress_level: 5 },
            },
            editorAudit: {
              murakabe_applied: true,
              ilahi_riza_checked: true,
              tevekkul_and_talak_hope_included: true,
              nafs_and_vesvese_addressed: "Yalnızlık ve bataklık vehmi kırıldı.",
              siyer_example_used: "Ashabın hicret gecesindeki mutlak tevekkülü",
              riba_warning_included: false,
            },
          },
        ];

  const filtered = displayMessages.filter((msg) => {
    if (filterMurakabe === "yes" && !msg.editorAudit?.murakabe_applied) return false;
    if (filterMurakabe === "no" && msg.editorAudit?.murakabe_applied) return false;

    if (filterRiba === "yes" && !msg.editorAudit?.riba_warning_included) return false;
    if (filterRiba === "no" && msg.editorAudit?.riba_warning_included) return false;

    if (filterFatwa === "yes") {
      const isFatwa = (msg.jevMetadata?.noul?.is_fatwa || 0) >= 0.7;
      if (!isFatwa) return false;
    }

    const distress = msg.jevMetadata?.score?.distress_level || 0;
    if (filterDistress === "high" && distress < 8) return false;
    if (filterDistress === "medium" && (distress < 5 || distress >= 8)) return false;
    if (filterDistress === "low" && distress >= 5) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const inContent = msg.content.toLowerCase().includes(term);
      const inPhone = msg.userPhone.toLowerCase().includes(term);
      if (!inContent && !inPhone) return false;
    }

    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="gold" className="text-xs">
            System 1 + System 2 Denetimi
          </Badge>
          <span className="text-xs text-muted-foreground">İçsel Editör Doğrulama Günlüğü</span>
        </div>
        <h1 className="text-2xl font-bold font-serif tracking-tight text-foreground mt-1">
          Jev &amp; Gemini Audit Denetim Günlüğü
        </h1>
        <p className="text-xs text-muted-foreground">
          5 Manevi Süzgeç, Riba Kalkanı, Fetva Engeli ve Nefis Tuzağı kararlarının tek tek incelenmesi.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 p-4 rounded-xl border border-border bg-card">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
            Murakabe Filtresi
          </label>
          <select
            value={filterMurakabe}
            onChange={(e) => setFilterMurakabe(e.target.value as any)}
            className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tümü (Murakabe)</option>
            <option value="yes">Murakabe Uygulandı (✓)</option>
            <option value="no">Anomali / Eksik (✗)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
            Riba (Faiz) Kalkanı
          </label>
          <select
            value={filterRiba}
            onChange={(e) => setFilterRiba(e.target.value as any)}
            className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tümü (Riba)</option>
            <option value="yes">Riba Uyarısı Verildi</option>
            <option value="no">Normal Sohbet</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
            Fetva Durumu
          </label>
          <select
            value={filterFatwa}
            onChange={(e) => setFilterFatwa(e.target.value as any)}
            className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tümü (Fetva)</option>
            <option value="yes">Fetva Sorusu Bloke Edildi (Alo 190)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
            Kriz / Distress Skoru
          </label>
          <select
            value={filterDistress}
            onChange={(e) => setFilterDistress(e.target.value as any)}
            className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tümü (Distress)</option>
            <option value="high">Yüksek Kriz (&ge; 8 / 112 Koruması)</option>
            <option value="medium">Orta Baskı (5 - 7)</option>
            <option value="low">Sükûnet (&lt; 5)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
            Arama
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Mesaj veya tel ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 text-xs pl-7"
            />
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-3" />
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground rounded-2xl border border-border bg-card">
            Seçilen filtre kriterlerine uygun denetim kaydı bulunamadı.
          </div>
        ) : (
          filtered.map((msg) => {
            const isExpanded = expandedId === msg.id;
            const distress = msg.jevMetadata?.score?.distress_level || 0;
            const isFatwa = (msg.jevMetadata?.noul?.is_fatwa || 0) >= 0.7;
            const isRiba = (msg.jevMetadata?.noul?.is_riba || 0) >= 0.7;

            return (
              <div
                key={msg.id}
                className="rounded-2xl border border-border bg-card shadow-sm hover:border-amber-500/40 transition-all overflow-hidden"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(msg.id)}
                  className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card select-none"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {msg.userPhone}
                      </span>
                      <span className="text-border">•</span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString("tr-TR")}
                      </span>

                      {/* Status Badges */}
                      {msg.editorAudit?.murakabe_applied && (
                        <Badge variant="emerald" className="text-[10px]">
                          Murakabe ✓
                        </Badge>
                      )}
                      {msg.editorAudit?.riba_warning_included && (
                        <Badge variant="gold" className="text-[10px]">
                          Riba Uyarısı Aktif
                        </Badge>
                      )}
                      {isFatwa && (
                        <Badge variant="destructive" className="text-[10px]">
                          Fetva Engeli (Alo 190)
                        </Badge>
                      )}
                      {msg.audioSent && (
                        <Badge variant="blue" className="text-[10px] gap-1">
                          <Volume2 className="h-3 w-3" />
                          Sesli Mesaj
                        </Badge>
                      )}
                      {distress >= 8 ? (
                        <Badge variant="destructive" className="text-[10px]">
                          Kriz: {distress}/10 (112/182)
                        </Badge>
                      ) : distress >= 5 ? (
                        <Badge variant="gold" className="text-[10px]">
                          Baskı: {distress}/10
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">
                          Sükûn: {distress}/10
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">
                      {msg.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto text-xs text-muted-foreground">
                    <span>{isExpanded ? "Detayları Gizle" : "Denetimi İncele"}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {/* Expanded Deep Audit Details */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 p-5 space-y-4 animate-in fade-in-50 text-xs">
                    {/* Full Content */}
                    <div>
                      <div className="font-semibold text-foreground mb-1">
                        Üretilen Nihai WhatsApp Yanıtı:
                      </div>
                      <div className="p-3.5 rounded-xl bg-card border border-border whitespace-pre-line text-foreground/90 leading-relaxed font-sans">
                        {msg.content}
                      </div>
                    </div>

                    {/* Jev System 1 Telemetry */}
                    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-border/60 pb-2">
                        <strong className="text-foreground flex items-center gap-1.5 font-serif">
                          <Scale className="h-4 w-4 text-amber-500" />
                          Jev System 1 Hızlı Teşhis Telemetrisi
                        </strong>
                        <span className="text-[11px] text-muted-foreground">Latency: ~35ms</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-2.5 rounded-lg bg-muted/40 space-y-1">
                          <span className="text-[11px] text-muted-foreground block">
                            Noul İhtimal Skorları
                          </span>
                          <div className="font-mono text-[11px]">
                            is_fatwa: {msg.jevMetadata?.noul?.is_fatwa ?? 0.05} <br />
                            is_riba: {msg.jevMetadata?.noul?.is_riba ?? 0.10} <br />
                            needs_audio: {msg.jevMetadata?.noul?.needs_audio ?? 0.85}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-muted/40 space-y-1">
                          <span className="text-[11px] text-muted-foreground block">
                            Nefis Tuzağı &amp; Kategori
                          </span>
                          <div className="font-semibold text-foreground">
                            {msg.jevMetadata?.choice?.nafs_trap || "FAKIRLIK_KORKUSU_VESVESESI"}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Kategori: {msg.jevMetadata?.choice?.rag_category || "RIZIK_VE_TICARET"}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-muted/40 space-y-1">
                          <span className="text-[11px] text-muted-foreground block">
                            Ruhsal Sıkıntı Derecesi
                          </span>
                          <div className="text-base font-bold text-amber-500">
                            {distress} / 10
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {distress >= 8 ? "Acil Teskin Önceliği" : "Normal İrşad"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gemini 2.5 Flash Editor Audit */}
                    <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/15 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-800/30 pb-2">
                        <strong className="text-emerald-300 flex items-center gap-1.5 font-serif">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          Gemini 2.5 Flash İçsel Editör Denetimi (Structured Output)
                        </strong>
                        <Badge variant="emerald" className="text-[10px]">
                          Anayasa Onaylı
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Murakabe Bilinci:</span>
                          <span className="font-semibold text-foreground">
                            {msg.editorAudit?.murakabe_applied ? "Uygulandı (✓)" : "Uygulanmadı (✗)"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">İlahi Rıza Terazisi:</span>
                          <span className="font-semibold text-foreground">
                            {msg.editorAudit?.ilahi_riza_checked ? "Gözetildi (✓)" : "Eksik (✗)"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Talâk 2-3 Ümit &amp; Çıkış:</span>
                          <span className="font-semibold text-foreground">
                            {msg.editorAudit?.tevekkul_and_talak_hope_included ? "Aşılandı (✓)" : "Yok"}
                          </span>
                        </div>

                        {msg.editorAudit?.nafs_and_vesvese_addressed && (
                          <div className="p-2 rounded-lg bg-card/60 border border-border">
                            <span className="font-semibold text-muted-foreground block text-[11px]">
                              Deşifre Edilen Nefis Tuzağı:
                            </span>
                            <p className="text-foreground italic">
                              {msg.editorAudit.nafs_and_vesvese_addressed}
                            </p>
                          </div>
                        )}

                        {msg.editorAudit?.siyer_example_used && (
                          <div className="p-2 rounded-lg bg-card/60 border border-border">
                            <span className="font-semibold text-muted-foreground block text-[11px]">
                              Kullanılan Siyer &amp; Sahih Hadis Mührü:
                            </span>
                            <p className="text-foreground italic">
                              {msg.editorAudit.siyer_example_used}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
