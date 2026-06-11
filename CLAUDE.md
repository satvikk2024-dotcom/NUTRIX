# CLAUDE.md

Guidance for Claude Code (or any AI assistant) working in this repo.

## What this project is

NUTRIX is a two-process app:

- **`server/`** — Express 5 API on port `5055`. Single real endpoint:
  `GET /api/v1/food/search`. Proxies and re-shapes data from
  [OpenFoodFacts](https://world.openfoodfacts.org/) (OFF). No
  database is actually used at runtime (see "Database" below).
- **`client/`** — Next.js 16 (Pages Router) + React 19 + Tailwind.
  One main page, `client/pages/index.js`, that does search, shows
  results, manages diet preferences, dark mode, and embeds the
  barcode scanner.

Run both (`node server.js` in `server/`, `npm run dev` in `client/`)
to test changes end-to-end. There is no test suite yet — verify
behavior by running the app and hitting the API/UI directly (see
`IMPLEMENTATION.md` for example requests and `FUTURE.md` for the "add
tests" item).

## Critical OpenFoodFacts gotchas

These are non-obvious and were each the root cause of a real bug.
Read before touching `server/controllers/foodController.js`:

1. **Always send a custom `User-Agent`.** OFF blocks/rate-limits
   axios's default UA, returning HTML "temporarily unavailable" pages
   or 503s instead of JSON. Every request uses `OFF_HEADERS`.

2. **OFF intermittently 503s on valid requests** — observed ~50% of
   the time on some endpoints, independent of the query. All OFF
   calls go through `offGet()`, which retries up to 2 times on 503.
   Don't bypass this helper for new OFF calls.

3. **Three different OFF search APIs exist — only one works well:**
   - `https://search.openfoodfacts.org/search?q=...` (search-a-licious,
     Elasticsearch-backed) — **this is what we use**. Typo-tolerant,
     returns relevance-ranked `hits` with `_score`.
   - `https://world.openfoodfacts.org/api/v2/search?search_terms=...`
     — **confirmed completely broken**: ignores the `search_terms`
     param entirely and returns the same ~4.5M-result set regardless
     of query. Do not use for text search.
   - `https://world.openfoodfacts.org/cgi/search.pl` — legacy, heavily
     rate-limited, not typo-tolerant. Avoid.
   - `/api/v2/search?categories_tags=...` **does** work correctly and
     is used for finding alternatives (see below).

4. **The search-a-licious index doesn't include
   ingredients/allergens/additives/nova_group.** After picking a hit,
   we always fetch `/api/v0/product/{code}.json` for the full record.

5. **search-a-licious relevance can rank the wrong product first** for
   multi-word brand queries (e.g. "sundrop peanut butter" matched an
   unrelated snack whose *description* mentioned peanut butter, not
   the actual Sundrop product). Fixed via `pickBestMatch()`, which
   re-ranks the top `page_size=24` hits by token-overlap between the
   query and `product_name + brands`. If overlap is zero for every
   hit (e.g. a pure typo like "bananna"), it falls back to
   search-a-licious's own top `_score` result — this preserves typo
   tolerance. **If you change this, re-test both a multi-word brand
   query and a misspelled single-word query.**

6. **Some products genuinely don't exist in OFF** (e.g. a specific
   Indian "O'cean Fruit Water" brand). If a search returns a plausible
   but "wrong" product, check OFF's own search UI directly before
   assuming it's a code bug — it may be a data-coverage gap, not
   something fixable here.

## Health score (`server/utils/healthScore.js`)

A single Nutri-Score-only formula left almost everything clustered
around the same score. The current formula combines **four**
independent factors (Nutri-Score grade, per-nutrient levels, NOVA
processing group, additive count) — see `IMPLEMENTATION.md` for the
exact penalty tables. If you adjust penalties, sanity-check against a
few known products (plain almonds should score high-80s/90s; an Oreo
or similar ultra-processed snack should score low-30s).

## Diet/allergen checker (`server/utils/dietChecker.js`)

Two non-obvious behaviors, both added after real false-negatives:

- It checks `name` and `brand`, not just ingredients — some OFF
  products have empty `ingredients_text`/`ingredients_tags` even when
  the product name makes the content obvious (e.g. "Peanut Butter &
  Co" with no listed ingredients).
- It matches **singular and plural variants** of each forbidden word
  (`peanut` ↔ `peanuts`), since user input and OFF data don't
  consistently use the same form.

## Alternative-finding logic

When a product is unsuitable (matches a forbidden ingredient) or
scores `< 60`, the controller walks `categories_tags` **reversed**
(most-specific category first, up to `MAX_CATEGORY_ATTEMPTS = 6`),
querying `/api/v2/search?categories_tags=...&sort_by=popularity` for
each, and picks the first candidate that (a) fixes the suitability
problem if there was one, and (b) scores strictly higher. This keeps
suggestions on-topic (a peanut butter doesn't get suggested bread).

## Database

`server/models/Food.js` and `server/config/db.js` exist but
`connectDB()` is commented out in `server.js` — **the app does not use
a database**. Don't assume data is persisted between requests. See
`FUTURE.md` if re-enabling persistence.

## Frontend API URL

`client/pages/index.js` hardcodes
`http://localhost:5055/api/v1/food/search`. If you change the server
port or deploy the API elsewhere, update this (see `FUTURE.md` for
making it an env var).

## Style notes

- Keep comments to "why", not "what" — this codebase already follows
  that convention; match it.
- No test framework is set up. Don't add one speculatively — see
  `FUTURE.md` for the testing item if the user asks for it.
