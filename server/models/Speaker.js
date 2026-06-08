const mongoose = require('mongoose');

const speakerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    bio: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    announcement: { type: String, trim: true, default: '' },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    isAnnouncementOnly: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Speaker', speakerSchema);
