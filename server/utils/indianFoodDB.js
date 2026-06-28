const INDIAN_FOODS = {
  // --- RICE DISHES ---
  'dal chawal': { name: 'Dal Chawal', description: 'Lentil curry served with steamed rice', ingredients: ['toor dal', 'rice', 'ghee', 'onion', 'tomato', 'turmeric', 'cumin', 'salt'], nutrition: { calories: 350, protein: 12, carbs: 58, fat: 8, sugar: 3, sodium: 0.4, fiber: 5 }, serving: '1 plate (300g)' },
  'rajma chawal': { name: 'Rajma Chawal', description: 'Kidney bean curry with steamed rice', ingredients: ['rajma', 'rice', 'onion', 'tomato', 'ginger', 'garlic', 'cumin', 'oil'], nutrition: { calories: 420, protein: 14, carbs: 68, fat: 10, sugar: 4, sodium: 0.5, fiber: 8 }, serving: '1 plate (350g)' },
  'kadhi chawal': { name: 'Kadhi Chawal', description: 'Yogurt-based curry with pakoras and rice', ingredients: ['yogurt', 'besan', 'rice', 'onion', 'turmeric', 'fenugreek', 'oil'], nutrition: { calories: 380, protein: 10, carbs: 55, fat: 14, sugar: 4, sodium: 0.3, fiber: 3 }, serving: '1 plate (300g)' },
  'curd rice': { name: 'Curd Rice', description: 'Yogurt mixed with rice, tempered with mustard seeds', ingredients: ['rice', 'yogurt', 'mustard seeds', 'curry leaves', 'green chili', 'salt'], nutrition: { calories: 250, protein: 7, carbs: 42, fat: 6, sugar: 3, sodium: 0.3, fiber: 1 }, serving: '1 bowl (250g)' },
  'biryani': { name: 'Biryani', description: 'Fragrant layered rice dish with spices and meat/vegetables', ingredients: ['basmati rice', 'onion', 'yogurt', 'spices', 'saffron', 'ghee', 'mint'], nutrition: { calories: 450, protein: 18, carbs: 55, fat: 16, sugar: 3, sodium: 0.5, fiber: 2 }, serving: '1 plate (350g)' },
  'chicken biryani': { name: 'Chicken Biryani', description: 'Layered rice with spiced chicken', ingredients: ['basmati rice', 'chicken', 'onion', 'yogurt', 'saffron', 'ghee', 'biryani masala'], nutrition: { calories: 500, protein: 25, carbs: 55, fat: 18, sugar: 3, sodium: 0.6, fiber: 2 }, serving: '1 plate (400g)' },
  'pulao': { name: 'Veg Pulao', description: 'Spiced rice with mixed vegetables', ingredients: ['basmati rice', 'mixed vegetables', 'ghee', 'cumin', 'bay leaf', 'whole spices'], nutrition: { calories: 300, protein: 6, carbs: 52, fat: 8, sugar: 3, sodium: 0.3, fiber: 3 }, serving: '1 plate (250g)' },
  'khichdi': { name: 'Khichdi', description: 'Comfort food of rice and lentils cooked together', ingredients: ['rice', 'moong dal', 'ghee', 'cumin', 'turmeric', 'salt'], nutrition: { calories: 280, protein: 10, carbs: 45, fat: 7, sugar: 2, sodium: 0.3, fiber: 4 }, serving: '1 bowl (250g)' },
  'lemon rice': { name: 'Lemon Rice', description: 'Tangy rice tempered with peanuts and curry leaves', ingredients: ['rice', 'lemon juice', 'peanuts', 'mustard seeds', 'turmeric', 'curry leaves'], nutrition: { calories: 290, protein: 6, carbs: 48, fat: 8, sugar: 1, sodium: 0.3, fiber: 2 }, serving: '1 plate (250g)' },

  // --- BREADS ---
  'roti': { name: 'Roti / Chapati', description: 'Whole wheat flatbread', ingredients: ['whole wheat flour', 'water', 'salt'], nutrition: { calories: 120, protein: 4, carbs: 22, fat: 2, sugar: 0.5, sodium: 0.2, fiber: 3 }, serving: '2 rotis (60g)' },
  'paratha': { name: 'Paratha', description: 'Layered flatbread cooked with ghee', ingredients: ['wheat flour', 'ghee', 'salt'], nutrition: { calories: 200, protein: 5, carbs: 28, fat: 8, sugar: 0.5, sodium: 0.3, fiber: 2 }, serving: '1 paratha (80g)' },
  'aloo paratha': { name: 'Aloo Paratha', description: 'Potato-stuffed flatbread', ingredients: ['wheat flour', 'potato', 'green chili', 'coriander', 'ghee'], nutrition: { calories: 300, protein: 6, carbs: 40, fat: 12, sugar: 1, sodium: 0.4, fiber: 3 }, serving: '1 paratha (120g)' },
  'naan': { name: 'Naan', description: 'Leavened flatbread baked in tandoor', ingredients: ['maida', 'yogurt', 'yeast', 'butter', 'salt'], nutrition: { calories: 260, protein: 8, carbs: 42, fat: 6, sugar: 2, sodium: 0.5, fiber: 1 }, serving: '1 naan (90g)' },
  'puri': { name: 'Puri', description: 'Deep-fried puffed bread', ingredients: ['wheat flour', 'oil', 'salt'], nutrition: { calories: 150, protein: 3, carbs: 18, fat: 7, sugar: 0.5, sodium: 0.2, fiber: 1 }, serving: '2 puris (50g)' },
  'dosa': { name: 'Dosa', description: 'Crispy fermented rice and lentil crepe', ingredients: ['rice', 'urad dal', 'fenugreek', 'oil'], nutrition: { calories: 170, protein: 5, carbs: 28, fat: 4, sugar: 1, sodium: 0.2, fiber: 1 }, serving: '1 dosa (100g)' },
  'masala dosa': { name: 'Masala Dosa', description: 'Dosa filled with spiced potato filling', ingredients: ['rice batter', 'urad dal', 'potato', 'onion', 'mustard seeds', 'turmeric'], nutrition: { calories: 280, protein: 7, carbs: 42, fat: 9, sugar: 2, sodium: 0.3, fiber: 3 }, serving: '1 masala dosa (180g)' },
  'idli': { name: 'Idli', description: 'Steamed fermented rice cakes', ingredients: ['rice', 'urad dal', 'salt'], nutrition: { calories: 80, protein: 2.5, carbs: 15, fat: 0.5, sugar: 0.5, sodium: 0.2, fiber: 1 }, serving: '1 idli (40g)' },
  'uttapam': { name: 'Uttapam', description: 'Thick pancake topped with vegetables', ingredients: ['rice batter', 'urad dal', 'onion', 'tomato', 'green chili'], nutrition: { calories: 200, protein: 5, carbs: 32, fat: 5, sugar: 2, sodium: 0.3, fiber: 2 }, serving: '1 uttapam (150g)' },

  // --- CURRIES ---
  'dal': { name: 'Dal', description: 'Lentil curry', ingredients: ['toor dal', 'onion', 'tomato', 'turmeric', 'cumin', 'ghee'], nutrition: { calories: 180, protein: 10, carbs: 28, fat: 4, sugar: 2, sodium: 0.4, fiber: 5 }, serving: '1 bowl (200g)' },
  'dal tadka': { name: 'Dal Tadka', description: 'Yellow lentils with ghee tempering', ingredients: ['toor dal', 'ghee', 'cumin', 'garlic', 'dried red chili', 'onion'], nutrition: { calories: 220, protein: 12, carbs: 30, fat: 6, sugar: 2, sodium: 0.4, fiber: 6 }, serving: '1 bowl (200g)' },
  'dal makhani': { name: 'Dal Makhani', description: 'Rich black lentil curry with cream', ingredients: ['urad dal', 'rajma', 'butter', 'cream', 'tomato', 'ginger', 'garlic'], nutrition: { calories: 280, protein: 12, carbs: 32, fat: 12, sugar: 3, sodium: 0.5, fiber: 6 }, serving: '1 bowl (200g)' },
  'rajma': { name: 'Rajma', description: 'Kidney bean curry', ingredients: ['rajma', 'onion', 'tomato', 'ginger', 'garlic', 'spices', 'oil'], nutrition: { calories: 210, protein: 10, carbs: 34, fat: 4, sugar: 3, sodium: 0.5, fiber: 8 }, serving: '1 bowl (200g)' },
  'chole': { name: 'Chole', description: 'Spiced chickpea curry', ingredients: ['chickpeas', 'onion', 'tomato', 'chole masala', 'ginger', 'oil'], nutrition: { calories: 240, protein: 11, carbs: 36, fat: 6, sugar: 4, sodium: 0.5, fiber: 7 }, serving: '1 bowl (200g)' },
  'paneer butter masala': { name: 'Paneer Butter Masala', description: 'Cottage cheese in creamy tomato gravy', ingredients: ['paneer', 'butter', 'cream', 'tomato', 'cashew', 'spices'], nutrition: { calories: 320, protein: 14, carbs: 12, fat: 24, sugar: 4, sodium: 0.5, fiber: 2 }, serving: '1 bowl (200g)' },
  'palak paneer': { name: 'Palak Paneer', description: 'Cottage cheese in spinach gravy', ingredients: ['paneer', 'spinach', 'onion', 'tomato', 'cream', 'garlic'], nutrition: { calories: 260, protein: 14, carbs: 10, fat: 18, sugar: 3, sodium: 0.4, fiber: 4 }, serving: '1 bowl (200g)' },
  'aloo gobi': { name: 'Aloo Gobi', description: 'Potato and cauliflower dry curry', ingredients: ['potato', 'cauliflower', 'onion', 'tomato', 'turmeric', 'cumin', 'oil'], nutrition: { calories: 180, protein: 4, carbs: 24, fat: 8, sugar: 3, sodium: 0.3, fiber: 4 }, serving: '1 serving (200g)' },
  'bhindi masala': { name: 'Bhindi Masala', description: 'Spiced okra stir-fry', ingredients: ['okra', 'onion', 'tomato', 'turmeric', 'coriander', 'oil'], nutrition: { calories: 140, protein: 3, carbs: 14, fat: 8, sugar: 3, sodium: 0.3, fiber: 4 }, serving: '1 serving (150g)' },
  'butter chicken': { name: 'Butter Chicken', description: 'Chicken in rich creamy tomato sauce', ingredients: ['chicken', 'butter', 'cream', 'tomato', 'cashew', 'fenugreek', 'spices'], nutrition: { calories: 380, protein: 28, carbs: 12, fat: 24, sugar: 4, sodium: 0.6, fiber: 1 }, serving: '1 bowl (250g)' },
  'egg curry': { name: 'Egg Curry', description: 'Boiled eggs in spiced onion-tomato gravy', ingredients: ['eggs', 'onion', 'tomato', 'ginger', 'garlic', 'spices', 'oil'], nutrition: { calories: 280, protein: 16, carbs: 12, fat: 18, sugar: 3, sodium: 0.5, fiber: 2 }, serving: '1 serving (250g, 2 eggs)' },
  'fish curry': { name: 'Fish Curry', description: 'Fish cooked in spiced coconut or tomato gravy', ingredients: ['fish', 'coconut milk', 'onion', 'tomato', 'curry leaves', 'spices'], nutrition: { calories: 250, protein: 22, carbs: 8, fat: 14, sugar: 2, sodium: 0.5, fiber: 1 }, serving: '1 serving (250g)' },
  'mutton curry': { name: 'Mutton Curry', description: 'Slow-cooked goat meat curry', ingredients: ['mutton', 'onion', 'yogurt', 'tomato', 'ginger', 'garlic', 'spices'], nutrition: { calories: 350, protein: 28, carbs: 8, fat: 22, sugar: 2, sodium: 0.6, fiber: 1 }, serving: '1 serving (250g)' },
  'kadhi pakora': { name: 'Kadhi Pakora', description: 'Yogurt curry with gram flour fritters', ingredients: ['yogurt', 'besan', 'onion', 'turmeric', 'fenugreek', 'oil'], nutrition: { calories: 220, protein: 8, carbs: 22, fat: 12, sugar: 4, sodium: 0.3, fiber: 2 }, serving: '1 bowl (200g)' },
  'mixed veg sabzi': { name: 'Mixed Veg Sabzi', description: 'Mixed vegetables dry/semi-dry curry', ingredients: ['mixed vegetables', 'onion', 'tomato', 'turmeric', 'cumin', 'oil'], nutrition: { calories: 150, protein: 4, carbs: 18, fat: 7, sugar: 4, sodium: 0.3, fiber: 5 }, serving: '1 serving (200g)' },

  // --- SNACKS ---
  'samosa': { name: 'Samosa', description: 'Crispy fried pastry with potato filling', ingredients: ['maida', 'potato', 'peas', 'cumin', 'coriander', 'oil'], nutrition: { calories: 180, protein: 3, carbs: 22, fat: 9, sugar: 1, sodium: 0.3, fiber: 2 }, serving: '1 samosa (80g)' },
  'pakora': { name: 'Pakora', description: 'Deep-fried vegetable fritters', ingredients: ['besan', 'onion', 'potato', 'spinach', 'spices', 'oil'], nutrition: { calories: 200, protein: 5, carbs: 20, fat: 12, sugar: 2, sodium: 0.3, fiber: 2 }, serving: '5-6 pieces (100g)' },
  'vada pav': { name: 'Vada Pav', description: 'Mumbai street food — spiced potato fritter in a bun', ingredients: ['pav', 'potato', 'besan', 'garlic chutney', 'green chutney', 'oil'], nutrition: { calories: 290, protein: 6, carbs: 38, fat: 12, sugar: 3, sodium: 0.5, fiber: 3 }, serving: '1 vada pav (150g)' },
  'pav bhaji': { name: 'Pav Bhaji', description: 'Mashed vegetable curry with buttered bread rolls', ingredients: ['mixed vegetables', 'butter', 'pav', 'pav bhaji masala', 'onion', 'lemon'], nutrition: { calories: 400, protein: 10, carbs: 52, fat: 16, sugar: 6, sodium: 0.6, fiber: 5 }, serving: '1 plate (300g)' },
  'chole bhature': { name: 'Chole Bhature', description: 'Spiced chickpeas with deep-fried bread', ingredients: ['chickpeas', 'maida', 'yogurt', 'onion', 'spices', 'oil'], nutrition: { calories: 550, protein: 14, carbs: 65, fat: 24, sugar: 4, sodium: 0.6, fiber: 6 }, serving: '1 plate (350g)' },
  'dhokla': { name: 'Dhokla', description: 'Steamed fermented gram flour cake', ingredients: ['besan', 'yogurt', 'mustard seeds', 'curry leaves', 'sugar', 'lemon'], nutrition: { calories: 160, protein: 6, carbs: 24, fat: 4, sugar: 4, sodium: 0.3, fiber: 2 }, serving: '3 pieces (120g)' },
  'poha': { name: 'Poha', description: 'Flattened rice with peanuts and onions', ingredients: ['poha', 'peanuts', 'onion', 'mustard seeds', 'turmeric', 'curry leaves'], nutrition: { calories: 270, protein: 7, carbs: 42, fat: 8, sugar: 3, sodium: 0.3, fiber: 2 }, serving: '1 bowl (200g)' },
  'upma': { name: 'Upma', description: 'Semolina porridge with vegetables', ingredients: ['semolina', 'onion', 'mustard seeds', 'curry leaves', 'green chili', 'ghee'], nutrition: { calories: 250, protein: 6, carbs: 38, fat: 8, sugar: 2, sodium: 0.3, fiber: 2 }, serving: '1 bowl (200g)' },
  'besan chilla': { name: 'Besan Chilla', description: 'Savory gram flour pancake', ingredients: ['besan', 'onion', 'tomato', 'green chili', 'coriander', 'oil'], nutrition: { calories: 150, protein: 7, carbs: 16, fat: 6, sugar: 2, sodium: 0.3, fiber: 3 }, serving: '1 chilla (80g)' },
  'jalebi': { name: 'Jalebi', description: 'Deep-fried pretzel-shaped sweet soaked in sugar syrup', ingredients: ['maida', 'sugar', 'saffron', 'cardamom', 'oil'], nutrition: { calories: 350, protein: 2, carbs: 60, fat: 12, sugar: 45, sodium: 0.1, fiber: 0 }, serving: '3-4 pieces (100g)' },
  'gulab jamun': { name: 'Gulab Jamun', description: 'Deep-fried milk dumplings in sugar syrup', ingredients: ['khoya', 'maida', 'sugar', 'cardamom', 'rose water', 'ghee'], nutrition: { calories: 320, protein: 4, carbs: 52, fat: 12, sugar: 40, sodium: 0.1, fiber: 0 }, serving: '2 pieces (80g)' },

  // --- DRINKS ---
  'chai': { name: 'Masala Chai', description: 'Spiced milk tea', ingredients: ['tea leaves', 'milk', 'sugar', 'ginger', 'cardamom'], nutrition: { calories: 80, protein: 2, carbs: 12, fat: 2, sugar: 10, sodium: 0.05, fiber: 0 }, serving: '1 cup (150ml)' },
  'lassi': { name: 'Lassi', description: 'Yogurt-based drink', ingredients: ['yogurt', 'sugar', 'cardamom', 'water'], nutrition: { calories: 150, protein: 5, carbs: 22, fat: 4, sugar: 18, sodium: 0.1, fiber: 0 }, serving: '1 glass (250ml)' },
  'buttermilk': { name: 'Chaas / Buttermilk', description: 'Spiced diluted yogurt drink', ingredients: ['yogurt', 'water', 'cumin', 'salt', 'coriander', 'mint'], nutrition: { calories: 40, protein: 2, carbs: 4, fat: 1, sugar: 3, sodium: 0.3, fiber: 0 }, serving: '1 glass (250ml)' },

  // --- THALI & COMBOS ---
  'thali': { name: 'Veg Thali', description: 'Full meal platter with dal, sabzi, roti, rice, salad', ingredients: ['dal', 'sabzi', 'roti', 'rice', 'salad', 'raita', 'pickle'], nutrition: { calories: 650, protein: 18, carbs: 85, fat: 22, sugar: 6, sodium: 0.6, fiber: 8 }, serving: '1 thali (500g)' },
  'south indian meals': { name: 'South Indian Meals', description: 'Rice with sambar, rasam, poriyal, curd', ingredients: ['rice', 'sambar', 'rasam', 'poriyal', 'curd', 'papad', 'pickle'], nutrition: { calories: 600, protein: 14, carbs: 90, fat: 16, sugar: 5, sodium: 0.5, fiber: 6 }, serving: '1 meals plate (450g)' },
};

