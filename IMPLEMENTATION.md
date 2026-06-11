# IMPLEMENTATION.md

A technical deep-dive into how NUTRIX works, for anyone extending the
codebase. For setup instructions see [README.md](README.md); for
gotchas/conventions see [CLAUDE.md](CLAUDE.md); for what's planned
next see [FUTURE.md](FUTURE.md).

## Data flow

```
┌────────────┐   GET /api/v1/food/search?query=&type=&forbidden=   ┌──────────────┐
│  Next.js    │ ─────────────────────────────────────────────────▶ │  Express API  │
│  client     │                                                     │  (port 5055)  │
│ (index.js)  │ ◀───────────────────────────────────────────────── │ foodController│
└────────────┘        { data, customScore, suitability,            └──────┬───────┘
                         alternative }                                     │
                                                                            │ axios + custom UA
                                                                            ▼
                                                                ┌────────────────────────┐
                                                                │     OpenFoodFacts       │
                                                                │  search-a-licious +     │
                                                                │  /api/v0 + /api/v2      │
                                                                └────────────────────────┘
```

The client makes one request per search/scan to
`server/controllers/foodController.js#searchFood`, which:

1. Resolves the query to a single OFF product record.
2. Re-shapes that record into `processedFood` (the `data` field).
3. Computes `customScore` (health score) and `suitability` (diet/
   allergen check).
4. Optionally finds a `alternative` (a "better choice" product).
5. Returns everything as one JSON payload.

## 1. Resolving the query to a product

### Barcode search (`type=barcode`)

Direct lookup:

```
GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json
```

`status === 0` or a missing `product` ⇒ `404 { message: 'Food not found' }`.

### Name search (`type=name`)

Two-step lookup:

1. **search-a-licious** (typo-tolerant, Elasticsearch-backed):
   ```
   GET https://search.openfoodfacts.org/search?q={query}&page_size=24
   ```
   Returns `{ hits: [{ code, product_name, brands, _score, ... }] }`.

2. **`pickBestMatch(hits, query)`** re-ranks those 24 hits:
   - Tokenizes the query and each hit's `product_name + brands` into
     lowercase alphanumeric words (`tokenize()`).
   - For each hit, counts how many query tokens appear in its
     name/brand tokens (`overlap`).
   - Picks the hit with the highest `overlap`, tie-broken by OFF's own
     `_score`.
   - **If every hit has `overlap === 0`** (no query word appears in
     any name/brand — e.g. a misspelling like "bananna"), falls back
     to `hits[0]` (search-a-licious's top relevance result), so typo
     tolerance still works.

   This fixes cases like `"sundrop peanut butter"`, where
   search-a-licious's BM25 ranking (which scores across *all* fields,
   including `ingredients_text`/`generic_name`) previously surfaced an
   unrelated snack whose description happened to mention "peanut
   butter".

3. Once a `code` is chosen, fetch the **full product record** (the
   search index lacks ingredients/allergens/additives/NOVA group):
   ```
   GET https://world.openfoodfacts.org/api/v0/product/{code}.json
   ```

### `offGet(url, retries=2)`

All OFF requests go through this wrapper:
- Sends `OFF_HEADERS = { 'User-Agent': 'NUTRIX-NutritionApp/1.0 (...)' }`
  — required, or OFF returns HTML/503 instead of JSON.
- 10s timeout (`OFF_TIMEOUT`).
- On a `503` response, retries immediately, up to `retries` times
  (OFF 503s on a valid request roughly half the time on some
  endpoints — observed via repeated identical requests).
- Any other error (or exhausted retries) propagates to the outer
  `catch`, which returns `500 { message: 'Server Error' }`.

## 2. Re-shaping the product (`processedFood` / `data`)

| Field | Source | Notes |
|---|---|---|
| `barcode` | `code` | `'N/A'` if missing |
| `name` | `product_name` | `'Unknown Food'` if missing |
| `brand` | `brands` | `'Unknown Brand'` if missing |
| `image` | `image_url` | |
| `nutriScore` | `nutriscore_grade` | `'unknown'` if missing |
| `ecoScore` | `ecoscore_grade` | `'unknown'` if missing |
| `ingredientsText` | `ingredients_text` | `'Ingredients not listed.'` if missing |
| `ingredients` | `ingredients_tags` | array, e.g. `["en:sugar", ...]` |
| `allergens` | `allergens_tags` | array, e.g. `["en:milk"]` |
| `additives` | `additives_tags` | `en:` prefix stripped, uppercased, e.g. `["E322"]` |
| `nutrientLevels` | `nutrient_levels` | `{ fat: 'low'\|'moderate'\|'high', ... }` |
| `nutrients.*` | `nutriments.*_100g` | rounded to 1 decimal via `round1()` |

`round1(n) = Math.round((n || 0) * 10) / 10` — OFF nutriment values
often arrive with long floating-point tails from unit conversions
(e.g. `590.285714285714`); this fixes the display without changing the
underlying precision meaningfully.

