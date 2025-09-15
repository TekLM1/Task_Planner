const mongoose = require('mongoose');

/**
 * User-Schema
 * - beschreibt die Struktur eines Users in MongoDB
 * - wird für Authentifizierung und Rollenverwaltung genutzt
 */
const schema = new mongoose.Schema({
  // E-Mail: muss einzigartig und verpflichtend sein
  email: { type: String, required: true, unique: true },

  // Name: sichtbarer Name des Users
  name:  { type: String, required: true },

  // Passwort: als Hash gespeichert (kein Klartext!)
  passwordHash: { type: String, required: true },

  // Rolle: steuert Berechtigungen
  role: { 
    type: String, 
    enum: ['user','supervisor'], // nur zwei mögliche Rollen
    default: 'user'              // Standard: normaler User
  }
}, { 
  timestamps: true // createdAt + updatedAt automatisch
});

// Modell exportieren (für Login/Registrierung etc. nutzbar)
module.exports = mongoose.model('User', schema);
