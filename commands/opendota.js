const fetch = require('node-fetch');
const Discord = require('discord.js');
const raw_data = require(`../assets/id.json`);



module.exports = {
	name: 'opendota',
    description: 'Uses opendota API to collect general information on player, and their three most played heroes',
    aliases: ['od'],
    args: true,
    usage: `[Steam32 ID]`,
    cooldown: 1,
    execute(message, args) {

        // Convert rank_tier to medal and leaderboard rank
        function medal(player) {
            if (player.rank_tier === null) return "unranked";
            if (player.leader_board) return `Immortal ** | rank **${player.rank}`;
            if (player.rank_tier[0] === 8) return `Immortal`;
            let medal_tier = player.rank_tier.toString();
            let medals = ["Lower than Herald?", "Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine"];
            return `${medals[medal_tier[0]]} ${medal_tier[1]}`;
        }
        
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
                p.name = data[0].profile.personaname;
                p.pic = data[0].profile.avatarfull;
                p.country = data[0].profile.loccountrycode;
                p.rank_tier = data[0].rank_tier;
                p.rank = data[0].leaderboard_rank;
                p.mmr_estimate = data[0].mmr_estimate.estimate;

                // Won and lost games
                p.won = data[1].win;
                p.lost = data[1].lose;

                // Heroes
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
                } 

                // Most recent match
                p.recent = {};
                p.recent.outcome = 'Lost';
                if ((data[5][0].player_slot < 6 && data[5][0].radiant_win == true) 
                    || (data[5][0].player_slot > 5 && data[5][0].radiant_win == false)) {
                    p.recent.outcome = 'Won';
                }
                for (let i = 0; i < data[3].length - 1; i++) {
                    if (data[3][i].id == data[5][0].hero_id) {
                        p.recent.hero = data[3][i].localized_name;
                        break;
                    }
                }
                p.recent.time = Date(data[5][0].start_time).substr(0, 24);
                p.recent.k = data[5][0].kills;
                p.recent.d = data[5][0].deaths;
                p.recent.a = data[5][0].assists;
                p.recent.lane = data[5][0].lane;
                let skill = ['Error', 'Normal', 'High', 'Very High'];
                p.recent.skill = skill[data[5][0].skill];
                p.recent.gpm = data[5][0].gold_per_min;
                p.recent.xpm = data[5][0].xp_per_min;
            })

            // Format data onto embed
            .then(() => {
                const profileEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`${p.name}`)
                    .setURL(`https://www.opendota.com/players/${args[0]}`)
                    .setAuthor(
                        'Lonely Bot', 
                        'https://cdn.discordapp.com/avatars/647044127313362980/9ca1222828d05412825fce12222ea48e.png?size=256', 
                        'https://github.com/Gy74S/Lonely-Bot'
                    )
                    .setDescription(`Medal: **${medal(p)}**\nMMR Estimate: **${p.mmr_estimate}**\nCountry: **${p.country}**`)
                    .setThumbnail(p.pic)
                    .setTimestamp()
                    .setFooter(`Total Processing Time: ${Date.now() - message.createdTimestamp} ms | Generating Time: ${Date.now() - time_recieved} ms`) // Can take additional argument of a small picture
                    .addFields(
                        {
                            name: '**General Match Data**', 
                            value: `Total: **${p.won + p.lost}** | Won: **${p.won}** | Lost: **${p.lost}** | Winrate: **${(100 * p.won / (p.won + p.lost)).toPrecision(4)}%**\n`
                        }
                    )
                    for (let i = 0; i < p.heroes.length; i++) {
                        profileEmbed.addFields(
                            { 
                                name: `**${p.heroes[i].name}**`, 
                                value: `Games: **${p.heroes[i].games}**
                                    Win as: **${(100 * p.heroes[i].win / p.heroes[i].games).toPrecision(2)}%**
                                    Win with: **${(100 * p.heroes[i].with_win / p.heroes[i].with_games).toPrecision(2)}%**
                                    Win against: **${(100 * p.heroes[i].against_win / p.heroes[i].against_games).toPrecision(2)}%**
                                    Percentile: **${p.heroes[i].percentile}%**`, 
                                inline: true 
                            },  
                        )
                    }
                    profileEmbed.addFields(
                        {
                            name: `**Most Recent Match Data**`,
                            value: `*${p.recent.time}*
                                Status: **${p.recent.outcome}**\t\t| Hero: **${p.recent.hero}** | KDA: **${p.recent.k}/${p.recent.d}/${p.recent.a}**
                                GPM: **${p.recent.gpm}** | XPM: **${p.recent.xpm}** | Skill: **${p.recent.skill}**`
                        }
                    )
                message.channel.send(profileEmbed);
            })
            .catch(function(error) {
                message.channel.send(`There was an error: ${error}`);
            })

	},
};