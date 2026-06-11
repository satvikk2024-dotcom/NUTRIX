const express = require('express');
const router = express.Router();
const { searchFood } = require('../controllers/foodController');

router.get('/search', searchFood);

module.exports = router;