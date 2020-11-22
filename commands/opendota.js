const fetch = require('node-fetch');
const Discord = require('discord.js');
const game_modes = require(`../assets/game_modes`);
const lobby_types = require(`../assets/lobby_types`);
const User = require('../models/user')
const config = require('../config.json');


module.exports = {
    name: 'opendota',
    description: 'Uses opendota API to collect general information on player',
    aliases: ['od'],
    args: true,
    usage: `[Steam32 ID] or 'me'`,
    cooldown: 5,
    execute: opendota
};


// Database interaction has to be asynchronous, so making new async function
async function opendota(message, args) {

    // Checks for id
    if (args[0] === "me") {
        details = await discordToSteamID(message.author.id);
        if (details) {
            args[0] = details.steamID;
        } else {
            let response = `${message.author} Invalid response from database. `;
            response += "In order to use the me argument, you have to have your id added. ";
            response += "Either you haven't added your id, or there was a database error. ";
            response += `You can add you id with the id command!`;
            message.channel.send(response);
            return;
        }
    }
    
    let time_recieved = Date.now();
    let url = `https://api.opendota.com/api/players/${args[0]}`;

    Promise.all([
        fetch(url),                                     // 0 For basic information
        fetch(`${url}/wl`),                             // 1 For won and lost game totals
        fetch(`${url}/heroes`),                         // 2 For top heroes
        fetch(`https://api.opendota.com/api/heroes`),   // 3 For hero names
        fetch(`${url}/rankings`),                       // 4 For hero rankings
        fetch(`${url}/recentMatches`)                   // 5 For most recent match data
    ])

    // Convert data to .json
    .then(response => Promise.all(response.map(response => response.json())))

    // Extract and format data
    .then(data => {
        return formatData(data[0], data[1], data[2], data[3], data[4], data[5]);
    })
    // Add data onto embed
    .then(player_data => {
        sendEmbed(message, time_recieved, player_data, player_data.recent);
    })
    .catch(function(error) {
        message.channel.send(`There was an error: ${error}`);
    })
}


// Collect data from opendota api and return object containing data
function formatData(profile, wl, player_heroes, heroes, rankings, recentMatches) {
    
    // Profile details
    let p = profile;
    p.w = wl.win;
    p.l = wl.lose;
    p.wr = (100 * p.w / (p.w + p.l)).toPrecision(4);

    // Top 3 heroes
    p.heroes = [];
    for (let i = 0; i < 3; i++) {
        p.heroes.push(player_heroes[i]);
        for (let j = 0; j < rankings.length - 1; j++) {
            if (rankings[j].hero_id == player_heroes[i].hero_id) {
                p.heroes[i].percentile = +(100 * rankings[j].percent_rank).toFixed(2);
                break;
            }
        }
        for (let j = 0; i < heroes.length - 1; j++) {
            if (heroes[j].id == player_heroes[i].hero_id) {
                p.heroes[i].name = heroes[j].localized_name;
                break;
            } 
        }
        p.heroes[i].winAs = (100 * p.heroes[i].win / p.heroes[i].games).toPrecision(2);
    }
    
    // Most recent match
    p.recent = recentMatches[0];
    p.recent.time = Date(p.recent.start_time).substr(0, 15);
    p.recent.skill = ['invalid', 'normal', 'high', 'very high'][p.recent.skill];

    // Find game mode and lobby, for some reason lobby is not always updated
    try {
        p.recent.game_mode = game_modes[p.recent.game_mode].replace(/_/g, " ");
    } catch {
        p.recent.game_mode = "";
    }
    try {
        p.recent.lobby_type = lobby_types[p.recent.lobby_type].replace(/_/g, " ");
    } catch {
        p.recent.lobby_type = "";
    }
    
    // Check if they've won or lost
    p.recent.outcome = 'Lost';
    if ((p.recent.player_slot < 6 && p.recent.radiant_win == true) 
        || (p.recent.player_slot > 5 && p.recent.radiant_win == false)) {
        p.recent.outcome = 'Won';
    }

    // Find name of hero they played
    for (let i = 0; i < heroes.length - 1; i++) {
        if (heroes[i].id == p.recent.hero_id) {
            p.recent.hero = heroes[i].localized_name;
            break;
        }
    }
    return p;
}


// Format data and send an embed to channel with details
function sendEmbed(message, time_recieved, p, match) {
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
            `Total Processing Time: ${Date.now() - message.createdTimestamp} ms | Generating Time: ${Date.now() - time_recieved} ms`
        )
        .addFields({
            name: '**General Match Data**', 
            value: `Total: **${p.w + p.l}** | Won: **${p.w}** | Lost: **${p.l}** | Winrate: **${p.wr}%**\n`
        })

    // Add player's top three heroes
    for (let i = 0; i < p.heroes.length; i++) {
        profileEmbed.addFields({ 
            name: `**${p.heroes[i].name}**`, 
            value: `
                Games: **${p.heroes[i].games}**
                Win as: **${p.heroes[i].winAs}%**
                Percentile: **${p.heroes[i].percentile}%**
                `, 
            inline: true 
        })
    }

    // Add most recent match data
    profileEmbed.addFields({
        name: `**Most Recent Match**`,
        value: `*${match.time} ${secondsToHms(match.duration)}*
            **${match.outcome}** playing a **${match.skill}** skill **${match.lobby_type} ${match.game_mode}** as **${match.hero}**
            KDA: **${match.kills}/${match.deaths}/${match.assists}** | GPM: **${match.gold_per_min}** | XPM: **${match.xp_per_min}**`
    })

    message.channel.send(profileEmbed);
}


// Convert rank_tier to medal and leaderboard rank
function medal(player) {
    if (player.rank_tier === null) return "unranked";
    if (player.leader_board) return `Immortal ** | rank **${player.leaderboard_rank}`;
    if (player.rank_tier[0] === 8) return `Immortal`;
    let medal_tier = player.rank_tier.toString();
    let medals = ["Lower than Herald?", "Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine"];
    return `${medals[medal_tier[0]]} ${medal_tier[1]}`;
}


// Convert from seconds into HH MM SS
function secondsToHms(duration) {
    let hours = duration / 3600;
    duration = duration % (3600);
    let min = parseInt(duration / 60);
    duration = duration % (60);
    let sec = parseInt(duration);
    if (sec < 10) sec = `0${sec}`;
    if (min < 10) min = `0${min}`;
    if (parseInt(hours, 10) > 0) return `${parseInt(hours, 10)}h ${min}m ${sec}s`;
    else if (min == 0) return `${sec}s`;
    return `${min}m ${sec}s`;
}


// Find the steamID based off the discord ID
function discordToSteamID(discordID) {
    const query = { "discordID": discordID };
    return User.findOne(query);;
}
