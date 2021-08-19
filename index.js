require("dotenv").config();
const Discord = require("discord.js");
const fs = require("fs");
const mongoose = require("mongoose");
const Guild = require("./database/guild");

// Set up the bot user and commands
//------------------------------------------------------------------------------
const client = new Discord.Client();
client.commands = new Discord.Collection();
client.prefixes = {};

// Load all the commands
//------------------------------------------------------------------------------
fs.readdirSync("./commands").forEach(dir => {
  const commands = fs.readdirSync(`./commands/${dir}`).filter(f => f.endsWith(".js"));
  for (const file of commands) {
    const command = require(`./commands/${dir}/${file}`);
    console.log(`Loaded command ${dir}/${file}`);
    client.commands.set(command.name, command);
  }
});

// Load all the events
//------------------------------------------------------------------------------
const eventFiles = fs.readdirSync("./events/").filter(f => f.endsWith(".js"));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  const eventName = file.split(".")[0];
  client.on(eventName, event.bind(null, client));
}

// Connect to mongoose database
//------------------------------------------------------------------------------
mongoose
  .connect(process.env.BOT_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .then(() => {
    Guild.find()
      .then((guilds) => {
        guilds.forEach((guild) => {
          client.prefixes[guild.guildId] = guild.prefix;
        });
      })
      .catch((err) => {
        console.log("Unable to cache server ids", err);
      });
  })
  .catch((err) => {
    console.log("Was not able to connect to MongoDB", err);
  });

// Login
//------------------------------------------------------------------------------
client.login(process.env.BOT_TOKEN);
