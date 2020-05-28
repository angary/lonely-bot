const Discord = require(`discord.js`);
const fetch = require('node-fetch');

module.exports = {
	name: 'betaopendota',
    description: 'Uses opendota API to collect information on player',
    aliases: ['od'],
    args: true,
    usage: `<steamID>`,
    cooldown: 5,
    
    async execute(message, args) {

        global.name = "string";
        global.picture = "string";
        global.country = "string";
        global.rank_tier = "0";
        global.mmr_estimate = "0";
        global.won = "0";
        global.lost = "0";

        let url = `https://api.opendota.com/api/players/${args[0]}`

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
                            global.name = data.profile.personaname;
                            global.picture = data.profile.avatar;
                            global.country = data.profile.loccountrycode;
                            global.rank_tier = data.rank_tier;
                            global.mmr_estimate = data.mmr_estimate.estimate;
                        });
                    }
                )
                .catch(function (err) {
                    message.channel.send('Fetch Error :-S', err);
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
                            global.won = data.win;
                            global.lost = data.lose;
                            message.channel.send(`**name:** ${name} **country:** ${country} **medal:** ${rank_tier} **mmr:** ${mmr_estimate} **win:** ${won} **lose:** ${lost} `)
                        });
                    }
                )
                .catch(function (err) {
                    message.channel.send('Fetch Error :-S', err);
                });
            

        }
        catch (error) {
            message.channel.send(`error :-S`, error);
        }

        
        message.channel.send(`If this message shows up first before anything else, there's an async problem, also I can't make an embed? So formatting is cucked`);

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