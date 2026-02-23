-- Add indexes to optimize the search endpoint query

-- 1. Video.views — used in ORDER BY views DESC LIMIT 200
CREATE INDEX "Video_views_idx" ON "Video"("views");

-- 2. VideoIngredient(videoId, confidence) — used in JOIN + WHERE confidence >= 0.5
CREATE INDEX "VideoIngredient_videoId_confidence_idx" ON "VideoIngredient"("videoId", "confidence");

-- 3. Video.title trigram GIN index — used in ILIKE '%term%' (case-insensitive contains)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Video_title_trgm_idx" ON "Video" USING GIN ("title" gin_trgm_ops);
