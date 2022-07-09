import { Event } from "../Event";
import { GuildModel } from "../models/Guild";
import { Guild } from "discord.js";

export default class GuildDelete extends Event {
  run = async (args: Guild[]): Promise<void> => {
    const [guild] = args;
    // If the bot is removed from a server, remove the server from database
    GuildModel.deleteOne({ guildId: guild.id }).catch((err) =>
      console.log(err)
    );
  };
}
