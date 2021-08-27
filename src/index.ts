import { GuildModel } from "./database/Guild";
import { Client } from "./types/Client";
import { connect as mongooseConnect } from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

// Set up the bot user and commands
//------------------------------------------------------------------------------
const client = new Client("../", "dist/src/commands", "dist/src/events");

// Connect to mongoose database
//------------------------------------------------------------------------------
mongooseConnect(process.env.BOT_URI)
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
