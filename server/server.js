require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/auth');
const registrationRoutes = require('./routes/registrations');
const adminRegistrationRoutes = require('./routes/adminRegistrations');
const speakerRoutes = require('./routes/speakers');
const adminSpeakerRoutes = require('./routes/adminSpeakers');
const authMiddleware = require('./middleware/auth');
const { uploadsDir } = require('./utils/fileUpload');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/speakers', speakerRoutes);

app.use('/api/admin/registrations', authMiddleware, adminRegistrationRoutes);
app.use('/api/admin/speakers', authMiddleware, adminSpeakerRoutes);

app.use(express.static(path.join(__dirname, '..')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'index.html'));
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
