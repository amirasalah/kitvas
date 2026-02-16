# Kitvas: Known Limitations & Issues

A comprehensive catalog of current constraints, technical debt, and areas for improvement. Organized by subsystem.

---

## 1. Search

| Constraint | Detail |
|---|---|
| Minimum ingredients | 2 required per search (schema enforced) |
| Maximum ingredients | 10 per search |
| Match threshold | 50% — at least half of searched ingredients must be present in a video |
| Result cap | 50 analyzed videos returned per search |
| YouTube API results | 50 videos fetched per query, only 20 processed inline |
| Background processing | Remaining 30 YouTube videos queued; invisible until next search |
| Rate limit | 10 YouTube API searches per hour per user/IP |
| Query construction | Simple `"ingredient1 ingredient2 recipe"` — no advanced operators, phrase search, or negative keywords |
| Database pool | Top 200 videos by views queried; niche videos with few views may be excluded |
| No pagination | Can't load more results beyond the initial 50 |
| No filters | Can't filter by video duration, upload date, channel, language, or category |

### Impact on creators

- Niche ingredient combinations (e.g., "pasta kofte") may return few results because both ingredients must be independently extracted
- Dish names treated as ingredients — "shakshuka" works, but "eggs in tomato sauce" requires separate ingredient entries
- Single-ingredient research not possible (e.g., "What videos exist about saffron?")

---

## 2. Ingredient Extraction

| Constraint | Detail |
|---|---|
| Primary method | Groq LLM (llama-3.3-70b-versatile) — free tier, no SLA |
| Fallback | ~230 hardcoded keyword list — limited coverage |
| Session disable | If Groq API fails once, LLM extraction disabled for entire server session |
| Description truncation | Only first 600 characters of video description analyzed (avoids sponsor links but may miss recipe details) |
| Transcript truncation | First 4000 characters only — long recipe transcripts cut off |
| Confidence threshold | Only ingredients with >= 0.5 confidence included in search results |
| Static blocklist | 92 hardcoded terms (cooking methods, adjectives, equipment) |
| Dynamic blocklist | Requires 2+ user corrections before an item is blocked |

### What gets missed

- **Compound ingredients**: "Teriyaki sauce", "garam masala" may not be in keyword list
- **Regional/specialty items**: Partial coverage for Indian, Korean, Middle Eastern ingredients
- **Ingredient modifications lost**: "Fresh basil" and "dried basil" both normalize to "basil"
- **Brand names ignored**: "Maldon salt" becomes "salt"
- **Non-English metadata**: Title/description extraction assumes English text — non-English videos rely entirely on transcript translation

---

## 3. Translation & Language Support

| Constraint | Detail |
|---|---|
| Translation engine | Groq LLM — same free tier as extraction |
| Offline fallback | None — if Groq is down, no translation |
| Chunk size | 3000 characters per translation call |
| Backlog | ~240 non-English videos still awaiting translation |
| Language detection | Unicode heuristic (instant) for batch; LLM-based for real-time |
| Supported scripts | Devanagari, Bengali, Arabic, CJK, Korean, Thai, Myanmar, and others |
| Caption quality | Depends on YouTube's auto-generated captions, which often contain errors |
| No confidence score | Translations stored without quality/confidence metric |
| Rate limits | Groq free tier: 100K tokens/day, 12K tokens/minute |

### Impact on creators

- Non-English recipe videos may have incomplete ingredient extraction
- Translation quality varies — cooking-specific terms may be mistranslated
- Searches primarily work well for English content; other languages are best-effort

---

## 4. YouTube API Constraints

| Constraint | Detail |
|---|---|
| Data fetched | Title, description, thumbnails, publish date, view count |
| Not fetched | Like count, comment count, subscriber count, video duration, category, caption availability |
| Shorts detection | Not possible — YouTube API doesn't distinguish Shorts from regular videos |
| Autocomplete | Uses unofficial Google endpoint (`suggestqueries.google.com`) — may break without notice |
| No comment analysis | Can't gauge audience sentiment or recipe quality from comments |
| No channel data | Creator subscriber count, upload frequency, and niche not tracked |
| View staleness | View counts refreshed weekly (Sundays) — can be 7 days stale |

---

## 5. Demand Signal Accuracy

