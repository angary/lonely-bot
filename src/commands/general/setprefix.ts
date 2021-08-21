import { prefix } from "../../config.json";
import { GuildModel } from "../../database/Guild";

module.exports = {
  name: "setprefix",
  description: "Change the prefix of the bot for the current server",
  information: `Change the prefix of the bot for the current server. If you would like to remove your server's prefix, you may set it back to \`${prefix}\`.`,
  aliases: false,
  args: true,
  usage: "[new prefix]",
  example: ">>",
  cooldown: 0,
  category: "general",
  execute: setprefix,
};

function setprefix(message, args, client) {
  const guildId = message.guild.id;
  const newPrefix = args[0];

  const query = { guildId: guildId };
  const update = { prefix: newPrefix };
  const options = { returnNewDocument: true };

  if (prefix === newPrefix) {
    GuildModel.deleteOne(query)
      .then(() => {
        delete client.prefixes[guildId];
        message.channel.send(
          `Successfully reset server prefix to be **${prefix}**!`
        );
      })
      .catch((err) =>
        message.channel.send(
          `${message.author} Failed to find and reset prefix ${err}`
        )
      );
    return;
  }

  GuildModel.findOneAndUpdate(query, update)
    .then((updatedDocument) => {
      if (updatedDocument) {
        message.channel.send(
          `Successfully updated server prefix to be **${newPrefix}**!`
          );
        client.prefixes[guildId] = newPrefix;
      } else {
        const newGuild = new GuildModel({ guildId, prefix: newPrefix });
        newGuild
          .save()
          .then(() => {
            message.channel.send(
              `Added server prefix to be **${newPrefix}**`
            );
            client.prefixes[guildId] = newPrefix;
          })
          .catch((err) => message.channel.send(`Error: ${err}`));
      }
    })
    .catch((err) =>
      message.channel.send(
        `${message.author} Failed to find and add/update prefix ${err}`
      )
    );
}
