import { Command } from "../../types/Command";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Message } from "discord.js";

export default class Ping extends Command {
  name = "ping";
  visible = false;
  description = "Sends back 'Pong!' and the latency of user from bot server";
  information = "";
  aliases = [];
  args = false;
  usage = "";
  example = "";
  cooldown = 0;
  category = "general";
  guildOnly = false;
  data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description);
  execute = (message: Message): Promise<Message> => {
    return message.channel.send(this.ping(message.createdTimestamp));
  };
  executeSlash = (interaction: CommandInteraction): Promise<void> => {
    return interaction.reply(this.ping(interaction.createdTimestamp));
  };

  private ping(startTime: number): string {
    const ping = Date.now() - startTime;
    return `Pong! Your ping is **${ping} ms**`;
  }
}
