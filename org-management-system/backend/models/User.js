const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  registrationDate: { type: Date, default: Date.now },
  totalMonthlyContributions: { type: Number, default: 0 },
  totalOccasionContributions: { type: Number, default: 0 },
  role: { type: String, enum: ['member', 'admin'], default: 'member' }
});

module.exports = mongoose.model('User', userSchema);
