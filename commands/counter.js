const axios = require('axios');
const cheerio = require('cheerio');
const Discord = require('discord.js');
const aliasToHeroName = require('../assets/heroNames');

module.exports = {
  name: 'counter',
  description: 'Returns a list of top counters to given heroes',
  information: 'Given the enemy hero names seperated by commas, return the top 10 ideal and unideal picks for your team.',
  aliases: false,
  args: true,
  usage: '[enemy_1], [enemy_2] ...',
  cooldown: 2,
  category: 'dota',
  execute: counter
};

// Some constants for webscraping
const tableSelector = 'body > div.container-outer.seemsgood > div.skin-container > div.container-inner.container-inner-content > div.content-inner > section:nth-child(4) > article > table > tbody > tr';

// Database interaction has to be asynchronous, so making new async function
async function counter (message, args) {
  // Trigger bot to start typing and record time message was recieved
  const timeRecieved = Date.now();
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
  console.log(enemies);

  // Object to store data for each hero
  const heroes = {};

  // Webscrape the data
  const promises = enemies.map(hero => {
    const urlName = hero.replace("'", '').toLowerCase().replace(' ', '-');
    return axios.get(`https://www.dotabuff.com/heroes/${urlName}/counters`);
  });

  axios.all(promises)

    // Collect via webscraping
    .then(async responses => {
      for (const response of responses) {
        // Grab the data from the counters table
        const $ = await cheerio.load(response.data);
        const counterTable = $(tableSelector);

        // Extract data from each hero
        counterTable.each((index, element) => {
          // Data is in given in the form of a string
          const name = $(element).find('td.cell-xlarge').text();
          const disadvantage = $(element).find('td:nth-child(3)').text();
          const winrate = $(element).find('td:nth-child(4)').text();

          // Convert data into numbers and store them
          heroes[name] = {};
          heroes[name].name = name;
          heroes[name].disadvantage = parseFloat(disadvantage.slice(0, -1));
          heroes[name].winrate = parseFloat(winrate.slice(0, -1));
        });
      }
    })

    // Format data and send it
    .then(() => {
      // Convert data into an array
      const heroesArray = Object.values(heroes);

      // Remove heroes if they are in the enemy team
      const counters = heroesArray.filter(hero => !enemies.includes(hero.name));

      // Sort counters based on disadvantage
      sendEmbed(message, timeRecieved, enemies, counters);
    })
    .catch(error => {
      sendMessage(message.channel, `There was an error: ${error}`);
    });
}

// Find the number of allies and heroes in the argument
function parseArgs (args) {
  return args.join('').split(',');
}

// Format data and send an embed to channel with details
function sendEmbed (message, timeRecieved, enemies, counters) {
  // Boilerplate formatting
  const heroesEmbed = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Team picker help')
    .setAuthor(
      'Lonely Bot',
      'https://i.imgur.com/b0sTfNL.png',
      'https://github.com/Gy74S/Lonely-Bot'
    )
    .setTimestamp()
    .setFooter(
      `Total Processing Time: ${Date.now() - message.createdTimestamp} ms | Generating Time: ${Date.now() - timeRecieved} ms`
    );

  // Description formatting
  heroesEmbed.setDescription(`Heroes good against **${enemies.join(', ')}**`);

  // Ideal pick formatting
  addHeroes(heroesEmbed, counters, 'winrate', 5);
  addHeroes(heroesEmbed, counters, 'disadvantage', 5);
  // addHeroes(heroesEmbed, counters, 'disadvantage', 5);
  sendMessage(message.channel, heroesEmbed);
}

// Add fields to embed, given the hero details
function addHeroes (heroesEmbed, counters, sortMethod, displayCount) {
  // Sort the heroes
  let winCounters = [...counters].sort((a, b) => a[sortMethod] - b[sortMethod]);
  winCounters = winCounters.slice(0, 5);

  // Add details to embed
  const details = [];
  details[`Sorted by ${sortMethod}\n**Heroes**:`] = `**${winCounters.map(counter => counter.name).join('**\n**')}**`;
  details['**\nDisadvantage**:'] = `${winCounters.map(counter => counter.disadvantage).join('%\n')}%`;
  details['**\nWinrate**:'] = `${winCounters.map(counter => counter.winrate).join('%\n')}%`;
  for (const [key, value] of Object.entries(details)) {
    heroesEmbed.addFields({
      name: key,
      value: value,
      inline: true
    });
  }
}

// Stop typing message in chat and send the message
function sendMessage (channel, message) {
  channel.stopTyping();
  return channel.send(message);
}
