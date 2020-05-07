const Discord = require(`discord.js`);
const request = require('request');

module.exports = {
	name: 'dotabuff',
    description: 'Webscrape dotabuff',
    args: true,
    usage: `<hero name>`,
    cooldown: 5,
	execute(message, args) {

        // Converts the hero name into lower case, and concatenates it with '+'
        let totalHeroName = '';
        for (let i = 0; i < args.length; i++) {
            totalHeroName += args[i].toLowerCase();

            // Adds the dashes inbetween the words
            if (i < args.length - 1) {
                totalHeroName += '-';
            }
        }

        // Sends them the link that they were going to webscrape
        message.channel.send(`Going to check url at: https://www.dotabuff.com/heroes/${totalHeroName}`);

        // The website that i am requesting, first argment is the URL, and the second argument is 
        request(`https://www.dotabuff.com/heroes/${totalHeroName}`, (error, response, html) => {
            // If there are no errors and statusCode is 200 (successful http response), then print out te html in the console.
            if (!error && response.statusCode == 200) {
                message.channel.send(`Was able to get site information`);
            }
            else if (response.statusCode != 200) {
                message.channel.send(`Error: reponse.statusCode: ${response.statusCode}`)
            }
            if (response.statusCode == 429) {
                message.channel.send(
                    `Dotabuff is limiting requests to 0 or smthing. In fact, this command is completely useless but I'm leaving it here as a proof of failure of concept.`)
            }
        });
	},
};