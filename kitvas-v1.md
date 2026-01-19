# Kitvas V1: Product Requirements Document

**Version:** 2.0  
**Last Updated:** January 2026  
**Status:** Scope Locked — Ready for Development

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Defensibility Strategy](#4-defensibility-strategy)
5. [Target Users](#5-target-users)
6. [Core Features](#6-core-features)
7. [User Stories](#7-user-stories)
8. [User Experience](#8-user-experience)
9. [Business Model](#9-business-model)
10. [Scope Definition](#10-scope-definition)
11. [Success Metrics](#11-success-metrics)
12. [Risks & Mitigations](#12-risks--mitigations)
13. [Timeline](#13-timeline)

---

## 1. Product Vision

### 1.1 One-Liner

**"The collective intelligence platform for food content creators — where every search makes the system smarter."**

### 1.2 Vision Statement

Kitvas is not just a tool — it's an intelligence network that compounds with every creator who uses it. By combining supply intelligence, demand signals, and **community-contributed data**, Kitvas creates insights that no single creator could discover alone and that no competitor can replicate without the same community scale.

### 1.3 The Moat Thesis

Most SaaS tools can be cloned in a weekend. Kitvas cannot because:

1. **Data compounds**: Every search, every correction, every outcome creates proprietary intelligence
2. **Community creates value**: Creators contributing data receive insights impossible to get elsewhere
3. **AI improves with scale**: More users → better ingredient detection → better recommendations → more users

**The goal**: Build the "Waze of recipe intelligence" — where users contribute individual data and receive collective intelligence that improves with every interaction.

### 1.4 Why Now

- 700K-900K food creators need better tools
- No existing tool provides ingredient-level intelligence
- AI/ML now enables real-time extraction at low cost
- **First-mover in community-driven culinary data wins permanently**

---

## 2. Problem Statement

### 2.1 The Core Problem

**Food content creators waste time making videos nobody searches for.**

A creator spends 4-8 hours filming a recipe, only to discover:
- 50 other creators already made the same thing
- The ingredient combination has zero search demand
- A slight twist would have 10x the opportunity

### 2.2 Why Existing Solutions Fail

| Tool | What It Does | Why It's Not Enough |
|------|--------------|---------------------|
| VidIQ / TubeBuddy | Keyword SEO | Not ingredient-level |
| Google Trends | Search interest | Not recipe-specific |
| Manual YouTube search | See what exists | 2-3 hours per idea, no demand signal |

**The gap**: No tool combines supply + demand + performance at the ingredient level. And critically, **no tool learns from creators' actual outcomes**.

### 2.3 The Hidden Opportunity

Every creator who uses a recipe intelligence tool generates valuable data:
- Which ingredients they search
- Which opportunities they pursue
- **What actually worked** (the outcome)

Today, this data is lost. Kitvas captures it, compounds it, and returns it as collective intelligence.

---

## 3. Solution Overview

### 3.1 The Three Intelligence Layers

| Layer | What It Provides | Data Source |
|-------|------------------|-------------|
| **Supply Intelligence** | What videos exist for this recipe | YouTube API + ML extraction |
| **Demand Intelligence** | What people are searching for | Autocomplete + Trends |
| **Outcome Intelligence** | What actually works for creators | **Community contributions** |

The third layer is the moat. Competitors can replicate supply and demand. They cannot replicate outcome intelligence without building the same community.

### 3.2 The Give-to-Get Model

Kitvas operates on a **give-to-get** principle:

| Creator Gives | Creator Gets |
|---------------|--------------|
| Ingredient corrections | More accurate search results |
| Search patterns | Trending ingredient alerts |
| Video performance outcomes | Benchmark against similar creators |
| Recipe success/failure reports | Opportunity scores calibrated to reality |

**The value proposition shifts from "use our tool" to "join our intelligence network."**

### 3.3 How It Works (User Perspective)

1. **Search**: Enter ingredients → See supply, demand, opportunities
2. **Correct**: Fix any ingredient detection errors → Improve the model
3. **Save**: Track opportunities you're considering → Build your idea pipeline
4. **Report**: Share how your video performed → Calibrate opportunity scores
5. **Discover**: Surface insights from aggregate community data

---

## 4. Defensibility Strategy

### 4.1 The Three Moats

Kitvas builds defensibility through three reinforcing moats:

```
┌─────────────────────────────────────────────────────────────────┐
│                     THE KITVAS FLYWHEEL                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│     ┌──────────────┐                                             │
│     │   MORE       │                                             │
│     │   USERS      │◄────────────────────────────────┐          │
│     └──────┬───────┘                                  │          │
│            │                                          │          │
│            ▼                                          │          │
│     ┌──────────────┐      ┌──────────────┐     ┌─────┴────────┐ │
│     │   MORE       │      │   BETTER     │     │   BETTER     │ │
│     │   DATA       │─────►│   AI         │────►│   INSIGHTS   │ │
│     └──────────────┘      └──────────────┘     └──────────────┘ │
│            │                                          ▲          │
│            │                                          │          │
│            ▼                                          │          │
│     ┌──────────────┐                                  │          │
│     │   MORE       │──────────────────────────────────┘          │
│     │   OUTCOMES   │                                             │
│     └──────────────┘                                             │
│                                                                  │
│  MOAT 1: Data Network Effects                                    │
│  MOAT 2: Community Network Effects                               │
│  MOAT 3: AI Feedback Loop                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Moat #1: Proprietary Ingredient Intelligence (Data)

**What we're building:**
A proprietary database of ingredient relationships, cooking techniques, and recipe patterns that improves with every user interaction.

**How it compounds:**

| Data Type | How We Capture It | Why It's Defensible |
|-----------|-------------------|---------------------|
| Ingredient corrections | Users fix detection errors | Labeled training data competitors can't buy |
| Ingredient relationships | "Users who searched X also searched Y" | Co-occurrence patterns unique to our corpus |
| Technique associations | "Air fryer works for X but not Y" | Cooking knowledge encoded from user behavior |
| Substitution patterns | "When Z unavailable, users try W" | Practical knowledge from real decisions |

**V1 Implementation:**
- **"Help Us Improve" button** on every detected ingredient
- Corrections tagged with user confidence and context
- Aggregate corrections into model retraining (weekly initially)
- Show users impact: "Your correction improved results for 47 other creators"

### 4.3 Moat #2: Creator Performance Benchmarks (Community)

**What we're building:**
The only database of recipe video performance benchmarked by ingredient, cuisine, and format.

**The give-to-get loop:**

```
Creator connects YouTube channel (OAuth)
            │
            ▼
We track performance of their recipe videos
            │
            ▼
Creator sees: "Your miso pasta video performed 
              in the top 23% of pasta recipes"
            │
            ▼
Aggregate data becomes: "Miso + pasta videos 
              average 15K views in first 7 days"
            │
            ▼
This feeds opportunity scoring for ALL users
```

**Why creators will share:**
- Get benchmarks they can't calculate alone
- See how their content compares to similar creators
- Receive alerts when their niche is trending

**V1 Implementation:**
- Optional YouTube channel connection
- Performance tracking for connected channels
- Anonymous aggregation into opportunity scores
- "Benchmark Report" feature showing creator vs. category

### 4.4 Moat #3: Outcome-Calibrated AI (Learning)

**What we're building:**
An AI that improves opportunity predictions based on **actual creator outcomes**, not just supply/demand signals.

**The feedback loop:**

```
1. Kitvas shows "Vegan miso pasta" as HIGH opportunity
            │
            ▼
2. 50 creators pursue this opportunity
            │
            ▼
3. 30 days later, we ask: "Did you make this video? How did it perform?"
            │
            ▼
4. Results: 35 made it, avg 12K views (vs. 8K category avg)
            │
            ▼
5. Kitvas learns: This opportunity signal was ACCURATE
            │
            ▼
6. Similar signals get boosted in future recommendations
```

**Why this is defensible:**
Competitors can replicate our algorithm. They cannot replicate 10,000 creator outcomes across 500 ingredient combinations.

**V1 Implementation:**
- "Track This Opportunity" button to save ideas
- Follow-up prompt after 30 days: "Did you make this? How'd it do?"
- Opportunity accuracy score visible to users: "73% of HIGH opportunities beat category average"
- Model recalibration based on outcomes (monthly)

### 4.5 Moat #4: Community Network Effects

**What we're building:**
A community where creators help each other through shared intelligence, templates, and best practices.

**V1.1+ Features (Post-Launch):**
- **Recipe Brief Templates**: Successful creators share their research templates
- **Opportunity Alerts**: Subscribe to ingredient trends from creators you follow
- **Collab Finder**: Connect with creators pursuing complementary niches

**Why it's defensible:**
Once creators have followed 20 others, saved 50 opportunities, and built a workflow around Kitvas, switching costs become significant.

### 4.6 Defensibility Timeline

| Phase | Moat Focus | Switching Cost |
|-------|------------|----------------|
| V1 Launch | Ingredient corrections + benchmarking | Low |
| Month 3 | Outcome tracking + calibration | Medium |
| Month 6 | Community templates + follows | Medium-High |
| Month 12 | Full network effects | High |

**Key insight**: We don't need all moats at launch. We need to **design for them** at launch and **activate them** over the first year.

---

## 5. Target Users

### 5.1 Primary User: The Growing Creator

**Profile:**
- Channel size: 5,000 - 100,000 subscribers
- Posting frequency: 1-3 videos per week
- Revenue: $200-2,000/month from content
- Mindset: Treats content creation as a business

**Name:** Maya (representative persona)  
**Channel:** 15,000 subscribers, 2 videos/week

**Why Maya contributes to the network:**
- She wants to know how her videos compare to similar creators
- She'll correct ingredient detection if it means better search results
- She'll report outcomes if it means better opportunity predictions
- She's invested in the success of her content strategy

**Quote:**
> "I don't just want a tool. I want to be part of a community that helps me make better decisions."

### 5.2 Contributor Personas

| Persona | Contribution | Motivation |
|---------|--------------|------------|
| **The Perfectionist** | Corrects every detection error | Wants accurate data |
| **The Benchmarker** | Connects channel for performance data | Wants to compare |
| **The Tracker** | Reports every outcome | Wants to close the loop |
| **The Sharer** | Creates templates and guides | Wants recognition |

Different users contribute differently. **All contributions compound into collective value.**

### 5.3 Anti-Personas

| Anti-Persona | Why Not |
|--------------|---------|
| One-time researchers | Won't contribute to the flywheel |
| Tool tourists | No intent to participate in community |
| Scraper/aggregators | Extract value without contributing |

**Design implication**: Some features (benchmarking, outcome scores) require contribution to unlock.

---

## 6. Core Features

### 6.1 Feature #1: Intelligent Recipe Search

#### What It Is
Search by ingredients to see supply, demand, and opportunities.

#### The Value
- Saves 2-3 hours of manual research
- Shows the competitive landscape
- Reveals opportunities others miss

#### The Moat Contribution
- Every search contributes to ingredient co-occurrence data
- Popular searches inform trending ingredients
- Search patterns reveal emerging niches

#### User Experience
1. Enter ingredients (up to 10)
2. Optionally filter by tags (vegan, air fryer, etc.)
3. See results ranked by relevance
4. See demand signals (High/Medium/Low/Unknown)
5. See opportunities with evidence

---

### 6.2 Feature #2: Ingredient Correction System

#### What It Is
Users can correct ingredient detection errors, improving the model for everyone.

#### The Value
- Better search results for the user
- Contribution to collective intelligence
- Visible impact on the community

#### The Moat Contribution
- **Labeled training data** that competitors cannot buy
- Each correction makes the model more accurate
- Corrections are tied to context (video type, cuisine, source)

#### User Experience

```
┌─────────────────────────────────────────────────────────────────┐
│ Video: "Creamy Miso Pasta"                                      │
│                                                                  │
│ Detected Ingredients:                                           │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ ✓ miso [title] ●●●●●                                         ││
│ │ ✓ pasta [title] ●●●●●                                        ││
│ │ ✓ butter [description] ●●●●○                                 ││
│ │ ? parmesan [transcript] ●●●○○  [This is wrong] [This is right]│
│ │                                                              ││
│ │ [+ Add missing ingredient]                                   ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ 💡 Your corrections help improve results for all creators       │
│    You've improved 12 results this month                        │
└─────────────────────────────────────────────────────────────────┘
```

#### Correction Types

| Action | Data Captured | Model Improvement |
|--------|---------------|-------------------|
| "This is wrong" | False positive label | Reduce over-detection |
| "This is right" | Confirmed positive | Increase confidence threshold |
| "Add missing" | False negative label | Improve recall |
| "Better name" | Synonym mapping | Expand vocabulary |

#### Gamification

| Milestone | Reward |
|-----------|--------|
| First correction | "Contributor" badge |
| 10 corrections | Access to beta features |
| 50 corrections | "Ingredient Expert" badge |
| 100 corrections | Featured in contributor list |

---

### 6.3 Feature #3: Demand Intelligence

#### What It Is
Signals showing what people are searching for, displayed as bands (High/Medium/Low/Unknown).

#### The Value
- Answers "Is anyone looking for this?"
- Reveals related searches
- Shows trend direction (rising/stable/declining)

#### The Moat Contribution
- Search patterns unique to food creators (vs. general population)
- Demand signals enriched by actual creator outcomes over time

#### User Experience

```
📈 Demand: HIGH
   Strong search signals with rising interest
   
   Related searches:
   • "miso pasta recipe" 
   • "creamy miso pasta"
   • "umami pasta"
   
   Based on: YouTube autocomplete + Trends data
   
   🎯 Accuracy: 73% of HIGH demand opportunities 
      beat category average (based on 234 outcomes)
```

**Note the accuracy signal**: This comes from outcome tracking (Moat #3).

---

### 6.4 Feature #4: Opportunity Detection

#### What It Is
Evidence-backed recommendations for recipe variations worth pursuing.

#### The Value
- Finds gaps creators can't see manually
- Provides evidence for each recommendation
- Suggests specific angles to pursue

#### The Moat Contribution
- Opportunity accuracy calibrated by community outcomes
- Evidence includes benchmark data from connected channels
- Comparable videos include performance data from the community

#### User Experience

```
┌────────────────────────────────────────────────────────────────┐
│ ⚡ HIGH OPPORTUNITY: Vegan Version                              │
│                                                                 │
│ Why this is an opportunity:                                     │
│ • Demand: HIGH — strong search signals                          │
│ • Performance: Similar recipes avg 15K views/day                │
│ • Supply: Only 2 videos exist                                   │
│                                                                 │
│ 🎯 Opportunity Accuracy: 78%                                    │
│    Based on 47 creators who pursued similar opportunities       │
│                                                                 │
│ Reference videos (from Kitvas community):                       │
│ • "Vegan Garlic Pasta" — 32K views/day (tracked creator)       │
│ • "Plant-Based Creamy Pasta" — 18K views/day                   │
│                                                                 │
│ [Track This Opportunity]  [Share Feedback]                      │
└────────────────────────────────────────────────────────────────┘
```

---

### 6.5 Feature #5: Opportunity Tracking & Outcomes

#### What It Is
Save opportunities you're considering, then report how they performed.

#### The Value
- Build a pipeline of ideas
- Get reminded to report outcomes
- See your personal success rate vs. community

#### The Moat Contribution
- **This is the core flywheel feature**
- Outcomes calibrate opportunity scoring
- Creates switching cost (your tracked history lives here)

#### User Experience

**Tracking:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 My Tracked Opportunities                                      │
│                                                                  │
│ Active (3):                                                      │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Vegan miso pasta                                             ││
│ │ Saved: Jan 5 • Status: Researching                           ││
│ │ Opportunity Score: HIGH (78%)                                ││
│ │ [Mark as Filmed] [Remove]                                    ││
│ └──────────────────────────────────────────────────────────────┘│
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Air fryer tofu                                               ││
│ │ Saved: Jan 3 • Status: Filming                               ││
│ │ Opportunity Score: MEDIUM (62%)                              ││
│ │ [Mark as Published] [Remove]                                 ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Completed (12):                                                  │
│ Your outcomes vs. predictions: 75% accurate                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Outcome Reporting:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Report Outcome: Vegan miso pasta                              │
│                                                                  │
│ Did you publish this video?                                      │
│ [Yes, I published it] [No, I decided not to]                    │
│                                                                  │
│ If yes:                                                          │
│ • YouTube URL: [_______________________]                         │
│ • First 7-day views: [_______]                                  │
│ • How would you rate this opportunity? ⭐⭐⭐⭐⭐                │
│                                                                  │
│ 💡 Your outcome helps calibrate recommendations for             │
│    23 other creators researching similar ideas                  │
│                                                                  │
│ [Submit Outcome]                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6.6 Feature #6: Performance Benchmarking (Requires Channel Connection)

#### What It Is
Connect your YouTube channel to see how your recipe videos compare to category averages.

#### The Value
- "Your miso pasta video performed in the top 23% of pasta recipes"
- See which of your ingredients outperform others
- Get alerts when your niches are trending

#### The Moat Contribution
- Aggregate performance data feeds opportunity scoring
- Creates strong give-to-get incentive
- Switching cost: your benchmark history lives here

#### User Experience

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Performance Benchmark Report                                  │
│                                                                  │
│ Channel: Maya's Kitchen (15.2K subscribers)                     │
│ Videos analyzed: 47                                              │
│                                                                  │
│ Your Top Performing Ingredients:                                 │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ 1. Gochujang — 3.2x category average                         ││
│ │ 2. Miso — 2.1x category average                              ││
│ │ 3. Sesame — 1.8x category average                            ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│ Opportunities in Your Wheelhouse:                                │
│ Based on your success with Asian fusion, consider:               │
│ • Gochujang + Pasta (HIGH opportunity, fits your style)         │
│ • Miso + Chicken (MEDIUM opportunity, rising demand)            │
│                                                                  │
│ 🔒 This report is personalized using your channel data +        │
│    anonymized benchmarks from 1,247 connected creators          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6.7 Feature #7: Weekly Trend Dashboard

#### What It Is
Trending ingredients with supply vs. demand comparison.

#### The Value
- Spot rising ingredients before saturation
- Avoid declining trends
- See community outcome data for trending topics

#### The Moat Contribution
- Trends enriched by community performance data
- "Creators who pursued this trend saw X results"

#### User Experience

```
🏆 HIGH OPPORTUNITY — Demand exceeds supply

#1  Gochujang
    Supply: 24 videos (+240% week-over-week)
    Demand: HIGH, rising
    
    Community insight: 12 tracked creators pursued this
    Average outcome: 18K views (2.3x category avg)
    
    [thumbnail] [thumbnail] [thumbnail]

⚠️ SATURATING — Supply exceeds demand

#8  Dubai Chocolate
    Supply: 156 videos (+890% week-over-week)
    Demand: MEDIUM, declining
    
    Community insight: 8 tracked creators pursued this
    Average outcome: 6K views (0.7x category avg)
    ⚠️ Opportunity accuracy: Only 25% beat category
```

---

## 7. User Stories

### 7.1 Core Search & Discovery

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| S1 | Creator | Search by ingredients | I can find relevant videos |
| S2 | Creator | See demand signals | I know if anyone wants this |
| S3 | Creator | See opportunities with evidence | I can find gaps to fill |
| S4 | Creator | See opportunity accuracy scores | I can trust the recommendations |

### 7.2 Contribution & Improvement

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| C1 | Creator | Correct ingredient detection errors | I get better results |
| C2 | Creator | See my contribution impact | I feel valued |
| C3 | Creator | Add missing ingredients | The system improves |
| C4 | Creator | Earn badges for contributions | I'm recognized |

### 7.3 Tracking & Outcomes

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| T1 | Creator | Track opportunities I'm considering | I have an idea pipeline |
| T2 | Creator | Report video outcomes | I help calibrate the system |
| T3 | Creator | See my outcome accuracy vs. predictions | I know if the tool works |
| T4 | Creator | Get reminded to report outcomes | I don't forget to contribute |

### 7.4 Benchmarking

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| B1 | Creator | Connect my YouTube channel | I can benchmark my performance |
| B2 | Creator | See how my videos compare | I understand my strengths |
| B3 | Creator | Get personalized opportunity recommendations | I find ideas that fit my style |
| B4 | Creator | See aggregate community benchmarks | I know what's realistic |

### 7.5 Account & Subscription

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| A1 | Visitor | Sign up with email/Google | I can access the platform |
| A2 | Free user | See my remaining searches | I can plan my usage |
| A3 | Free user | Upgrade to Pro | I get unlimited access + benchmarking |
| A4 | Pro user | Manage my subscription | I have control |

---

## 8. User Experience

### 8.1 Key Screens

1. **Search (Home)**: Ingredient input, results, demand signals, opportunities
2. **My Opportunities**: Tracked ideas, outcome reporting, personal stats
3. **Benchmarks**: Channel connection, performance reports (Pro)
4. **Trends**: Weekly trending ingredients with community data
5. **Profile**: Contribution stats, badges, settings

### 8.2 Contribution Integration

Contribution opportunities are embedded naturally, not as interruptions:

| Screen | Contribution Opportunity |
|--------|--------------------------|
| Search results | "This is wrong / This is right" on ingredients |
| Opportunity cards | "Track This Opportunity" |
| My Opportunities | "Report Outcome" prompt |
| Profile | Contribution stats and badges |

### 8.3 Design Principles

1. **Contribution feels like improvement, not work**: Users help themselves while helping others
2. **Impact is visible**: Show users how their contributions improve the system
3. **Value requires participation**: Best features (benchmarking) require giving data
4. **Community is present**: Show aggregate stats, contributor counts, accuracy scores

---

## 9. Business Model

### 9.1 Pricing Tiers

| | Free | Pro ($12/month) |
|--|------|-----------------|
| **Searches** | 10/week | Unlimited |
| **Ingredient corrections** | ✓ | ✓ |
| **Opportunity tracking** | 5 active | Unlimited |
| **Outcome reporting** | ✓ | ✓ |
| **Trends dashboard** | Basic | Full (with community outcomes) |
| **Channel benchmarking** | ✗ | ✓ |
| **Personalized recommendations** | ✗ | ✓ |
| **Opportunity accuracy scores** | Summary | Full detail |

### 9.2 Why This Split

- **Free tier captures contributions**: Corrections and outcome reports from free users
- **Pro tier requires giving to get**: Benchmarking requires channel connection
- **Value clearly scales**: More features = more insights = more contribution

### 9.3 Revenue Projections

| Stage | Users | Connected Channels | Paying | MRR |
|-------|-------|-------------------|--------|-----|
| Launch | 50 | 10 | 0 | €0 |
| Month 1 | 100 | 30 | 10 | €120 |
| Month 3 | 500 | 150 | 40 | €480 |
| Month 6 | 2,000 | 600 | 150 | €1,800 |
| Year 1 | 5,000 | 1,500 | 400 | €4,800 |

**Connected channels are the moat metric**: More connections = better benchmarks = more value = more connections.

---

## 10. Scope Definition

### 10.1 V1 Scope (Launch)

| Feature | Moat Contribution | Priority |
|---------|-------------------|----------|
| Intelligent Recipe Search | Search patterns | Must Have |
| Ingredient Correction System | Training data | Must Have |
| Demand Intelligence | - | Must Have |
| Opportunity Detection | - | Must Have |
| Opportunity Tracking | Outcome loop setup | Must Have |
| Basic Outcome Reporting | Calibration data | Must Have |
| Weekly Trends (basic) | - | Must Have |
| Free/Pro tiers | - | Must Have |
| Auth (email + Google) | - | Must Have |
| Stripe billing | - | Must Have |

### 10.2 V1.1 Scope (Month 2-3)

| Feature | Moat Contribution | Priority |
|---------|-------------------|----------|
| Channel Benchmarking | Performance data | High |
| Opportunity Accuracy Scores | Trust + calibration | High |
| Enhanced Outcome Reporting | Better calibration | High |
| Contributor Badges | Gamification | Medium |
| Personalized Recommendations | Switching cost | Medium |

### 10.3 V1.2+ Scope (Month 4+)

| Feature | Moat Contribution | Priority |
|---------|-------------------|----------|
| Recipe Brief Templates | UGC content | Medium |
| Creator Following | Social graph | Medium |
| Collab Finder | Network effects | Low |
| API for power users | Ecosystem | Low |

### 10.4 Out of Scope

| Feature | Reason |
|---------|--------|
| TikTok/Instagram | Focus on YouTube first |
| Recipe generation | Different product |
| Multi-platform benchmarking | Complexity |
| Cuisine classifier | Trust liability (deferred) |

---

## 11. Success Metrics

### 11.1 Traditional Metrics

| Metric | Launch Target | Month 3 Target |
|--------|---------------|----------------|
| Users | 50 | 500 |
| Paying customers | 0 | 40 |
| MRR | €0 | €480 |
| Search latency (P95) | < 2s | < 2s |

### 11.2 Moat Metrics (The Real KPIs)

| Metric | Launch Target | Month 3 Target | Why It Matters |
|--------|---------------|----------------|----------------|
| **Correction rate** | 5% of searches | 10% of searches | Training data flywheel |
| **Corrections per user** | 2/month | 5/month | Engagement depth |
| **Connected channels** | 10 | 150 | Benchmark data moat |
| **Outcome reports** | 20 | 200 | Calibration accuracy |
| **Opportunity accuracy** | N/A (need data) | > 60% | Trust metric |
| **Return users (7-day)** | 30% | 50% | Habit formation |

### 11.3 Flywheel Health Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Correction velocity | Corrections per week / Active users | Increasing |
| Data quality score | % of videos with 3+ high-confidence ingredients | > 70% |
| Outcome close rate | Outcomes reported / Opportunities tracked | > 30% |
| Benchmark participation | Connected channels / Total Pro users | > 60% |

### 11.4 North Star Metric

**"Successful Videos Inspired by Kitvas"**

Measured as:
- Creator tracked opportunity in Kitvas
- Creator reported publishing video
- Video performed above category average

This captures the full value chain: we showed an opportunity → creator acted → it worked.

---

## 12. Risks & Mitigations

### 12.1 Product-Market Fit Risk

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Creators don't value this | **HIGH** | Critical | Validate with 5+ creators before Week 4 |
| Free tier too generous | Medium | High | Monitor contribution rates; adjust |
| $12/month wrong price | Medium | Medium | A/B test post-launch |

### 12.2 Moat-Building Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Users won't contribute | Medium | Critical | Make contribution feel like self-improvement |
| Corrections are low quality | Medium | High | Require confidence level; weight by user history |
| Outcome reporting too much friction | Medium | High | Simplify to 3 clicks; send reminders |
| Channel connection feels invasive | Medium | High | Clear value prop; read-only access |

### 12.3 Data Quality Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Ingredient detection too inaccurate | Medium | High | Confidence indicators; easy correction |
| Demand signals unreliable | Medium | High | Bands not scores; calibrate with outcomes |
| Not enough outcomes to calibrate | High | Medium | Don't show accuracy until N=100 |

### 12.4 Execution Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Solo founder burnout | Medium | High | Strict scope; 15-20 hrs/week max |
| Scope creep | High | Medium | V1 locked; defer to V1.1 |
| Moat features delay launch | High | Medium | Launch without benchmarking; add in V1.1 |

---

## 13. Timeline

### 13.1 Development Schedule

| Week | Focus | Key Deliverable | Moat Foundation |
|------|-------|-----------------|-----------------|
| 1 | Foundation | Data pipeline working | - |
| 2 | Extraction | Ingredients + tags extracting | - |
| 3 | Search | Basic search working | Search pattern capture |
| 4 | Training data | Labeled dataset complete | - |
| 5 | ML models | Models trained | - |
| 6 | Demand + Corrections | Demand signals + correction UI | Correction system live |
| 7 | Opportunities + Tracking | Scoring + tracking UI | Tracking system live |
| 8 | Auth + Payments | Full user flow | - |
| 9 | Launch | Soft launch to beta | Begin data collection |

### 13.2 Post-Launch Moat Activation

| Month | Moat Focus | Goal |
|-------|------------|------|
| 1 | Corrections | 100+ corrections collected |
| 2 | Outcomes | 50+ outcome reports |
| 3 | Benchmarking | 100+ connected channels |
| 4 | Accuracy | First accuracy scores visible |
| 5 | Community | Templates + following (if traction) |
| 6 | Flywheel | All moats reinforcing |

### 13.3 Total Effort

- **Duration**: 9 weeks to launch
- **Weekly commitment**: 15-20 hours
- **Total hours**: 140-170

---

## Appendix A: Moat Comparison

| Moat Type | Kitvas Approach | Competitor Difficulty |
|-----------|-----------------|----------------------|
| **Data: Ingredient corrections** | Users label training data | Would need same user base |
| **Data: Performance benchmarks** | Connected channels share data | Would need same channel network |
| **Data: Outcome calibration** | Tracked opportunities → reported results | Would need same outcome volume |
| **Community: Contribution culture** | Badges, impact visibility | Cultural, hard to replicate |
| **AI: Improving accuracy** | Corrections + outcomes feed model | Would need same data |

---

## Appendix B: Give-to-Get Matrix

| What Users Give | What Users Get | Who Can Give | When Available |
|-----------------|----------------|--------------|----------------|
| Ingredient corrections | Better search results | All users | V1 Launch |
| Search patterns | Trending alerts | All users | V1 Launch |
| Opportunity tracking | Idea pipeline | All users | V1 Launch |
| Outcome reports | Opportunity accuracy | All users | V1 Launch |
| Channel connection | Performance benchmarks | Pro users | V1.1 |
| Channel data | Personalized recommendations | Pro users | V1.1 |

---

## Appendix C: Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Corrections embedded in results, not separate | Feels like fixing "your" results, not "our" data |
| Accuracy scores only shown after N=100 outcomes | Don't show uncertain data |
| Benchmarking requires channel connection | Strong give-to-get incentive |
| Tracking limited to 5 for free users | Encourages upgrade AND contribution |
| Badges visible on profile | Social proof encourages contribution |
| "Your corrections helped 47 creators" | Impact visibility motivates more |

---

**End of Document**

*This PRD defines a product with built-in moats. The features are designed not just to solve the user's problem, but to create compounding advantages that make Kitvas harder to replicate over time.*
