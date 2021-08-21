import { prefix, activity } from "../config.json";

import { IBot, IEvent } from "../interfaces/Bot";

export default class Ready implements IEvent {
  client: IBot;

  constructor(client: IBot) {
    this.client = client;
  }

  public async run(args: any): Promise<void> {
    try {
      this.client.user.setActivity(`${prefix}${activity}`);
      console.log(`Active in ${this.client.guilds.cache.size} servers!`);
      console.log(`${this.client.user.tag} is ready!`);
    } catch (err) {
      console.log(err);
    }
  }
}
