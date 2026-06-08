const express = require('express');
const Registration = require('../models/Registration');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, organization, registrationType, message } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const existing = await Registration.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: 'This email is already registered for the event' });
    }

    const registration = await Registration.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      organization: organization?.trim() || '',
      registrationType: registrationType || 'attendee',
      message: message?.trim() || '',
    });

    const count = await Registration.countDocuments();
    res.status(201).json({ message: 'Registration successful!', registration, totalCount: count });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register. Please try again.' });
  }
});

router.get('/count', async (_req, res) => {
  try {
    const count = await Registration.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error('Count error:', err);
    res.status(500).json({ error: 'Failed to fetch count' });
  }
});

module.exports = router;
