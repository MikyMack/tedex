const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    organization: { type: String, trim: true, default: '' },
    registrationType: {
      type: String,
      enum: ['attendee', 'student-speaker', 'speaker-applicant'],
      default: 'attendee',
    },
    message: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

registrationSchema.index({ email: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
