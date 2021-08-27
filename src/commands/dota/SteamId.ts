import { UserModel } from "../../database/User";
import { Command } from "../../types/Command";
import { Message } from "discord.js";

export default class SteamId extends Command {
  name = "steamid";
  visible = true;
  description = "Stores or update your Steam ID";
  information =
    "Stores or updates your steam ID (it should consist of only numbers and be the number that you see as your steam friend id or in your steam URL, or the number at the end of your dotabuff/ opendota URL). Once your steam ID is saved, you do not need to type your steamID the next time you use the opendota command. If you would like to remove your steamID info from the database, you can use `steamid 0`. IF no argument is provided, then it returns your Steam ID if you've stored it in the database";
  aliases: string[] = [];
  args = false;
  usage = "[Steam32 ID]";
  example = "193480093";
  cooldown = 0;
  category = "dota";
  guildOnly = false;
  execute = (message: Message, args: string[]): Promise<Message> => {
    message.channel.sendTyping();

    const discordID = message.author.id;
    const query = { discordID: discordID };
    if (args.length === 0) {
      UserModel.findOne(query).then((result) => {
        if (result) {
          this.createAndSendEmbed(
            message.channel,
            `${message.author} Your saved Steam ID is **${result.steamID}**`
          );
        } else {
          this.createAndSendEmbed(
            message.channel,
            `${message.author} You do not have a Steam ID stored in the database`
          );
        }
      });
      return;
    }

    const steamID = args[0];
    const update = { steamID: steamID };

    // Remove steamID from the database
    if (steamID === "0") {
      UserModel.deleteMany(query)
        .then(() => {
          this.createAndSendEmbed(
            message.channel,
            `${message.author} Successfully removed steamID from database!`
          );
        })
        .catch((err) =>
          this.createAndSendEmbed(
            message.channel,
            `${message.author} Failed to find and remove steamID ${err}`
          )
        );
      return;
    }

    // Basic check if the steamID is valid
    if (args.length !== 0 && isNaN(parseInt(steamID))) {
      return this.createAndSendEmbed(
        message.channel,
        `${message.author} Invalid steamID. It should only consist of numbers.`
      );
    }

    // Update the steamID in the database
    UserModel.findOneAndUpdate(query, update)
      .then((updatedDocument) => {
        if (updatedDocument) {
          this.createAndSendEmbed(
            message.channel,
            `${message.author} Successfully updated Steam ID to be **${steamID}**!`
          );
        } else {
          const newUser = new UserModel({ discordID, steamID });
          newUser
            .save()
            .then(() => {
              this.createAndSendEmbed(
                message.channel,
                `${message.author} Added Steam ID to be **${steamID}**.`
              );
            })
            .catch((err) => message.channel.send("Error: " + err));
        }
      })
      .catch((err) =>
        this.createAndSendEmbed(
          message.channel,
          `${message.author} Failed to find and add/ update ID. ${err}`
        )
      );
  };
}