// English keyword patterns → Indian dish mapping
// Vision models often describe dishes in English instead of using Indian names
const KEYWORD_PATTERNS = [
  { keywords: ['lentil', 'rice'], dish: 'dal chawal' },
  { keywords: ['dal', 'rice'], dish: 'dal chawal' },
  { keywords: ['dal', 'chawal'], dish: 'dal chawal' },
  { keywords: ['kidney', 'bean', 'rice'], dish: 'rajma chawal' },
  { keywords: ['rajma'], dish: 'rajma chawal' },
  { keywords: ['yogurt', 'curry', 'rice'], dish: 'kadhi chawal' },
  { keywords: ['kadhi'], dish: 'kadhi chawal' },
  { keywords: ['curd', 'rice'], dish: 'curd rice' },
  { keywords: ['biryani'], dish: 'biryani' },
  { keywords: ['layered', 'rice', 'meat'], dish: 'biryani' },
  { keywords: ['spiced', 'rice', 'chicken'], dish: 'chicken biryani' },
  { keywords: ['chicken', 'biryani'], dish: 'chicken biryani' },
  { keywords: ['pulao'], dish: 'pulao' },
  { keywords: ['pilaf'], dish: 'pulao' },
  { keywords: ['khichdi'], dish: 'khichdi' },
  { keywords: ['rice', 'lentil', 'porridge'], dish: 'khichdi' },
  { keywords: ['lemon', 'rice'], dish: 'lemon rice' },
  { keywords: ['roti'], dish: 'roti' },
  { keywords: ['chapati'], dish: 'roti' },
  { keywords: ['flatbread'], dish: 'roti' },
  { keywords: ['paratha'], dish: 'paratha' },
  { keywords: ['stuffed', 'flatbread'], dish: 'aloo paratha' },
  { keywords: ['aloo', 'paratha'], dish: 'aloo paratha' },
  { keywords: ['potato', 'flatbread'], dish: 'aloo paratha' },
  { keywords: ['naan'], dish: 'naan' },
  { keywords: ['puri'], dish: 'puri' },
  { keywords: ['fried', 'bread', 'puffed'], dish: 'puri' },
  { keywords: ['dosa'], dish: 'dosa' },
  { keywords: ['crepe', 'indian'], dish: 'dosa' },
  { keywords: ['masala', 'dosa'], dish: 'masala dosa' },
  { keywords: ['crepe', 'potato'], dish: 'masala dosa' },
  { keywords: ['idli'], dish: 'idli' },
  { keywords: ['steamed', 'cake', 'rice'], dish: 'idli' },
  { keywords: ['white', 'round', 'steamed'], dish: 'idli' },
  { keywords: ['uttapam'], dish: 'uttapam' },
  { keywords: ['pancake', 'indian'], dish: 'uttapam' },
  { keywords: ['dal', 'tadka'], dish: 'dal tadka' },
  { keywords: ['dal', 'makhani'], dish: 'dal makhani' },
  { keywords: ['black', 'lentil'], dish: 'dal makhani' },
  { keywords: ['chickpea', 'curry'], dish: 'chole' },
  { keywords: ['chana', 'masala'], dish: 'chole' },
  { keywords: ['chole'], dish: 'chole' },
  { keywords: ['chole', 'bhature'], dish: 'chole bhature' },
  { keywords: ['chickpea', 'fried', 'bread'], dish: 'chole bhature' },
  { keywords: ['palak', 'paneer'], dish: 'palak paneer' },
  { keywords: ['spinach', 'paneer'], dish: 'palak paneer' },
  { keywords: ['spinach', 'cheese'], dish: 'palak paneer' },
  { keywords: ['spinach', 'cottage'], dish: 'palak paneer' },
  { keywords: ['spinach', 'curry'], dish: 'palak paneer' },
  { keywords: ['green', 'curry', 'cheese'], dish: 'palak paneer' },
  { keywords: ['green', 'curry', 'paneer'], dish: 'palak paneer' },
  { keywords: ['paneer', 'butter'], dish: 'paneer butter masala' },
  { keywords: ['paneer', 'tomato', 'cream'], dish: 'paneer butter masala' },
  { keywords: ['paneer', 'masala'], dish: 'paneer butter masala' },
  { keywords: ['cottage', 'cheese', 'curry'], dish: 'paneer butter masala' },
  { keywords: ['cottage', 'cheese', 'tomato'], dish: 'paneer butter masala' },
  { keywords: ['aloo', 'gobi'], dish: 'aloo gobi' },
  { keywords: ['potato', 'cauliflower'], dish: 'aloo gobi' },
  { keywords: ['bhindi'], dish: 'bhindi masala' },
  { keywords: ['okra'], dish: 'bhindi masala' },
  { keywords: ['butter', 'chicken'], dish: 'butter chicken' },
  { keywords: ['chicken', 'cream', 'tomato'], dish: 'butter chicken' },
  { keywords: ['chicken', 'curry', 'creamy'], dish: 'butter chicken' },
  { keywords: ['tikka', 'masala'], dish: 'butter chicken' },
  { keywords: ['egg', 'curry'], dish: 'egg curry' },
  { keywords: ['fish', 'curry'], dish: 'fish curry' },
  { keywords: ['mutton', 'curry'], dish: 'mutton curry' },
  { keywords: ['goat', 'curry'], dish: 'mutton curry' },
  { keywords: ['kadhi', 'pakora'], dish: 'kadhi pakora' },
  { keywords: ['samosa'], dish: 'samosa' },
  { keywords: ['triangular', 'fried', 'pastry'], dish: 'samosa' },
  { keywords: ['fried', 'dumpling', 'potato'], dish: 'samosa' },
  { keywords: ['pakora'], dish: 'pakora' },
  { keywords: ['fritter'], dish: 'pakora' },
  { keywords: ['vada', 'pav'], dish: 'vada pav' },
  { keywords: ['pav', 'bhaji'], dish: 'pav bhaji' },
  { keywords: ['mashed', 'vegetable', 'bread'], dish: 'pav bhaji' },
  { keywords: ['mashed', 'vegetable', 'curry'], dish: 'pav bhaji' },
  { keywords: ['vegetable', 'mash', 'bread'], dish: 'pav bhaji' },
  { keywords: ['vegetable', 'mash', 'bun'], dish: 'pav bhaji' },
  { keywords: ['bhaji', 'pav'], dish: 'pav bhaji' },
  { keywords: ['dhokla'], dish: 'dhokla' },
  { keywords: ['poha'], dish: 'poha' },
  { keywords: ['flattened', 'rice'], dish: 'poha' },
  { keywords: ['beaten', 'rice'], dish: 'poha' },
  { keywords: ['upma'], dish: 'upma' },
  { keywords: ['semolina'], dish: 'upma' },
  { keywords: ['besan', 'chilla'], dish: 'besan chilla' },
  { keywords: ['gram', 'flour', 'pancake'], dish: 'besan chilla' },
  { keywords: ['jalebi'], dish: 'jalebi' },
  { keywords: ['orange', 'spiral', 'sweet'], dish: 'jalebi' },
  { keywords: ['pretzel', 'sweet', 'syrup'], dish: 'jalebi' },
  { keywords: ['gulab', 'jamun'], dish: 'gulab jamun' },
  { keywords: ['fried', 'ball', 'syrup'], dish: 'gulab jamun' },
  { keywords: ['brown', 'ball', 'sweet'], dish: 'gulab jamun' },
  { keywords: ['sweet', 'dumpling', 'syrup'], dish: 'gulab jamun' },
  { keywords: ['dessert', 'ball', 'indian'], dish: 'gulab jamun' },
  { keywords: ['chai'], dish: 'chai' },
  { keywords: ['masala', 'tea'], dish: 'chai' },
  { keywords: ['indian', 'tea'], dish: 'chai' },
  { keywords: ['milk', 'tea', 'spice'], dish: 'chai' },
  { keywords: ['lassi'], dish: 'lassi' },
  { keywords: ['buttermilk'], dish: 'buttermilk' },
  { keywords: ['chaas'], dish: 'buttermilk' },
  { keywords: ['thali'], dish: 'thali' },
  { keywords: ['meal', 'platter', 'indian'], dish: 'thali' },
  { keywords: ['multiple', 'bowls', 'rice', 'curry'], dish: 'thali' },
];

