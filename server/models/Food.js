const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema({
  barcode: { type: String, unique: true },
  name: String,
  brand: String,
  image: String,
  nutriScore: String,
  novaScore: Number,
  ecoScore: String,
  ingredients: [String],
  nutrients: {
    calories: Number,
    protein: Number,
    carbs: Number,
    sugar: Number,
    fat: Number,
    sodium: Number
  },
  additives: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Food', FoodSchema);