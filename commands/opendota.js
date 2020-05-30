// My code's a bit scuffed in this file. Still figuring things out
const fetch = require('node-fetch');

module.exports = {
	name: 'opendota',
    description: 'Uses opendota API to collect information on player',
    aliases: ['od'],
    args: true,
    usage: `<steamID>`,
    cooldown: 5,
    async execute(message, args) {

        // Declared variables
        let name = "string";
        let picture = "string";
        let country = "string";
        let rank_tier = "0";
        let mmr_estimate = "0";
        let won = "0";
        let lost = "0";

        // URL for fetching API
        let url = `https://api.opendota.com/api/players/${args[0]}`

        // TODO: Implement method for immortal
        function medal(rank) {

            if (rank === "none") {
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


        try {
            // Finds general information on the player
            await fetch(url)
                .then(
                    function (response) {
                        if (response.status !== 200) {
                            message.channel.send(`Looks like there was a problem. Status Code: ${response.status}`);
                            return;
                        }
                        response.json().then(function (data) {
                            console.log(data);
                            name = data.profile.personaname;
                            picture = data.profile.avatar;
                            country = data.profile.loccountrycode;
                            rank_tier = data.rank_tier;
                            mmr_estimate = data.mmr_estimate.estimate;
                        });
                    }
                )
                .catch(function (err) {
                    message.channel.send('Fetch Error :-S');
                    console.log(err);
                });
            
            // Finds information on player win loss
            await fetch(`${url}/wl`)
                .then(
                    function (response) {
                        if (response.status !== 200) {
                            message.channel.send(`Looks like there was a problem. Status Code: ${response.status}`);
                            return;
                        }
                        response.json().then(function (data) {
                            console.log(data);
                            won = data.win;
                            lost = data.lose;

                            // Temporary, as I can't get callback to work, and embed is not workinf=g
                            message.channel.send(`Steam name: **${name}** \nCountry: **${country}** \nMedal: **${medal(rank_tier)}** \nEstimated MMR: **${mmr_estimate}** \nWon games: **${won}** \nLost games: **${lost}** \nWinrate: **${(100 * won/(won + lost)).toFixed(2)}%**`)
                        });
                    }
                )
                .catch(function (err) {
                    message.channel.send('Fetch Error :-S');
                    console.log(err);
                });
        }
        catch (error) {
            message.channel.send(`error :-S`, error);
        }
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