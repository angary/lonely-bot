import { clientName, profilePicture, githubLink } from "../../../config.json";
import { heroNames as aliasToHeroName } from "../../assets/heroNames";
import { Command } from "../../types/Command";
import { IHero } from "../../types/interfaces/Bot";
import { SlashCommandBuilder } from "@discordjs/builders";
import axios, { AxiosResponse } from "axios";
import cheerio from "cheerio";
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
    const counterEmbed = await this.counter(args);
    return message.channel.send({ embeds: [counterEmbed] });
  };
  executeSlash = async (interaction: CommandInteraction): Promise<void> => {
    const args = [interaction.options.get("enemies").value as string];
    const counterEmbed = await this.counter(args);
    return interaction.reply({ embeds: [counterEmbed] });
  };

  /**
   * Extract out the enemies hero names, webscrape data about their matches and
   * then return an embed containing the relevant counters
   *
   * @param args a list of the enemy heroes input by the user
   * @returns an embed containing data about the top counters
   */
  private async counter(args: string[]) {
    const enemies: string[] = [];
    const parsedArgs = args.join("").split(",");
    for (const name of parsedArgs) {
      const officialName = aliasToHeroName[name.trim().toLowerCase()];
      if (officialName) {
        enemies.push(officialName);
      } else {
        return this.createColouredEmbed(`Invalid hero name **${name}**.`);
      }
    }

    // Webscrape the data
    const promises = enemies.map((hero) => {
      const urlName = hero.replace("'", "").toLowerCase().replace(" ", "-");
      return axios.get(`https://www.dotabuff.com/heroes/${urlName}/counters`);
    });

    let counterEmbed: MessageEmbed;
    await axios
      .all(promises)

      // Collect via webscraping
      .then(async (responses) => this.aggregateData(responses, enemies))

      // Format data onto the counter embed
      .then((counters) => (counterEmbed = this.getEmbed(enemies, counters)));
    return counterEmbed;
  }
  /**
   * Collect all relevant data from webscraping
   *
   * @param responses the fetched webpages
   * @param enemies a list of the enemy names
   * @returns a list of data about the top counters to each enemy
   */
  private async aggregateData(
    responses: AxiosResponse[],
    enemies: string[]
  ): Promise<IHero[]> {
    const heroes: Record<string, IHero> = {};

    // Extra data from each hero counter request
    for (const response of responses) {
      // Grab the data from the counters table
      const $ = cheerio.load(response.data);
      const counterTable = $(
        "body > div.container-outer.seemsgood > div.skin-container > \
        div.container-inner.container-inner-content > div.content-inner > \
        section:nth-child(4) > article > table > tbody > tr"
      );

      // Extract data from each hero
      counterTable.each((index, element) => {
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
    for (const key in heroes) {
      const count = heroes[key].count;
      heroes[key].winrate /= count;
      heroes[key].disadvantage /= count;
    }

    // Convert object into array and remove heroes if they are in enemy team
    return Object.values(heroes).filter(
      (hero: IHero) => !enemies.includes(hero.name)
    );
  }

  /**
   * Format data and send an embed to channel with details
   *
   * @param enemies the list of enemies given in the arguments
   * @param counters the list of data containing top counters
   * @returns promise to the message sent
   */
  private getEmbed(enemies: string[], counters: IHero[]): MessageEmbed {
    // Boilerplate formatting
    const heroesEmbed = this.createColouredEmbed()
      .setTitle("Team Picker Help")
      .setAuthor(clientName, profilePicture, githubLink)
      .setTimestamp()
      .setFooter(
        "Source: Dotabuff",
        "https://pbs.twimg.com/profile_images/879332626414358528/eHLyVWo-_400x400.jpg"
      );

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
    this.addHeroes(heroesEmbed, winCounters, "Win Rate");

    // Add heroes with good advantage against enemy
    const advCounters = counters
      .sort((a, b) => b.disadvantage - a.disadvantage)
      .slice(0, 5);
    this.addHeroes(heroesEmbed, advCounters, "Advantage");

    return heroesEmbed;
  }

  /**
   * Add fields to embed, given the hero details
   *
   * @param heroesEmbed the message embed to send
   * @param counters a list of data for the top counters
   * @param sortMethod the name of the field of how the counters were sorted
   */
  private addHeroes(
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
