import { Command } from "../../types/Command";
import { IMetaHeroData } from "../../types/interfaces/Bot";
import { SlashCommandBuilder } from "@discordjs/builders";
import axios from "axios";
import cheerio from "cheerio";
import {
  CommandInteraction,
  Message,
  MessageComponentInteraction,
  MessageEmbed,
} from "discord.js";

export default class Meta extends Command {
  name = "meta";
  visible = true;
  description = "Get the top heroes of the current meta";
  information =
    "Get the top heroes of the current meta. \
    By default it shows the top heroes in the Archon bracket, \
    however the bracket can be specified as an additional argument. \
    If you use the slash command, you can move through the different pages, \
    however the buttons are disabled after a minute.";
  aliases = [];
  args = false;
  usage = "[rank]";
  example = "ancient";
  cooldown = 0;
  category = "dota";
  guildOnly = false;
  data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .addStringOption((option) =>
      option
        .setName("rank")
        .setDescription("The ranked bracket to find the meta for")
    );
  execute = async (message: Message, args: string[]): Promise<Message> => {
    message.channel.sendTyping();
    const [metaEmbed, rank, results] = await this.meta(args);
    const sentMessage = await message.channel.send({ embeds: [metaEmbed] });
    if (
      !message.guild.me.permissions.has("MANAGE_MESSAGES") ||
      results === []
    ) {
      return;
    }
    let page = 0;
    await sentMessage.react("⬅️");
    await sentMessage.react("➡️");

    // Create collector
    const filter = (reaction, user) =>
      ["⬅️", "➡️"].includes(reaction.emoji.name) && !user.bot;
    const collector = sentMessage.createReactionCollector({
      filter,
      time: 60_000,
    });

    // Handle reaction logic
    collector.on("collect", (reaction, user) => {
      page =
        reaction.emoji.name === "⬅️"
          ? Math.max(0, page - 1)
          : Math.min(Math.floor(results.length / 10), page + 1);
      sentMessage.edit({
        embeds: [this.createEmbedWithData(rank, results, page)],
      });

      // Remove the user reactions
      reaction.users.remove(user.id);
    });
    collector.on("end", () => {
      sentMessage.reactions.removeAll();
    });
  };

  executeSlash = async (interaction: CommandInteraction): Promise<void> => {
    const commandArg = interaction.options.get("rank");
    const args = commandArg !== null ? [commandArg.value as string] : [];

    // Get the embed
    const [metaEmbed, rank, results] = await this.meta(args);

    // Create the row of buttons
    let row = this.createScrollButtonRow(false);

    // Create functionality for the buttons
    let page = 0;
    const collector = interaction.channel.createMessageComponentCollector({
      time: 60_000,
    });
    collector.on("collect", async (i: MessageComponentInteraction) => {
      switch (i.customId) {
        case "First":
          page = 0;
          break;
        case "Prev":
          page = Math.max(0, page - 1);
          break;
        case "Next":
          page = Math.min(Math.floor(results.length / 10), page + 1);
          break;
        case "Last":
          page = Math.floor(results.length / 10);
          break;
      }
      try {
        await i.update({
          embeds: [this.createEmbedWithData(rank, results, page)],
          components: [row],
        });
      } catch (error) {
        console.log(error);
      }
      return;
    });

    // Remove the buttons after a minute
    collector.on("end", () => {
      row = this.createScrollButtonRow(true);
      interaction.editReply({ embeds: [metaEmbed], components: [row] });
    });

    return await interaction.reply({ embeds: [metaEmbed], components: [row] });
  };

  /**
   * Finds data on the current meta at the archon rank by default, unless a
   * rank is specified in the args
   *
   * @param args user arguments
   * @returns the embed containing the meta data, the rank, and a list of
   *          winrates and pick rates of that rank
   */
  private async meta(
    args: string[]
  ): Promise<[MessageEmbed, string, IMetaHeroData[]]> {
    const rank = args.length === 0 ? "archon" : args[0];
    const rankCol = this.getRankCol(rank);
    if (rankCol === -1) {
      return [this.createColouredEmbed("Invalid rank"), rank, []];
    }

    const results: IMetaHeroData[] = [];
    let metaEmbed: MessageEmbed;
    await axios
      .get(
        "https://www.dotabuff.com/heroes/meta?view=played&metric=rating_bracket"
      )
      .then((response) => {
        const $ = cheerio.load(response.data);
        const table = $(
          "body > div.container-outer.seemsgood > div.skin-container > \
          div.container-inner.container-inner-content > div.content-inner > \
          section > footer > article > table > tbody > tr"
        );
        table.each((index, element) => {
          results.push({
            name: $(element).find("td:nth-child(2)").text(),
            pickRate: $(element).find(`td:nth-child(${rankCol})`).text(),
            winRate: $(element)
              .find(`td:nth-child(${rankCol + 1})`)
              .text(),
            index: 0,
            popularity: 0,
          });
        });
        return results;
      })
      .then((results) => {
        // Sort the results by pick rate to get their popularity
        results
          .sort((a, b) => parseFloat(b.pickRate) - parseFloat(a.pickRate))
          .forEach((result, index) => (result.popularity = index));

        // Sort the results by winrate and get the top 10
        results
          .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))
          .forEach((result, index) => (result.index = index));
        metaEmbed = this.createEmbedWithData(rank, results, 0);
      });
    return [metaEmbed, rank, results];
  }

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
          name: "Popularity",
          value: results
            .map(
              (result) =>
                `${result.popularity}${this.ordinalSuffix(result.popularity)}`
            )
            .join("\n") as string,
          inline: true,
        }
      )
      .setFooter(`Page ${page + 1}`);
  }

  /**
   * @param n the given number
   * @returns the ordinal suffix of the given number
   */
  private ordinalSuffix(n: number): string {
    const lastDigit = n % 10;
    switch (lastDigit) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }
}
