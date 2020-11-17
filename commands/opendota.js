const fetch = require('node-fetch');
const Discord = require('discord.js');
const raw_data = require(`../assets/id.json`);
const game_modes = require(`../assets/game_modes`);
const lobby_types = require(`../assets/lobby_types`);


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
    if (sec < 10)
        sec = `0${sec}`;
    if (min < 10)
        min = `0${min}`;
    if (parseInt(hours, 10) > 0)
        return `${parseInt(hours, 10)}h ${min}m ${sec}s`;
    else if (min == 0)
        return `${sec}s`;
    else
        return `${min}m ${sec}s`;
  }


module.exports = {
	name: 'opendota',
    description: 'Uses opendota API to collect general information on player',
    aliases: ['od'],
    args: true,
    usage: `[Steam32 ID]`,
    cooldown: 1,
    execute(message, args) {

        // Checks for id
        if (args[0] === "me") {
            args[0] = raw_data[`${message.author.id}`];
        }

        // Object to hold data
        let p = {};

        let time_recieved = Date.now();
        let url = `https://api.opendota.com/api/players/${args[0]}`;

        // Could make promise them one by one and extract data to reduce overall time?
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

        // Extract data
        .then(data => {

            // Profile details
            p = data[0];

            // Won and lost games
            p.w = data[1].win;
            p.l = data[1].lose;
            p.wr = (100 * p.w / (p.w + p.l)).toPrecision(4)

            // Top 3 heroes
            p.heroes = [];
            for (let i = 0; i < 3; i++) {
                p.heroes.push(data[2][i]);
                for (let j = 0; j < data[4].length - 1; j++) {
                    if (data[4][j].hero_id == data[2][i].hero_id) {
                        p.heroes[i].percentile = +(100 * data[4][j].percent_rank).toFixed(2);
                        break;
                    }
                }
                for (let j = 0; i < data[3].length - 1; j++) {
                    if (data[3][j].id == data[2][i].hero_id) {
                        p.heroes[i].name = data[3][j].localized_name;
                        break;
                    } 
                }
                p.heroes[i].winAs = (100 * p.heroes[i].win / p.heroes[i].games).toPrecision(2);
            } 
            
            // Most recent match
            p.recent = data[5][0];
            p.recent.time = Date(p.recent.start_time).substr(0, 15);
            p.recent.skill = ['invalid', 'normal', 'high', 'very high'][p.recent.skill];

            // Find game mode and lobby, for some reason lobby is not always updated
            try {
                p.recent.game_mode = game_modes[p.recent.game_mode].replace(/_/g, " ");
            }
            catch {
                p.recent.game_mode = "";
            }
            try {
                p.recent.lobby_type = lobby_types[p.recent.lobby_type].replace(/_/g, " ");
            }
            catch {
                p.recent.lobby_type = "";
            }
            
            // Check if they've won or lost
            p.recent.outcome = 'Lost';
            if ((p.recent.player_slot < 6 && p.recent.radiant_win == true) 
                || (p.recent.player_slot > 5 && p.recent.radiant_win == false)) {
                p.recent.outcome = 'Won';
            }

            // Find name of hero they played
            for (let i = 0; i < data[3].length - 1; i++) {
                if (data[3][i].id == p.recent.hero_id) {
                    p.recent.hero = data[3][i].localized_name;
                    break;
                }
            }
        })

        // Format data onto embed
        .then(() => {
            const profileEmbed = new Discord.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`${p.profile.personaname}`)
                .setURL(`https://www.opendota.com/players/${args[0]}`)
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
                    // Can take additional argument of a small picture
                    `Total Processing Time: ${Date.now() - message.createdTimestamp} ms | Generating Time: ${Date.now() - time_recieved} ms`
                )

                // Win Lose info
                .addFields({
                    name: '**General Match Data**', 
                    value: `Total: **${p.w + p.l}** | Won: **${p.w}** | Lost: **${p.l}** | Winrate: **${p.wr}%**\n`
                })

                // Top 3 heroes
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

                // Most recent match data
                profileEmbed.addFields({
                    name: `**Most Recent Match**`,
                    value: `*${p.recent.time} ${secondsToHms(p.recent.duration)}*
                        **${p.recent.outcome}** playing a **${p.recent.skill}** skill **${p.recent.lobby_type} ${p.recent.game_mode}** as **${p.recent.hero}**
                        KDA: **${p.recent.kills}/${p.recent.deaths}/${p.recent.assists}** | GPM: **${p.recent.gold_per_min}** | XPM: **${p.recent.xp_per_min}**`
                })
            
            message.channel.send(profileEmbed);
        })
        .catch(function(error) {
            message.channel.send(`There was an error: ${error}`);
        })
    },
};