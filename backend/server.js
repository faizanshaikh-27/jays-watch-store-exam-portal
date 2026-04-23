require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jays-exam-portal';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve frontend static files
// Works both locally (../frontend) and on Render (../../frontend from backend/)
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/results', require('./routes/results'));

// Health check
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  env: process.env.NODE_ENV || 'development'
}));

// Catch-all: serve frontend SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Seed default users on first run
async function seedDatabase() {
  const User = require('./models/User');
  const count = await User.countDocuments();
  if (count > 0) return;
  console.log('🌱 Seeding default users...');
  await User.create([
    { name: 'Admin', username: 'admin', password: 'faizan@845107', role: 'admin' },
  ]);
  console.log('✅ Default users created.');
}

// Connect MongoDB → then start server
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log(`✅ MongoDB connected`);
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`\n⌚  Jay's Watch Store — Exam Portal`);
      console.log(`🚀  Running at http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('👉  Set MONGODB_URI in your .env file or environment variables.');
    process.exit(1);
  });
