import { Command } from "../../Command";
import { heroNames as aliasToHeroName } from "../../assets/heroNames";
import { Hero } from "../../interfaces/Bot";
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

**Disadvantage**
- The numbers suggest the hero's average advantage against the enemies
- Sorting by disadvantage suggests heroes that generally counter the heros based on their abilities, but may not be the best in the current meta
`;

type CounterMethod = "Win Rate" | "Disadvantage";

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
    )
    .addStringOption((option) =>
      option
        .setName("method")
        .setDescription("How the hero counters the enemies")
        .setRequired(false)
        .addChoices([
          ["Win Rate", "Win Rate"],
          ["Disadvantage", "Disadvantage"],
        ])
    );
  execute = async (message: Message, args: string[]): Promise<Message> => {
    message.channel.sendTyping();
    try {
      const [enemies, counters] = await this.counter(args);
      const counterEmbed = this.generateEmbed(enemies, counters);
      return message.channel.send({ embeds: [counterEmbed] });
    } catch (error) {
      return this.createAndSendEmbed(error.message);
    }
  };
  executeSlash = async (interaction: CommandInteraction): Promise<void> => {
    const argHeroes = [interaction.options.get("enemies").value as string];
    const counterMethodArg = interaction.options.get("method");
    const counterMethod = (
      counterMethodArg ? counterMethodArg.value : "Win Rate"
    ) as CounterMethod;
    const page = 0;
    try {
      const [enemies, counters] = await this.counter(argHeroes);
      const maxPages = Math.floor(counters.length / 10);
      const row = this.createActiveScrollBar(
        interaction,
        maxPages,
        this,
        this.generateEmbed,
        [enemies, counters, counterMethod]
      );
      const counterEmbed = this.generateEmbed(
        enemies,
        counters,
        counterMethod,
        page
      );
      return interaction.reply({ embeds: [counterEmbed], components: [row] });
    } catch (error) {
      return interaction.reply({
        embeds: [this.createColouredEmbed(error.message)],
      });
    }
  };

  /**
   * Extract out the enemies hero names, webscrape data about their matches and
   * then return an embed containing the relevant counters
   *
   * @param argHeroes a list of the enemy heroes input by the user
   * @returns an embed containing data about the top counters
   */
  private async counter(argHeroes: string[]): Promise<[string[], Hero[]]> {
    const enemies: string[] = [];
    for (const name of argHeroes.join("").split(",")) {
      const parsedName = name.replace(/ /g, "").toLowerCase();
      if (parsedName in aliasToHeroName) {
        enemies.push(aliasToHeroName[parsedName]);
      } else {
        throw Error(`Invalid hero name **${name}**.`);
      }
    }

    // Webscrape the data
    const promises = enemies.map((hero) => {
      const urlName = hero.replace("'", "").replace(" ", "-").toLowerCase();
      return axios.get(`https://www.dotabuff.com/heroes/${urlName}/counters`);
    });

    const counterResponses = await axios.all(promises);
    const counters = await this.aggregateData(counterResponses, enemies);
    return [enemies, counters];
  }

  /**
   * Collect all relevant data from webscraping
   *
   * @param responses the fetched webpages
   * @param enemies a list of the names of the enemy heroes to counter
   * @returns a list of data about the top counters to each enemy
   */
  private async aggregateData(
    responses: AxiosResponse[],
    enemies: string[]
  ): Promise<Hero[]> {
    const heroes: Record<string, Hero> = {};

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
      counterTable.each((_, row) => {
        // Data is in given in the form of a string
        const name = $(row).find("td.cell-xlarge").text();
        const disadvantage = parseFloat($(row).find("td:nth-child(3)").text());
        const winrate = parseFloat($(row).find("td:nth-child(4)").text());

        // Convert data into numbers and store them
        if (name in heroes) {
          heroes[name].disadvantage += disadvantage;
          heroes[name].winrate += winrate;
          heroes[name].count++;
        } else {
          heroes[name] = { name, disadvantage, winrate, count: 1 };
        }
      });
    }

    // Find the average winrate and disadvantage
    Object.values(heroes).forEach((hero) => {
      hero.winrate /= hero.count;
      hero.disadvantage /= hero.count;
    });
    return Object.values(heroes).filter((hero) => !enemies.includes(hero.name));
  }

  /**
   * Format data and send an embed to channel with details
   *
   * @param enemies the list of enemies given in the arguments
   * @param counters the list of data containing top counters
   * @param counterMethod how the hero gets countered ("Win Rate" | "Disadvantage")
   * @param page the page of counters to show
   * @returns promise to the message sent
   */
  protected generateEmbed(
    enemies: string[],
    counters: Hero[],
    counterMethod: CounterMethod = "Win Rate",
    page = 0
  ): MessageEmbed {
    // Boilerplate formatting
    const heroesEmbed = this.createColouredEmbed()
      .setTitle("Team Picker Help")
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
    const typeKey = counterMethod.replace(/ /g, "").toLocaleLowerCase();
    this.addHeroesToEmbed(
      heroesEmbed,
      counters.sort((a, b) => {
        return typeKey === "disadvantage"
          ? b[typeKey] - a[typeKey]
          : a[typeKey] - b[typeKey];
      }),
      page,
      counterMethod
    );
    return heroesEmbed;
  }

  /**
   * Add fields to embed, given the hero details
   *
   * @param heroesEmbed the message embed to send
   * @param counters a list of data for the top counters
   * @param counterMethod the name of the field of how the counters were sorted
   * @param page the page / section of the heroes list to include
   */
  private addHeroesToEmbed(
    heroesEmbed: MessageEmbed,
    counters: Hero[],
    page: number,
    counterMethod: CounterMethod
  ): void {
    const details: Record<string, string> = {};
    const baseIndex = page * 10;
    const pageCounters = counters.slice(baseIndex, baseIndex + 10);
    let heroes = "";
    pageCounters.forEach(
      (c, i) => (heroes += `${baseIndex + i + 1}: **${c.name}**\n`)
    );
    details[`**__Sorted by ${counterMethod}__\nHeroes**`] = heroes;
    details["**\nAdvantage**"] = `${pageCounters
      .map((c) => c.disadvantage.toFixed(2))
      .join("%\n")}%`;
    details["**\nWin Rate**"] = `${pageCounters
      .map((c) => (100 - c.winrate).toFixed(2))
      .join("%\n")}%`;
    for (const [name, value] of Object.entries(details)) {
      heroesEmbed.addField(name, value, true);
    }
  }
}
