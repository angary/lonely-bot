const Guild = require('../database/guild');

module.exports = (client, guild) => {
  // If the bot is removed from a server, remove the server from database
  Guild.remove({ guildId: guild.id }).catch(err => console.log(err));
};
