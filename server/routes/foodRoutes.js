const express = require('express');
const router = express.Router();
const { searchFood, getHomemadeAlternative } = require('../controllers/foodController');
const { analyzeImage } = require('../controllers/imageController');
const { getSuggestions } = require('../controllers/suggestionsController');

router.get('/search', searchFood);
router.get('/homemade', getHomemadeAlternative);
router.post('/analyze-image', analyzeImage);
router.post('/suggestions', getSuggestions);

module.exports = router;