-- ==============================================================================
-- SIRDAŞ AI: PGVECTOR UZANTISI VE İNDEKSLER (01_pgvector_init.sql)
-- Supabase PostgreSQL üzerinde çalıştırılır.
-- ==============================================================================

-- 1. pgvector uzantısını etkinleştir
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. HNSW (Hierarchical Navigable Small World) İndeksi Oluştur
-- 768 boyutlu Google text-embedding-004 için Cosine Distance İndeksi
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx 
ON public.knowledge_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 3. Etiket ve Nefis Tuzağı aramaları için GIN indeksleri
CREATE INDEX IF NOT EXISTS knowledge_chunks_tags_gin_idx 
ON public.knowledge_chunks USING GIN (tags);

CREATE INDEX IF NOT EXISTS knowledge_chunks_nafs_traps_gin_idx 
ON public.knowledge_chunks USING GIN (nafs_traps);
