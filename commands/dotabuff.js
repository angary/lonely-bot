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
                message.channel.send(`reponse.statusCode: ${response.statusCode}`)
            }
        });

        // Sends them a embed with the information about the hero
        const embed = new Discord.MessageEmbed()

            // Colour of background
            .setColor('#0099ff')

            // Text in blue (ideally hero name)
            .setTitle(args)

            // Link when the click on the title
            .setURL('https://discord.js.org/')

            // The thing at the very top of the embed
            .setAuthor('Lonely Bot', 'https://i.imgur.com/tFUPkxM.png', 'https://discord.js.org')

            // Information that comes underneath the hero name
            .setDescription('description here')

            // Lower thumbnail
            .setThumbnail('https://i.imgur.com/wSTFkRM.png')
            .addFields(
                { name: 'Regular field title', value: 'Some value here' },
                { name: '\u200B', value: '\u200B' },
                { name: 'Inline field title', value: 'Some value here', inline: true },
                { name: 'Inline field title', value: 'Some value here', inline: true },
            )
            .addField('Inline field title', 'Some value here', true)
            .setImage('https://i.imgur.com/wSTFkRM.png')
            .setTimestamp()
            .setFooter('Some footer text here', 'https://i.imgur.com/wSTFkRM.png');
            
            message.channel.send(embed);

            // Sends them a message at the bottom
        return message.channel.send(`Webscaping data not implemented yet.`);
	},
};