require("dotenv").config();
import { Collection } from "discord.js";
import { readdirSync } from "fs";
import { Client } from "./Client";
import { GuildModel } from "./database/Guild";
const mongoose = require("mongoose");

// Set up the bot user and commands
//------------------------------------------------------------------------------
const client = new Client();
client.commands = new Collection();
client.prefixes = {};
client.musicQueue = new Map();

console.log(__dirname);

// Load all the commands
//------------------------------------------------------------------------------
readdirSync("./dist/commands").forEach((dir) => {
  const commands = readdirSync(`./dist/commands/${dir}`).filter((f) =>
    f.endsWith(".js")
  );
  for (const file of commands) {
    const command = require(`./commands/${dir}/${file}`);
    console.log(`Loaded command ${dir}/${file}`);
    client.commands.set(command.name, command);
  }
});

// Load all the events
//------------------------------------------------------------------------------
const eventFiles = readdirSync("./dist/events/").filter((f) => f.endsWith(".js"));
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
    GuildModel.find()
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
