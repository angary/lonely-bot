import { Message } from "discord.js";
import { Command } from "../Command";

export default class Ping extends Command {
  name: string = "ping";
  description: string =
    'Sends back "Pong!" and the latency of user from bot server';
  information: string = "";
  aliases: string[] = [];
  args: boolean = false;
  usage: string = "";
  example: string = "";
  cooldown: number = 0;
  category: string = "general";
  guildOnly: boolean = false;
  execute = (message: Message, args: string[]): Promise<any> => {
    const ping = `${Date.now() - message.createdTimestamp} ms`;
    return message.channel.send(`Pong! Your ping is **${ping}**.`);
  };
}
