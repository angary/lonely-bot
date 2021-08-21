import axios from "axios";
import cheerio from "cheerio";
import { Message, MessageEmbed } from "discord.js";
import { clientName, profilePicture, githubLink } from "../../config.json";
import { heroNames as aliasToHeroName } from "../../assets/heroNames";
import { IBot, ICommand, IHero } from "../../interfaces/Bot";

export default class Counter implements ICommand {
  name: string = "counter";
  description: string = "Returns a list of top counters to given heroes";
  information: string = information;
  aliases: string[] = [];
  args: boolean = true;
  usage: string = "[enemy_1], [enemy_2] ...";
  example: string = "am, venge, lone druid";
  cooldown: number = 0;
  category: string = "dota";
  guildOnly: boolean = false;
  execute: (message: Message, args: string[], client: IBot) => Promise<void> =
    counter;
}

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

// Some constants for webscraping
const tableSelector =
  "body > div.container-outer.seemsgood > div.skin-container > div.container-inner.container-inner-content > div.content-inner > section:nth-child(4) > article > table > tbody > tr";

// Database interaction has to be asynchronous, so making new async function
async function counter(
  message: Message,
  args: string[],
  client: IBot
): Promise<void> {
  // Trigger bot to start typing and record time message was received
  message.channel.startTyping();

  // Convert argument names into official names
  const enemies = [];
  for (const name of parseArgs(args)) {
    const officialName = aliasToHeroName[name.trim().toLowerCase()];
    if (officialName) {
      enemies.push(officialName);
    } else {
      return sendMessage(message.channel, `Invalid hero name **${name}**.`);
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
    .then(async (responses) => aggregateData(responses, enemies))

    // Format data and send it
    .then((counters) => sendEmbed(message, enemies, counters))

    // Handle errors
    .catch((error) => {
      sendMessage(message.channel, `There was an error: ${error}`);
    });
}

// Find the number of allies and heroes in the argument
function parseArgs(args) {
  return args.join("").split(",");
}

// Collect all relevant data from webscraping
async function aggregateData(responses, enemies) {
  const heroes: Record<string, IHero> = {};

  // Extra data from each hero counter request
  for (const response of responses) {
    // Grab the data from the counters table
    const $ = await cheerio.load(response.data);
    const counterTable = $(tableSelector);

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
        heroes[name];
        heroes[name].name = name;
        heroes[name].disadvantage = parseFloat(disadvantage.slice(0, -1));
        heroes[name].winrate = parseFloat(winrate.slice(0, -1));
        heroes[name].count = 1;
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
  return Object.values(heroes).filter((hero) => !enemies.includes(hero.name));
}

// Format data and send an embed to channel with details
function sendEmbed(message, enemies, counters) {
  // Boilerplate formatting
  const heroesEmbed = new MessageEmbed()
    .setColor("#0099ff")
    .setTitle("Team picker help")
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
  addHeroes(heroesEmbed, winCounters, "winrate");

  // Add heroes with good advantage against enemy
  const advCounters = counters
    .sort((a, b) => b.disadvantage - a.disadvantage)
    .slice(0, 5);
  addHeroes(heroesEmbed, advCounters, "disadvantage");

  sendMessage(message.channel, heroesEmbed);
}

// Add fields to embed, given the hero details
function addHeroes(heroesEmbed, counters, sortMethod) {
  // Add details to embed
  const details = [];
  let heroes = "";
  counters.forEach((element, index) => {
    heroes += `${index + 1}: **${element.name}**\n`;
  });
  details[`**__Sorted by ${sortMethod}__\nHeroes**:`] = heroes;
  details["**\nDisadvantage**:"] = `${counters
    .map((c) => c.disadvantage.toFixed(2))
    .join("%\n")}%`;
  details["**\nWinrate**:"] = `${counters
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

// Stop typing message in chat and send the message
function sendMessage(channel, message) {
  channel.stopTyping();
  return channel.send(message);
}
