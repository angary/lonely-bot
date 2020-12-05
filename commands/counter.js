const axios = require('axios');
const cheerio = require('cheerio');
// const Discord = require('discord.js');
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
  message.channel.startTyping();

  // Convert argument names into official names
  const names = [];
  for (const name of parseArgs(args)) {
    const officialName = aliasToHeroName[name.trim().toLowerCase()];
    if (officialName) {
      names.push(officialName.toLowerCase().replace(' ', '-'));
    } else {
      return sendMessage(message.channel, `Invalid name ${name}.`);
    }
  }
  console.log(names);

  // Dictionary to store data for each hero
  const heroes = {};

  // Webscrape the data
  const url = `https://www.dotabuff.com/heroes/${names[0]}/counters`;
  axios.get(url)
    .then(async response => {
      // Grab the data from the counters table
      const $ = await cheerio.load(response.data);
      const counters = $(tableSelector);

      // Extract data from each hero
      counters.each((index, element) => {
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
    })
    .then(() => {
      console.log(heroes);
      message.channel.stopTyping();
    })
    .catch(err => console.log(err));
}

// Find the number of allies and heroes in the argument
function parseArgs (args) {
  return args.join('').split(',');
}

// Stop typing message in chat and send the message
function sendMessage (channel, message) {
  channel.stopTyping();
  return channel.send(message);
}
