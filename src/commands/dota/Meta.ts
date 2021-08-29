import { Command } from "../../types/Command";
import { IMetaHeroData } from "../../types/interfaces/Bot";
import axios from "axios";
import cheerio from "cheerio";
import { Message, MessageEmbed } from "discord.js";

export default class Meta extends Command {
  name = "meta";
  visible = true;
  description = "Get the top heroes of the current meta";
  information =
    "Get the top heroes of the current meta. By default it shows the top heroes in the Archon bracket, however the bracket can be specified as an additional argument.";
  aliases = [];
  args = false;
  usage = "[rank]";
  example = "ancient";
  cooldown = 0;
  category = "dota";
  guildOnly = false;
  execute = (message: Message, args: string[]): Promise<Message> => {
    message.channel.sendTyping();

    const rank = args.length === 0 ? "archon" : args[0];
    const rankCol = this.getRankCol(rank);
    if (rankCol === -1) {
      return this.createAndSendEmbed(message.channel, "Invalid rank");
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
            index: 0,
          });
        });
        return results;
      })
      .then((results) => {
        // Sort the results by winrate and get the top 10
        results
          .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))
          .forEach((result, index) => (result.index = index));
        const metaEmbed = this.createEmbedWithData(rank, results, 0);
        return message.channel.send({ embeds: [metaEmbed] });
      })
      .then(async (sentEmbed) => {
        if (!message.guild.me.permissions.has("MANAGE_MESSAGES")) {
          return;
        }
        let page = 0;
        await sentEmbed.react("⬅️");
        await sentEmbed.react("➡️");

        // Create collector
        const filter = (reaction, user) =>
          ["⬅️", "➡️"].includes(reaction.emoji.name) && !user.bot;
        const collector = sentEmbed.createReactionCollector({
          filter,
          time: 60_000,
        });

        // Handle reaction logic
        collector.on("collect", (reaction, user) => {
          page =
            reaction.emoji.name === "⬅️"
              ? Math.max(0, page - 1)
              : Math.min(Math.ceil(results.length / 10), page + 1);
          sentEmbed.edit({
            embeds: [this.createEmbedWithData(rank, results, page)],
          });

          // Remove the user reactions
          reaction.users.remove(user.id);
        });
        collector.on("end", () => {
          sentEmbed.reactions.removeAll();
        });
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

  /**
   * Create a coloured embed and populate it with given data
   *
   * @param rank the rank of the meta
   * @param results the list of heroes and their meta data
   * @param page the current page of the list
   * @returns the new embed with the data
   */
  private createEmbedWithData(
    rank: string,
    results: IMetaHeroData[],
    page: number
  ): MessageEmbed {
    const [start, end] = [page * 10, (page + 1) * 10];

    results = results.slice(start, end);

    return this.createColouredEmbed()
      .setTitle("Meta")
      .setDescription(
        `Sorted by winrate in **${
          rank.charAt(0).toUpperCase() + rank.slice(1)
        }** games`
      )
      .addFields(
        {
          name: "Hero",
          value: results
            .map((result) => `${result.index + 1}. **${result.name}**`)
            .join("\n") as string,
          inline: true,
        },
        {
          name: "Win Rate",
          value: results
            .map((result) => `${result.winRate}`)
            .join("\n") as string,
          inline: true,
        },
        {
          name: "Pick Rate",
          value: results
            .map((result) => `${result.pickRate}`)
            .join("\n") as string,
          inline: true,
        }
      )
      .setFooter(`Page ${page + 1}`);
  }
}
