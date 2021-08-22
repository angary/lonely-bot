import { Collection } from "discord.js";
import * as config from "../../config.json";
import { Cooldown } from "../interfaces/Bot";

import { IBot, IEvent } from "../interfaces/Bot";

export default class Message implements IEvent {
  client: IBot;
  cooldowns: Collection<String, Cooldown>;

  constructor(client: IBot) {
    this.client = client;
    this.cooldowns = new Collection();
  }

  public async run(args: any): Promise<void> {
    const [message] = args;

    // Does nothing if sender is a bot
    if (message.author.bot) return;

    // Check if there was a custom prefix, else use default
    const prefix = await this.findPrefix(message);

    if (!message.content.startsWith(prefix)) return;

    // Stores the arguments in a new array without the prefix and splits array into strings
    const messageArgs = message.content.slice(prefix.length).split(/ +/);

    // Removes the first argument as the command name, and converts to lower case
    const commandName = messageArgs.shift().toLowerCase();

    // Checks the commands folder if it has a command that the message requested
    const command =
      this.client.commands.get(commandName) ||
      this.client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );
    if (!command) return;

    // Errors with command
    //----------------------------------------------------------------------------

    // DMs
    if (command.guildOnly && message.channel.type !== "text") {
      return message.reply("I can't execute that command inside DMs!");
    }

    // No Arguments
    if (command.args && !args.length) {
      let reply = `You didn't provide any arguments, ${message.author}`;
      if (command.usage) {
        reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
      }
      if (command.example) {
        reply += `\nExample: \`${prefix}${command.name} ${command.example}\``;
      }
      return message.channel.send(reply);
    }

    // Cooldowns
    if (!this.cooldowns.has(command.name)) {
      this.cooldowns.set(command.name, new Collection());
    }
    const now = Date.now();
    const timestamps = this.cooldowns.get(command.name);
    const cooldownAmount = command.cooldown * 1000;

    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(
          `please wait ${timeLeft.toFixed(
            1
          )} more seconds before reusing the \`${command.name}\` command.`
        );
      }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    // Else executes the command
    //----------------------------------------------------------------------------
    try {
      command.execute(message, args);
    } catch (error) {
      message.reply("there was an error trying to execute that command");
      console.log(error);
    }
  }

  private async findPrefix(message) {
    if (this.client.prefixes.hasOwnProperty(message.guild.id)) {
      return this.client.prefixes[message.guild.id];
    }
    return config.prefix;
  }
}
