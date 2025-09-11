const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();
app.use(cors({
  origin: (process.env.CORS_ORIGIN || '').split(',').map(s=>s.trim()),
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
    app.listen(port, () => console.log(`API läuft auf http://localhost:${port}`));
  })
  .catch(err => {
    console.error('Mongo Connect Error:', err.message);
    process.exit(1);
  });
