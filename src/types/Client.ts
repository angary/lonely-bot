import { Command } from "./Command";
import { IServerMusicQueue } from "./interfaces/Bot";
import { Collection, Client as DiscordClient } from "discord.js";

export class Client extends DiscordClient {
  commands: Collection<string, Command>;
  prefixes: { [key: number]: string };
  musicQueue: Map<string, IServerMusicQueue>;

  public constructor() {
    super();
    this.commands = new Collection();
    this.prefixes = {};
    this.musicQueue = new Map();
  }
}
