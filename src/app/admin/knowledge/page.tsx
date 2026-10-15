"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Volume2,
  Tag,
  Search,
  Filter,
  ExternalLink,
  ShieldAlert,
  Play,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface KnowledgeChunkView {
  id: string;
  sourceType: "QURAN" | "HADITH" | "DUA" | "HALIS_AYDEMIR" | "SIYER";
  sourceTitle: string;
  content: string;
  tags: string[];
  nafsTraps: string[];
  isRibaRelated: boolean;
  youtubeId?: string | null;
  startSec?: number | null;
  endSec?: number | null;
  audioUrl?: string | null;
}

const SAMPLE_CHUNKS: KnowledgeChunkView[] = [
  {
    id: "chunk-1",
    sourceType: "QURAN",
    sourceTitle: "Bakara Suresi 275-279",
    content:
      "Faiz yiyenler ancak şeytanın çarptığı kimsenin kalktığı gibi kalkarlar. Bu onların 'Alışveriş de faiz gibidir' demelerindendir. Oysa Allah alışverişi helal, faizi haram kılmıştır. Kime Rabbinden bir öğüt gelir de faizden vazgeçerse geçmişi kendisine aittir... Eğer faizden vazgeçmezseniz Allah ve Resulü tarafından açılmış bir harbi bilin!",
    tags: ["BAKARA_275_279", "RIBA", "HARAM", "RIZIK_VE_TICARET"],
    nafsTraps: ["KOLAY_KAZANC_HIRSI", "FAKIRLIK_KORKUSU_VESVESESI"],
    isRibaRelated: true,
  },
  {
    id: "chunk-2",
    sourceType: "QURAN",
    sourceTitle: "Talâk Suresi 2-3",
    content:
      "Kim Allah'tan korkup sakınırsa, Allah ona bir çıkış yolu açar ve onu beklemediği yerden rızıklandırır. Kim Allah'a tevekkül ederse, O kendisine yeter. Şüphesiz Allah, emrini yerine getirendir.",
    tags: ["TALAK_2_3", "TEVEKKUL", "CIKIS_YOLU", "RIZIK"],
    nafsTraps: ["UMITSIZLIK_VE_REHAVET", "CARESIZLIK_VEHMI"],
    isRibaRelated: false,
  },
  {
    id: "chunk-3",
    sourceType: "HADITH",
    sourceTitle: "Sahih Müslim (Birr 69)",
    content:
      "Peygamber Efendimiz (s.a.v.) buyurdu: 'Sadaka vermekle mal eksilmez. Kul affettikçe Allah onun izzet ve şerefini artırır. Kim Allah için tevazu gösterirse, Allah onu yüceltir.'",
    tags: ["INFAK", "SADAKA", "TEVAZU", "BEREKET"],
    nafsTraps: ["CIMRILIK", "MAL_HIRSI", "KIBIR"],
    isRibaRelated: false,
  },
  {
    id: "chunk-4",
    sourceType: "HALIS_AYDEMIR",
    sourceTitle: "Halis Aydemir - Tefekkür Sohbeti (Rızık ve Sebepler)",
    content:
      "Biz sebeplere hürmet ederiz, sebepleri putlaştırmayız. Kul sabah dükkanını açarken 'Rızkı bu dükkan değil, Rezzak olan Allah verecek' şuuruyla besmele çekmelidir. Sebeplere tapınmak insanı vesveseye ve telaşa boğar.",
    tags: ["RIZIK", "TEVEKKUL", "SEBEPLER", "HALIS_AYDEMIR"],
    nafsTraps: ["SEBEPLERI_PUTLASTIRMA", "GELECEK_ENDISESI"],
    isRibaRelated: false,
    youtubeId: "vB8kLm90Op",
    startSec: 120,
    endSec: 210,
    audioUrl: "https://media.sirdas.ai/halis_aydemir/rizik_ve_sebepler.ogg",
  },
  {
    id: "chunk-5",
    sourceType: "HALIS_AYDEMIR",
    sourceTitle: "Halis Aydemir - Vesvese ve Kalp Huzuru",
    content:
      "Vesvese kulun kalbine atılan boş bir oltadır. Sen o oltaya takılmazsan, 'Rabbim beni işitir ve görür' dersen o vesvese bir duman gibi dağılır. Kendi içindeki o sesi Rabbinin kelamıyla sustur.",
    tags: ["VESVESE", "SEKINE", "MURAKABE", "HALIS_AYDEMIR"],
    nafsTraps: ["ICSEL_VESVESE", "SUPHE_TUザAGI"],
    isRibaRelated: false,
    youtubeId: "xY90Pq11Az",
    startSec: 340,
    endSec: 435,
    audioUrl: "https://media.sirdas.ai/halis_aydemir/vesvese_ve_sekine.ogg",
  },
  {
    id: "chunk-6",
    sourceType: "SIYER",
    sourceTitle: "Taif Dönüşü Hz. Peygamber'in (s.a.v.) İhlas Duası",
    content:
      "Allah'ım! Güçsüzlüğümü, zaafımı ve insanların gözündeki değersizliğimi Sana arz ediyorum. Ey merhametlilerin en merhametlisi! Beni kime bırakıyorsun? Bana kaba davranan bir yabancıya mı, yoksa emrimi eline verdiğin bir düşmana mı? Eğer bana karşı bir gazabın yoksa, çektiğim sıkıntılara aldırmam...",
    tags: ["TAIF", "SIYER", "TESLIMIYET", "DUA"],
    nafsTraps: ["SITEM", "ISYAN_MEYLI", "SABIRSIZLIK"],
    isRibaRelated: false,
  },
];

