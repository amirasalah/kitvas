# ML Training & Insights System Plan

> **✅ STATUS: IMPLEMENTED** (January 2026)
>
> This plan has been fully implemented. See `docs/IMPLEMENTATION_STATUS.md` for details.

## Overview

A comprehensive system to leverage collected data for:
1. **Extraction Improvement** - Use corrections to reduce false positives ✅
2. **Trending Insights Dashboard** - Analytics endpoints for trends and gaps ✅
3. **Opportunity Score Calibration** - Use outcomes to improve predictions ✅

**ML Approach:** Hybrid - Groq API for extraction + lightweight local classification

---

## Phase 1: Analytics Infrastructure (Foundation)

### 1.1 New Database Tables

```prisma
// Add to schema.prisma

model IngredientTrend {
  id            String   @id @default(cuid())
  ingredientId  String
  ingredient    Ingredient @relation(fields: [ingredientId], references: [id])
  period        String   // 'daily' | 'weekly' | 'monthly'
  periodStart   DateTime
  searchCount   Int      // searches containing this ingredient
  videoCount    Int      // new videos with this ingredient
  avgViews      Int?     // avg views of videos with this ingredient
  @@unique([ingredientId, period, periodStart])
  @@index([period, periodStart])
  @@index([searchCount])
}

model ExtractionFeedback {
  id              String   @id @default(cuid())
  pattern         String   // text pattern that was wrong (e.g., "ethiopian")
  feedbackType    String   // 'false_positive' | 'false_negative' | 'rename'
  correctValue    String?  // what it should be (null for false positives)
  occurrences     Int      @default(1)
  incorporated    Boolean  @default(false) // has this been added to prompts?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@unique([pattern, feedbackType])
  @@index([incorporated])
}

model OpportunityCalibration {
  id                String   @id @default(cuid())
  demandBand        String   // 'hot' | 'growing' | 'stable' | 'niche'
  opportunityScore  String   // 'high' | 'medium' | 'low'
  totalOutcomes     Int
  avgViews7day      Int
  avgRating         Float
  successRate       Float    // % with rating >= 4
  calculatedAt      DateTime @default(now())
  @@unique([demandBand, opportunityScore])
}
```

### 1.2 New Analytics Router

Create `backend/src/routers/analytics.ts`:

```typescript
// Endpoints to implement:

// GET /analytics/trending
// Returns: top 20 ingredients by search volume (7d/30d/90d)
trendingIngredients: {
  input: { period: '7d' | '30d' | '90d' }
  output: Array<{
    ingredient: string
    searchCount: number
    growth: number // % change from previous period
    videoCount: number
    avgViews: number
  }>
}

// GET /analytics/seasonal
// Returns: ingredient popularity by month (for planning)
seasonalPatterns: {
  input: { ingredient?: string }
  output: Array<{
    month: number
    topIngredients: Array<{ name: string, searchCount: number }>
  }>
}

// GET /analytics/content-gaps
// Returns: underserved ingredient combinations
contentGaps: {
  input: { minSearches: number }
  output: Array<{
    ingredients: string[]
    searchCount: number
    videoCount: number
    gapScore: number // high search, low video = high gap
    demandBand: string
  }>
}

// GET /analytics/co-occurrence
// Returns: ingredients frequently searched together
ingredientCoOccurrence: {
  input: { ingredient: string }
  output: Array<{
    pairedWith: string
    coSearchCount: number
    avgViews: number
  }>
}

// GET /analytics/extraction-accuracy
// Returns: current extraction performance metrics
extractionAccuracy: {
  output: {
    precision: number
    recall: number
    f1: number
    totalLabeled: number
    lastMeasured: Date
  }
}

// GET /analytics/opportunity-calibration
// Returns: how accurate opportunity scores have been
opportunityCalibration: {
  output: Array<{
    opportunityScore: string
    demandBand: string
    totalOutcomes: number
    avgViews7day: number
    successRate: number
  }>
}
```

### 1.3 Trend Aggregation Job

Create `backend/src/scripts/aggregate-trends.ts`:

```typescript
// Run daily (after midnight)
// Aggregates search patterns into IngredientTrend table

async function aggregateTrends() {
  // 1. Get all searches from last 24h
  // 2. Count ingredient occurrences
  // 3. Upsert daily trends
  // 4. Roll up into weekly/monthly on appropriate days
}
```

---

## Phase 2: Extraction Improvement System

### 2.1 Correction Aggregation

