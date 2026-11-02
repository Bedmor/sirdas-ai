#!/usr/bin/env python3
"""
Sırdaş AI - Comprehensive Quranic Semantic Tagger & Nafs Trap Classifier
Deeply enriches all 1,546 passages with accurate tags and NafsTraps,
then updates both the local JSON and the live Supabase PostgreSQL database.
"""

import json
import logging
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

PIPELINE_ROOT = Path(__file__).resolve().parent
if str(PIPELINE_ROOT) not in sys.path:
    sys.path.insert(0, str(PIPELINE_ROOT))

import config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sirdas.corpus_enricher")

# Canonical Nafs Traps from Jev Specification
VALID_NAFS_TRAPS = {
    "FAKIRLIK_KORKUSU_VESVESESI",
    "GIZLI_KIBIR_HAKLILIK",
    "UMITSIZLIK_KARAMSARLIK",
    "INTIKAM_VE_HASET",
    "ELALEM_NE_DER_RIYA",
    "REHAVET_TEMBELLIK",
    "KADERE_ITIRAZ_VE_ISYAN",
    "ACELECI_TALEPLER_VE_ISTIACAL",
    "ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK",
    "UCUB_VE_AMELINE_GUVENME",
    "KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK",
    "GIZLI_SIRK_VE_SAHTE_SIGINAKLAR",
    "SUI_ZAN_VE_TECESSUS",
    "MINNET_VE_BASA_KAKMA",
    "KAYITSIZLIK_VE_MERHAMETSIZLIK",
    "GECMISIN_PISMANLIK_GIRDABI",
    "TUL_I_EMEL_VE_GAYETSIZLIK",
    "VESVESE_VE_GUSUL_ABDEST_EVHAMI",
    "KOLAY_KAZANC_HIRSI",
    "CIMRILIK_VE_MAL_HIRSI",
    "HAYIR_DIYEMEME_ZAAFI",
}

# Canonical RAG Categories from Jev Specification
VALID_RAG_CATEGORIES = {
    "RIZIK_VE_TICARET",
    "SABIR_VE_MUSIBET",
    "OFKE_VE_AHLAK",
    "AILE_VE_SILA_I_RAHIM",
    "KUL_HAKKI_VE_ADALET",
    "TEVEKKUL_VE_MURAKABE",
    "SIYER_ORNEKLERI",
    "KADER_VE_KAZA_HIKMETI",
    "DUA_VE_ILCA_USULU",
    "TEVBE_VE_INABE",
    "KALP_AMELLELI_VE_IHLAS",
    "FANILIK_VE_TAZIYE",
    "FITNE_VE_AHIR_ZAMAN_AHLAKI",
    "ISRAF_VE_IKTISAT_FIKHI",
    "SIYERDE_DARLIK_DONEMLERI",
}

MANDATORY_RIBA_TAGS = ["faiz", "riba", "haram_kazanc", "borc_krizi"]
BAKARA_275_279_TAG = "BAKARA_275_279"


