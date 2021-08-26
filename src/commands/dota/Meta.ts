import { Command } from "../../types/Command";
import { IMetaHeroData } from "../../types/interfaces/Bot";
import axios from "axios";
import cheerio from "cheerio";
import { Message, MessageEmbed } from "discord.js";

export default class Meta extends Command {
  name = "meta";
  visible = true;
  description = "Get the top heroes of the current meta";
  information = "";
  aliases = [""];
  args = false;
  usage = "[rank]";
  example = "ancient";
  cooldown = 0;
  category = "dota";
  guildOnly = false;
  execute = (message: Message, args: string[]): Promise<Message> => {
    message.channel.startTyping();

    const rank = args.length === 0 ? "archon" : args[0];
    const rankCol = this.getRankCol(rank);
    if (rankCol === -1) {
      return this.stopTypingAndSend(message.channel, "Invalid rank");
    }

    const results: IMetaHeroData[] = [];
    axios
      .get(
        "https://www.dotabuff.com/heroes/meta?view=played&metric=rating_bracket"
      )
      .then((response) => {
        const $ = cheerio.load(response.data);
        const table = $(
          "body > div.container-outer.seemsgood > div.skin-container > div.container-inner.container-inner-content > div.content-inner > section > footer > article > table > tbody > tr"
        );
        table.each((index, element) => {
          results.push({
            name: $(element).find("td:nth-child(2)").text(),
            pickRate: $(element).find(`td:nth-child(${rankCol})`).text(),
            winRate: $(element)
              .find(`td:nth-child(${rankCol + 1})`)
              .text(),
          });
        });
        return results;
      })
      .then((results) => {
        // Sort the results by winrate and get the top 10
        const sortedResults = results
          .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))
          .slice(0, 10);

        // Hero names
        const metaEmbed = new MessageEmbed()
          .setColor("0099ff")
          .setTitle("Meta")
          .addFields(
            {
              name: "Hero",
              value: sortedResults.map(
                (result) =>
                  `${sortedResults.indexOf(result) + 1}. **${result.name}**`
              ),
              inline: true,
            },
            {
              name: "Win Rate",
              value: sortedResults.map((result) => `${result.winRate}`),
              inline: true,
            },
            {
              name: "Pick Rate",
              value: sortedResults.map((result) => `${result.pickRate}`),
              inline: true,
            }
          );
        this.stopTypingAndSend(message.channel, metaEmbed);
      });
  };

  /**
   * Given a rank, give the rank's corresponding column in the table of the
   * scrapped dotabuff webpage
   *
   * @param rank the dota 2 rank tier
   * @returns the corresponding column
   */
  private getRankCol(rank: string): number {
    switch (rank) {
      case "herald":
      case "guardian":
      case "crusader":
        return 3;
      case "archon":
        return 5;
      case "legend":
        return 7;
      case "ancient":
        return 9;
      case "divine":
      case "immortal":
        return 11;
    }
    return -1;
  }
}
