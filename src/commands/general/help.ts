import {
  prefix,
  clientName,
  profilePicture,
  githubLink,
} from "../../config.json";

import { Message, MessageEmbed } from "discord.js";
import { IBot, ICommand } from "../../interfaces/Bot";

export default class Help implements ICommand {
  name: string = "help";
  description: string = "List all of my commands or info about a specific command.";
  information: string = "";
  aliases: string[] = ["commands"];
  args: boolean = false;
  usage: string = "[command name]";
  example: string = "help";
  cooldown: number = 0;
  category: string = "general";
  guildOnly: boolean = false;
  execute: (message: Message, args: string[], client: IBot) => Promise<void> =
    help;
}

function help(message, args, client) {
  const { commands } = message.client;
  let helpEmbed = new MessageEmbed()
    .setColor("#0099ff")
    .setAuthor(clientName, profilePicture, githubLink);

  // If they didn't specify a specific command
  if (!args.length) {
    helpEmbed = generalInformation(helpEmbed, commands);
  } else {
    try {
      helpEmbed = specificInformation(args, helpEmbed, commands);
    } catch {
      return message.channel.send(
        `${message.author} Command **${args[0]}** was not valid!`
      );
    }
  }
  message.channel.send(helpEmbed);
}

function generalInformation(helpEmbed, commands) {
  // Add all the details of the commands
  helpEmbed.setTitle("Available commands");

  addCategory("general", helpEmbed, commands);
  addCategory("dota", helpEmbed, commands);
  addCategory("music", helpEmbed, commands);
  helpEmbed.setFooter(
    `You can send '${prefix}help [command name]' to get info on a specific command!`
  );
  return helpEmbed;
}

// Add relevant category to the embed
function addCategory(category, helpEmbed, commands) {
  // Format the relevant data, not sure how to use filter function
  const data = [];
  const dataCommands = commands;
  data.push(
    dataCommands
      .map((command) => {
        if (command.category == category) {
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

function specificInformation(args, helpEmbed, commands) {
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
  return helpEmbed;
}
