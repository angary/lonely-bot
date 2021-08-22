import { GuildModel } from "./database/Guild";
import { Client } from "./types/Client";
import { Command } from "./types/Command";
import { Event } from "./types/Event";
import { readdirSync, statSync } from "fs";
import { connect as mongooseConnect } from "mongoose";
import { join } from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

// Set up the bot user and commands
//------------------------------------------------------------------------------
const client = new Client();

// Load all the commands
//------------------------------------------------------------------------------
const commandPath = "./dist/src/commands";
readdirSync(commandPath).forEach((dir) => {
  if (statSync(join(commandPath, dir)).isDirectory()) {
    const commandFiles = readdirSync(`${commandPath}/${dir}`).filter((f) =>
      f.endsWith(".js")
    );
    for (const file of commandFiles) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const FoundCommand = require(`./commands/${dir}/${file}`).default;
      const command: Command = new FoundCommand(client);

      console.log(`Loaded command ${dir}/${file}`);
      client.commands.set(command.name, command);
    }
  }
});

// Load all the events
//------------------------------------------------------------------------------
const eventPath = "./dist/src/events";
const eventFiles = readdirSync(eventPath).filter(
  (f) => f.endsWith(".js") && f !== "Event.js"
);
for (const file of eventFiles) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const FoundEvent = require(`./events/${file}`).default;
  console.log(FoundEvent);
  const event: Event = new FoundEvent(client);
  const eventName = file.split(".")[0];

  client.on(
    eventName.charAt(0).toLowerCase() + eventName.slice(1),
    (...args: string[]) => event.run(args)
  );
}

// Connect to mongoose database
//------------------------------------------------------------------------------
mongooseConnect(process.env.BOT_URI, {
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
