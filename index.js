const Discord = require('discord.js');
const { prefix } = require('./config.json');
const fs = require('fs');
const mongoose = require('mongoose');

const client = new Discord.Client();

// Load all the commands
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}


// Connect to mongoose database
mongoose.connect(process.env.BOT_URI, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(() => {
    // If it connects
    console.log("Connected to MongoDB");
}).catch((err) => {
    // If it couldn't connect
    console.log("Was not able to connect to MongoDB", err);
});


const cooldowns = new Discord.Collection();


client.once('ready', () => {

    // Prints out ready in the console 
    console.log('Ready!');

    // Sets it's activity (what discord says it's doing)
    client.user.setActivity(`${prefix}jebeta`);
});


// Responses to messages
////////////////////////////////////////////////////////////////////////////////
client.on('message', message => {

    // Does nothing if it doesn't being with the proper prefix
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    // Stores the arguments in a new array without the prefix and splits array into strings
    const args = message.content.slice(prefix.length).split(/ +/);

    // Removes the first argument as the command name, and converts to lower case
    const commandName = args.shift().toLowerCase();

    
    // Checks the commands folder if it has a command that the message requested
    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;

    // Errors with command
    //--------------------------------------------------------------------------

    // DMs
    if (command.guildOnly && message.channel.type != 'text') {
        return message.reply(`I can't execute that command inside DMs!`);
    }

    // No Arguments
    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}`;
        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name}${command.usage}\``;
        }
        return message.channel.send(reply);
    }

    // Cooldowns
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`please wait ${timeLeft.toFixed(1)} more seconds before reusing the \`${command.name}\` command.`)
        }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // Else executes the command
    //--------------------------------------------------------------------------
    try {
        command.execute(message, args);
    } catch (error) {
        message.reply('there was an error trying to execute that command');
    }
});

client.login(process.env.BOT_TOKEN)