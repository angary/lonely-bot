const Discord = require('discord.js');
const { prefix } = require('./config.json');
const fs = require('fs');
const mongoose = require('mongoose');

// Set up the bot user and commands
const client = new Discord.Client();
client.commands = new Discord.Collection();

// Load all the commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

// Load all the events
const eventFiles = fs.readdirSync('./events/').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    const eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
}


// Connect to mongoose database
mongoose.connect(process.env.BOT_URI, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.log("Was not able to connect to MongoDB", err);
});


// Login
client.login(process.env.BOT_TOKEN);