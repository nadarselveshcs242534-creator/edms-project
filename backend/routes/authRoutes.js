const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 1. Verify User & Role Existence
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(404).json({ error: 'Invalid email or role mismatch.' });
    }

    // 2. Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Access denied.' });
    }

    // 3. Generate Security Token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || 'cyber_secret_key', 
      { expiresIn: '1d' }
    );

    res.json({ message: 'Authentication successful', token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

module.exports = router;