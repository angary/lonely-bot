const Discord = require(`discord.js`);
const fetch = require('node-fetch');

module.exports = {
	name: 'opendota',
    description: 'Uses opendota API to collect information on player',
    aliases: ['od'],
    args: true,
    usage: `<steamID>`,
    cooldown: 5,
	execute(message, args) {

        let url = `https://api.opendota.com/api/players/${args[0]}`


        fetch(`${url}`)
            .then(
                function (response) {
                    if (response.status !== 200) {
                        message.channel.send(`Looks like there was a problem. Status Code: ${response.status}`);
                        return;
                    }

                    // Examine the text in the response
                    response.json().then(function (data) {
                        let name = data.profile.personaname;
                        message.channel.send(`${name}'s rank tier is: ${data.rank_tier}, and mmr estimate is: ${data.mmr_estimate.estimate}`);
                    });
                }
            )
            .catch(function (err) {
                message.channel.send('Fetch Error :-S', err);
            });

        //     {
        //         "tracked_until": "string",
        //         "solo_competitive_rank": "string",
        //         "competitive_rank": "string",
        //         "rank_tier": 0,
        //         "leaderboard_rank": 0,
        //         "mmr_estimate": {
        //             "estimate": 0,
        //             "stdDev": 0,
        //             "n": 0
        //         },
        //         "profile": {
        //             "account_id": 0,
        //             "personaname": "string",
        //             "name": "string",
        //             "plus": true,
        //             "cheese": 0,
        //             "steamid": "string",
        //             "avatar": "string",
        //             "avatarmedium": "string",
        //             "avatarfull": "string",
        //             "profileurl": "string",
        //             "last_login": "string",
        //             "loccountrycode": "string",
        //             "is_contributor": false
        //         }
        //     }
	},
};