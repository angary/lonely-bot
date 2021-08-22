require("dotenv").config();
import { readdirSync, statSync } from "fs";
import { join } from "path";
import { Client } from "./Client";
import { Command } from "./commands/Command";
import { GuildModel } from "./database/Guild";
import { IEvent } from "./interfaces/Bot";
const mongoose = require("mongoose");

// Set up the bot user and commands
//------------------------------------------------------------------------------
const client = new Client();

// Load all the commands
//------------------------------------------------------------------------------
const commandPath: string = "./dist/src/commands";
readdirSync(commandPath).forEach((dir) => {
  if (statSync(join(commandPath, dir)).isDirectory()) {
    const commands = readdirSync(`${commandPath}/${dir}`).filter((f) =>
      f.endsWith(".js")
    );
    for (const file of commands) {
      const foundCommand: any = require(`./commands/${dir}/${file}`).default;
      const command: Command = new foundCommand(client);
  
      console.log(`Loaded command ${dir}/${file}`);
      client.commands.set(command.name, command);
    }
  }
});

// Load all the events
//------------------------------------------------------------------------------
const eventFiles = readdirSync("./dist/src/events/").filter((f) =>
  f.endsWith(".js")
);
for (const file of eventFiles) {
  const Event: any = require(`./events/${file}`).default;
  const event: IEvent = new Event(client);
  const eventName = file.split(".")[0];

  client.on(
    eventName.charAt(0).toLowerCase() + eventName.slice(1),
    (...args: string[]) => event.run(args)
  );
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
