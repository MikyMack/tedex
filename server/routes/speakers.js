const express = require('express');
const Speaker = require('../models/Speaker');
const Settings = require('../models/Settings');

const router = express.Router();

async function getSpeakerAnnouncement() {
  const setting = await Settings.findOne({ key: 'speaker_announcement' });
  return setting?.value || 'Speaker announcements will be released soon.';
}

router.get('/', async (_req, res) => {
  try {
    const speakers = await Speaker.find({ published: true }).sort({ order: 1, createdAt: -1 });
    const announcement = await getSpeakerAnnouncement();
    res.json({ speakers, announcement });
  } catch (err) {
    console.error('Public speakers error:', err);
    res.status(500).json({ error: 'Failed to fetch speakers' });
  }
});

module.exports = router;
