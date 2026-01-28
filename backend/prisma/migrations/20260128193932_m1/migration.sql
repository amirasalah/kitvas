-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subscription" TEXT NOT NULL DEFAULT 'free',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correctionsCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "thumbnailUrl" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "views" INTEGER,
    "viewsUpdatedAt" TIMESTAMP(3),
    "channelId" TEXT,
    "extractedAt" TIMESTAMP(3),
    "labeledAt" TIMESTAMP(3),
    "labeledBy" TEXT,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoTag" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "VideoTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoIngredient" (
    "videoId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "correctionsCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VideoIngredient_pkey" PRIMARY KEY ("videoId","ingredientId")
);

-- CreateTable
CREATE TABLE "Search" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "ingredients" TEXT[],
    "resultCount" INTEGER,
    "hadYouTubeHit" BOOLEAN NOT NULL DEFAULT false,
    "demandBand" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Correction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "suggestedName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Correction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedOpportunity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ingredients" TEXT[],
    "status" TEXT NOT NULL,
    "opportunityScore" TEXT NOT NULL,
    "trackedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outcome" (
    "id" TEXT NOT NULL,
    "trackedOpportunityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoUrl" TEXT,
    "views7day" INTEGER,
    "rating" INTEGER,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandSignal" (
    "id" TEXT NOT NULL,
    "ingredientKey" TEXT NOT NULL,
    "ingredients" TEXT[],
    "demandScore" INTEGER NOT NULL,
    "demandBand" TEXT NOT NULL,
    "avgViews" INTEGER NOT NULL,
    "medianViews" INTEGER NOT NULL,
    "avgViewsPerDay" INTEGER NOT NULL,
    "videoCount" INTEGER NOT NULL,
    "contentGapScore" INTEGER NOT NULL,
    "contentGapType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Video_youtubeId_key" ON "Video"("youtubeId");

-- CreateIndex
CREATE INDEX "Video_youtubeId_idx" ON "Video"("youtubeId");

-- CreateIndex
CREATE INDEX "Video_publishedAt_idx" ON "Video"("publishedAt");

-- CreateIndex
CREATE INDEX "Video_labeledAt_idx" ON "Video"("labeledAt");

-- CreateIndex
CREATE INDEX "Video_viewsUpdatedAt_idx" ON "Video"("viewsUpdatedAt");

-- CreateIndex
CREATE INDEX "VideoTag_videoId_idx" ON "VideoTag"("videoId");

-- CreateIndex
CREATE INDEX "VideoTag_tag_idx" ON "VideoTag"("tag");

-- CreateIndex
CREATE INDEX "VideoTag_category_idx" ON "VideoTag"("category");

-- CreateIndex
CREATE UNIQUE INDEX "VideoTag_videoId_tag_key" ON "VideoTag"("videoId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_key" ON "Ingredient"("name");

-- CreateIndex
CREATE INDEX "Ingredient_name_idx" ON "Ingredient"("name");

-- CreateIndex
CREATE INDEX "VideoIngredient_ingredientId_videoId_idx" ON "VideoIngredient"("ingredientId", "videoId");

-- CreateIndex
CREATE INDEX "VideoIngredient_videoId_idx" ON "VideoIngredient"("videoId");

-- CreateIndex
CREATE INDEX "Search_userId_createdAt_idx" ON "Search"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Search_createdAt_idx" ON "Search"("createdAt");

-- CreateIndex
CREATE INDEX "Correction_videoId_ingredientId_idx" ON "Correction"("videoId", "ingredientId");

-- CreateIndex
CREATE INDEX "Correction_userId_idx" ON "Correction"("userId");

-- CreateIndex
CREATE INDEX "TrackedOpportunity_userId_status_idx" ON "TrackedOpportunity"("userId", "status");

-- CreateIndex
CREATE INDEX "Outcome_trackedOpportunityId_idx" ON "Outcome"("trackedOpportunityId");

-- CreateIndex
CREATE INDEX "Outcome_userId_idx" ON "Outcome"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DemandSignal_ingredientKey_key" ON "DemandSignal"("ingredientKey");

-- CreateIndex
CREATE INDEX "DemandSignal_ingredientKey_idx" ON "DemandSignal"("ingredientKey");

-- CreateIndex
CREATE INDEX "DemandSignal_demandBand_idx" ON "DemandSignal"("demandBand");

-- CreateIndex
CREATE INDEX "DemandSignal_calculatedAt_idx" ON "DemandSignal"("calculatedAt");

-- AddForeignKey
ALTER TABLE "VideoTag" ADD CONSTRAINT "VideoTag_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoIngredient" ADD CONSTRAINT "VideoIngredient_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoIngredient" ADD CONSTRAINT "VideoIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Search" ADD CONSTRAINT "Search_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Correction" ADD CONSTRAINT "Correction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Correction" ADD CONSTRAINT "Correction_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Correction" ADD CONSTRAINT "Correction_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedOpportunity" ADD CONSTRAINT "TrackedOpportunity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_trackedOpportunityId_fkey" FOREIGN KEY ("trackedOpportunityId") REFERENCES "TrackedOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
