const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  title: String,
  description: String,
  effortMin: Number,
  assignee: String,
  auditor: String,
  status: { type: String, enum: ['offen','in_arbeit','review','erledigt'], default: 'offen' },
  comments: [{ text: String, date: { type: Date, default: Date.now } }]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