## 3. Health score (`server/utils/healthScore.js`)

Starts at `100` and subtracts four independent penalties:

**a) Nutri-Score grade** (`NUTRISCORE_PENALTY`):

| Grade | Penalty |
|---|---|
| a | 0 |
| b | 8 |
| c | 18 |
| d | 30 |
| e | 42 |
| *(unknown)* | 18 (treated as grade `c`) |

**b) Per-nutrient levels** (`NUTRIENT_LEVEL_PENALTY`, applied to each
of `fat`, `saturated-fat`, `sugars`, `salt` from `nutrient_levels`):

| Level | Penalty (×4 nutrients) |
|---|---|
| low | 0 |
| moderate | 3 |
| high | 8 |

(Worst case: 4 × 8 = 32 if everything is "high".)

**c) NOVA processing group** (`nova_group`):

| Group | Penalty |
|---|---|
| 4 (ultra-processed) | 12 |
| 3 | 4 |
| 1, 2, or unknown | 0 |

**d) Additives** — `min(additives_tags.length * 1.5, 9)`.

Final score: `Math.round(clamp(score, 0, 100))`.

**Why this exists**: an earlier Nutri-Score-only formula clustered
almost every product around the same value (~90). Combining four
factors spreads scores meaningfully — e.g. plain almonds ≈ 89,
peanut butter ≈ 56, an Oreo-style cookie ≈ 31.

## 4. Diet/allergen suitability (`server/utils/dietChecker.js`)

`checkDietSuitability(food, forbiddenList)`:

1. Concatenates `name`, `brand`, `ingredientsText`, `ingredients`
   (joined), `allergens` (joined), `additives` (joined) into one
   lowercase string (`combinedText`).
   - `name`/`brand` are included as a fallback for products with
     missing/empty ingredient data — e.g. an OFF entry literally named
     "Peanut Butter & Co" with no `ingredients_text` would otherwise
     be marked safe.
2. For each forbidden word (trimmed, lowercased):
   - Computes a singular/plural **variant**: strips a trailing `s` if
     present, or appends `s` if not (`peanut` ↔ `peanuts`).
   - If `combinedText` contains either the word or its variant,
     `isSuitable = false` and `reasons` gets `"Contains '<word>'"`.
3. Returns `{ isSuitable, reasons }`. If nothing matched,
   `reasons = ['Safe based on your list']`.

This same function is reused for candidate alternatives (with a
reduced `itemProcessed` shape — no `ingredientsText` from the search
endpoint isn't fetched per-candidate for performance, only the fields
already present in `/api/v2/search` results).

## 5. Finding a "Better Choice" alternative

Triggered only if `!suitability.isSuitable || healthScore < 60`.

```js
const categoryTags = [...(rawData.categories_tags || [])]
  .reverse()              // most-specific category first
  .slice(0, MAX_CATEGORY_ATTEMPTS); // = 6
```

`categories_tags` from OFF is ordered broad → specific (e.g.
`["en:plant-based-foods", "en:spreads", "en:nut-butters", "en:peanut-butters"]`).
Reversing it means we try `"peanut-butters"` before `"spreads"`,
keeping suggestions on-topic.

For each category tag (stopping at the first one that yields a
result):

```
GET https://world.openfoodfacts.org/api/v2/search
    ?categories_tags={tag}
    &sort_by=popularity
    &page_size=20
    &fields=code,product_name,brands,image_url,nutriscore_grade,
            nutrient_levels,nova_group,nutriments,ingredients_text,
            ingredients_tags,allergens_tags,additives_tags
    &json=true
```

For each candidate (skipping the original product itself):

- Build `itemProcessed` and run `checkDietSuitability` on it.
- **If the original was unsuitable**, the candidate must itself be
  suitable (`!altSuitability.isSuitable` ⇒ skip) — an alternative that
  shares the same flagged ingredient is useless.
- Compute `altScore = calculateHealthScore(item)`. Skip if
  `altScore <= healthScore` — must be a genuine improvement.
- Track the candidate with the **highest `altScore`** seen so far.

The first category tag that produces *any* qualifying alternative
wins (`if (alternative) break;` after the inner loop). The response's
`alternative.reason` differs based on why the original was flagged:

- Unsuitable: `"Doesn't contain your flagged ingredients and scores {altScore} vs {healthScore}."`
- Just low-scoring: `"A healthier choice in the same category — scores {altScore} vs {healthScore}."`

If no category yields a qualifying alternative within
`MAX_CATEGORY_ATTEMPTS`, `alternative` stays `null` and the client
simply doesn't render the "Better Choice" card.

## 6. Frontend (`client/pages/index.js`)

Single-page app, all state in `Home()`:

- `query`, `foodData`, `loading`, `error` — search state.
- `forbiddenText`, `showSettings` — Diet Preferences panel
  (comma-separated list, sent as `forbidden=` on every search).
