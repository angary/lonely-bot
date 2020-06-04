const fetch = require('node-fetch');
const Discord = require('discord.js');

module.exports = {
	name: 'opendota',
    description: 'Uses opendota API to collect information on player',
    aliases: ['od'],
    args: true,
    usage: `<steamID>`,
    cooldown: 1,
    async execute(message, args) {

        // Declared variables
        let p = {
            name: "don't",
            pic: "asdf",
            country: "know",
            rank_tier: "how to use",
            mmr_estimate: "callbacks",
            won: "0",
            lost: "0",
            hero: [
                {"hero_id":"0","last_played":0,"games":0,"win":0,"with_games":0,"with_win":0,"against_games":0,"against_win":0},
                {"hero_id":"0","last_played":0,"games":0,"win":0,"with_games":0,"with_win":0,"against_games":0,"against_win":0},
                {"hero_id":"0","last_played":0,"games":0,"win":0,"with_games":0,"with_win":0,"against_games":0,"against_win":0}
            ]
        }

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

        let base_url = `https://api.opendota.com/api/players/${args[0]}`
        let profile = fetch (base_url);
        let win_lose = fetch (`${base_url}/wl`);
        let player_heroes = fetch(`${base_url}/heroes`);
        let heroes = fetch(`https://api.opendota.com/api/heroes`);

        Promise.all([profile, win_lose, player_heroes, heroes])
            .then(response => Promise.all(response.map(response => response.json())))
            .then(data => {

                // Profile details
                p.name = data[0].profile.personaname;
                p.pic = data[0].profile.avatarfull;
                p.country = data[0].profile.loccountrycode;
                p.rank_tier = data[0].rank_tier;
                p.mmr_estimate = data[0].mmr_estimate.estimate;
                // message.channel.send(`Steam name: **${p.name}** \nCountry: **${p.country}** \nMedal: **${medal(p.rank_tier)}** \nEstimated MMR: **${p.mmr_estimate}**`);

                // Won and lost games
                p.won = data[1].win;
                p.lost = data[1].lose;
                // message.channel.send(`Won games: **${p.won}** \nLost games: **${p.lost}** \nWinrate: **${(100 * p.won/(p.won + p.lost)).toPrecision(2)}%**`);

                // Heroes
                for (let i = 0; i < 3; i++) {
                    p.hero[i] = data[2][i];
                    for (let j = 0; i < data[3].length - 1; j++) {
                        if (data[3][j].id == data[2][i].hero_id) {
                            p.hero[i].id = data[3][j].localized_name;
                            break;
                        } 
                    }
                } 
                // message.channel.send(`Best heroes: **${p.hero[0].id}**,  **${p.hero[1].id}**,  **${p.hero[2].id}**`);
            })
            .then(() => {
                const profileEmbed = new Discord.MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`${p.name}`)
                    .setURL(`https://www.opendota.com/players/${args[0]}`)
                    .setAuthor(`Lonely Bot`, 'https://i.imgur.com/wSTFkRM.png', 'https://github.com/Gy74S/Lonely-Bot')
                    .setDescription(`Medal: **${medal(p.rank_tier)}**\nMMR Estimate: **${p.mmr_estimate}**\nCountry: **${p.country}**`)
                    .setThumbnail(p.pic)
                    .addFields(
                        {
                            name: '**Match data**', 
                            value: `Total: **${p.won + p.lost}** | Won: **${p.won}** | Lost: **${p.lost}** | Winrate: **${(100 * p.won/(p.won + p.lost)).toPrecision(2)}%**`
                        },
                        { 
                            name: `**${p.hero[0].id}**`, 
                            value: `Games: **${p.hero[0].games}**
                                Win as: **${(100*p.hero[0].win/p.hero[0].games).toPrecision(2)}%**
                                Win with: **${(100*p.hero[0].with_win/p.hero[0].with_games).toPrecision(2)}%**
                                Win against: **${(100*p.hero[0].against_win/p.hero[0].against_games).toPrecision(2)}%**`, 
                            inline: true 
                        },
                        { 
                            name: `**${p.hero[1].id}**`, 
                            value: `Games: **${p.hero[1].games}**
                                Win as: **${(100*p.hero[1].win/p.hero[1].games).toPrecision(2)}%**
                                Win with: **${(100*p.hero[1].with_win/p.hero[1].with_games).toPrecision(2)}%**
                                Win against: **${(100*p.hero[1].against_win/p.hero[1].against_games).toPrecision(2)}%**`,
                            inline: true 
                        },
                        { 
                            name: `**${p.hero[2].id}**`, 
                            value: `Games: **${p.hero[2].games}**
                                Win as: **${(100*p.hero[2].win/p.hero[2].games).toPrecision(2)}%**
                                Win with: **${(100*p.hero[2].with_win/p.hero[2].with_games).toPrecision(2)}%**
                                Win against: **${(100*p.hero[2].against_win/p.hero[2].against_games).toPrecision(2)}%**`,
                            inline: true 
                        }
                    )
                    // .setImage(p.pic)
                    .setTimestamp()
                    .setFooter(`I'll implement hero rating later, trust | Time taken: ${Date.now() - message.createdTimestamp}ms`); // Can take additional argument of a small picture

                message.channel.send(profileEmbed);
            })
            .catch(function(error) {
                console.log(error);
            })
            // responses[0].then(async function profile (data) {
            //     console.log(data);
            //     p.name = await data.profile.personaname;
            //     p.picture = await data.profile.avatar;
            //     p.country = await data.profile.loccountrycode;
            //     p.rank_tier = await data.rank_tier;
            //     p.mmr_estimate = await data.mmr_estimate.estimate;
            //     // message.channel.send(`Steam name: **${p.name}** \nCountry: **${p.country}** \nMedal: **${medal(p.rank_tier)}** \nEstimated MMR: **${p.mmr_estimate}**`);
            // })
            // responses[1].then(async function win_lose (data) {
            //     console.log(data);
            //     p.won = await data.win;
            //     p.lost = await data.lose;
            //     // message.channel.send(`Won games: **${p.won}** \nLost games: **${p.lost}** \nWinrate: **${(100 * p.won/(p.won + p.lost)).toPrecision(2)}%**`);
            // })
            // .then (() => {
            // })
            // .catch(function (err) {
            //     message.channel.send(`Fetch error ${err}`);
            // })
	},
};

// message.channel.send(`If this message shows up first before anything else, there's an async problem, also I can't make an embed? So formatting is cucked`);
// {
//     "tracked_until": "string",
//     "solo_competitive_rank": "string",
//     "competitive_rank": "string",
//     "rank_tier": 0,
//     "leaderboard_rank": 0,
//     "mmr_estimate": {
//         "estimate": 0,
//         "stdDev": 0,
//         "n": 0
//     },
//     "profile": {
//         "account_id": 0,
//         "personaname": "string",
//         "name": "string",
//         "plus": true,
//         "cheese": 0,
//         "steamid": "string",
//         "avatar": "string",
//         "avatarmedium": "string",
//         "avatarfull": "string",
//         "profileurl": "string",
//         "last_login": "string",
//         "loccountrycode": "string",
//         "is_contributor": false
//     }
// }
// [
//     {
//       "hero_id": "string",
//       "last_played": 0,
//       "games": 0,
//       "win": 0,
//       "with_games": 0,
//       "with_win": 0,
//       "against_games": 0,
//       "against_win": 0
//     }
//   ]