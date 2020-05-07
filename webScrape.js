// A file to test out webscraping

// Include our dependancies(currently using javascript frameworks: request and cheerio)
const request = require('request');
// const cheerio = require('cheerio');

// The website that i am requesting, first argment is the URL, and the second argument is 
request('https://www.dotabuff.com/heroes/lone-druid', (error, response, html) => {
    // If there are no errors and statusCode is 200 (successful http response), then print out te html in the console.
    
    console.log(response.statusCode);
    console.log(html);
});
console.log('we gud');

