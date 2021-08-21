import { GuildModel } from "../database/Guild";
import { IBot, IEvent } from "../interfaces/Bot";

export default class GuildDelete implements IEvent {
  client: IBot;

  constructor(client: IBot) {
    this.client = client;
  }

  public async run(args: any): Promise<void> {
    const [guild] = args;
    // If the bot is removed from a server, remove the server from database
    GuildModel.remove({ guildId: guild.id }).catch((err) => console.log(err));
  }
}
