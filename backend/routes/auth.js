const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authMiddleware, adminOnly, JWT_SECRET } = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username: username.toLowerCase().trim() }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, name: user.name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user._id, username: user.username, name: user.name, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all staff (admin only)
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'staff' }).select('-password').sort({ createdAt: -1 });
    res.json(users.map(u => ({ id: u._id, username: u.username, name: u.name, createdAt: u.createdAt })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create staff account (admin only)
router.post('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { username, password, name } = req.body;
    if (!username || !password || !name)
      return res.status(400).json({ error: 'All fields required' });

    const exists = await User.findOne({ username: username.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: 'Username already exists' });

    const user = await User.create({ username, password, name, role: 'staff' });
    res.json({ id: user._id, username: user.username, name: user.name });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Username already exists' });
    res.status(500).json({ error: err.message });
  }
});

// Delete staff (admin only)
router.delete('/users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin')
      return res.status(404).json({ error: 'User not found' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
