import { Message } from "discord.js";
import { prefix } from "../../../config.json";
import { GuildModel } from "../../database/Guild";
import { Command } from "../Command";

export default class SetPrefix extends Command {
  name: string = "setprefix";
  description: string = "Change the prefix of the bot for the current server";
  information: string = `Change the prefix of the bot for the current server. If you would like to remove your server's prefix, you may set it back to \`${prefix}\`.`;
  aliases: string[] = [];
  args: boolean = true;
  usage: string = "[new prefix]";
  example: string = ">>";
  cooldown: number = 0;
  category: string = "general";
  guildOnly: boolean = false;
  execute = (message: Message, args: string[]): void => {
    const guildId = message.guild.id;
    const newPrefix = args[0];

    const query = { guildId: guildId };
    const update = { prefix: newPrefix };
    // const options = { returnNewDocument: true };

    if (prefix === newPrefix) {
      GuildModel.deleteOne(query)
        .then(() => {
          delete this.client.prefixes[guildId];
          return message.channel.send(
            `Successfully reset server prefix to be **${prefix}**!`
          );
        })
        .catch((err) =>
          message.channel.send(
            `${message.author} Failed to find and reset prefix ${err}`
          )
        );
    }

    GuildModel.findOneAndUpdate(query, update)
      .then((updatedDocument) => {
        if (updatedDocument) {
          message.channel.send(
            `Successfully updated server prefix to be **${newPrefix}**!`
          );
          this.client.prefixes[guildId] = newPrefix;
        } else {
          const newGuild = new GuildModel({ guildId, prefix: newPrefix });
          newGuild
            .save()
            .then(() => {
              message.channel.send(
                `Added server prefix to be **${newPrefix}**`
              );
              this.client.prefixes[guildId] = newPrefix;
            })
            .catch((err) => message.channel.send(`Error: ${err}`));
        }
      })
      .catch((err) =>
        message.channel.send(
          `${message.author} Failed to find and add/update prefix ${err}`
        )
      );
  };
}
