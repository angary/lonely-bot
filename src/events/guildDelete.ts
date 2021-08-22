import { GuildModel } from "../database/Guild";
import { Event } from "./Event";

export default class GuildDelete extends Event {
  run = async (args: any): Promise<void> => {
    const [guild] = args;
    // If the bot is removed from a server, remove the server from database
    GuildModel.remove({ guildId: guild.id }).catch((err) => console.log(err));
  };
}
