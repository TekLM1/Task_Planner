const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name:  { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user','supervisor'], default: 'user' }
}, { timestamps: true });
module.exports = mongoose.model('User', schema);
