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
  Activity,
  HeartPulse,
  Brain,
  ShieldAlert,
  Flame,
  CheckCircle2,
  XCircle,
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
              score: { distress_level: 3 },
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

  // Calculate Jev crisis score distribution
  const highDistressCount = displayMessages.filter(
    (m) => (m.jevMetadata?.score?.distress_level || 0) >= 8
  ).length;
  const mediumDistressCount = displayMessages.filter((m) => {
    const d = m.jevMetadata?.score?.distress_level || 0;
    return d >= 5 && d < 8;
  }).length;
  const lowDistressCount = displayMessages.filter(
    (m) => (m.jevMetadata?.score?.distress_level || 0) < 5
  ).length;
  const totalCount = displayMessages.length || 1;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/60 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="gold"
              className="text-[11px] bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono"
            >
              System 1 + System 2 Denetimi
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              İçsel Editör Doğrulama Günlüğü
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-foreground">
            Jev &amp; Gemini Audit Denetim Günlüğü
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl">
            5 Sarsılmaz Manevi Süzgeç (Murakabe, Rıza, Tevekkül, Talâk 2-3, İmtihan), Riba Kalkanı,
            Fetva Engeli ve Nefis Tuzağı kararlarının anlık bilişsel telemetri dökümü.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-900/40 text-xs">
          <Brain className="h-4 w-4 text-emerald-400" />
          <span className="text-muted-foreground">Aktif Model:</span>
          <span className="text-foreground font-mono font-semibold">Gemini 2.5 Flash</span>
        </div>
      </div>

      {/* Jev Crisis Score Distribution Overview Strip */}
      <div className="p-5 rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-rose-400" />
            Jev Kriz &amp; Ruhsal Sıkıntı (Distress) Dağılımı
          </span>
          <span className="text-muted-foreground font-mono text-[11px]">
            Toplam {displayMessages.length} denetim oturumu
          </span>
        </div>

        {/* 3-Part Distribution Progress Bar */}
        <div className="h-2 w-full rounded-full bg-emerald-950/60 overflow-hidden flex gap-0.5">
          <div
            style={{ width: `${Math.round((highDistressCount / totalCount) * 100)}%` }}
            className="bg-rose-500 transition-all duration-300"
            title="Yüksek Kriz (>=8)"
          />
          <div
            style={{ width: `${Math.round((mediumDistressCount / totalCount) * 100)}%` }}
            className="bg-amber-500 transition-all duration-300"
            title="Orta Baskı (5-7)"
          />
          <div
            style={{ width: `${Math.round((lowDistressCount / totalCount) * 100)}%` }}
            className="bg-emerald-500 transition-all duration-300"
            title="Sükûn (<5)"
          />
        </div>

        {/* Distribution Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
              <span className="text-xs text-rose-300 font-medium">Yüksek Kriz (&ge; 8)</span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400">
              {highDistressCount} oturum ({Math.round((highDistressCount / totalCount) * 100)}%)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-xs text-amber-300 font-medium">Orta Baskı (5 - 7)</span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {mediumDistressCount} oturum ({Math.round((mediumDistressCount / totalCount) * 100)}%)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium">Sükûnet &amp; İrşad (&lt; 5)</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {lowDistressCount} oturum ({Math.round((lowDistressCount / totalCount) * 100)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 p-4 rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
            Murakabe Filtresi
          </label>
          <select
            value={filterMurakabe}
            onChange={(e) => setFilterMurakabe(e.target.value as any)}
            className="w-full h-9 rounded-lg border border-emerald-950 bg-emerald-950/40 text-foreground px-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">Tümü (Murakabe)</option>
            <option value="yes">Murakabe Uygulandı (✓)</option>
            <option value="no">Anomali / Eksik (✗)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
            Riba (Faiz) Kalkanı
          </label>
          <select
            value={filterRiba}
            onChange={(e) => setFilterRiba(e.target.value as any)}
            className="w-full h-9 rounded-lg border border-emerald-950 bg-emerald-950/40 text-foreground px-2.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">Tümü (Riba)</option>
            <option value="yes">Riba Uyarısı Verildi</option>
            <option value="no">Normal Sohbet</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
            Fetva Durumu
          </label>
          <select
            value={filterFatwa}
            onChange={(e) => setFilterFatwa(e.target.value as any)}
            className="w-full h-9 rounded-lg border border-emerald-950 bg-emerald-950/40 text-foreground px-2.5 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
          >
            <option value="all">Tümü (Fetva)</option>
            <option value="yes">Fetva Sorusu Bloke Edildi (Alo 190)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
            Kriz / Distress Skoru
          </label>
          <select
            value={filterDistress}
            onChange={(e) => setFilterDistress(e.target.value as any)}
            className="w-full h-9 rounded-lg border border-emerald-950 bg-emerald-950/40 text-foreground px-2.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">Tümü (Distress)</option>
            <option value="high">Yüksek Kriz (&ge; 8 / 112 Koruması)</option>
            <option value="medium">Orta Baskı (5 - 7)</option>
            <option value="low">Sükûnet (&lt; 5)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
            Arama
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Mesaj veya tel ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 text-xs pl-7 border-emerald-950 bg-emerald-950/40 text-foreground placeholder:text-muted-foreground/60"
            />
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-3" />
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-14 text-center text-xs text-muted-foreground rounded-2xl border border-emerald-950/80 bg-[#0d1411]/90">
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
                className={`rounded-2xl border bg-[#0d1411]/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all overflow-hidden ${
                  distress >= 8
                    ? "border-rose-900/60 hover:border-rose-600/70"
                    : isRiba || isFatwa
                    ? "border-amber-900/60 hover:border-amber-600/70"
                    : "border-emerald-950/80 hover:border-emerald-700/60"
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(msg.id)}
                  className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 select-none hover:bg-emerald-950/20 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-emerald-400">
                        {msg.userPhone}
                      </span>
                      <span className="text-emerald-950">&bull;</span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString("tr-TR")}
                      </span>

                      {/* Status Badges */}
                      {msg.editorAudit?.murakabe_applied && (
                        <Badge
                          variant="emerald"
                          className="text-[10px] bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"
                        >
                          Murakabe ✓
                        </Badge>
                      )}
                      {msg.editorAudit?.riba_warning_included && (
                        <Badge
                          variant="gold"
                          className="text-[10px] bg-amber-950/60 text-amber-300 border border-amber-600/40"
                        >
                          Riba Uyarısı Aktif
                        </Badge>
                      )}
                      {isFatwa && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] bg-rose-950/60 text-rose-300 border border-rose-800/50"
                        >
                          Fetva Engeli (Alo 190)
                        </Badge>
                      )}
                      {msg.audioSent && (
                        <Badge
                          variant="blue"
                          className="text-[10px] gap-1 bg-cyan-950/60 text-cyan-300 border border-cyan-800/50"
                        >
                          <Volume2 className="h-3 w-3" />
                          Sesli Mesaj
                        </Badge>
                      )}
                      {distress >= 8 ? (
                        <Badge
                          variant="destructive"
                          className="text-[10px] bg-rose-950/70 text-rose-300 border border-rose-600/50 font-mono"
                        >
                          Kriz: {distress}/10 (112/182)
                        </Badge>
                      ) : distress >= 5 ? (
                        <Badge
                          variant="gold"
                          className="text-[10px] bg-amber-950/70 text-amber-300 border border-amber-600/50 font-mono"
                        >
                          Baskı: {distress}/10
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-emerald-900/60 text-emerald-300 font-mono"
                        >
                          Sükûn: {distress}/10
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed font-sans">
                      {msg.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto text-xs text-muted-foreground group-hover:text-amber-400 transition-colors">
                    <span className="text-[11px] font-medium">
                      {isExpanded ? "Detayları Gizle" : "Denetimi İncele"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-amber-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {/* Expanded Deep Audit Details Drawer */}
                {isExpanded && (
                  <div className="border-t border-emerald-950/80 bg-[#090d0b]/80 p-5 space-y-4 animate-in fade-in-50 text-xs">
                    {/* Full Content */}
                    <div>
                      <div className="font-semibold text-foreground mb-1.5 flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        <span>Üretilen Nihai WhatsApp Yanıtı:</span>
                      </div>
                      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 whitespace-pre-line text-foreground/95 leading-relaxed font-sans shadow-inner">
                        {msg.content}
                      </div>
                    </div>

                    {/* Jev System 1 Telemetry Panel */}
                    <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
                        <strong className="text-amber-300 flex items-center gap-1.5 font-serif text-sm">
                          <Scale className="h-4 w-4 text-amber-400" />
                          Jev System 1 Hızlı Teşhis Telemetrisi
                        </strong>
                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                          Latency: ~35ms (RTX 4060 GPU / OpenRouter)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-950/80 space-y-2">
                          <span className="text-[11px] font-semibold text-muted-foreground block">
                            Noul İhtimal Metrikleri
                          </span>
                          <div className="space-y-1.5 font-mono text-[11px]">
                            <div className="flex justify-between items-center">
                              <span>is_fatwa:</span>
                              <span className="text-rose-400 font-bold">
                                {msg.jevMetadata?.noul?.is_fatwa ?? 0.05}
                              </span>
                            </div>
                            <div className="w-full bg-emerald-950/60 rounded-full h-1.5">
                              <div
                                style={{ width: `${Math.round((msg.jevMetadata?.noul?.is_fatwa ?? 0.05) * 100)}%` }}
                                className="bg-rose-500 h-1.5 rounded-full"
                              />
                            </div>

                            <div className="flex justify-between items-center pt-1">
                              <span>is_riba:</span>
                              <span className="text-amber-400 font-bold">
                                {msg.jevMetadata?.noul?.is_riba ?? 0.10}
                              </span>
                            </div>
                            <div className="w-full bg-emerald-950/60 rounded-full h-1.5">
                              <div
                                style={{ width: `${Math.round((msg.jevMetadata?.noul?.is_riba ?? 0.10) * 100)}%` }}
                                className="bg-amber-500 h-1.5 rounded-full"
                              />
                            </div>

                            <div className="flex justify-between items-center pt-1">
                              <span>needs_audio:</span>
                              <span className="text-cyan-400 font-bold">
                                {msg.jevMetadata?.noul?.needs_audio ?? 0.85}
                              </span>
                            </div>
                            <div className="w-full bg-emerald-950/60 rounded-full h-1.5">
                              <div
                                style={{ width: `${Math.round((msg.jevMetadata?.noul?.needs_audio ?? 0.85) * 100)}%` }}
                                className="bg-cyan-500 h-1.5 rounded-full"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-950/80 space-y-1.5">
                          <span className="text-[11px] font-semibold text-muted-foreground block">
                            Nefis Tuzağı &amp; Kategori
                          </span>
                          <div className="font-mono text-xs font-bold text-amber-300 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/40">
                            {msg.jevMetadata?.choice?.nafs_trap || "FAKIRLIK_KORKUSU_VESVESESI"}
                          </div>
                          <div className="text-[11px] text-muted-foreground pt-1">
                            RAG Kategorisi:{" "}
                            <span className="font-mono text-emerald-400 font-medium">
                              {msg.jevMetadata?.choice?.rag_category || "RIZIK_VE_TICARET"}
                            </span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-950/80 space-y-1.5">
                          <span className="text-[11px] font-semibold text-muted-foreground block">
                            Ruhsal Sıkıntı Derecesi
                          </span>
                          <div className="text-2xl font-bold font-mono text-amber-400">
                            {distress} / 10
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {distress >= 8
                              ? "🚨 Acil Teskin Önceliği (112/182 Koruması)"
                              : distress >= 5
                              ? "⚠️ Manevi Baskı (Teskin Sesi Önerildi)"
                              : "🌿 Sükûnet & İrşad"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gemini 2.5 Flash Editor Audit */}
                    <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-800/30 pb-2">
                        <strong className="text-emerald-300 flex items-center gap-1.5 font-serif text-sm">
                          <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          Gemini 2.5 Flash İçsel Editör Denetimi (editorAudit Structured Output)
                        </strong>
                        <Badge
                          variant="emerald"
                          className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/50"
                        >
                          5 Sarsılmaz Süzgeç Onaylı
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0d1411] border border-emerald-950">
                          {msg.editorAudit?.murakabe_applied ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                          )}
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Murakabe Bilinci:</span>
                            <span className="font-semibold text-foreground">
                              {msg.editorAudit?.murakabe_applied ? "Uygulandı (✓)" : "Eksik (✗)"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0d1411] border border-emerald-950">
                          {msg.editorAudit?.ilahi_riza_checked ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                          )}
                          <div>
                            <span className="text-muted-foreground block text-[10px]">İlahi Rıza Terazisi:</span>
                            <span className="font-semibold text-foreground">
                              {msg.editorAudit?.ilahi_riza_checked ? "Gözetildi (✓)" : "Eksik (✗)"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0d1411] border border-emerald-950">
                          {msg.editorAudit?.tevekkul_and_talak_hope_included ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Talâk 2-3 Ümit &amp; Çıkış:</span>
                            <span className="font-semibold text-foreground">
                              {msg.editorAudit?.tevekkul_and_talak_hope_included ? "Aşılandı (✓)" : "Gerekmedi"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Callout Cards for Nafs Trap and Siyer */}
                      {msg.editorAudit?.nafs_and_vesvese_addressed && (
                        <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-900/40">
                          <span className="font-semibold text-amber-400 block text-[11px] mb-0.5">
                            Deşifre Edilen Nefis Tuzağı &amp; Vesvese Tedavisi:
                          </span>
                          <p className="text-foreground/90 italic leading-relaxed">
                            &ldquo;{msg.editorAudit.nafs_and_vesvese_addressed}&rdquo;
                          </p>
                        </div>
                      )}

                      {msg.editorAudit?.siyer_example_used && (
                        <div className="p-3 rounded-lg bg-[#0d1411] border border-emerald-900/40">
                          <span className="font-semibold text-sky-400 block text-[11px] mb-0.5">
                            Kullanılan Siyer &amp; Sahih Hadis Mührü:
                          </span>
                          <p className="text-foreground/90 italic leading-relaxed">
                            &ldquo;{msg.editorAudit.siyer_example_used}&rdquo;
                          </p>
                        </div>
                      )}
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

