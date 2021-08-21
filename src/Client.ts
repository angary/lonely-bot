import { Collection, Client as DiscordClient } from 'discord.js';
import { IBot } from './interfaces/Bot';

export class Client extends DiscordClient implements IBot {
  public commands;
  public prefixes;
  public musicQueue;


}