const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

const findMatch = (aiName, aiDescription) => {
  const combined = normalize(`${aiName} ${aiDescription || ''}`);
  const words = combined.split(/\s+/);

  // 1. Direct key match
  const key = normalize(aiName);
  if (INDIAN_FOODS[key]) return INDIAN_FOODS[key];

  // 2. Substring match on keys
  for (const [k, v] of Object.entries(INDIAN_FOODS)) {
    if (combined.includes(k) || k.includes(key)) return v;
  }

  // 3. Keyword pattern matching (catches English descriptions)
  let bestPattern = null;
  let bestPatternScore = 0;
  for (const { keywords, dish } of KEYWORD_PATTERNS) {
    const matched = keywords.filter((kw) => words.some((w) => w.includes(kw) || kw.includes(w))).length;
    const score = matched / keywords.length;
    if (score >= 1 && keywords.length > bestPatternScore) {
      bestPatternScore = keywords.length;
      bestPattern = dish;
    }
  }
  if (bestPattern && INDIAN_FOODS[bestPattern]) return INDIAN_FOODS[bestPattern];

  // 4. Partial keyword match (at least 60% match)
  for (const { keywords, dish } of KEYWORD_PATTERNS) {
    const matched = keywords.filter((kw) => words.some((w) => w.includes(kw) || kw.includes(w))).length;
    if (matched / keywords.length >= 0.6 && matched >= 2) {
      if (INDIAN_FOODS[dish]) return INDIAN_FOODS[dish];
    }
  }

  // 5. Word overlap with DB keys
  let bestMatch = null;
  let bestScore = 0;
  for (const [k, v] of Object.entries(INDIAN_FOODS)) {
    const kWords = k.split(/\s+/);
    const overlap = words.filter((w) => kWords.includes(w)).length;
    if (overlap > bestScore) { bestScore = overlap; bestMatch = v; }
  }
  return bestScore > 0 ? bestMatch : null;
};

module.exports = { INDIAN_FOODS, findMatch };