Create `backend/src/scripts/aggregate-corrections.ts`:

```typescript
// Analyzes corrections to find patterns

async function aggregateCorrections() {
  // 1. Group corrections by action type
  // 2. Find frequent false positives (action='wrong')
  //    - Pattern: ingredient name that's often marked wrong
  //    - Store in ExtractionFeedback with type='false_positive'
  // 3. Find frequent additions (action='add')
  //    - Pattern: ingredient name that's often added
  //    - Store in ExtractionFeedback with type='false_negative'
  // 4. Find frequent renames
  //    - Store mapping in ExtractionFeedback
}
```

### 2.2 Dynamic Prompt Enhancement

Update `backend/src/lib/ingredient-extractor.ts`:

```typescript
// Add function to build enhanced prompt with feedback

async function buildEnhancedPrompt(prisma: PrismaClient): Promise<string> {
  // 1. Fetch unincorporated ExtractionFeedback
  // 2. Build negative examples section:
  //    "DO NOT extract these as ingredients: ethiopian, korean, ..."
  // 3. Build positive examples section:
  //    "Make sure to detect these common ingredients: chocolate, ..."
  // 4. Build rename mappings:
  //    "Use 'bell pepper' instead of 'capsicum', ..."
  // 5. Cache prompt for 1 hour
}

// Modify extractWithLLM to use enhanced prompt
async function extractWithLLM(
  title: string,
  description: string | null,
  transcript: string | null,
  prisma?: PrismaClient // optional, for feedback-enhanced extraction
): Promise<ExtractedIngredient[]>
```

### 2.3 Blocklist/Allowlist Integration

Update keyword extraction in `ingredient-extractor.ts`:

```typescript
// Add dynamic blocklist from corrections
const DYNAMIC_BLOCKLIST = new Set<string>(); // populated from ExtractionFeedback

async function refreshBlocklist(prisma: PrismaClient) {
  const falsePositives = await prisma.extractionFeedback.findMany({
    where: { feedbackType: 'false_positive', occurrences: { gte: 3 } }
  });
  DYNAMIC_BLOCKLIST.clear();
  falsePositives.forEach(fp => DYNAMIC_BLOCKLIST.add(fp.pattern.toLowerCase()));
}

// Use in keyword extraction
function extractFromKeywords(text: string): ExtractedIngredient[] {
  // ... existing logic ...
  // Add: skip if ingredient in DYNAMIC_BLOCKLIST
}
```

### 2.4 Accuracy Tracking Over Time

Create table for historical accuracy:

```prisma
model AccuracySnapshot {
  id          String   @id @default(cuid())
  precision   Float
  recall      Float
  f1          Float
  exactMatch  Float
  sampleSize  Int
  measuredAt  DateTime @default(now())
  @@index([measuredAt])
}
```

Update `measure-accuracy.ts` to store snapshots.

---

## Phase 3: Opportunity Score Calibration

### 3.1 Calibration Data Collection

Create `backend/src/scripts/calibrate-opportunities.ts`:

```typescript
// Run weekly
// Correlates predicted scores with actual outcomes

async function calibrateOpportunities() {
  // 1. Join TrackedOpportunity + Outcome
  // 2. Group by (demandBand, opportunityScore)
  // 3. Calculate:
  //    - avgViews7day per group
  //    - avgRating per group
  //    - successRate (rating >= 4) per group
  // 4. Upsert into OpportunityCalibration
  // 5. Generate weight adjustments for demand calculator
}
```

### 3.2 Learned Weights for Demand Calculation

Update `backend/src/lib/youtube-demand-calculator.ts`:

```typescript
// Add calibration-based weight adjustments

interface CalibrationWeights {
  outlierRatioWeight: number;    // default: 15
  supplyDemandWeight: number;    // default: 25
  emergingTopicWeight: number;   // default: 15
  velocityWeight: number;        // default: 10
}

// Load weights from OpportunityCalibration results
async function loadCalibratedWeights(prisma: PrismaClient): Promise<CalibrationWeights> {
  // Analyze which factors correlate with high-success outcomes
  // Adjust weights accordingly
}
```

### 3.3 Simple Classification Model

Create `backend/src/lib/opportunity-classifier.ts`:

