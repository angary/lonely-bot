import { UserModel } from "../../database/User";
import { Command } from "../../types/Command";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Message, MessageEmbed, User } from "discord.js";

export default class SteamId extends Command {
  name = "steamid";
  visible = true;
  description = "Stores or update your Steam ID";
  information =
    "Stores or updates your steam ID (it should consist of only numbers and be the number that you see as your steam friend id). \
    Once your steam ID is saved, you do not need to type your steamID when you use the opendota command. \
    To remove your steamID info from the database, use `steamid 0`. \
    If no argument is provided, then it returns your Steam ID if it's stored.";
  aliases = [];
  args = false;
  usage = "[Steam32 ID]";
  example = "193480093";
  cooldown = 0;
  category = "dota";
  guildOnly = false;
  data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .addStringOption((option) =>
      option.setName("steamid").setDescription("Your steam id")
    );
  execute = async (message: Message, args: string[]): Promise<Message> => {
    message.channel.sendTyping();
    const steamIdEmbed = await this.steamId(message.author, args);
    return message.channel.send({ embeds: [steamIdEmbed] });
  };

  executeSlash = async (interaction: CommandInteraction): Promise<void> => {
    const commandArg = interaction.options.get("steamid");
    const args = commandArg !== null ? [commandArg.value as string] : [];
    const steamIdEmbed = await this.steamId(interaction.user, args);
    return interaction.reply({ embeds: [steamIdEmbed] });
  };

  /**
   * Extract their steam id from the database or set it to a new value
   *
   * @param author the user who triggered the command
   * @param args the args of the user
   * @returns an embed containing the status of the steam id update or their
   *          current steam id
   */
  private async steamId(author: User, args: string[]): Promise<MessageEmbed> {
    const discordID = author.id;
    const query = { discordID: discordID };
    if (args.length === 0) {
      const result = await UserModel.findOne(query);
      if (result) {
        return this.createColouredEmbed(
          `Your saved Steam ID is **${result.steamID}**`
        );
      } else {
        return this.createColouredEmbed(
          "You do not have a Steam ID stored in the database"
        );
      }
    }

    const steamID = args[0];
    const update = { steamID: steamID };

    // Remove steamID from the database
    if (steamID === "0") {
      await UserModel.deleteMany(query);
      return this.createColouredEmbed(
        "Successfully removed steamID from database"
      );
    }

    // Basic check if the steamID is valid
    if (args.length !== 0 && isNaN(parseInt(steamID))) {
      return this.createColouredEmbed(
        "Invalid steamID, it should only consist of numbers"
      );
    }

    // Update the steamID in the database
    const updatedDocument = await UserModel.findOneAndUpdate(query, update);
    if (updatedDocument) {
      return this.createColouredEmbed(
        `Successfully updated Steam ID to be **${steamID}**`
      );
    } else {
      const newUser = new UserModel({ discordID, steamID });
      await newUser.save();
      return this.createColouredEmbed(`Added Steam ID to be **${steamID}**`);
    }
  }
}
