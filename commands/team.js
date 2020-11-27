const fetch = require('node-fetch');
const Discord = require('discord.js');
const aliasToHeroName = require('../assets/heroNames');

module.exports = {
  name: 'team',
  description: 'Returns ideal and unideal hero picks',
  information: 'Given the name of heroes on your team seperated by commas, followed by a "|", and then heroes on the enemy team seperated by commas, return the top 10 ideal and unideal picks for your team.\n\nIf there is no "|", it is assumed all heroes are on your team. If there is no hero before "|", it is assumed all heroes are on the enemy team.\n\nRating is measured by winrate with/ against in matches from the past week, so heroes with naturally high winrates may score higher as an ideal pick',
  aliases: false,
  args: true,
  usage: '[ally_1], [ally_2] ... | [enemy_1], [enemy_2] ...',
  cooldown: 2,
  category: 'dota',
  execute: team
};

// Database interaction has to be asynchronous, so making new async function
async function team (message, args) {
  // Trigger bot to start typing and record time message was recieved
  const timeRecieved = Date.now();
  message.channel.startTyping();

  // Find the number of allies in the argument and the names of the heroes
  const [allyCount, argNames] = parseArgs(args);

  // Convert argument names into official names
  const names = [];
  for (const name of argNames) {
    const officialName = aliasToHeroName[name.trim().toLowerCase()];
    if (officialName) {
      names.push(officialName);
    } else {
      message.channel.stopTyping();
      console.log('stopped');
      return message.channel.send(`Invalid name ${name}.`);
    }
  }

  // Collect response
  const response = await fetchAllHeroes();
  if (response.status != 200) {
    message.channel.stopTyping();
    return message.channel.send('Invalid API response, when getting information on heroes.');
  }

  // Convert all heroes to hero objects
  const heroes = await response.json();
  const argHeroes = [];
  for (let i = 0; i < names.length; i++) {
    const hero = nameToHero(heroes, names[i]);
    if (!hero) {
      message.channel.stopTyping();
      return message.channel.send(`Could not find information for ${names[i]}`);
    }
    argHeroes.push(hero);
  }

  // Fetch data on hero's matchups
  const urls = [];
  for (const hero of argHeroes) {
    const url = `https://api.stratz.com/api/v1/hero/${hero.id}/matchup`;
    urls.push(fetch(url));
  }

  // Once recieved the data on all the heroes
  Promise.all(urls)

    // Check that the status code of the API response was 200
    .then(responses => checkAPIResponse(responses))

    // Convert response into json
    .then(responses => Promise.all(responses.map(response => response.json())))

    // Find the best counters
    .then(data => aggregateData(data, heroes, names, allyCount))

    // Format data onto an embed message
    .then(counters => sendEmbed(message, timeRecieved, names, counters, allyCount))

    // Handle errors
    .catch(error => {
      message.channel.stopTyping();
      message.channel.send(`There was an error: ${error}`);
    });
}

// Find the number of allies and heroes in the argument
function parseArgs (args) {
  args = args.join('');
  if (args.includes('|')) {
    args = args.split('|');
    args = args.map(team => team.split(','));
    if (args[0] == '') {
      return [0, args[1]];
    } else {
      return [args[0].length, args[0].concat(args[1])];
    }
  } else {
    return [args.length, args.split(',')];
  }
}

// Aggregate data
function aggregateData (data, heroes, names, allyCount) {
  // Find winrate with / against given team composition
  const picks = aggregateWinrate(data, allyCount);

  // Sort picks based off winrate, and convert from objects into hero name
  let best = Object.entries(picks);
  best.sort((a, b) => (a[1] - b[1]));
  best = best.map((hero) => idToHeroName(heroes, hero[0]));

  // Remove the hero if it's an ally or enemy
  for (const name of names) {
    const index = best.indexOf(name);
    if (index != -1) best.splice(index, 1);
  }
  return best;
}

// Format data and send an embed to channel with details
function sendEmbed (message, timeRecieved, heroes, counters, allyCount) {
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
  let description = '';
  if (allyCount > 0) {
    description += `Heroes good with: **${heroes.slice().splice(0, allyCount).join(', ')}**\n`;
  }
  if (heroes.length > allyCount) {
    description += `Heroes good against: **${heroes.slice().splice(allyCount).join(', ')}**\n`;
  }
  heroesEmbed.setDescription(description);

  // Ideal pick formatting
  let goodHeroes = '';
  let badHeroes = '';
  for (let i = 0; i < 10; i++) {
    goodHeroes += `${i + 1}: **${counters[i]}**\n`;
    badHeroes += `${i + 1}: **${counters[counters.length - 1 - i]}**\n`;
  }
  heroesEmbed.addFields({
    name: '**Best Picks**:',
    value: goodHeroes,
    inline: true
  });
  heroesEmbed.addFields({
    name: '**Worst Picks**:',
    value: badHeroes,
    inline: true
  });
  message.channel.stopTyping();
  message.channel.send(heroesEmbed);
}

// Send a get request to find information on all heroes
async function fetchAllHeroes () {
  const response = fetch('https://api.stratz.com/api/v1/hero');
  return response;
}

// Return a hero object given the hero's localized name
function nameToHero (heroes, name) {
  for (const i in heroes) {
    if (heroes[i].displayName == name) {
      return heroes[i];
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

// Given data of matchups, return winrates of heroes with allies and against enemys
function aggregateWinrate (data, allyCount) {
  const aggregate = {};

  // Given a winrate list, add winrates of each hero to the aggregate object
  // where the property name is the hero id
  function addWinrates (heroes) {
    for (const i in heroes) {
      if (aggregate[heroes[i].heroId2]) {
        aggregate[heroes[i].heroId2] += heroes[i].wins;
      } else {
        aggregate[heroes[i].heroId2] = heroes[i].wins;
      }
    }
  }

  // Grab winrate of heroes with allies
  for (const hero of data.slice().splice(0, allyCount)) {
    const withHeroes = hero.advantage[0].with;
    addWinrates(withHeroes);
  }

  // Grab winrate of heroes against enemy
  for (const hero of data.slice().splice(allyCount)) {
    const vsHeroes = hero.advantage[0].vs;
    addWinrates(vsHeroes);
  }
  return aggregate;
}

// Given hero data from stratz, and hero id, return hero object with same id
function idToHeroName (heroes, heroId) {
  for (const i in heroes) {
    if (heroes[i].id == heroId) {
      return heroes[i].displayName;
    }
  }
  return null;
}
