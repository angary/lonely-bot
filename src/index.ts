import { GuildModel } from "./database/Guild";
import { Client } from "./types/Client";
import { connect as mongooseConnect } from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

// Set up the bot user and commands
//------------------------------------------------------------------------------
const dev: boolean = process.argv[0].endsWith("ts-node");
const commandPaths: string = dev ? "src/commands" : "dist/src/commands";
const eventsPath: string = dev ? "src/events" : "dist/src/events";
const client = new Client(
  commandPaths,
  eventsPath,
  process.env.BOT_TOKEN,
  process.env.TEST_SERVER_ID
);

// Connect to mongoose database
//------------------------------------------------------------------------------
mongooseConnect(process.env.BOT_URI)
  .then(() => {
    console.log("Connected to MongoDB");
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
try {
  client.login(process.env.BOT_TOKEN);
} catch (error) {
  console.log(`Error logging in: ${error}`);
}
