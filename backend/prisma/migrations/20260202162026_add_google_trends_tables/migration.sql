-- AlterTable
ALTER TABLE "DemandSignal" ADD COLUMN     "googleTrendsBreakout" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleTrendsFetchedAt" TIMESTAMP(3),
ADD COLUMN     "googleTrendsGrowth" DOUBLE PRECISION,
ADD COLUMN     "googleTrendsScore" INTEGER;

-- CreateTable
CREATE TABLE "GoogleTrend" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "interestValue" INTEGER NOT NULL,
    "isBreakout" BOOLEAN NOT NULL DEFAULT false,
    "date" TIMESTAMP(3) NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'US',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleTrendRelatedQuery" (
    "id" TEXT NOT NULL,
    "parentKeyword" TEXT NOT NULL,
    "relatedQuery" TEXT NOT NULL,
    "queryType" TEXT NOT NULL,
    "value" INTEGER,
    "isBreakout" BOOLEAN NOT NULL DEFAULT false,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleTrendRelatedQuery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleTrendsCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "responseData" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleTrendsCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleTrendsJobLog" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "keywordCount" INTEGER,
    "errorMessage" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleTrendsJobLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoogleTrend_keyword_idx" ON "GoogleTrend"("keyword");

-- CreateIndex
CREATE INDEX "GoogleTrend_date_idx" ON "GoogleTrend"("date");

-- CreateIndex
CREATE INDEX "GoogleTrend_isBreakout_idx" ON "GoogleTrend"("isBreakout");

-- CreateIndex
CREATE INDEX "GoogleTrend_interestValue_idx" ON "GoogleTrend"("interestValue");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleTrend_keyword_date_region_key" ON "GoogleTrend"("keyword", "date", "region");

-- CreateIndex
CREATE INDEX "GoogleTrendRelatedQuery_parentKeyword_idx" ON "GoogleTrendRelatedQuery"("parentKeyword");

-- CreateIndex
CREATE INDEX "GoogleTrendRelatedQuery_queryType_idx" ON "GoogleTrendRelatedQuery"("queryType");

-- CreateIndex
CREATE INDEX "GoogleTrendRelatedQuery_isBreakout_idx" ON "GoogleTrendRelatedQuery"("isBreakout");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleTrendRelatedQuery_parentKeyword_relatedQuery_fetchedA_key" ON "GoogleTrendRelatedQuery"("parentKeyword", "relatedQuery", "fetchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleTrendsCache_cacheKey_key" ON "GoogleTrendsCache"("cacheKey");

-- CreateIndex
CREATE INDEX "GoogleTrendsCache_cacheKey_idx" ON "GoogleTrendsCache"("cacheKey");

-- CreateIndex
CREATE INDEX "GoogleTrendsCache_expiresAt_idx" ON "GoogleTrendsCache"("expiresAt");

-- CreateIndex
CREATE INDEX "GoogleTrendsJobLog_createdAt_idx" ON "GoogleTrendsJobLog"("createdAt");

-- CreateIndex
CREATE INDEX "GoogleTrendsJobLog_status_idx" ON "GoogleTrendsJobLog"("status");

-- CreateIndex
CREATE INDEX "GoogleTrendsJobLog_jobType_idx" ON "GoogleTrendsJobLog"("jobType");

-- CreateIndex
CREATE INDEX "DemandSignal_googleTrendsBreakout_idx" ON "DemandSignal"("googleTrendsBreakout");
