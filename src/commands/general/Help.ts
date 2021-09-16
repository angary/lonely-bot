import { prefix, githubLink, inviteLink } from "../../../config.json";
import { Command } from "../../types/Command";
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
  information = "";
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
    let helpEmbed: MessageEmbed;
    if (args.length > 0) {
      helpEmbed = this.help(args[0]);
    } else {
      helpEmbed = this.help();
    }
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

    if (command === undefined || command === null) {
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

    this.addCategory("general", helpEmbed, commands);
    this.addCategory("dota", helpEmbed, commands);
    this.addCategory("music", helpEmbed, commands);
    this.addHelpAndSupport(helpEmbed);
    helpEmbed.setFooter(
      `You can send "/help [command name]" to get info on a specific command!`
    );
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
    // Format the relevant data, not sure how to use filter function
    const data = [];
    const dataCommands = commands;
    data.push(
      dataCommands
        .map((command) => {
          if (command.category === category && command.visible) {
            return `**${command.name}**: ${command.description}\n`;
          } else {
            return "";
          }
        })
        .join("")
    );

    // Add it to the embed
    helpEmbed.addField(
      `**${category.charAt(0).toUpperCase() + category.slice(1)}**`,
      data.join("\n"),
      false
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
    const data = [];
    if (command.aliases.length > 0) {
      data.push(`**Aliases:** ${command.aliases.join(", ")}`);
    }
    if (command.information) {
      data.push(`**Information:** ${command.information}`);
    } else if (command.description) {
      data.push(`**Information:** ${command.description}`);
    }
    if (command.usage) {
      data.push(`**Usage:** \`${prefix}${command.name} ${command.usage}\``);
    }
    if (command.example) {
      data.push(`**Example:** \`${prefix}${command.name} ${command.example}\``);
    }
    if (command.cooldown) {
      data.push(`**Cooldown:** ${command.cooldown} second(s)`);
    }
    helpEmbed.setDescription(data.join("\n"));
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