| Constraint | Detail |
|---|---|
| Sample size | Based on up to 50 YouTube search results — not the full YouTube index |
| Demand bands | 5 levels: hot, growing, stable, niche, unknown |
| Competition model | Hardcoded thresholds (e.g., avgViews >= 1M = high barrier) — not calibrated to niche creators |
| No absolute search volume | Relies on YouTube video counts and views, not actual search demand |
| No seasonality | Can't detect seasonal patterns (pumpkin spice in fall, eggnog in winter) |
| No revenue signals | No CPM, sponsorship potential, or creator income data |
| Unproven combinations | 3+ ingredients with < 15 videos scored at 25 — may underestimate emerging trends |
| View decay ignored | Old viral videos (5+ years) weighted same as recent uploads |

### Impact on creators

- Demand scores are directional, not precise — useful for comparing combinations, not absolute planning
- "Niche" doesn't mean "bad opportunity" — it may indicate an untapped market
- Competition barriers assume large-channel dynamics; small creators face different economics

---

## 6. Content Gap Detection

| Constraint | Detail |
|---|---|
| Minimum sample | Requires >= 5 high-performing videos to detect gaps |
| View threshold | Only videos with >= 1000 views considered |
| Ubiquitous filtering | 53 common ingredients (salt, oil, garlic, etc.) excluded from gap analysis |
| Co-occurrence method | Logarithmic view weighting — one viral video can skew pairing strength |
| No seasonality | Gaps don't account for time-of-year demand shifts |
| Pairing minimum | Ingredient must appear in >= 15% of sample OR >= 3 videos |

### Impact on creators

- True blue-ocean opportunities (0-4 existing videos) can't be detected
- Common pantry ingredients filtered out even when they're the focus (e.g., "salt recipes")
- Gap scores are relative within a search, not comparable across different searches

---

## 7. Google Trends Integration

| Constraint | Detail |
|---|---|
| Keywords tracked | ~45 per hour (top 20 searched + 15 hot/growing + 10 tracked) |
| Fetch frequency | Hourly via cron job |
| Cache TTL | 24 hours — data can be up to 1 day old |
| Scale | Relative (0-100) — no absolute search volume |
| Regional coverage | Worldwide only — no country-specific trends |
| Granularity | Daily data points only — can't detect intra-day spikes |
| Rate limit | 5 requests/minute to Google Trends (unofficial API) |
| Breakout reliability | "> 5000%" growth flag can fire for tiny niches |

---

## 8. Frontend & UX

| Constraint | Detail |
|---|---|
| Guest video limit | 3 analyzed videos visible without login |
| Guest feature gating | Demand details, gaps, content angles, transcripts blurred/hidden |
| Search limit (guest) | 2 searches before sign-in prompt |
| No search history | Searches not saved or retrievable |
| No saved combinations | Can't bookmark ingredient combinations for tracking |
| No comparison mode | Can't compare two ingredient combinations side-by-side |
| No advanced filters | Can't filter results by views, date, channel, language |
| No dietary filters | Can't filter by vegan, keto, gluten-free, allergen-free |
| No bulk operations | Can't export results, share searches, or batch-analyze |
| Transcript viewer | Inline scrollable panel only — no full-page view or search within transcript |

---

## 9. Infrastructure

| Constraint | Detail |
|---|---|
| Rate limits | In-memory — reset on server restart |
| Cron jobs | Sequential execution — jobs can't run in parallel |
| Job recovery | No automatic retry on failure; no alerting |
| Job timeout | 30 minutes default — may be insufficient for large batch operations |
| View refresh | Weekly only (Sundays 3am UTC) |
| Database | No expiry mechanism for deleted/private YouTube videos |
| Auth | Google OAuth only — no email/password or other providers |

---

## Summary: Top 10 Limitations for Creators

1. **Minimum 2 ingredients** — can't research single-ingredient opportunities
2. **50% match filter** — partial matches shown but many relevant videos still filtered out
3. **Small sample size** — demand signals based on 50 YouTube results, not full index
4. **Extraction gaps** — LLM may miss specialty, regional, or compound ingredients
5. **Non-English quality** — translation backlog and extraction accuracy lower for non-English content
6. **No duration/shorts filter** — can't distinguish Shorts from full recipes
7. **Weekly view refresh** — view counts can be 7 days stale
8. **No seasonality** — demand and gaps don't account for time-of-year patterns
9. **Guest restrictions** — most features require Google sign-in
10. **No saved searches** — can't track ingredient combinations over time
