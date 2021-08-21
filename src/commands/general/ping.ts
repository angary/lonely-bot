import { Message } from "discord.js";
import { IBot, ICommand } from "../../interfaces/Bot";

export default class Ping implements ICommand {
  name: string = "ping";
  description: string = 'Sends back "Pong!" and the latency of user from bot server';
  information: string = "";
  aliases: string[] = [];
  args: boolean = false;
  usage: string = "";
  example: string = "";
  cooldown: number = 0;
  category: string = "general";
  guildOnly: boolean = false;
  execute: (message: Message, args: string[], client: IBot) => Promise<void> =
    ping;
}

function ping(message, args, client) {
  const ping = `${Date.now() - message.createdTimestamp} ms`;
  return message.channel.send(`Pong! Your ping is **${ping}**.`);
}
