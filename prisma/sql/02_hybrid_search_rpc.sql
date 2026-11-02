-- ==============================================================================
-- SIRDAŞ AI: ÇOKLU KAYNAK DENGELİ HİBRİT ARAMA RPC FONKSİYONU (02_hybrid_search_rpc.sql)
-- Supabase PostgreSQL üzerinde çalıştırılır.
-- Garanti edilen kaynak dengesi:
--   1. Zorunlu Riba/Faiz Paketi (force_riba = true ise Bakara 275-279 kesinlikle çekilir)
--   2. En uygun Kur'an Pasajı (QURAN)
--   3. En uygun Sahih Hadis / Siyer Örneği (HADITH, SIYER)
--   4. En uygun Halis Aydemir Sesli Sohbet Parçası (HALIS_AYDEMIR)
--   5. Genel Hibrit Benzerlik Adayları (kalan kontenjan için)
--   6. DISTINCT ON (c.id) ile kusursuz tekilleştirme (Deduplication)
-- SourceType enum'ının varlığını garanti et
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SourceType') THEN
        CREATE TYPE "SourceType" AS ENUM ('QURAN', 'HADITH', 'DUA', 'HALIS_AYDEMIR', 'SIYER');
    END IF;
END $$;

CREATE OR REPLACE FUNCTION match_knowledge_chunks(
    query_embedding vector(768),
    match_threshold float DEFAULT 0.30,
    match_count int DEFAULT 4,
    filter_category text DEFAULT NULL,
    filter_nafs text DEFAULT NULL,
    force_riba boolean DEFAULT FALSE
)
RETURNS TABLE (
    id uuid,
    source_type "SourceType",
    source_title text,
    content text,
    tags text[],
    nafs_traps text[],
    is_riba_related boolean,
    youtube_id text,
    start_sec double precision,
    end_sec double precision,
    audio_url text,
    similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- 1. Zorunlu Riba/Faiz Paketi (force_riba = true ise Bakara 275-279 kesinlikle çekilir)
    riba_enforced AS (
        SELECT 
            kc.id,
            kc.source_type,
            kc.source_title,
            kc.content,
            kc.tags,
            kc.nafs_traps,
            kc.is_riba_related,
            kc.youtube_id,
            kc.start_sec,
            kc.end_sec,
            kc.audio_url,
            1.0::double precision AS similarity,
            1 AS priority_rank
        FROM public.knowledge_chunks kc
        WHERE force_riba = TRUE 
          AND kc.is_riba_related = TRUE
        ORDER BY (CASE WHEN 'BAKARA_275_279' = ANY(kc.tags) THEN 0 ELSE 1 END), kc.created_at ASC
        LIMIT 2
    ),
    -- 2. Kaynak Dengesi Garantisi: En uygun Kur'an Pasajı
    best_quran AS (
        SELECT 
            kc.id,
            kc.source_type,
            kc.source_title,
            kc.content,
            kc.tags,
            kc.nafs_traps,
            kc.is_riba_related,
            kc.youtube_id,
            kc.start_sec,
            kc.end_sec,
            kc.audio_url,
            (1 - (kc.embedding <=> query_embedding))::double precision AS similarity,
            2 AS priority_rank
        FROM public.knowledge_chunks kc
        WHERE kc.source_type = 'QURAN'
          AND kc.embedding <=> query_embedding <= (1 - match_threshold)
        ORDER BY 
          (CASE WHEN filter_category IS NOT NULL AND filter_category = ANY(kc.tags) THEN 0 ELSE 1 END) ASC,
          (CASE WHEN filter_nafs IS NOT NULL AND filter_nafs = ANY(kc.nafs_traps) THEN 0 ELSE 1 END) ASC,
          kc.embedding <=> query_embedding ASC
        LIMIT 1
    ),
    -- 3. Kaynak Dengesi Garantisi: En uygun Sahih Hadis / Siyer Örneği
    best_hadith_siyer AS (
        SELECT 
            kc.id,
            kc.source_type,
            kc.source_title,
            kc.content,
            kc.tags,
            kc.nafs_traps,
            kc.is_riba_related,
            kc.youtube_id,
            kc.start_sec,
            kc.end_sec,
            kc.audio_url,
            (1 - (kc.embedding <=> query_embedding))::double precision AS similarity,
            3 AS priority_rank
        FROM public.knowledge_chunks kc
        WHERE kc.source_type IN ('HADITH', 'SIYER')
          AND kc.embedding <=> query_embedding <= (1 - match_threshold)
        ORDER BY 
          (CASE WHEN filter_category IS NOT NULL AND filter_category = ANY(kc.tags) THEN 0 ELSE 1 END) ASC,
          (CASE WHEN filter_nafs IS NOT NULL AND filter_nafs = ANY(kc.nafs_traps) THEN 0 ELSE 1 END) ASC,
          kc.embedding <=> query_embedding ASC
        LIMIT 1
    ),
    -- 4. Kaynak Dengesi Garantisi: En uygun Halis Aydemir Sesli Sohbet Parçası
    best_halis_audio AS (
        SELECT 
            kc.id,
            kc.source_type,
            kc.source_title,
            kc.content,
            kc.tags,
            kc.nafs_traps,
            kc.is_riba_related,
            kc.youtube_id,
            kc.start_sec,
            kc.end_sec,
            kc.audio_url,
            (1 - (kc.embedding <=> query_embedding))::double precision AS similarity,
            4 AS priority_rank
        FROM public.knowledge_chunks kc
        WHERE kc.source_type = 'HALIS_AYDEMIR'
          AND kc.embedding <=> query_embedding <= (1 - match_threshold)
        ORDER BY 
          (CASE WHEN filter_category IS NOT NULL AND filter_category = ANY(kc.tags) THEN 0 ELSE 1 END) ASC,
          (CASE WHEN filter_nafs IS NOT NULL AND filter_nafs = ANY(kc.nafs_traps) THEN 0 ELSE 1 END) ASC,
          kc.embedding <=> query_embedding ASC
        LIMIT 1
    ),
    -- 5. Genel Hibrit Benzerlik Adayları (Kalan kontenjanı en yakın parçalarla doldurur)
    general_matches AS (
        SELECT 
            kc.id,
            kc.source_type,
            kc.source_title,
            kc.content,
            kc.tags,
            kc.nafs_traps,
            kc.is_riba_related,
            kc.youtube_id,
            kc.start_sec,
            kc.end_sec,
            kc.audio_url,
            (1 - (kc.embedding <=> query_embedding))::double precision AS similarity,
            5 AS priority_rank
        FROM public.knowledge_chunks kc
        WHERE kc.embedding <=> query_embedding <= (1 - match_threshold)
          AND (filter_category IS NULL OR filter_category = ANY(kc.tags))
          AND (filter_nafs IS NULL OR filter_nafs = ANY(kc.nafs_traps))
        ORDER BY kc.embedding <=> query_embedding ASC
        LIMIT match_count
    ),
    -- 6. Tüm adayların birleşimi ve id bazlı tekilleştirme (Deduplication)
    unfiltered_candidates AS (
        SELECT * FROM riba_enforced
        UNION ALL
        SELECT * FROM best_quran
        UNION ALL
        SELECT * FROM best_hadith_siyer
        UNION ALL
        SELECT * FROM best_halis_audio
        UNION ALL
        SELECT * FROM general_matches
    ),
    deduplicated AS (
        SELECT DISTINCT ON (c.id)
            c.id,
            c.source_type,
            c.source_title,
            c.content,
            c.tags,
            c.nafs_traps,
            c.is_riba_related,
            c.youtube_id,
            c.start_sec,
            c.end_sec,
            c.audio_url,
            c.similarity,
            c.priority_rank
        FROM unfiltered_candidates c
        ORDER BY c.id, c.priority_rank ASC, c.similarity DESC
    )
    SELECT 
        d.id,
        d.source_type,
        d.source_title,
        d.content,
        d.tags,
        d.nafs_traps,
        d.is_riba_related,
        d.youtube_id,
        d.start_sec,
        d.end_sec,
        d.audio_url,
        d.similarity
    FROM deduplicated d
    ORDER BY d.priority_rank ASC, d.similarity DESC
    LIMIT (match_count + CASE WHEN force_riba THEN 2 ELSE 0 END);
END;
$$;
