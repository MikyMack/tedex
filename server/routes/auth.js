const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD;

    if (!adminPass) {
      return res.status(500).json({ error: 'Admin credentials not configured' });
    }

    if (username !== adminUser || password !== adminPass) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ role: 'admin', username: adminUser }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({ token, username: adminUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/verify', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }
  try {
    jwt.verify(header.slice(7), process.env.JWT_SECRET);
    res.json({ valid: true });
  } catch {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