def classify_spiritual_passage(
    surah_id: int,
    surah_name: str,
    verse_start: int,
    verse_end: int,
    content: str,
) -> Tuple[List[str], List[str], bool]:
    """
    Analyzes Quran translation text and context to assign:
    1. Rich, relevant tags (Surah name, core RAG categories, spiritual topic keywords)
    2. Specific Nafs Traps that this passage addresses, cures, or warns against.
    3. is_riba_related boolean flag.
    """
    text_lower = content.lower()
    surah_lower = surah_name.lower()

    tags_set: Set[str] = {"QURAN", surah_name.upper()}
    traps_set: Set[str] = set()
    is_riba = False

    # 1. FAİZ / RİBA (Anti-Usury Package)
    is_bakara_275_279 = (surah_id == 2 and verse_start == 275 and verse_end == 279)
    has_riba_kw = any(w in text_lower for w in ["faiz", "riba", "ribâ", "tefeci", "faiz yiyenler"])
    if is_bakara_275_279 or has_riba_kw:
        is_riba = True
        for m_tag in MANDATORY_RIBA_TAGS:
            tags_set.add(m_tag)
        tags_set.update(["RIBA", "HARAM", "RIZIK_VE_TICARET", "BORC_AHLAKI"])
        traps_set.update(["KOLAY_KAZANC_HIRSI", "FAKIRLIK_KORKUSU_VESVESESI", "CIMRILIK_VE_MAL_HIRSI"])
        if is_bakara_275_279:
            tags_set.add(BAKARA_275_279_TAG)

    # 2. RIZIK, TİCARET, İNFAK, SADAKA, MAL & BEREKET
    if any(w in text_lower for w in ["rızık", "rızıklandır", "ticaret", "kazanç", "bereket", "harcarlar", "infak", "sadaka", "zekat", "mallar", "servet", "açlık", "yoksul", "miskin", "darlık", "ihtiyaç"]):
        tags_set.add("RIZIK_VE_TICARET")
        if any(w in text_lower for w in ["infak", "sadaka", "zekat", "harca", "yoksul", "doyur"]):
            tags_set.add("INFAK")
            tags_set.add("ISRAF_VE_IKTISAT_FIKHI")
            traps_set.add("CIMRILIK_VE_MAL_HIRSI")
            traps_set.add("FAKIRLIK_KORKUSU_VESVESESI")
        else:
            traps_set.add("FAKIRLIK_KORKUSU_VESVESESI")
            traps_set.add("ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK")

    # 3. SABIR, MUSİBET, İMTİHAN, HASTALIK, ZORLUK & TESELLİ
    if any(w in text_lower for w in ["sabır", "sabredin", "sabredenler", "imtihan", "musibet", "sınamak", "zorluk", "sıkıntı", "bela", "hastalık", "keder", "hüzün", "acı", "tahammül", "üzülmeyin", "gevşemeyin", "kolaylık"]):
        tags_set.add("SABIR_VE_MUSIBET")
        traps_set.add("UMITSIZLIK_KARAMSARLIK")
        traps_set.add("KADERE_ITIRAZ_VE_ISYAN")
        if any(w in text_lower for w in ["acele", "çabuk", "vakit"]):
            traps_set.add("ACELECI_TALEPLER_VE_ISTIACAL")

    # 4. KADER, TAKDİR, İLAHİ İLİM & GİZLİ HİKMET
    if any(w in text_lower for w in ["kader", "takdir", "yazılmış", "kitapta", "levh", "hızır", "musa", "bilmezsiniz", "hayır sanırsınız", "şer sanırsınız", "hikmet", "hakkıyla bilen", "haberdar"]):
        tags_set.add("KADER_VE_KAZA_HIKMETI")
        tags_set.add("TEVEKKUL_VE_MURAKABE")
        traps_set.add("KADERE_ITIRAZ_VE_ISYAN")
        traps_set.add("KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK")
        traps_set.add("ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK")

    # 5. TEVEKKÜL, SEKiNET, HUZUR, MURAKABE & ALLAH'A GÜVEN
    if any(w in text_lower for w in ["tevekkül", "vekil", "hasbiyallah", "güven", "teslim", "şah damarı", "yakındır", "gören", "işiten", "huzur", "sekinet", "kalpler ancak", "koruyan", "sığın"]):
        tags_set.add("TEVEKKUL_VE_MURAKABE")
        tags_set.add("KALP_AMELLELI_VE_IHLAS")
        traps_set.add("KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK")
        traps_set.add("ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK")
        traps_set.add("UMITSIZLIK_KARAMSARLIK")

    # 6. TÖVBE, İSTİĞFAR, BAĞIŞLANMA & RAHMET
    if any(w in text_lower for w in ["tövbe", "tevbe", "istiğfar", "bağışla", "affet", "mağfiret", "gafûr", "rahîm", "merhamet", "günah", "hata", "pişman", "nefsimize zulmettik", "ümit kesmeyin"]):
        tags_set.add("TEVBE_VE_INABE")
        tags_set.add("KALP_AMELLELI_VE_IHLAS")
        traps_set.add("GECMISIN_PISMANLIK_GIRDABI")
        traps_set.add("UMITSIZLIK_KARAMSARLIK")

    # 7. KİBİR, UCUB, BÜYÜKLENME, FİRAVUN/KARUN & HELAK İBRETİ
    if any(w in text_lower for w in ["kibir", "büyüklendi", "böbürlen", "küçümse", "firavun", "karun", "haman", "nemrut", "ad kavmi", "semud", "şımarık", "şımarma", "üstünlük", "gurur", "aldandı", "helak"]):
        tags_set.add("OFKE_VE_AHLAK")
        tags_set.add("KUL_HAKKI_VE_ADALET")
        traps_set.add("GIZLI_KIBIR_HAKLILIK")
        traps_set.add("UCUB_VE_AMELINE_GUVENME")
        traps_set.add("ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK")

    # 8. ÖFKE, KİN, HASET, İFTİRA, SUİZAN & DİL AHLAKI
    if any(w in text_lower for w in ["öfke", "haset", "kıskan", "kin", "intikam", "düşmanlık", "alay", "gıybet", "arkadan çekiştir", "zannet", "suizan", "tecessüs", "iftira", "yalan", "şahitlik", "diller"]):
        tags_set.add("OFKE_VE_AHLAK")
        tags_set.add("KUL_HAKKI_VE_ADALET")
        traps_set.add("INTIKAM_VE_HASET")
        traps_set.add("SUI_ZAN_VE_TECESSUS")
        traps_set.add("GIZLI_KIBIR_HAKLILIK")

    # 9. KUL HAKKI, ADALET, EMANET, YETİM & ZULÜM
    if any(w in text_lower for w in ["adalet", "hak", "kul hakkı", "zulüm", "zalim", "haksızlık", "tartı", "ölçü", "emanet", "yetim", "yoksul", "hüküm", "zulmetmeyin"]):
        tags_set.add("KUL_HAKKI_VE_ADALET")
        traps_set.add("KAYITSIZLIK_VE_MERHAMETSIZLIK")
        traps_set.add("GIZLI_KIBIR_HAKLILIK")
        traps_set.add("INTIKAM_VE_HASET")

    # 10. DUA, İLTİCA, SEHER & YAKARMA
    if any(w in text_lower for w in ["dua", "rabbenâ", "rabbimiz", "yalvar", "niyaz", "isteyin", "kabul", "çağırın", "seher", "secde", "gece ibadeti", "namaz", "iltica"]):
        tags_set.add("DUA_VE_ILCA_USULU")
        tags_set.add("TEVEKKUL_VE_MURAKABE")
        traps_set.add("ACELECI_TALEPLER_VE_ISTIACAL")
        traps_set.add("UMITSIZLIK_KARAMSARLIK")

    # 11. FANİLİK, ÖLÜM, KIYAMET, CENNET, CEHENNEM & AHiRET
    if any(w in text_lower for w in ["ölüm", "ahiret", "kıyamet", "cennet", "cehennem", "hesap", "mizan", "kabir", "diriliş", "haşr", "fani", "geçici", "aldatıcı dünya", "ecel", "can verme"]):
        tags_set.add("FANILIK_VE_TAZIYE")
        traps_set.add("TUL_I_EMEL_VE_GAYETSIZLIK")
        traps_set.add("ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK")
        traps_set.add("REHAVET_TEMBELLIK")

    # 12. AİLE, ANNE-BABA, EŞ, EVLAT & AKRABA
    if any(w in text_lower for w in ["anne", "baba", "ana-baba", "ebeveyn", "öf bile deme", "eş", "zevce", "evlat", "çocuk", "akraba", "sıla-i rahim", "merhamet kanatları", "nikah", "boşanma", "aile"]):
        tags_set.add("AILE_VE_SILA_I_RAHIM")
        tags_set.add("KUL_HAKKI_VE_ADALET")
        traps_set.add("MINNET_VE_BASA_KAKMA")
        traps_set.add("INTIKAM_VE_HASET")
        traps_set.add("KAYITSIZLIK_VE_MERHAMETSIZLIK")

    # 13. SALİH AMEL, GAYRET, DİRİLİŞ & TEMBELLİKTEN SIKILMA
    if any(w in text_lower for w in ["amel", "salih amel", "çalışın", "gayret", "koşun", "yarışın", "cihad", "ağırlaşmayın", "vakit", "zaman", "iman edip iyi işler"]):
        tags_set.add("KALP_AMELLELI_VE_IHLAS")
        traps_set.add("REHAVET_TEMBELLIK")
        traps_set.add("TUL_I_EMEL_VE_GAYETSIZLIK")

    # 14. ELALEM, RİYA, GÖSTERİŞ & İKİYÜZLÜLÜK
    if any(w in text_lower for w in ["gösteriş", "insanlar görsün", "elalem", "övgü", "münafık", "ikiyüzlü", "desinler", "kınayanın kınaması"]):
        tags_set.add("KALP_AMELLELI_VE_IHLAS")
        tags_set.add("FITNE_VE_AHIR_ZAMAN_AHLAKI")
        traps_set.add("ELALEM_NE_DER_RIYA")
        traps_set.add("HAYIR_DIYEMEME_ZAAFI")
        traps_set.add("UCUB_VE_AMELINE_GUVENME")

    # 15. VESVESE, KURUNTU & ŞÜPHE
    if any(w in text_lower for w in ["vesvese", "fısıldar", "şeytanın adımları", "kuruntu", "şüphe", "hannas", "göğüslere fısıldayan"]):
        tags_set.add("TEVEKKUL_VE_MURAKABE")
        traps_set.add("VESVESE_VE_GUSUL_ABDEST_EVHAMI")
        traps_set.add("UMITSIZLIK_KARAMSARLIK")

    # 16. SURE SPESİFİK DERİN TEMALAR
    if surah_id == 1:  # Fâtiha
        tags_set.update(["DUA_VE_ILCA_USULU", "TEVEKKUL_VE_MURAKABE", "FATİHA", "TEVHID"])
        traps_set.update(["GIZLI_SIRK_VE_SAHTE_SIGINAKLAR", "ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK"])
    elif surah_id == 12:  # Yûsuf
        tags_set.update(["SIYER_ORNEKLERI", "SABIR_VE_MUSIBET", "KADER_VE_KAZA_HIKMETI"])
        traps_set.update(["INTIKAM_VE_HASET", "UMITSIZLIK_KARAMSARLIK"])
    elif surah_id in (93, 94):  # Duhâ & İnşirah
        tags_set.update(["SABIR_VE_MUSIBET", "TEVEKKUL_VE_MURAKABE", "TESKIN_VE_TESELLI"])
        traps_set.update(["UMITSIZLIK_KARAMSARLIK", "FAKIRLIK_KORKUSU_VESVESESI"])
    elif surah_id == 65:  # Talâk
        tags_set.update(["RIZIK_VE_TICARET", "TEVEKKUL_VE_MURAKABE", "TALAK_2_3"])
        traps_set.update(["FAKIRLIK_KORKUSU_VESVESESI", "KONTROL_YANILSAMASI_VE_MUKEMMELIYETCILIK"])
    elif surah_id == 18:  # Kehf
        tags_set.update(["KADER_VE_KAZA_HIKMETI", "FITNE_VE_AHIR_ZAMAN_AHLAKI"])
        traps_set.update(["ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK", "KADERE_ITIRAZ_VE_ISYAN"])
    elif surah_id == 49:  # Hucurât
        tags_set.update(["OFKE_VE_AHLAK", "KUL_HAKKI_VE_ADALET"])
        traps_set.update(["SUI_ZAN_VE_TECESSUS", "INTIKAM_VE_HASET", "GIZLI_KIBIR_HAKLILIK"])
    elif surah_id == 31:  # Lokmân
        tags_set.update(["AILE_VE_SILA_I_RAHIM", "OFKE_VE_AHLAK"])
        traps_set.update(["GIZLI_KIBIR_HAKLILIK", "ELALEM_NE_DER_RIYA"])
    elif surah_id == 103:  # Asr
        tags_set.update(["FANILIK_VE_TAZIYE", "SABIR_VE_MUSIBET"])
        traps_set.update(["REHAVET_TEMBELLIK", "TUL_I_EMEL_VE_GAYETSIZLIK"])
    elif surah_id in (113, 114):  # Felak & Nâs
        tags_set.update(["TEVEKKUL_VE_MURAKABE", "MANEVI_KORUNMA"])
        traps_set.update(["VESVESE_VE_GUSUL_ABDEST_EVHAMI", "INTIKAM_VE_HASET"])

    # Fallback Guarantee: Every passage MUST have at least 1-2 NafsTraps and 3-5 tags
    if not traps_set:
        # If still empty, evaluate general spiritual tone
        if any(w in text_lower for w in ["allah", "rab", "ilah", "hüküm", "hak"]):
            traps_set.add("ZAHIRE_ALDANMA_VE_SEBEP_PERESTLIK")
            traps_set.add("GIZLI_SIRK_VE_SAHTE_SIGINAKLAR")
        else:
            traps_set.add("REHAVET_TEMBELLIK")
            traps_set.add("TUL_I_EMEL_VE_GAYETSIZLIK")

    if len(tags_set) < 3:
        tags_set.add("TEVEKKUL_VE_MURAKABE")
        tags_set.add("KALP_AMELLELI_VE_IHLAS")

    # Clean and sort
    final_tags = sorted(list(tags_set))
    final_traps = sorted(list(traps_set))

    return final_tags, final_traps, is_riba


