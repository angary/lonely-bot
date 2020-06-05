const fetch = require('node-fetch');
const Discord = require('discord.js');

module.exports = {
	name: 'opendota',
    description: 'Uses opendota API to collect information on player',
    aliases: ['od'],
    args: true,
    usage: `<steamID>`,
    cooldown: 1,
    execute(message, args) {

        // Embed information
        let p = {
            name: "don't",
            pic: "asdf",
            country: "know",
            rank_tier: "how to use",
            mmr_estimate: "callbacks",
            won: "0",
            lost: "0",
            hero: [
                {"hero_id":"0","last_played":0,"games":0,"win":0,"with_games":0,"with_win":0,"against_games":0,"against_win":0,"percentile":0},
                {"hero_id":"0","last_played":0,"games":0,"win":0,"with_games":0,"with_win":0,"against_games":0,"against_win":0,"percentile":0},
                {"hero_id":"0","last_played":0,"games":0,"win":0,"with_games":0,"with_win":0,"against_games":0,"against_win":0,"percentile":0}
            ]
        }

        let time_recieved = Date.now();

        // TODO: Implement method for immortal
        function medal(rank) {
            if (rank === null) {
                return "unranked";
            }
            let medal_tier = rank.toString();
            let medals = {
                "1": "Herald",
                "2": "Guardian",
                "3": "Crusader",
                "4": "Archon",
                "5": "Legend",
                "6": "Ancient",
                "7": "Divine"
            }
            return `${medals[medal_tier[0]]} ${medal_tier[1]}`;
        }

        let base_url = `https://api.opendota.com/api/players/${args[0]}`;
        let profile = fetch (base_url);
        let win_lose = fetch (`${base_url}/wl`);
        let player_heroes = fetch(`${base_url}/heroes`);
        let heroes = fetch(`https://api.opendota.com/api/heroes`);
        let player_rankings = fetch(`${base_url}/rankings`);

        Promise.all([profile, win_lose, player_heroes, heroes, player_rankings])

            // Convert data to .json
            .then(response => Promise.all(response.map(response => response.json())))

            // Extract data
            .then(data => {

                // Profile details
                p.name = data[0].profile.personaname;
                p.pic = data[0].profile.avatarfull;
                p.country = data[0].profile.loccountrycode;
                p.rank_tier = data[0].rank_tier;
                p.mmr_estimate = data[0].mmr_estimate.estimate;

                // Won and lost games
                p.won = data[1].win;
                p.lost = data[1].lose;

                // Heroes
                for (let i = 0; i < 3; i++) {
                    p.hero[i] = data[2][i];
                    for (let j = 0; j < data[4].length - 1; j++) {
                            if (data[4][j].hero_id == data[2][i].hero_id) {
                            p.hero[i].percentile = +(100 * data[4][j].percent_rank).toFixed(2);
                            break;
                        }
                    }
                    for (let j = 0; i < data[3].length - 1; j++) {
                        if (data[3][j].id == data[2][i].hero_id) {
                            p.hero[i].name = data[3][j].localized_name;
                            break;
                        } 
                    }
                } 
                // console.log(p);
            })

            // Format data onto embed
            .then(() => {
                const profileEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`${p.name}`)
                    .setURL(`https://www.opendota.com/players/${args[0]}`)
                    .setAuthor(`Lonely Bot`, 'https://cdn.discordapp.com/avatars/647044127313362980/9ca1222828d05412825fce12222ea48e.png?size=256', 'https://github.com/Gy74S/Lonely-Bot')
                    .setDescription(`Medal: **${medal(p.rank_tier)}**\nMMR Estimate: **${p.mmr_estimate}**\nCountry: **${p.country}**`)
                    .setThumbnail(p.pic)
                    .addFields(
                        {
                            name: '**Match data**', 
                            value: `Total: **${p.won + p.lost}** | Won: **${p.won}** | Lost: **${p.lost}** | Winrate: **${(100 * p.won/(p.won + p.lost)).toPrecision(2)}%**\n`
                        }
                    )
                    .addFields(
                        { 
                            name: `**${p.hero[0].name}**`, 
                            value: `Games: **${p.hero[0].games}**
                                Win as: **${(100*p.hero[0].win/p.hero[0].games).toPrecision(2)}%**
                                Win with: **${(100*p.hero[0].with_win/p.hero[0].with_games).toPrecision(2)}%**
                                Win against: **${(100*p.hero[0].against_win/p.hero[0].against_games).toPrecision(2)}%**
                                Percentile: **${p.hero[0].percentile}**`, 
                            inline: true 
                        },
                        { 
                            name: `**${p.hero[1].name}**`, 
                            value: `Games: **${p.hero[1].games}**
                                Win as: **${(100*p.hero[1].win/p.hero[1].games).toPrecision(2)}%**
                                Win with: **${(100*p.hero[1].with_win/p.hero[1].with_games).toPrecision(2)}%**
                                Win against: **${(100*p.hero[1].against_win/p.hero[1].against_games).toPrecision(2)}%**
                                Percentile: **${p.hero[1].percentile}**`,
                            inline: true 
                        },
                        { 
                            name: `**${p.hero[2].name}**`, 
                            value: `Games: **${p.hero[2].games}**
                                Win as: **${(100*p.hero[2].win/p.hero[2].games).toPrecision(2)}%**
                                Win with: **${(100*p.hero[2].with_win/p.hero[2].with_games).toPrecision(2)}%**
                                Win against: **${(100*p.hero[2].against_win/p.hero[2].against_games).toPrecision(2)}%**
                                Percentile: **${p.hero[2].percentile}**`,
                            inline: true 
                        }
                    )
                    .setTimestamp()
                    .setFooter(`Total Processing Time: ${Date.now() - message.createdTimestamp} ms | Generating Time: ${Date.now() - time_recieved} ms`); // Can take additional argument of a small picture

                message.channel.send(profileEmbed);
            })
            .catch(function(error) {
                console.log(error);
                message.channel.send(`There was an error: ${error}`);
            })
	},
};