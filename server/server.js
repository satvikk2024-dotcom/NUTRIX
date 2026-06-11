require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const foodRoutes = require('./routes/foodRoutes');

const app = express();

// Middleware
app.use(cors()); // Allow frontend to access
app.use(express.json());

// Connect Database
// connectDB();

// Routes
app.use('/api/v1/food', foodRoutes);

const PORT = process.env.PORT || 5055;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));