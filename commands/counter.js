const fetch = require('node-fetch');
const Discord = require('discord.js');
const aliasToHeroName = require('../assets/heroNames');

module.exports = {
  name: 'counter',
  description: 'Returns top 5 counters to given heroes',
  information: 'Given the name of multiple heroes seperated by commas, return the top 5 counters to a team composition of those heroes',
  aliases: ['od', 'opendota'],
  args: false,
  usage: 'hero_name_1, hero_name_2, ...',
  cooldown: 0,
  category: 'dota',
  execute: counter
};

// Database interaction has to be asynchronous, so making new async function
async function counter (message, args) {
  message.channel.startTyping();
  // Grabs the hero names
  args = args.join('').split(',');
  const aliases = args.map(name => aliasToHeroName[name.trim().toLowerCase()]);
  console.log(aliases);

  const timeRecieved = Date.now();

  const response = await fetchAllHeroes();
  if (response.status != 200) {
    return message.channel.send('Invalid API response, when getting information on heroes.');
  }

  // Convert all to hero objects
  const heroes = await response.json();
  const argsHeroes = [];
  for (let i = 0; i < aliases.length; i++) {
    argsHeroes.push(nameToHero(heroes, aliases[i]));
  }

  // Fetch data on that hero's matchups
  const argsHeroesMatchup = [];
  for (let i = 0; i < argsHeroes.length; i++) {
    const url = `https://api.opendota.com/api/heroes/${argsHeroes[i].id}/matchups`;
    console.log(url);
    const response = await fetch(url);
    if (response.status != 200) {
      return message.channel.send(`Invalid response when getting data for ${argsHeroes[i].localized_name}.`);
    }
    const heroMatchups = await response.json();
    argsHeroesMatchup.push(heroMatchups);
  }

  // Add winrate
  argsHeroesMatchup[0].forEach((hero) => {
    hero.winrate = hero.wins / hero.games_played;
  });
  // Loop through all the heroes specified by the user
  for (let i = 1; i < argsHeroesMatchup.length; i++) {
    // Loop through all the matchups
    for (let j = 0; j < argsHeroesMatchup[i].length; j++) {
      // Find the same matchup as for the first hero specified
      for (let k = 0; k < argsHeroesMatchup[0].length; k++) {
        // If it's the same matchup
        if (argsHeroesMatchup[i][j].hero_id == argsHeroesMatchup[0][k].hero_id) {
          argsHeroesMatchup[0][k].winrate += argsHeroesMatchup[i][j].wins / argsHeroesMatchup[i][j].games_played;
          break;
        }
      }
    }
  }

  // Find the respective winrate
  let aggregateMatchups = argsHeroesMatchup[0];

  // Sort array such that counters appear first
  aggregateMatchups.sort((a, b) => {
    if (a.winrate < b.winrate) return -1;
    else if (a.winrate > b.winrate) return 1;
    return 0;
  });
  aggregateMatchups = aggregateMatchups.slice(0, 5).map(hero => idToHeroName(heroes, hero.hero_id));
  message.channel.stopTyping();
  sendEmbed(message, timeRecieved, aliases, aggregateMatchups);
}

// Format data and send an embed to channel with details
function sendEmbed (message, timeRecieved, heroes, counters) {
  const profileEmbed = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`Counters for **${heroes.join(' ')}**`)
    .setAuthor(
      'Lonely Bot',
      'https://i.imgur.com/b0sTfNL.png',
      'https://github.com/Gy74S/Lonely-Bot'
    )
    .setDescription(`${counters.join('\n')}`)
    .setTimestamp()
    .setFooter(
      `Total Processing Time: ${Date.now() - message.createdTimestamp} ms | Generating Time: ${Date.now() - timeRecieved} ms`
    );
  message.channel.send(profileEmbed);
}

// Send a get request to find information on all heroes
async function fetchAllHeroes () {
  const response = fetch('https://api.opendota.com/api/heroes');
  return response;
}

// Return a hero object given the hero's localized name
function nameToHero (heroes, name) {
  for (let i = 0; i < heroes.length; i++) {
    if (heroes[i].localized_name == name) {
      return heroes[i];
    }
  }
  return null;
}

function idToHeroName (heroes, heroId) {
  for (let i = 0; i < heroes.length; i++) {
    if (heroes[i].id == heroId) {
      return heroes[i].localized_name;
    }
  }
  return 'Unknown';
}
