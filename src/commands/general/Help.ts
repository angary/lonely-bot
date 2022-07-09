import { prefix, githubLink, inviteLink } from "../../../config.json";
import { Command } from "../../Command";
import { SlashCommandBuilder } from "@discordjs/builders";
import {
  Collection,
  CommandInteraction,
  Message,
  MessageEmbed,
} from "discord.js";

export default class Help extends Command {
  name = "help";
  visible = true;
  description = "List all of my commands or info about a specific command";
  information = this.description;
  aliases = ["commands"];
  args = false;
  usage = "[command name]";
  example = "help";
  cooldown = 0;
  category = "general";
  guildOnly = false;
  data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to get specific information on")
    );
  execute = (message: Message, args: string[]): Promise<Message> => {
    const helpEmbed = this.help(args[0]);
    return message.channel.send({ embeds: [helpEmbed] });
  };

  executeSlash = (interaction: CommandInteraction): Promise<void> => {
    const helpEmbed = this.help(interaction.options.getString("command"));
    return interaction.reply({ embeds: [helpEmbed] });
  };

  /**
   * @param command the specific command to get help on
   * @returns help embed for general help ro specific help for a command based
   *          off arguments
   */
  private help(command?: string): MessageEmbed {
    const commands = this.client.commands;
    const helpEmbed = this.createColouredEmbed();
    if (!command) {
      this.generalInformation(helpEmbed, commands);
    } else {
      this.specificInformation(helpEmbed, commands, command);
    }
    return helpEmbed;
  }

  /**
   * Add general information to an embed and send it
   *
   * @param helpEmbed the MessageEmbed to add details to
   * @param commands a collection of the bot's command
   */
  private generalInformation(
    helpEmbed: MessageEmbed,
    commands: Collection<string, Command>
  ): void {
    // Add all the details of the commands
    helpEmbed.setTitle("Available commands");
    ["general", "dota", "music"].forEach((category) =>
      this.addCategory(category, helpEmbed, commands)
    );
    this.addHelpAndSupport(helpEmbed);
    helpEmbed.setFooter({
      text: `You can send "/help [command name]" to get info on a specific command!`,
    });
  }

  /**
   * Adds general information on commands of the specified category
   *
   * @param category the name of the category
   * @param helpEmbed the MessageEmbed to add details to
   * @param commands a collection of the bot's commands
   */
  private addCategory(
    category: string,
    helpEmbed: MessageEmbed,
    commands: Collection<string, Command>
  ): void {
    // Add it to the embed
    helpEmbed.addField(
      `**${category.charAt(0).toUpperCase() + category.slice(1)}**`,
      commands
        .filter((command) => command.category === category && command.visible)
        .map((command) => `**${command.name}**: ${command.description}\n`)
        .join("")
    );
  }

  /**
   * Adds specific information about a command
   *
   * @param name the arguments given by the user
   * @param helpEmbed the MessageEmbed to add details to
   * @param commands a collection of the bot's commands
   */
  private specificInformation(
    helpEmbed: MessageEmbed,
    commands: Collection<string, Command>,
    name: string
  ): void {
    // Check if the command exists
    name = name.toLowerCase();
    const command =
      commands.get(name) ||
      commands.find((c) => c.aliases && c.aliases.includes(name));
    if (!command) throw Error("Command given was not valid!");

    // Else find information on the command
    helpEmbed.setTitle(`Help for: ${command.name}`);
    let d = `**Information:** ${command.information}`;
    if (command.aliases.length) {
      d += `\n**Aliases:** ${command.aliases.join(", ")}`;
    }
    ["usage", "example"]
      .filter((f) => command[f])
      .forEach(
        (f) => (d += `\n**${f}:** \`${prefix}${command.name} ${command[f]}\``)
      );
    if (command.cooldown) {
      d += `\n**Cooldown:** ${command.cooldown} second(s)`;
    }
    helpEmbed.setDescription(d);
  }

  /**
   * Adds details such as how to add the bot to another server, and link to
   * source code
   *
   * @param helpEmbed the MessageEmbed to add details to
   */
  private addHelpAndSupport(helpEmbed: MessageEmbed): void {
    helpEmbed.addField(
      "**Help and Support**",
      `Add lonely to your server: **[Link](${inviteLink})**\n \
      If slash commands do not appear, reinvite this bot with the link above.\n \
      I'm **[open source](${githubLink})**! Feel free to add an issue or make a PR.`
    );
  }
}
