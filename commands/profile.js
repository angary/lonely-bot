const fetch = require('node-fetch');
const Discord = require('discord.js');
const gameModes = require('../assets/gameModes');
const lobbyTypes = require('../assets/lobbyTypes');
const User = require('../models/user');

module.exports = {
  name: 'profile',
  description: 'Uses opendota API to collect general information on player',
  information: 'Given a steamID, return general info about the player. If your steamID is saved with the id command, then the steamID argument is not required.',
  aliases: [],
  args: false,
  usage: '[Steam32 ID]',
  example: '193480093',
  cooldown: 2,
  category: 'dota',
  execute: profile
};

// Database interaction has to be asynchronous, so making new async function
async function profile (message, args) {
  message.channel.startTyping();
  // Checks for id
  let id = args[0];
  if (!id) {
    const details = await discordToSteamID(message.author.id);
    if (details) {
      id = details.steamID;
    } else {
      return invalidDatabaseResponse(message);
    }
  }
  const url = 'https://api.opendota.com/api/';

  // 0: Basic information
  // 1: Won and lost game totals
  // 2: Top heroes
  // 3: Hero names
  // 4: Hero rankings
  // 5: Most recent match data
  Promise.all([
    fetch(`${url}players/${id}`),
    fetch(`${url}players/${id}/wl`),
    fetch(`${url}players/${id}/heroes`),
    fetch(`${url}heroes`),
    fetch(`${url}players/${id}/rankings`),
    fetch(`${url}players/${id}/recentMatches`)
  ])
    // Check for valid response
    .then(responses => checkAPIResponse(responses))

    // Convert data to .json
    .then(responses => Promise.all(responses.map(response => response.json())))

    // Extract and format data
    .then(data => formatData(data))

    // Add data onto embed
    .then(playerData => sendEmbed(message, playerData, playerData.recent))

    // Catch errors
    .catch(error => {
      message.channel.stopTyping();
      message.channel.send(`There was an error: ${error}`);
    });
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

// Collect data from opendota api and return object containing data
function formatData (data) {
  // Destructure data
  const [profile, wl, playerHeroes, heroes, rankings, recentMatches] = data;

  // Profile details
  const p = profile;
  p.w = wl.win;
  p.l = wl.lose;
  p.wr = (100 * p.w / (p.w + p.l)).toPrecision(4);
  if (!p.profile.loccountrycode) p.profile.loccountrycode = 'Unknown';

  // Top 3 heroes
  p.heroes = [];
  for (let i = 0; i < 3; i++) {
    p.heroes.push(playerHeroes[i]);
    p.heroes[i].name = idToHeroName(heroes, playerHeroes[i].hero_id);
    p.heroes[i].winAs = (100 * p.heroes[i].win / p.heroes[i].games).toPrecision(2);
    p.heroes[i].percentile = idToHeroRanking(rankings, p.heroes[i].hero_id);
  }

  // Most recent match
  p.recent = recentMatches[0];
  p.recent.time = Date(p.recent.start_time).substr(0, 15);
  p.recent.skill = ['invalid', 'normal', 'high', 'very high'][p.recent.skill];
  p.recent.hero = idToHeroName(heroes, p.recent.hero_id);

  // Find game mode and lobby
  try {
    p.recent.game_mode = gameModes[p.recent.game_mode].replace(/_/g, ' ');
  } catch {
    p.recent.game_mode = '';
  }
  try {
    p.recent.lobby_type = lobbyTypes[p.recent.lobby_type].replace(/_/g, ' ');
  } catch {
    p.recent.lobby_type = '';
  }
  if (p.recent.lobby_type == '' && p.recent.game_mode == '') {
    p.recent.lobby_type = 'match';
  }

  // Check if they've won or lost
  p.recent.outcome = 'Lost';
  if ((p.recent.player_slot < 6 && p.recent.radiant_win) ||
    (p.recent.player_slot > 5 && !p.recent.radiant_win)) {
    p.recent.outcome = 'Won';
  }

  return p;
}

// Format data and send an embed to channel with details
function sendEmbed (message, p, match) {
  const profileEmbed = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle(`${p.profile.personaname}`)
    .setURL(`https://www.opendota.com/players/${p.profile.account_id}`)
    .setAuthor(
      'Lonely Bot',
      'https://i.imgur.com/b0sTfNL.png',
      'https://github.com/Gy74S/Lonely-Bot'
    )
    .setDescription(
      `Medal: **${medal(p)}**
      MMR Estimate: **${p.mmr_estimate.estimate}**
      Country: **${p.profile.loccountrycode}**`
    )
    .setThumbnail(p.profile.avatarfull)
    .setTimestamp()
    .setFooter(
      `Source: Opendota | Total Processing Time: ${Date.now() - message.createdTimestamp} ms`,
      'https://pbs.twimg.com/profile_images/962444554967203840/G6KHe1q3.jpg'
    )
    .addFields({
      name: '**General Match Data**',
      value: `Total: **${p.w + p.l}** | Won: **${p.w}** | Lost: **${p.l}** | Winrate: **${p.wr}%**\n`
    });

  // Add player's top three heroes
  for (let i = 0; i < p.heroes.length; i++) {
    profileEmbed.addFields({
      name: `**${p.heroes[i].name}**`,
      value: `
        Games: **${p.heroes[i].games}**
        Win as: **${p.heroes[i].winAs}%**
        Percentile: **${p.heroes[i].percentile}**`,
      inline: true
    });
  }

  // Add most recent match data
  profileEmbed.addFields({
    name: '**Most Recent Match**',
    value: `
    **${match.outcome}** playing a **${match.skill}** skill **${match.lobby_type} ${match.game_mode}** as **${match.hero}**
    KDA: **${match.kills}/${match.deaths}/${match.assists}** | GPM: **${match.gold_per_min}** | XPM: **${match.xp_per_min}**
    Date: **${match.time}** | Duration: **${secondsToHms(match.duration)}**`
  });

  message.channel.stopTyping();
  message.channel.send(profileEmbed);
}

// Send message regarding invalid database response
function invalidDatabaseResponse (message) {
  let response = `${message.author} Invalid response from database. `;
  response += 'In order to use the me argument, you have to have your id added. ';
  response += "Either you haven't added your id, or there was a database error. ";
  response += 'You can add you id with the id command!';
  message.channel.stopTyping();
  message.channel.send(response);
}

// Return a hero ranking given the hero id and list of ranking details
function idToHeroRanking (rankings, heroId) {
  for (let i = 0; i < rankings.length; i++) {
    if (rankings[i].hero_id == heroId) {
      return `${+(100 * rankings[i].percent_rank).toFixed(2)}%`;
    }
  }
  return 'Unknown';
}

// Return a hero name given the hero id and list of hero details
function idToHeroName (heroes, heroId) {
  for (let i = 0; i < heroes.length; i++) {
    if (heroes[i].id == heroId) {
      return heroes[i].localized_name;
    }
  }
  return 'Unknown';
}

// Convert rank_tier to medal and leaderboard rank
function medal (player) {
  if (player.rank_tier == null) return 'unranked';
  if (player.leader_board) return `Immortal ** | rank **${player.leaderboard_rank}`;
  if (player.rank_tier[0] == 8) return 'Immortal';
  const medalTier = player.rank_tier.toString();
  const medals = ['Lower than Herald?', 'Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine'];
  return `${medals[medalTier[0]]} ${medalTier[1]}`;
}

// Convert from seconds into HH MM SS
function secondsToHms (duration) {
  const hours = duration / 3600;
  duration = duration % (3600);
  const min = parseInt(duration / 60);
  duration = duration % (60);
  const sec = parseInt(duration);
  if (parseInt(hours, 10) > 0) return `${parseInt(hours, 10)}h ${min}m ${sec}s`;
  else if (min == 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

// Find the steamID based off the discord ID
function discordToSteamID (discordID) {
  const query = { discordID: discordID };
  return User.findOne(query);
}
