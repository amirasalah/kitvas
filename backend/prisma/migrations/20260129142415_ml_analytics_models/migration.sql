-- CreateTable
CREATE TABLE "IngredientTrend" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "searchCount" INTEGER NOT NULL,
    "videoCount" INTEGER NOT NULL,
    "avgViews" INTEGER,

    CONSTRAINT "IngredientTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionFeedback" (
    "id" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "feedbackType" TEXT NOT NULL,
    "correctValue" TEXT,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "incorporated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractionFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityCalibration" (
    "id" TEXT NOT NULL,
    "demandBand" TEXT NOT NULL,
    "opportunityScore" TEXT NOT NULL,
    "totalOutcomes" INTEGER NOT NULL,
    "avgViews7day" INTEGER NOT NULL,
    "avgRating" DOUBLE PRECISION NOT NULL,
    "successRate" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityCalibration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccuracySnapshot" (
    "id" TEXT NOT NULL,
    "precision" DOUBLE PRECISION NOT NULL,
    "recall" DOUBLE PRECISION NOT NULL,
    "f1" DOUBLE PRECISION NOT NULL,
    "exactMatch" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccuracySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IngredientTrend_period_periodStart_idx" ON "IngredientTrend"("period", "periodStart");

-- CreateIndex
CREATE INDEX "IngredientTrend_searchCount_idx" ON "IngredientTrend"("searchCount");

-- CreateIndex
CREATE UNIQUE INDEX "IngredientTrend_ingredientId_period_periodStart_key" ON "IngredientTrend"("ingredientId", "period", "periodStart");

-- CreateIndex
CREATE INDEX "ExtractionFeedback_incorporated_idx" ON "ExtractionFeedback"("incorporated");

-- CreateIndex
CREATE INDEX "ExtractionFeedback_feedbackType_occurrences_idx" ON "ExtractionFeedback"("feedbackType", "occurrences");

-- CreateIndex
CREATE UNIQUE INDEX "ExtractionFeedback_pattern_feedbackType_key" ON "ExtractionFeedback"("pattern", "feedbackType");

-- CreateIndex
CREATE INDEX "OpportunityCalibration_calculatedAt_idx" ON "OpportunityCalibration"("calculatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityCalibration_demandBand_opportunityScore_key" ON "OpportunityCalibration"("demandBand", "opportunityScore");

-- CreateIndex
CREATE INDEX "AccuracySnapshot_measuredAt_idx" ON "AccuracySnapshot"("measuredAt");

-- AddForeignKey
ALTER TABLE "IngredientTrend" ADD CONSTRAINT "IngredientTrend_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
