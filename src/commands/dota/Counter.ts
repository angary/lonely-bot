import { heroNames as aliasToHeroName } from "../../assets/heroNames";
import { Command } from "../../types/Command";
import { IHero } from "../../types/interfaces/Bot";
import { SlashCommandBuilder } from "@discordjs/builders";
import axios, { AxiosResponse } from "axios";
import { load } from "cheerio";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";

const information = `
Given the enemy hero names separated by commas, return the top counters by winrate and advantage.

Explanation of data:

**Win Rate**
- The numbers suggest the hero's average winrate against the enemies
- Sorting by winrate suggests heroes that are in the meta

**Advantage**
- The numbers suggest the hero's average advantage against the enemies
- Sorting by disadvantage suggests heroes that generally counter the heros based on their abilities, but may not be the best in the current meta
`;

export default class Counter extends Command {
  name = "counter";
  visible = true;
  description = "Returns a list of top counters to given heroes";
  information = information;
  aliases = [];
  args = true;
  usage = "[enemy_1], [enemy_2] ...";
  example = "am, venge, lone druid";
  cooldown = 0;
  category = "dota";
  guildOnly = false;
  data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .addStringOption((option) =>
      option
        .setName("enemies")
        .setDescription("A list of the enemy's heroes")
        .setRequired(true)
    );
  execute = async (message: Message, args: string[]): Promise<Message> => {
    message.channel.sendTyping();
    try {
      const [enemies, counters] = await this.counter(args);
      const counterEmbed = this.generateEmbed(enemies, counters);
      return message.channel.send({ embeds: [counterEmbed] });
    } catch (error) {
      return this.createAndSendEmbed(error);
    }
  };
  executeSlash = async (interaction: CommandInteraction): Promise<void> => {
    const args = [interaction.options.get("enemies").value as string];
    // TODO: Handle scrolling through counters
    try {
      const [enemies, counters] = await this.counter(args);
      const counterEmbed = this.generateEmbed(enemies, counters);
      return interaction.reply({ embeds: [counterEmbed] });
    } catch (error) {
      return interaction.reply({ embeds: [this.createColouredEmbed(error)] });
    }
  };

  /**
   * Extract out the enemies hero names, webscrape data about their matches and
   * then return an embed containing the relevant counters
   *
   * @param args a list of the enemy heroes input by the user
   * @returns an embed containing data about the top counters
   */
  private async counter(args: string[]): Promise<[string[], IHero[]]> {
    const parsedArgs = args.join("").split(",");
    const enemies: string[] = [];
    for (const name of parsedArgs) {
      const officialName =
        aliasToHeroName[name.replace(/ /g, "").toLowerCase()];
      if (officialName) {
        enemies.push(officialName);
      } else {
        throw `Invalid hero name **${name}**.`;
      }
    }

    // Webscrape the data
    const promises = enemies.map((hero) => {
      const urlName = hero.replace("'", "").toLowerCase().replace(" ", "-");
      return axios.get(`https://www.dotabuff.com/heroes/${urlName}/counters`);
    });

    const counterResponses = await axios.all(promises);
    const counters = await this.aggregateData(counterResponses);
    return [enemies, counters];
  }

  /**
   * Collect all relevant data from webscraping
   *
   * @param responses the fetched webpages
   * @returns a list of data about the top counters to each enemy
   */
  private async aggregateData(responses: AxiosResponse[]): Promise<IHero[]> {
    const heroes: Record<string, IHero> = {};

    // Extra data from each hero counter request
    for (const response of responses) {
      // Grab the data from the counters table
      const $ = load(response.data);
      const counterTable = $(
        "body > div.container-outer.seemsgood > div.skin-container > \
        div.container-inner.container-inner-content > div.content-inner > \
        section:nth-child(4) > article > table > tbody > tr"
      );

      // Extract data from each hero
      counterTable.each((_, element) => {
        // Data is in given in the form of a string
        const name = $(element).find("td.cell-xlarge").text();
        const disadvantage = $(element).find("td:nth-child(3)").text();
        const winrate = $(element).find("td:nth-child(4)").text();

        // Convert data into numbers and store them
        if (name in heroes) {
          // If hero exists in object, then increase stats
          heroes[name].disadvantage += parseFloat(disadvantage.slice(0, -1));
          heroes[name].winrate += parseFloat(winrate.slice(0, -1));
          heroes[name].count += 1;
        } else {
          // Else if hero doesn't exist in object, initialise data
          heroes[name] = {
            name: name,
            disadvantage: parseFloat(disadvantage.slice(0, -1)),
            winrate: parseFloat(winrate.slice(0, -1)),
            count: 1,
          };
        }
      });
    }

    // Find the average winrate and disadvantage
    Object.values(heroes).forEach((hero) => {
      hero.winrate /= hero.count;
      hero.disadvantage /= hero.count;
    });
    return Object.values(heroes);
  }

  /**
   * Format data and send an embed to channel with details
   *
   * @param enemies the list of enemies given in the arguments
   * @param counters the list of data containing top counters
   * @returns promise to the message sent
   */
  private generateEmbed(enemies: string[], counters: IHero[]): MessageEmbed {
    // Boilerplate formatting
    const heroesEmbed = this.createColouredEmbed()
      .setTitle("Team Picker Help")
      // .setAuthor(clientName, profilePicture, githubLink) // TODO: setAuthor deprecated
      .setTimestamp()
      .setFooter({
        text: "Source: Dotabuff",
        iconURL:
          "https://pbs.twimg.com/profile_images/879332626414358528/eHLyVWo-_400x400.jpg",
      });

    // Description formatting
    heroesEmbed.setDescription(
      `Heroes good against **${enemies.join(", ")}**\n
      High **win rate** heroes are good in the current meta
      High **advantage** heroes are natural counters`
    );

    // Add heroes with good winrates against enemy
    const winCounters = counters
      .sort((a, b) => a.winrate - b.winrate)
      .slice(0, 5);
    this.addHeroesToEmbed(heroesEmbed, winCounters, "Win Rate");

    // Add heroes with good advantage against enemy
    const advCounters = counters
      .sort((a, b) => b.disadvantage - a.disadvantage)
      .slice(0, 5);
    this.addHeroesToEmbed(heroesEmbed, advCounters, "Advantage");

    return heroesEmbed;
  }

  /**
   * Add fields to embed, given the hero details
   *
   * @param heroesEmbed the message embed to send
   * @param counters a list of data for the top counters
   * @param sortMethod the name of the field of how the counters were sorted
   */
  private addHeroesToEmbed(
    heroesEmbed: MessageEmbed,
    counters: IHero[],
    sortMethod: string
  ): void {
    // Add details to embed
    const details = [];
    let heroes = "";
    counters.forEach((element, index) => {
      heroes += `${index + 1}: **${element.name}**\n`;
    });
    details[`**__Sorted by ${sortMethod}__\nHeroes**`] = heroes;
    details["**\nAdvantage**"] = `${counters
      .map((c) => c.disadvantage.toFixed(2))
      .join("%\n")}%`;
    details["**\nWin Rate**"] = `${counters
      .map((c) => (100 - c.winrate).toFixed(2))
      .join("%\n")}%`;
    for (const [key, value] of Object.entries(details)) {
      heroesEmbed.addFields({
        name: key,
        value: value,
        inline: true,
      });
    }
  }
}
