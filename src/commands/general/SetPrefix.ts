import { prefix } from "../../../config.json";
import { GuildModel } from "../../database/Guild";
import { Command } from "../../types/Command";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";

export default class SetPrefix extends Command {
  name = "setprefix";
  visible = true;
  description = "Change the prefix of the bot for the current server";
  information = `
    Change the prefix of the bot for the current server. \
    If you would like to remove your server's prefix, you may set it back to \`${prefix}\`.
  `;
  aliases = [];
  args = true;
  usage = "[new prefix]";
  example = ">>";
  cooldown = 0;
  category = "general";
  guildOnly = false;
  data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .addStringOption((option) =>
      option
        .setName("prefix")
        .setDescription("The new prefix of the bot for the current server")
    );
  execute = (message: Message, args: string[]): Promise<Message> => {
    const guildId = message.guild.id;
    const newPrefix = args[0];
    return message.channel.send({
      embeds: [this.setPrefix(guildId, newPrefix)],
    });
  };
  executeSlash = (interaction: CommandInteraction): Promise<void> => {
    const guildId = interaction.guild.id;
    const newPrefix = interaction.options.getString("prefix");
    return interaction.reply({ embeds: [this.setPrefix(guildId, newPrefix)] });
  };

  /**
   * Given the serve and the new prefix, update the server's prefix to be the
   * new prefix in the database and client's cache.
   *
   * @param guildId the id of the server we want to change the prefix for
   * @param newPrefix the new prefix
   * @returns a message embed saying whether it was successful or not
   */
  private setPrefix(guildId: string, newPrefix: string): MessageEmbed {
    const query = { guildId: guildId };
    const update = { prefix: newPrefix };
    let successful = false;

    if (prefix === newPrefix) {
      GuildModel.deleteOne(query).then(() => {
        delete this.client.prefixes[guildId];
        successful = true;
      });
    } else {
      GuildModel.findOneAndUpdate(query, update).then((updatedDocument) => {
        if (updatedDocument) {
          this.client.prefixes[guildId] = newPrefix;
          successful = true;
        } else {
          const newGuild = new GuildModel({ guildId, prefix: newPrefix });
          newGuild.save().then(() => {
            this.client.prefixes[guildId] = newPrefix;
            successful = true;
          });
        }
      });
    }
    const description = successful
      ? `Set new prefix to **${newPrefix}**`
      : `There was an error setting prefix to **${newPrefix}**`;
    return this.createColouredEmbed(description);
  }
}
