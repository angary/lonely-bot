import { Client } from "../Client";
import { IBot, ICommand } from "../interfaces/Bot";
import { Message } from "discord.js";

export abstract class Command implements ICommand {
  client: Client;
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

  /**
   * @param message the message to respond to
   * @param args the rest of the arguments given to the command
   * @returns A promise to the message sent back or void if there is none
   */
  execute: (message: Message, args: string[]) => Promise<Message>;

  constructor(client: IBot) {
    this.client = client;
  }
}