- `darkMode` — toggles a `dark` class on the root `<div>`, which
  Tailwind's `dark:` variants key off (`darkMode: 'class'` in
  `tailwind.config.js`).
- `isScanning` — shows/hides the `<BarcodeScanner>` modal.

`searchFood(searchTerm)`:
- Detects barcode vs. name via `/^\d+$/.test(term)` (all-digit string
  ⇒ `type=barcode`, otherwise `type=name`).
- Calls the API, stores the whole response in `foodData`.

### Results UI (rendered when `foodData` is set)

1. **Product header card** — image, name, brand, a suitability badge
   (red "Contains 'X'" or blue "Fits your diet"), and a circular score
   badge colored by `getScoreColor`:
   - `score >= 80` → green
   - `score >= 50` → amber
   - else → red
2. **"Better Choice Available" card** (if `alternative` is non-null)
   — clicking it re-runs the search using `alternative.barcode` and
     scrolls to top, effectively "drilling into" the suggestion.
3. **Macro summary cards** (`MacroCard`) — Calories, Carbs, Protein,
   Sugar (highlighted with a red ring if `sugar > 10`).
4. **Nutrition Facts label** — styled like a US nutrition label;
   sodium is converted from grams to milligrams for display
   (`Math.round(sodium_g * 1000)`).
5. **Nutrient Levels** (`LevelBar`) — traffic-light bars for fat,
   saturated fat, sugars, salt, driven by `nutrientLevels` (`low`/
   `moderate`/`high` → green/amber/red, 33%/66%/100% width). Bars with
   no level data render nothing (`if (!level) return null`).
6. **Ingredients** — raw `ingredientsText` plus additive tag chips.

### Bottom navigation

Four items, none of which are routes (single-page app):
- **Home** — scrolls to top.
- **Search** — focuses the search input (`searchInputRef`).
- **Goals** — toggles the Diet Preferences panel (`showSettings`).
  *Note*: despite the label, this is not a calorie/macro goals
  tracker — see [FUTURE.md](FUTURE.md).
- **Theme** — toggles dark mode.

## 7. Barcode scanner (`client/components/BarcodeScanner.js`)

Built on `react-zxing` (`useZxing`) + `@zxing/library`:

- **`SCAN_HINTS`** restricts decoding to formats found on food
  packaging (`EAN_13`, `EAN_8`, `UPC_A`, `UPC_E`, `CODE_128`,
  `CODE_39`, `ITF`) — fewer readers per frame ⇒ faster decode attempts.
- **`SCAN_CONSTRAINTS`** requests the rear camera
  (`facingMode: 'environment'`), a 1920×1080 ideal feed, and
  `advanced: [{ focusMode: 'continuous' }]` for continuous autofocus
  where supported.
- `timeBetweenDecodingAttempts: 100` (ms).
- `onDecodeResult` calls `onResult(text)`, which the page wires to
  `handleScanResult` → sets `query` and immediately calls
  `searchFood(barcode)`.
- `onError` maps `getUserMedia` error names to user-friendly messages
  (permission denied, no camera, camera in use, unsupported
  constraints, insecure context).
- **Tap-to-focus**: tapping the video frame calls
  `track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] })`,
  falling back to `'single-shot'`, then silently no-ops if focus
  control isn't supported. Shows a brief white-border "refocusing"
  state.
- **Torch toggle** — shown only if `torch.isAvailable` (from
  `useZxing`).
- **Manual entry fallback** — a numeric text input + "Go" button for
  devices/browsers without camera access (also the only option over
  plain HTTP on a non-localhost host).

## Example end-to-end response

```json
{
  "source": "api",
  "data": {
    "barcode": "0041220576101",
    "name": "Creamy Peanut Butter",
    "brand": "Smucker's",
    "image": "https://images.openfoodfacts.org/.../front_en.jpg",
    "nutriScore": "d",
    "ecoScore": "unknown",
    "ingredientsText": "Roasted peanuts, sugar, palm oil, salt.",
    "ingredients": ["en:roasted-peanuts", "en:sugar", "en:palm-oil", "en:salt"],
    "allergens": ["en:peanuts"],
    "additives": [],
    "nutrientLevels": { "fat": "high", "saturated-fat": "moderate", "sugars": "moderate", "salt": "low" },
    "nutrients": { "calories": 588.0, "protein": 25.0, "carbs": 20.0, "sugar": 9.0, "fat": 50.0, "sodium": 0.4 }
  },
  "customScore": 56,
  "suitability": { "isSuitable": false, "reasons": ["Contains 'peanuts'"] },
  "alternative": {
    "name": "Whole Almonds",
    "brand": "Blue Diamond",
    "image": "https://images.openfoodfacts.org/.../front_en.jpg",
    "nutriScore": "a",
    "score": 89,
    "calories": 579,
    "barcode": "0041570058352",
    "reason": "Doesn't contain your flagged ingredients and scores 89 vs 56."
  }
}
```
