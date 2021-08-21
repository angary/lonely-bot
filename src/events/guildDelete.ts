import { GuildModel } from "../database/Guild";

module.exports = (client, guild) => {
  // If the bot is removed from a server, remove the server from database
  GuildModel.remove({ guildId: guild.id }).catch((err) => console.log(err));
};
