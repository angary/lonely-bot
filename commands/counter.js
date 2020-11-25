const fetch = require('node-fetch');
const Discord = require('discord.js');
const aliasToHeroName = require('../assets/heroNames');

module.exports = {
  name: 'counter',
  description: 'Returns top 5 counters to given heroes',
  information: 'Given the name of multiple heroes seperated by commas, return the top 5 counters to a team composition of those heroes',
  aliases: [],
  args: true,
  usage: 'hero_name_1, hero_name_2, ...',
  cooldown: 2,
  category: 'dota',
  execute: counter
};

// Database interaction has to be asynchronous, so making new async function
async function counter (message, args) {
  // Trigger bot to start typing and record time message was recieved
  const timeRecieved = Date.now();

  // Grabs the hero names
  args = args.join('').split(',');
  const names = args.map(name => aliasToHeroName[name.trim().toLowerCase()]);
  console.log(names);

  // Collect response
  const response = await fetchAllHeroes();
  if (response.status != 200) {
    return message.channel.send('Invalid API response, when getting information on heroes.');
  }

  // Convert all heroes to hero objects
  const heroes = await response.json();
  const argHeroes = [];
  for (let i = 0; i < names.length; i++) {
    const hero = nameToHero(heroes, names[i]);
    if (!hero) {
      return message.channel.send(`Could not find information for ${names[i]}`);
    }
    argHeroes.push(hero);
  }

  // Fetch data on hero's matchups
  const urls = [];
  for (const hero in argHeroes) {
    const url = `https://api.stratz.com/api/v1/hero/${argHeroes[hero].id}/matchup`;
    urls.push(fetch(url));
  }

  // Once recieved the data on all the heroes
  Promise.all(urls)

    // Check that the status code of the API response was 200
    .then(responses => checkAPIResponse(responses))

    // Convert response into json
    .then(responses => Promise.all(responses.map(response => response.json())))

    // Find the best counters
    .then(data => aggregateData(data, heroes, names))

    // Formate data onto an embed message
    .then(best => sendEmbed(message, timeRecieved, names, best.splice(0, 10)))

    // Handle errors
    .catch(error => message.channel.send(`There was an error: ${error}`));
}

// Aggregate data
function aggregateData(data, heroes, names) {
  const counters = aggregateWinrate(data, 'vs');
  let best = Object.entries(counters);
  best.sort((a, b) => {
    if (a[1] > b[1]) return 1;
    else if (a[1] < b[1]) return -1;
    return 0;
  });
  best = best.map((hero) => idToHeroName(heroes, hero[0]));
  for (const i in names) {
    const index = best.indexOf(names[i]);
    if (index != -1) best.splice(index, 1);
  }
  return best;
}

// Format data and send an embed to channel with details
function sendEmbed (message, timeRecieved, heroes, counters) {
  let description = '';
  for (let i = 0; i < counters.length; i++) {
    description += `${i + 1}: **${counters[i]}**\n`;
  }
  const profileEmbed = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`Counters for **${heroes.join(', ')}**`)
    .setAuthor(
      'Lonely Bot',
      'https://i.imgur.com/b0sTfNL.png',
      'https://github.com/Gy74S/Lonely-Bot'
    )
    .setDescription(description)
    .setTimestamp()
    .setFooter(
      `Total Processing Time: ${Date.now() - message.createdTimestamp} ms | Generating Time: ${Date.now() - timeRecieved} ms`
    );
  message.channel.send(profileEmbed);
}

// Send a get request to find information on all heroes
async function fetchAllHeroes () {
  const response = fetch('https://api.stratz.com/api/v1/hero');
  return response;
}

// Return a hero object given the hero's localized name
function nameToHero (heroes, name) {
  for (const hero in heroes) {
    if (heroes[hero].displayName == name) {
      return heroes[hero];
    }
  }
  return null;
}

// Check the status code of the API response
function checkAPIResponse (responses) {
  // Takes a long time to loop, can be optimised
  for (let i = 0; i < responses.length; i++) {
    if (responses[i].status != 200) {
      throw Error('Invalid API response, check that the id was correct!');
    }
  }
  return responses;
}

// Given data of matchups
function aggregateWinrate (data, type) {
  const aggregate = {};
  for (const hero in data) {
    const heroes = data[hero].advantage[0][type];
    for (const i in heroes) {
      if (aggregate[heroes[i].heroId2]) {
        aggregate[heroes[i].heroId2] += heroes[i].wins;
      } else {
        aggregate[heroes[i].heroId2] = heroes[i].wins;
      }
    }
  }
  return aggregate;
}

// Given hero data from stratz, and hero id, return hero object with same id
function idToHeroName (heroes, heroId) {
  for (const hero in heroes) {
    if (heroes[hero].id == heroId) {
      return heroes[hero].displayName;
    }
  }
  return null;
}
