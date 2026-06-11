# FUTURE.md

Ideas and known gaps for NUTRIX, roughly ordered by impact/effort. Not
commitments — just a roadmap to pick from.

## Near-term / low-effort

- **Move the API URL to an environment variable.** `client/pages/index.js`
  currently hardcodes `http://localhost:5055/api/v1/food/search`.
  Switch to `process.env.NEXT_PUBLIC_API_URL` (with the current value
  as a `.env.local` default) so the client can point at a deployed
  backend.
- **Remove the `console.log` in `dietChecker.js`.** Useful for local
  debugging but noisy in production logs — gate behind a `DEBUG` env
  var or remove entirely.
- **Cache OpenFoodFacts responses.** Repeated searches for the same
  product/barcode hit OFF every time. A short-lived in-memory or Redis
  cache (keyed by barcode/query) would cut latency and reduce the
  503-retry overhead from `offGet()`.
- **Add a `dev`/`start` script to `server/package.json`.** Currently
  the server is run via `node server.js` directly even though
  `nodemon` is a dependency.

## Product features

- **Real "Goals" tab.** The bottom-nav "Goals" item currently just
  toggles the Diet Preferences panel. A real implementation would let
  users set daily calorie/macro targets and show progress —
  separate from diet/allergen preferences.
- **Food diary / history.** Persist searched products per user/session
  (re-enable `connectDB()` and `server/models/Food.js`, which already
  has a schema for this) so users can log meals and see daily totals.
- **User accounts.** Needed before a food diary or goals feature makes
  sense across devices/sessions.
- **Better category mapping for alternatives.** The alternative-finder
  walks `categories_tags` reversed and stops at the first category
  with a qualifying result — this can occasionally suggest something
  in a slightly-too-broad category. Could be improved with a curated
  category-equivalence map or a minimum specificity threshold.
- **OCR fallback for products not in OpenFoodFacts.** Some
  region-specific products (confirmed example: an Indian "O'cean Fruit
  Water" brand) simply don't exist in OFF. A camera-based OCR fallback
  for the nutrition label could fill gaps OFF can't cover — though
  this is a substantial feature on its own.
- **PWA / offline support.** Cache recent searches and allow the app
  to be installed on mobile home screens.

## Engineering quality

- **Automated tests.** No test framework is configured yet. Priority
  targets, since they're pure functions with well-understood inputs:
  - `server/utils/healthScore.js` — penalty table edge cases (unknown
    grade, missing `nutrient_levels`, NOVA group boundaries).
  - `server/utils/dietChecker.js` — singular/plural matching, name/
    brand fallback, multiple forbidden words.
  - `server/controllers/foodController.js`'s `pickBestMatch()` and
    `tokenize()` — re-ranking behavior for multi-word brand queries vs.
    pure typos (zero-overlap fallback).
- **Re-enable MongoDB persistence**, or remove the unused
  `server/models/Food.js` / `server/config/db.js` if persistence is
  permanently out of scope — having dead scaffolding can be confusing.
- **Rate-limit / queue OFF requests** if usage grows — OFF's 503s
  suggest it's sensitive to request volume from a single UA.
