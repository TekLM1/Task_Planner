const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();

/**
 * Proxy-Setup (z. B. Render/Heroku)
 * - sorgt fuer korrekte HTTPS-Infos und Cookie-Flags
 */
app.set('trust proxy', 1);

/**
 * CORS
 * - erlaubte Origins kommen aus .env (CORS_ORIGIN, komma-getrennt)
 * - credentials: true fuer Cookies/Authorization Header
 */
const allowed = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);            // z. B. curl/Postman ohne Origin
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error('CORS blocked: ' + origin));
  },
  credentials: true
}));

/** Parser */
app.use(express.json());     // JSON-Body
app.use(cookieParser());     // Cookies lesen/schreiben

/** Healthcheck fuer Uptime/Monitoring */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

/** API-Routen */
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

/**
 * DB-Connect + Server-Start
 * - bricht bei Verbindungsfehler ab (exit 1)
 */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    const port = process.env.PORT || 3001;
    app.listen(port, () => console.log(`API laeuft auf http://localhost:${port}`));
  })
  .catch(err => {
    console.error('Mongo Connect Error:', err.message);
    process.exit(1);
  });
