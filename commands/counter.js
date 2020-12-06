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
      enemies.push(officialName.toLowerCase().replace(' ', '-'));
    } else {
      return sendMessage(message.channel, `Invalid name ${name}.`);
    }
  }

  // Object to store data for each hero
  const heroes = {};

  // Webscrape the data
  const promises = enemies.map(hero => axios.get(`https://www.dotabuff.com/heroes/${hero}/counters`));
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
      console.log(enemies);
      const counters = heroesArray.filter(hero => !enemies.includes(hero.name.toLowerCase().replace(' ', '-')));

      // Sort counters based on disadvantage
      counters.sort((a, b) => b.disadvantage - a.disadvantage);
      sendEmbed(message, timeRecieved, enemies, counters);
    })
    .catch(err => console.log(err));
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
  let heroes = '';
  let disadvantages = '';
  let winrates = '';
  for (let i = 0; i < 10; i++) {
    heroes += `${i + 1}: **${counters[i].name}**\n`;
    disadvantages += `${counters[i].disadvantage}%\n`;
    winrates += `${counters[i].winrate}%\n`;
  }
  heroesEmbed.addFields({
    name: '**Heroes**:',
    value: heroes,
    inline: true
  });
  heroesEmbed.addFields({
    name: '**Disadvantage**:',
    value: disadvantages,
    inline: true
  });
  heroesEmbed.addFields({
    name: '**Winrate**:',
    value: winrates,
    inline: true
  });
  sendMessage(message.channel, heroesEmbed);
}

// Stop typing message in chat and send the message
function sendMessage (channel, message) {
  channel.stopTyping();
  return channel.send(message);
}
