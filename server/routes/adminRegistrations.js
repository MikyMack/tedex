const express = require('express');
const Registration = require('../models/Registration');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const registrations = await Registration.find().sort({ createdAt: -1 });
    res.json({ registrations, count: registrations.length });
  } catch (err) {
    console.error('List registrations error:', err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Registration.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    res.json({ message: 'Registration deleted' });
  } catch (err) {
    console.error('Delete registration error:', err);
    res.status(500).json({ error: 'Failed to delete registration' });
  }
});

module.exports = router;
