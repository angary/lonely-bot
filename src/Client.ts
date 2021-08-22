import { IBot, ICommand } from "./interfaces/Bot";
import { Collection, Client as DiscordClient } from "discord.js";

export class Client extends DiscordClient implements IBot {
  commands: Collection<string, ICommand>;
  prefixes: { [key: number]: string };
  musicQueue;

  constructor() {
    super();
    this.commands = new Collection();
    this.prefixes = {};
    this.musicQueue = new Map();
  }
}
