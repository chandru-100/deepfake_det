const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./database');
const { analyzeMediaHybrid } = require('./services/ensembleEngine');

const app = express();
app.use(cors());
app.use(express.json());

// Set up storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Endpoint: Upload Media
app.post('/api/upload', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { filename, mimetype } = req.file;
    const mediaType = mimetype.startsWith('video') ? 'video' : 'image';

    const analysis = await analyzeMediaHybrid(req.file.path, mediaType, mimetype);
    
    // Save to DB
    const result = await db.db.run(
      'INSERT INTO uploads (filename, media_type, result, score) VALUES (?, ?, ?, ?)',
      [filename, mediaType, analysis.status, analysis.authenticityScore]
    );

    res.json({
      success: true,
      data: {
        id: result.lastID,
        filename,
        mediaType,
        result: analysis.status,
        score: analysis.authenticityScore,
        aiVerificationReport: analysis.aiVerificationReport,
        url: `http://localhost:5002/uploads/${filename}`
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server processing error' });
  }
});

// Endpoint: Report Fake Media
app.post('/api/reports', async (req, res) => {
  try {
    const { media_link, reason } = req.body;
    await db.db.run(
      'INSERT INTO reports (media_link, reason) VALUES (?, ?)',
      [media_link, reason]
    );
    res.json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server database error' });
  }
});

// Endpoint: Admin Dashboard Stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const uploads = await db.db.all('SELECT * FROM uploads ORDER BY uploaded_at DESC LIMIT 50');
    const reports = await db.db.all('SELECT * FROM reports ORDER BY created_at DESC LIMIT 50');
    const counts = await db.db.all(`
      SELECT 
        (SELECT COUNT(*) FROM uploads) as totalScans,
        (SELECT COUNT(*) FROM uploads WHERE result = 'Fake') as fakeCount,
        (SELECT COUNT(*) FROM reports) as totalReports
    `);
    
    res.json({
      stats: counts[0],
      recentUploads: uploads,
      recentReports: reports
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database fetch error' });
  }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
