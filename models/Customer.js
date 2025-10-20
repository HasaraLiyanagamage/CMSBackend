const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  basicInfo: { type: Object, default: {} },
  ownerDetails: { type: Object, default: {} },
  attachments: [String],
  declaration: { type: Boolean, default: false },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema);
