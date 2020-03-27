// Initial stuff
const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./auth.json');

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(auth.token);

// Status
client.on('ready', () => {
    client.user.setActivity("I'm actually kind of a useless bot")
});

// Help
client.on('message', msg => {
    if (msg.content === '!help') {
        msg.reply("Gary is too rarted to know how to program anything yet.");
    }
});

// Msg/reply; lol
client.on('message', msg => {
    if (msg.content === 'lol') {
        msg.reply(
            "I wish I could understand people like you. What does replying lol accomplish? Do you think it angers me?",
            "Do you think myself or everyone else who obviously is looking at you like a crazy person are actually the",
            "crazy ones? Please enlighten me. Are you just always pissed and childish towards anyone who doesn't have",
            "your views? Do these sentences even make you think anything at all? What sentences do you choose to read",
            "and why do you ignore the ones you do? Did you even read the response before angrily typing?",
            "Do you do the same at work? With your family? Or were you brought up the same way and are now just",
            "emulating your parents? Are you a terrible troll or just a genuine awful person who literally ignores facts?");
    }
});

// Ping
client.on('message', msg => {
    if (msg.content === '!ping') {
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
    }
});

