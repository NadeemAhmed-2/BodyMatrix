require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/calculator', require('./routes/calculator'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/meal', require('./routes/meal'));
app.use('/api/workout', require('./routes/workout'));

// Basic Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fitness API is running' });
});

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
