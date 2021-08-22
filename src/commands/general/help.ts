import { prefix, githubLink, inviteLink } from "../../../config.json";
import { Command } from "../../types/Command";
import { ICommand } from "../../types/interfaces/Bot";
import { Collection, Message, MessageEmbed } from "discord.js";

export default class Help extends Command {
  name = "help";
  visible = true;
  description = "List all of my commands or info about a specific command.";
  information = "";
  aliases: string[] = ["commands"];
  args = false;
  usage = "[command name]";
  example = "help";
  cooldown = 0;
  category = "general";
  guildOnly = false;
  execute = (message: Message, args: string[]): Promise<Message> => {
    const commands = this.client.commands;
    const helpEmbed = new MessageEmbed().setColor("#0099ff");

    // If they didn't specify a specific command
    if (!args.length) {
      generalInformation(helpEmbed, commands);
    } else {
      try {
        specificInformation(args, helpEmbed, commands);
      } catch {
        return message.channel.send(
          `${message.author} Command **${args[0]}** was not valid!`
        );
      }
    }
    message.channel.send(helpEmbed);
  };
}

function generalInformation(
  helpEmbed: MessageEmbed,
  commands: Collection<string, ICommand>
): void {
  // Add all the details of the commands
  helpEmbed.setTitle("Available commands");

  addCategory("general", helpEmbed, commands);
  addCategory("dota", helpEmbed, commands);
  addCategory("music", helpEmbed, commands);
  addHelpAndSupport(helpEmbed);
  helpEmbed.setFooter(
    `You can send "${prefix}help [command name]" to get info on a specific command!`
  );
}

// Add relevant category to the embed
function addCategory(
  category: string,
  helpEmbed: MessageEmbed,
  commands: Collection<string, ICommand>
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
  helpEmbed.addFields({
    name: `**${category.charAt(0).toUpperCase() + category.slice(1)}**`,
    value: data,
  });
}

function specificInformation(
  args: string[],
  helpEmbed: MessageEmbed,
  commands: Collection<string, ICommand>
): void {
  // Check if the command exists
  const name = args[0].toLowerCase();
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
  helpEmbed.setDescription(data);
  addHelpAndSupport(helpEmbed);
}

function addHelpAndSupport(helpEmbed: MessageEmbed): void {
  helpEmbed.addField(
    "**Help and Support**",
    `Add lonely to your server: **[Link](${inviteLink})**\n \
    I'm open source! You can find my code here **[Link](${githubLink})**\n \
    Feel free to add an issue or make a pull request!`
  );
}
