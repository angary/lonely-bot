// My code's a bit scuffed in this file. Still figuring things out
const fetch = require('node-fetch');

module.exports = {
	name: 'opendota',
    description: 'Uses opendota API to collect information on player',
    aliases: ['od'],
    args: true,
    usage: `<steamID>`,
    cooldown: 1,
    async execute(message, args) {

        // Declared variables
        let name = "don't";
        let picture = "string";
        let country = "know";
        let rank_tier = "how to use";
        let mmr_estimate = "callbacks";
        let won = "0";
        let lost = "0";

        // URL for fetching API

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

        Promise.all([profile, win_lose])
        .then ( stats => {

            // Error Checking
            for (let i = 0; i < stats.length; i++) {
                if (stats[i].status !== 200) {
                    message.channel.send(`Looks like there was a problem. Status Code: ${stats[i].status}`);
                    return;
                };
            }
            stats[0].json().then(function (data) {
                console.log(data);
                name = data.profile.personaname;
                picture = data.profile.avatar;
                country = data.profile.loccountrycode;
                rank_tier = data.rank_tier;
                mmr_estimate = data.mmr_estimate.estimate;
                message.channel.send(`Steam name: **${name}** \nCountry: **${country}** \nMedal: **${medal(rank_tier)}** \nEstimated MMR: **${mmr_estimate}**`);
            })
            stats[1].json().then(function (data) {
                console.log(data);
                won = data.win;
                lost = data.lose;
                message.channel.send(`Won games: **${won}** \nLost games: **${lost}** \nWinrate: **${(100 * won/(won + lost)).toFixed(2)}%**`);
            })
        })
        .catch(function (err) {
            message.channel.send(`Fetch error ${err}`);
        });
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