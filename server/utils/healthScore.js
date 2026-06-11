// Multi-factor health score: Nutri-Score grade, per-nutrient levels (fat,
// saturated fat, sugars, salt), processing level (NOVA group), and additive
// count. A Nutri-Score-only formula left almost everything clustered around
// the same value, so each factor contributes its own penalty here.
const NUTRISCORE_PENALTY = { a: 0, b: 8, c: 18, d: 30, e: 42 };
const NUTRIENT_LEVEL_PENALTY = { high: 8, moderate: 3, low: 0 };
const NUTRIENT_LEVEL_KEYS = ['fat', 'saturated-fat', 'sugars', 'salt'];

exports.calculateHealthScore = (foodData) => {
  let score = 100;

  const nutriPenalty = NUTRISCORE_PENALTY[foodData.nutriscore_grade];
  score -= nutriPenalty !== undefined ? nutriPenalty : NUTRISCORE_PENALTY.c;

  const levels = foodData.nutrient_levels || {};
  NUTRIENT_LEVEL_KEYS.forEach((key) => {
    score -= NUTRIENT_LEVEL_PENALTY[levels[key]] || 0;
  });

  if (foodData.nova_group === 4) score -= 12;
  else if (foodData.nova_group === 3) score -= 4;

  const additivesCount = (foodData.additives_tags || []).length;
  score -= Math.min(additivesCount * 1.5, 9);

  return Math.round(Math.max(0, Math.min(score, 100)));
};
