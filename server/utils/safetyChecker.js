const FLAGGED_ADDITIVES = {
  'E320': { name: 'BHA (Butylated Hydroxyanisole)', concern: 'Possible carcinogen; banned in some countries', severity: 'high' },
  'E321': { name: 'BHT (Butylated Hydroxytoluene)', concern: 'Potential endocrine disruptor', severity: 'medium' },
  'E129': { name: 'Allura Red (Red 40)', concern: 'Linked to hyperactivity in children; banned in some EU countries', severity: 'high' },
  'E102': { name: 'Tartrazine (Yellow 5)', concern: 'May cause allergic reactions and hyperactivity', severity: 'medium' },
  'E110': { name: 'Sunset Yellow (Yellow 6)', concern: 'Linked to hyperactivity; restricted in EU', severity: 'medium' },
  'E621': { name: 'Monosodium Glutamate (MSG)', concern: 'May cause headaches in sensitive individuals', severity: 'low' },
  'E951': { name: 'Aspartame', concern: 'Controversial artificial sweetener; potential neurological effects', severity: 'low' },
  'E211': { name: 'Sodium Benzoate', concern: 'Can form benzene with vitamin C; linked to hyperactivity', severity: 'medium' },
  'E250': { name: 'Sodium Nitrite', concern: 'Can form carcinogenic nitrosamines when heated', severity: 'high' },
  'E171': { name: 'Titanium Dioxide', concern: 'Possible genotoxic effects; banned in EU as food additive', severity: 'high' },
  'E150D': { name: 'Caramel Color (Sulphite Ammonia)', concern: 'Contains 4-MEI, a possible carcinogen', severity: 'medium' },
  'E407': { name: 'Carrageenan', concern: 'May cause gastrointestinal inflammation', severity: 'low' },
  'E319': { name: 'TBHQ (tert-Butylhydroquinone)', concern: 'Possible carcinogen at high doses', severity: 'high' },
  'E385': { name: 'Calcium Disodium EDTA', concern: 'May affect mineral absorption; potential kidney effects', severity: 'medium' },
  'E133': { name: 'Brilliant Blue FCF', concern: 'Linked to hyperactivity; derived from petroleum', severity: 'medium' },
  'E127': { name: 'Erythrosine (Red 3)', concern: 'Possible thyroid disruptor; banned in cosmetics', severity: 'high' },
  'E249': { name: 'Potassium Nitrite', concern: 'Can form carcinogenic nitrosamines', severity: 'high' },
  'E952': { name: 'Cyclamate', concern: 'Banned in US; potential bladder cancer link', severity: 'medium' },
  'E954': { name: 'Saccharin', concern: 'Controversial artificial sweetener', severity: 'low' },
  'E950': { name: 'Acesulfame K', concern: 'Possible carcinogen; not fully studied', severity: 'low' },
};

const checkAdditives = (additivesList) => {
  if (!additivesList?.length) return [];
  const warnings = [];
  for (const additive of additivesList) {
    const code = additive.toUpperCase();
    const match = FLAGGED_ADDITIVES[code];
    if (match) {
      warnings.push({ code, ...match });
    }
  }
  return warnings;
};

const calculateTransparencyScore = (ingredientsText, additivesTags) => {
  const trimmed = (ingredientsText || '').trim();
  if (!trimmed || trimmed.toLowerCase() === 'ingredients not listed.') {
    return null;
  }

  let score = 100;

  const additiveCount = additivesTags?.length || 0;
  score -= Math.min(additiveCount * 5, 40);

  const ingredients = trimmed
    .split(/,|;/)
    .map(s => s.trim())
    .filter(Boolean);

  if (ingredients.length > 10) {
    score -= Math.min((ingredients.length - 10) * 2, 20);
  }

  let chemicalCount = 0;
  for (const ing of ingredients) {
    if (ing.length > 25 || /\d/.test(ing) || /[()]/.test(ing)) {
      chemicalCount++;
    }
  }
  score -= Math.min(chemicalCount * 3, 30);

  if (ingredients.length > 0 && ingredients.length < 5) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
};

module.exports = { checkAdditives, calculateTransparencyScore, FLAGGED_ADDITIVES };