def run_enrichment():
    passages_path = PIPELINE_ROOT / "data" / "quran_semantic_passages.json"
    if not passages_path.exists():
        logger.error("Passages file not found: %s", passages_path)
        sys.exit(1)

    with open(passages_path, "r", encoding="utf-8") as f:
        passages = json.load(f)

    logger.info("Enriching %d Quran semantic passages with deep spiritual tags and nafs traps...", len(passages))

    enriched_count = 0
    traps_distribution: Dict[str, int] = {}
    tags_distribution: Dict[str, int] = {}
    riba_count = 0

    updates_for_db = []

    for item in passages:
        s_id = item.get("surah_id", 0)
        s_name = item.get("surah_name", "")
        v_start = item.get("verse_start", 0)
        v_end = item.get("verse_end", 0)
        content = item.get("content", "")

        tags, nafs_traps, is_riba = classify_spiritual_passage(s_id, s_name, v_start, v_end, content)

        # Preserve Bakara 275-279 priority
        is_canonical_bakara_riba = (s_id == 2 and v_start == 275 and v_end == 279)
        if is_canonical_bakara_riba:
            is_riba = True
            if BAKARA_275_279_TAG not in tags:
                tags.insert(0, BAKARA_275_279_TAG)

        item["tags"] = tags
        item["nafs_traps"] = nafs_traps
        item["is_riba_related"] = is_riba

        enriched_count += 1
        if is_riba:
            riba_count += 1

        for t in tags:
            tags_distribution[t] = tags_distribution.get(t, 0) + 1
        for trap in nafs_traps:
            traps_distribution[trap] = traps_distribution.get(trap, 0) + 1

        updates_for_db.append({
            "id": item["id"],
            "source_type": item.get("source_type", "QURAN"),
            "source_title": item.get("source_title", ""),
            "content": item.get("content", ""),
            "tags": tags,
            "nafs_traps": nafs_traps,
            "is_riba_related": is_riba,
        })

    # 1. Save enriched JSON locally
    with open(passages_path, "w", encoding="utf-8") as f:
        json.dump(passages, f, ensure_ascii=False, indent=2)

    logger.info("Successfully updated local %s (size: %.2f MB)", passages_path.name, passages_path.stat().st_size / (1024 * 1024))
    logger.info("Top 10 Nafs Traps assigned: %s", sorted(traps_distribution.items(), key=lambda x: x[1], reverse=True)[:10])
    logger.info("Top 10 Tags assigned: %s", sorted(tags_distribution.items(), key=lambda x: x[1], reverse=True)[:10])
    logger.info("Total Riba-related passages: %d", riba_count)

    # 2. Update Supabase PostgreSQL database
    logger.info("Updating live Supabase database knowledge_chunks...")
    supabase_client = config.get_supabase_client()

    batch_size = 100
    total_db_updates = len(updates_for_db)
    success_db = 0

    t0 = time.time()
    for i in range(0, total_db_updates, batch_size):
        batch = updates_for_db[i : i + batch_size]
        try:
            # We use upsert with on_conflict="id" to update tags, nafs_traps, is_riba_related
            # In supabase-py, upserting partial records updates specified columns on match!
            res = supabase_client.table("knowledge_chunks").upsert(
                batch,
                on_conflict="id"
            ).execute()
            success_db += len(batch)
            logger.info("DB Progress: %d / %d chunks updated in Supabase...", success_db, total_db_updates)
        except Exception as e:
            logger.error("Batch update failed at %d-%d: %s", i, i + len(batch), e)
            raise

    elapsed = time.time() - t0
    logger.info("=" * 60)
    logger.info("Enrichment Complete in %.2f seconds", elapsed)
    logger.info("Total passages enriched: %d", enriched_count)
    logger.info("Total DB records updated: %d", success_db)
    logger.info("=" * 60)


if __name__ == "__main__":
    run_enrichment()
