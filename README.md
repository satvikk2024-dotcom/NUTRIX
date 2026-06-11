# NUTRIX

A nutrition lookup app with a MyFitnessPal-style UI. Search any food by
name or barcode, scan packaging with your camera, and instantly see a
health score, full nutrition facts, allergen/diet warnings, and a
healthier alternative when one exists — all powered by live data from
[OpenFoodFacts](https://world.openfoodfacts.org/).

## Features

- **Search by name or barcode** — typo-tolerant search (e.g. "chiken
  nuggets", "snikers" both resolve correctly)
- **Health Score (0–100)** — a single number combining Nutri-Score,
  fat/saturated-fat/sugar/salt levels, processing level (NOVA group),
  and additive count
- **Diet & allergen flags** — list ingredients you want to avoid (e.g.
  `peanuts,milk,gluten`) and matching products are flagged, with
  singular/plural matching (`peanut` also catches `peanuts`)
- **"Better Choice" alternatives** — when a product is unsuitable or
  scores poorly, NUTRIX suggests a genuinely healthier option from the
  same category
- **Barcode scanner** — camera-based scanning (autofocus, torch
  toggle, tap-to-refocus) with a manual entry fallback
- **Dark mode** and a MyFitnessPal-inspired mobile-first layout

## Tech Stack

| Layer    | Stack |
|----------|-------|
| Frontend | Next.js 16 (Pages Router), React 19, Tailwind CSS 3 |
| Backend  | Express 5, Axios |
| Data     | [OpenFoodFacts](https://world.openfoodfacts.org/) REST + [search-a-licious](https://github.com/openfoodfacts/search-a-licious) APIs |
| Scanner  | `react-zxing` (`@zxing/library`) |

## Project Structure

```
NUTRIX/
├── client/                  # Next.js frontend (port 3000/3001)
│   ├── components/
│   │   └── BarcodeScanner.js
│   ├── pages/
│   │   ├── _app.js
│   │   └── index.js          # Main UI — search, results, diet prefs
│   └── styles/globals.css
└── server/                   # Express API (port 5055)
    ├── controllers/
    │   └── foodController.js # Search, scoring, alternatives
    ├── utils/
    │   ├── healthScore.js    # Health score formula
    │   └── dietChecker.js    # Allergen / diet-preference matching
    ├── routes/foodRoutes.js
    ├── models/Food.js         # Mongoose schema (DB currently disabled)
    └── server.js
```

See [IMPLEMENTATION.md](IMPLEMENTATION.md) for how each piece works,
[FUTURE.md](FUTURE.md) for the roadmap, and [CLAUDE.md](CLAUDE.md) for
notes if you're using an AI coding assistant on this repo.

## Getting Started

### Prerequisites

- Node.js 18+

### 1. Backend

```bash
cd server
npm install
node server.js     # or: npx nodemon server.js
```

Runs on **http://localhost:5055**. No database or API keys are
required — it talks directly to OpenFoodFacts.

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Runs on **http://localhost:3000** (or 3001 if 3000 is busy). Open it
in your browser — for the camera barcode scanner to work, use
`localhost` or HTTPS.

## API Reference

### `GET /api/v1/food/search`

| Query param | Required | Description |
|---|---|---|
| `query` | yes | Food name (e.g. `oreo`) or barcode digits |
| `type` | yes | `name` or `barcode` |
| `forbidden` | no | Comma-separated ingredients to flag, e.g. `peanuts,milk` |

**Response shape:**

```json
{
  "source": "api",
  "data": {
    "barcode": "...", "name": "...", "brand": "...", "image": "...",
    "nutriScore": "a-e|unknown", "ecoScore": "a-e|unknown",
    "ingredientsText": "...", "ingredients": [], "allergens": [],
    "additives": [], "nutrientLevels": {}, "nutrients": { "calories": 0, "protein": 0, "carbs": 0, "sugar": 0, "fat": 0, "sodium": 0 }
  },
  "customScore": 0,
  "suitability": { "isSuitable": true, "reasons": ["Safe based on your list"] },
  "alternative": null
}
```

A `404` is returned with `{ "message": "Food not found" }` if no
match exists in OpenFoodFacts.

## Notes

- The frontend currently calls the API at a hardcoded
  `http://localhost:5055` (see [FUTURE.md](FUTURE.md) for making this
  configurable).
- MongoDB persistence is scaffolded (`server/models/Food.js`,
  `server/config/db.js`) but disabled — every search hits OpenFoodFacts
  live and nothing is saved.
