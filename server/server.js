const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();

// hinter Proxy (Render) → korrektes HTTPS / Cookies
app.set('trust proxy', 1);

// CORS erlaubte Origins aus .env
const allowed = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);            // z. B. curl/Postman
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error('CORS blocked: ' + origin));
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req,res)=>res.json({ok:true}));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(()=> {
    const port = process.env.PORT || 3001;
    app.listen(port, () => console.log(`API laeuft auf http://localhost:${port}`));
  })
  .catch(err => {
    console.error('Mongo Connect Error:', err.message);
    process.exit(1);
  });
