import { clientName, profilePicture, githubLink } from "../../../config.json";
import { heroNames as aliasToHeroName } from "../../assets/heroNames";
import { Command } from "../../types/Command";
import { IHero } from "../../types/interfaces/Bot";
import axios, { AxiosResponse } from "axios";
import cheerio from "cheerio";
import { Message, MessageEmbed } from "discord.js";

const information = `
Given the enemy hero names separated by commas, return the top counters by winrate and advantage.

Explanation of data:

**Winrate**
- The numbers suggest the enemy's average winrate against the hero
- Sorting by winrate suggests heroes that are in the meta

**Disadvantage**
- The numbers suggest the enemy's average disadvantage against the hero
- Sorting by disadvantage suggests heroes that generally counter the heros based on their abilities, but may not be the best in the current meta
`;

export default class Counter extends Command {
  name = "counter";
  visible = true;
  description = "Returns a list of top counters to given heroes";
  information: string = information;
  aliases: string[] = [];
  args = true;
  usage = "[enemy_1], [enemy_2] ...";
  example = "am, venge, lone druid";
  cooldown = 0;
  category = "dota";
  guildOnly = false;
  execute = async (message: Message, args: string[]): Promise<Message> => {
    // Trigger bot to start typing and record time message was received
    message.channel.startTyping();

    // Convert argument names into official names
    const enemies: string[] = [];
    const parsedArgs = args.join("").split(",");
    for (const name of parsedArgs) {
      const officialName = aliasToHeroName[name.trim().toLowerCase()];
      if (officialName) {
        enemies.push(officialName);
      } else {
        return this.stopTypingAndSend(
          message.channel,
          `Invalid hero name **${name}**.`
        );
      }
    }

    // Webscrape the data
    const promises = enemies.map((hero) => {
      const urlName = hero.replace("'", "").toLowerCase().replace(" ", "-");
      return axios.get(`https://www.dotabuff.com/heroes/${urlName}/counters`);
    });

    axios
      .all(promises)

      // Collect via webscraping
      .then(async (responses) => this.aggregateData(responses, enemies))

      // Format data and send it
      .then((counters) => this.sendEmbed(message, enemies, counters))

      // Handle errors
      .catch((error) => {
        this.stopTypingAndSend(message.channel, `There was an error: ${error}`);
      });
  };

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
        "body > div.container-outer.seemsgood > div.skin-container > div.container-inner.container-inner-content > div.content-inner > section:nth-child(4) > article > table > tbody > tr"
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
   * @param message the message to respond to
   * @param enemies the list of enemies given in the arguments
   * @param counters the list of data containing top counters
   * @returns promise to the message sent
   */
  private sendEmbed(
    message: Message,
    enemies: string[],
    counters: IHero[]
  ): Promise<Message> {
    // Boilerplate formatting
    const heroesEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle("Team Picker Help")
      .setAuthor(clientName, profilePicture, githubLink)
      .setTimestamp()
      .setFooter(
        `Source: Dotabuff | Total Processing Time: ${
          Date.now() - message.createdTimestamp
        } ms`,
        "https://pbs.twimg.com/profile_images/879332626414358528/eHLyVWo-_400x400.jpg"
      );

    // Description formatting
    heroesEmbed.setDescription(`Heroes good against **${enemies.join(", ")}**`);

    // Add heroes with good winrates against enemy
    const winCounters = counters
      .sort((a, b) => a.winrate - b.winrate)
      .slice(0, 5);
    this.addHeroes(heroesEmbed, winCounters, "winrate");

    // Add heroes with good advantage against enemy
    const advCounters = counters
      .sort((a, b) => b.disadvantage - a.disadvantage)
      .slice(0, 5);
    this.addHeroes(heroesEmbed, advCounters, "disadvantage");

    return this.stopTypingAndSend(message.channel, heroesEmbed);
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
    details["**\nDisadvantage**"] = `${counters
      .map((c) => c.disadvantage.toFixed(2))
      .join("%\n")}%`;
    details["**\nWin Rate**"] = `${counters
      .map((c) => c.winrate.toFixed(2))
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