export default function KnowledgeBrowserPage() {
  const [chunks, setChunks] = useState<KnowledgeChunkView[]>(SAMPLE_CHUNKS);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    async function loadChunks() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/knowledge");
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setChunks(json.data);
        }
      } catch (e) {
        console.warn("Using sample chunks fallback:", e);
      } finally {
        setLoading(false);
      }
    }
    loadChunks();
  }, []);

  const filteredChunks = chunks.filter((c) => {
    if (selectedType !== "ALL" && c.sourceType !== selectedType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const inTitle = c.sourceTitle.toLowerCase().includes(term);
      const inContent = c.content.toLowerCase().includes(term);
      const inTags = c.tags.some((t) => t.toLowerCase().includes(term));
      if (!inTitle && !inContent && !inTags) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="purple" className="text-xs">
            Çelik Kasa RAG Külliyatı
          </Badge>
          <span className="text-xs text-muted-foreground">
            Supabase pgvector (768 Boyutlu text-embedding-004)
          </span>
        </div>
        <h1 className="text-2xl font-bold font-serif tracking-tight text-foreground mt-1">
          Doğrulanmış Bilgi ve Ses Kütüphanesi
        </h1>
        <p className="text-xs text-muted-foreground">
          Halüsinasyonu sıfırlayan Kur&apos;an mealleri, sahih hadisler ve Halis Aydemir .ogg ses kesitleri havuzu.
        </p>
      </div>

      {/* Toolbar: Source Type filter & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        {/* Source Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "ALL", label: "Tümü" },
            { id: "QURAN", label: "Kur'an Pasajları" },
            { id: "HADITH", label: "Sahih Hadisler" },
            { id: "HALIS_AYDEMIR", label: "Halis Aydemir (Ses)" },
            { id: "SIYER", label: "Siyer & Ashab" },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedType === type.id
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Input
            type="text"
            placeholder="Ayet, etiket veya kelime ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 text-xs pl-8"
          />
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-3" />
        </div>
      </div>

      {/* Chunks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredChunks.map((chunk) => {
          const isAudio = chunk.sourceType === "HALIS_AYDEMIR";

          return (
            <div
              key={chunk.id}
              className={`rounded-2xl border p-6 bg-card shadow-sm space-y-4 flex flex-col justify-between transition-all hover:border-amber-500/40 ${
                chunk.isRibaRelated ? "border-amber-500/50" : "border-border"
              }`}
            >
              <div className="space-y-3">
                {/* Top Badges */}
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      chunk.sourceType === "QURAN"
                        ? "emerald"
                        : chunk.sourceType === "HADITH"
                        ? "blue"
                        : chunk.sourceType === "HALIS_AYDEMIR"
                        ? "gold"
                        : "purple"
                    }
                    className="text-[10px]"
                  >
                    {chunk.sourceType === "HALIS_AYDEMIR"
                      ? "Halis Aydemir Sohbeti"
                      : chunk.sourceType}
                  </Badge>

                  {chunk.isRibaRelated && (
                    <Badge variant="destructive" className="text-[10px] gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      Riba Kalkanı Eşleşmesi
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-bold font-serif text-foreground leading-snug">
                  {chunk.sourceTitle}
                </h3>

                {/* Content snippet */}
                <p className="text-xs text-foreground/90 leading-relaxed font-sans bg-muted/30 p-3.5 rounded-xl border border-border/60">
                  {chunk.content}
                </p>

                {/* Audio Player if Halis Aydemir */}
                {isAudio && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <Volume2 className="h-3.5 w-3.5" />
                        Cloudflare R2 .ogg Ses Kesiti
                      </span>
                      {chunk.startSec !== undefined && chunk.endSec !== undefined && (
                        <span>
                          {chunk.startSec} sn - {chunk.endSec} sn (
                          {(chunk.endSec || 0) - (chunk.startSec || 0)} sn)
                        </span>
                      )}
                    </div>

                    <audio
                      controls
                      className="w-full h-8 accent-amber-500"
                      preload="none"
                    >
                      <source src={chunk.audioUrl || ""} type="audio/ogg" />
                      Tarayıcınız ses oynatmayı desteklemiyor.
                    </audio>
                  </div>
                )}
              </div>

              {/* Bottom Tags and Nafs Traps */}
              <div className="pt-3 border-t border-border/60 space-y-2">
                <div className="flex flex-wrap items-center gap-1">
                  <Tag className="h-3 w-3 text-muted-foreground mr-1" />
                  {chunk.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {chunk.nafsTraps.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mr-1">
                      Hedef Nefis Tuzağı:
                    </span>
                    {chunk.nafsTraps.map((trap) => (
                      <span
                        key={trap}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                      >
                        {trap}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
