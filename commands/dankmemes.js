const request = require('request');

module.exports = {
	name: 'dankmemes',
    description: 'Webscrape reddit dankmemes',
    cooldown: 5,
	execute(message, args) {
        
        message.channel.send(`asdf`);

        request(`https://www.reddit.com/r/dankmemes/`, (error, response, html) => {
            if (!error && response.statusCode == 200) {
                message.channel.send(`Success`);
                console.log(response);
            }
            else {
                message.channel.send(`Error: reponse.statusCode: ${response.statusCode}`);
            }
        })
	},
};