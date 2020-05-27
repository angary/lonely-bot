const request = require('request');
const cheerio = require('cheerio');


module.exports = {
	name: 'dankmemes',
    description: 'Webscrape reddit dankmemes',
    cooldown: 5,
	execute(message, args) {
        
        
        // Dld code which couldn't scrape website
        message.channel.send(`asdf`);

        request(`http://www.reddit.com/r/dankmemes/`, (error, response, html) => {

            if (!error && response.statusCode == 200) {
                
                
                // Assigns '$' to the html of the page
                const $ = cheerio.load(html);

                // Finds the h3 test and prints it in the console
                const posts = $('.rpBJOHq2PR60pnwJlUyP0');
                const titles = posts.find('h3').text();
                const pictures = posts.find('src');
                message.channel.send(pictures);
                message.channel.send(titles);
                
                message.channel.send('Function development was discontinued');
            }
            else {
                message.channel.send(`Error:\nreponse.statusCode was: ${response.statusCode}`);
            }
        })        
	},
};