const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Task-Schema
 * - beschreibt die Struktur eines Tasks in MongoDB
 * - nutzt Mongoose Schema für Typisierung + Defaults
 */
const taskSchema = new Schema({
  // Referenz zum User, dem der Task gehört
  user: { type: Schema.Types.ObjectId, ref: 'User' },

  // Basis-Infos
  title: String,            // Titel des Tasks
  description: String,      // Beschreibung
  effortMin: Number,        // Aufwand in Minuten

  // Zuständige Personen
  assignee: String,         // Verantwortlicher
  auditor: String,          // Prüfer / Kontrollinstanz

  // Status: nur bestimmte Werte erlaubt
  status: { 
    type: String, 
    enum: ['offen','in_arbeit','review','erledigt'], 
    default: 'offen' 
  },

  // Kommentare: Array von Objekten mit Text + Datum
  comments: [{ 
    text: String, 
    date: { type: Date, default: Date.now } 
  }]
}, { 
  timestamps: true // createdAt + updatedAt automatisch
});

// Modell exportieren (für Controller/Router nutzbar)
module.exports = mongoose.model('Task', taskSchema);
