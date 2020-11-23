const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  discordID: { type: String, required: true },
  steamID: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
