const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
  text: String,
  date: { type: Date, default: Date.now }
}, { _id: false });

const taskSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', index: true }, // Besitzer
  title: { type: String, required: true },
  description: String,
  effortMin: { type: Number, default: 0 },
  assignee: String,
  auditor: String,
  status: { type: String, enum: ['offen','in_arbeit','review','erledigt'], default: 'offen' },
  comments: [commentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
