# Discord Lonely Bot
Link to add to your server: <br>
https://discordapp.com/api/oauth2/authorize?client_id=647044127313362980&permissions=8&scope=bot



# Table Of Contents
1. [Current Capabilities](#To-Do-List)
2. [Setup](#Setup)
3. [Extra Information](#Extra-Information)



# Current Capabilities: <a name="To-Do-List"></a>
1. Can analyse multiple word hero names, and 
2. Find a method to search up two-word hero names
3. Find a method to webscrape using javascript
4. Find a method to implement this all into the discord bot



# Setup <a name="Setup"></a>
## Node.js
You'll need node.js to run the javascript code<br>
Download [here](https://nodejs.org/en/download/)


## Discord.js
This will provide the libraries for interacting with the Discord api<br>
**Node.js 12.0.0 or newer is required.**  
Ignore any warnings about unmet peer dependencies, as they're all optional.

Without voice support: `npm install discord.js`  
With voice support ([@discordjs/opus](https://www.npmjs.com/package/@discordjs/opus)): `npm install discord.js @discordjs/opus`  
With voice support ([opusscript](https://www.npmjs.com/package/opusscript)): `npm install discord.js opusscript`<br>
Example usage:<br>

```js
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong');
  }
});

client.login('token');
```


## request
This will allow you to make http calls (used for webscraping)<br>
`npm install request`<br>
Example usage:<br>
```js
const request = require('request');

request('http://www.google.com', function (error, response, body) {
  console.error('error:', error); // Print the error if one occurred
  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  console.log('body:', body); // Print the HTML for the Google homepage.
});
```


## cheerio
Maybe it will be used (not sure yet). It's just something that'll be used for manipulating webdata.<br>
`npm install cheerio`<br>
Example usage:<br>
```js
const cheerio = require('cheerio')
const $ = cheerio.load('<h2 class="title">Hello world</h2>')

$('h2.title').text('Hello there!')
$('h2').addClass('welcome')

$.html()
//=> <html><head></head><body><h2 class="title welcome">Hello there!</h2></body></html>
```



# Extra Information <a name="Extra-Information"></a>
- Don't actually have a server, so unless someone is running it, the bot's actually offline; either that or I keep my PC on 24/7

[comment]: <> (HeHeXD)
