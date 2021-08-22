import { Message } from "discord.js";
import { IBot, ICommand } from "../interfaces/Bot";

export abstract class Command implements ICommand {
  client: IBot;
  name: string;
  description: string;
  information: string;
  aliases: string[];
  args: boolean;
  usage: string;
  example: string;
  cooldown: number;
  category: string;
  guildOnly: boolean;
  execute: (
    message: Message,
    args: string[],
  ) => void | Promise<any>;

  constructor(client: IBot) {
    this.client = client;
  }
}
