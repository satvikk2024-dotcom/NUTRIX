const express = require('express');
const router = express.Router();
const { searchFood, getHomemade } = require('../controllers/foodController');

router.get('/search', searchFood);
router.get('/homemade', getHomemade);

module.exports = router;