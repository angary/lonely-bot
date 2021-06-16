const mongoose = require("mongoose");

module.exports = mongoose.model(
  "User",
  new mongoose.Schema({
    discordID: { type: String, required: true },
    steamID: { type: String, required: true },
  })
);