```typescript
// Lightweight classifier using decision tree logic
// No external ML library needed - rule-based from calibration data

interface OpportunityFeatures {
  demandScore: number;
  contentGapScore: number;
  avgViews: number;
  videoCount: number;
  recentVideoRatio: number;
}

function classifyOpportunity(features: OpportunityFeatures): {
  score: 'high' | 'medium' | 'low';
  confidence: number;
  reasoning: string;
} {
  // Decision tree based on calibration data thresholds
  // Example:
  // if demandScore >= 70 && contentGapScore >= 60 && calibration.hot.successRate > 0.6
  //   return { score: 'high', confidence: calibration.hot.successRate }
}
```

---

## Phase 4: Insights API for Frontend

### 4.1 Dashboard Data Endpoint

Add to analytics router:

```typescript
// GET /analytics/dashboard
// Single endpoint for insights dashboard
dashboardData: {
  output: {
    trending: Array<{ ingredient: string, growth: number }>
    topGaps: Array<{ ingredients: string[], gapScore: number }>
    recentAccuracy: { f1: number, trend: 'up' | 'down' | 'stable' }
    calibrationSummary: {
      highAccuracy: number,
      mediumAccuracy: number,
      lowAccuracy: number
    }
    weeklyStats: {
      searches: number,
      corrections: number,
      outcomes: number
    }
  }
}
```

### 4.2 Export Endpoints for Training

```typescript
// GET /analytics/export/corrections
// Export corrections for external model training
exportCorrections: {
  input: { since?: Date }
  output: Array<{
    videoTitle: string,
    videoDescription: string,
    extractedIngredient: string,
    action: string,
    suggestedName: string | null
  }>
}

// GET /analytics/export/training-set
// Export labeled data for model fine-tuning
exportTrainingSet: {
  input: { split: 'train' | 'validation' | 'test' }
  output: Array<{
    input: { title: string, description: string },
    output: { ingredients: string[] }
  }>
}
```

---

## Implementation Order

### Week 1: Analytics Foundation
1. Add new Prisma models (IngredientTrend, ExtractionFeedback, etc.)
2. Run migration
3. Create analytics router with basic endpoints
4. Implement trend aggregation job

### Week 2: Extraction Improvement
1. Implement correction aggregation script
2. Add dynamic blocklist to keyword extraction
3. Enhance LLM prompt with feedback patterns
4. Add accuracy tracking over time

### Week 3: Opportunity Calibration
1. Implement calibration data collection
2. Add OpportunityCalibration table aggregation
3. Create rule-based classifier
4. Integrate calibrated weights into demand calculator

### Week 4: Polish & Dashboard
1. Add dashboard data endpoint
2. Create export endpoints for training data
3. Add cron jobs for daily/weekly aggregations
4. Test end-to-end feedback loops

---

## Verification Strategy

### Analytics Endpoints
- [ ] Trending endpoint returns correct counts (verify against raw Search queries)
- [ ] Content gaps align with DemandSignal data
- [ ] Co-occurrence patterns are sensible

### Extraction Improvement
- [ ] Corrections marked as 'wrong' 3+ times get added to blocklist
- [ ] F1 score improves after incorporating feedback
- [ ] False positive rate decreases over time

### Opportunity Calibration
- [ ] Calibration matches Outcome data (manual spot check)
- [ ] High-score opportunities have higher success rate than low-score
- [ ] Classifier confidence correlates with actual outcomes

---

## Files to Create/Modify

### New Files
- `backend/src/routers/analytics.ts` - Analytics API endpoints
- `backend/src/scripts/aggregate-trends.ts` - Daily trend aggregation
- `backend/src/scripts/aggregate-corrections.ts` - Correction pattern extraction
- `backend/src/scripts/calibrate-opportunities.ts` - Weekly calibration
- `backend/src/lib/opportunity-classifier.ts` - Rule-based classifier

### Modified Files
- `backend/prisma/schema.prisma` - Add new models
- `backend/src/lib/ingredient-extractor.ts` - Dynamic blocklist, enhanced prompts
- `backend/src/lib/youtube-demand-calculator.ts` - Calibrated weights
- `backend/src/scripts/measure-accuracy.ts` - Store snapshots
- `backend/src/index.ts` - Register analytics router

---

## No External ML Dependencies

This plan uses:
- **Groq API** - Existing LLM for extraction (enhanced prompts)
- **Rule-based classification** - Decision trees from calibration data
- **SQL aggregations** - Prisma for trend/pattern analysis
- **No GPU, no scikit-learn, no TensorFlow** - Pure TypeScript

The "learning" happens through:
1. Feedback aggregation → prompt improvement
2. Outcome correlation → weight adjustment
3. Pattern detection → blocklist/allowlist updates
