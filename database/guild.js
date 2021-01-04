const mongoose = require('mongoose');

module.exports = mongoose.model('Guild', new mongoose.Schema({
  guildId: { type: String, required: true },
  prefix: { type: String, required: true }
}));
