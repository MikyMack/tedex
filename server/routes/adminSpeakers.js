const express = require('express');
const multer = require('multer');
const Speaker = require('../models/Speaker');
const Settings = require('../models/Settings');
const upload = require('../middleware/upload');
const { deleteUploadedFile } = require('../utils/fileUpload');

const router = express.Router();

async function getSpeakerAnnouncement() {
  const setting = await Settings.findOne({ key: 'speaker_announcement' });
  return setting?.value || 'Speaker announcements will be released soon.';
}

function parseSpeakerFields(body) {
  return {
    name: body.name?.trim(),
    title: body.title?.trim(),
    bio: body.bio?.trim() || '',
    announcement: body.announcement?.trim() || '',
    published: body.published === 'true' || body.published === true,
    order: Number(body.order) || 0,
    isAnnouncementOnly: body.isAnnouncementOnly === 'true' || body.isAnnouncementOnly === true,
  };
}

function uploadSpeakerImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Image must be smaller than 5MB' });
    }
    return res.status(400).json({ error: err.message });
  });
}

router.get('/', async (_req, res) => {
  try {
    const speakers = await Speaker.find().sort({ order: 1, createdAt: -1 });
    const announcement = await getSpeakerAnnouncement();
    res.json({ speakers, announcement });
  } catch (err) {
    console.error('Admin speakers error:', err);
    res.status(500).json({ error: 'Failed to fetch speakers' });
  }
});

router.post('/', uploadSpeakerImage, async (req, res) => {
  try {
    const fields = parseSpeakerFields(req.body);
    if (!fields.name || !fields.title) {
      if (req.file) deleteUploadedFile('/uploads/' + req.file.filename);
      return res.status(400).json({ error: 'Name and title are required' });
    }

    const speaker = await Speaker.create({
      ...fields,
      imageUrl: req.file ? '/uploads/' + req.file.filename : '',
    });

    res.status(201).json({ speaker });
  } catch (err) {
    if (req.file) deleteUploadedFile('/uploads/' + req.file.filename);
    console.error('Create speaker error:', err);
    res.status(500).json({ error: 'Failed to create speaker' });
  }
});

router.put('/announcement', async (req, res) => {
  try {
    const { announcement } = req.body;
    const setting = await Settings.findOneAndUpdate(
      { key: 'speaker_announcement' },
      { value: announcement?.trim() || '' },
      { upsert: true, new: true }
    );
    res.json({ announcement: setting.value });
  } catch (err) {
    console.error('Update announcement error:', err);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

router.put('/:id', uploadSpeakerImage, async (req, res) => {
  try {
    const existing = await Speaker.findById(req.params.id);
    if (!existing) {
      if (req.file) deleteUploadedFile('/uploads/' + req.file.filename);
      return res.status(404).json({ error: 'Speaker not found' });
    }

    const fields = parseSpeakerFields(req.body);
    const updates = { ...fields };

    if (req.file) {
      updates.imageUrl = '/uploads/' + req.file.filename;
      deleteUploadedFile(existing.imageUrl);
    }

    const speaker = await Speaker.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ speaker });
  } catch (err) {
    if (req.file) deleteUploadedFile('/uploads/' + req.file.filename);
    console.error('Update speaker error:', err);
    res.status(500).json({ error: 'Failed to update speaker' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Speaker.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Speaker not found' });
    }
    deleteUploadedFile(deleted.imageUrl);
    res.json({ message: 'Speaker deleted' });
  } catch (err) {
    console.error('Delete speaker error:', err);
    res.status(500).json({ error: 'Failed to delete speaker' });
  }
});

module.exports = router;
