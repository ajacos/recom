const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Optional: for environment variables like PORT

const productRoutes = require('./routes/products'); // We'll create this next

const app = express();

// === Environment Variables ===
const PORT = process.env.PORT || 5003; 
// Allow frontend origin (replace '*' or specific origin in production)
const FRONTEND_URL = process.env.FRONTEND_URL || '*'; 

// === Middleware ===
const corsOptions = {
  origin: FRONTEND_URL,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions)); 
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(express.static('public')); // Serve static files (like images) from 'public' folder

// === Basic Logging Middleware ===
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// === API Routes ===
app.get('/', (req, res) => {
  res.send('ReCom Backend API is running!');
});

app.use('/api/products', productRoutes); // Use the product routes

// === Error Handling Middleware (Basic) ===
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// === Start Server ===
if (process.env.NODE_ENV !== 'test') { // Avoid starting server during tests
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Allowing requests from origin: ${FRONTEND_URL}`);
  });
}

module.exports = app; // Export for potential testing 