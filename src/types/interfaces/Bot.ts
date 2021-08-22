import { Client, Collection, Message } from "discord.js";

export interface IBot extends Client {
  commands: Collection<string, ICommand>;
  prefixes: { [key: number]: string };
  musicQueue;
}

export interface ICommand {
  name: string;
  visible: boolean;
  description: string;
  information: string;
  aliases: string[];
  args: boolean;
  usage: string;
  example: string;
  cooldown: number;
  category: string;
  guildOnly: boolean;
  execute: (message: Message, args: string[]) => Promise<Message>;
}

export interface IEvent {
  client: Client;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  run: (args?: any[]) => void;
}

export type Cooldown = Collection<string, number>;

export interface IHero {
  name: string;
  count: number;
  winrate: number;
  disadvantage: number;
}
