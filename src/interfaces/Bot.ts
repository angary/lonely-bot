import { Client, Collection, Message } from "discord.js";

export interface IBot extends Client {
  commands;
  prefixes;
  musicQueue;
}

export interface ICommand {
  name: string;
  description: string;
  information: string;
  aliases: boolean;
  args: boolean;
  usage: string;
  example: string;
  cooldown: number;
  category: string;
  execute: (message: Message, args: string[], client: IBot) => Promise<void>;
}

export type Cooldown = Collection<string, number>;

export interface IHero {
  name: string;
  count: number;
  winrate: number;
  disadvantage: number;
}
