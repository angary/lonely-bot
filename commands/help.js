const { prefix, clientName, profilePicture, githubLink } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
  name: 'help',
  description: 'List all of my commands or info about a specific command.',
  information: '',
  aliases: ['commands'],
  args: false,
  usage: '[command name]',
  cooldown: 0,
  category: 'misc',
  execute (message, args) {
    const { commands } = message.client;
    let helpEmbed = new Discord.MessageEmbed()
      .setColor('#0099ff')
      .setAuthor(
        clientName,
        profilePicture,
        githubLink
      );

    // If they didn't specify a specific commmand
    if (!args.length) {
      helpEmbed = generalInformation(helpEmbed, commands);
    } else {
      try {
        helpEmbed = specificInformation(args, helpEmbed, commands);
      } catch {
        return message.channel.send(`${message.author} Command **${args[0]}** was not valid!`);
      }
    }
    message.channel.send(helpEmbed);
  }
};

function generalInformation (helpEmbed, commands) {
  // Add all the details of the commands
  helpEmbed.setTitle('Avaliable commands');

  // Add relevant category to the embed
  function addCategory (category) {
    // Format the relevant data, not sure how to use filter function
    const data = [];
    const dataCommands = commands;
    data.push(
      dataCommands.map(function (command) {
        if (command.category == category) return `**${command.name}**: ${command.description}\n`;
        return '';
      }).join('')
    );

    // Add it to the embed
    helpEmbed.addFields({
      name: `**${category.charAt(0).toUpperCase() + category.slice(1)}**`,
      value: data
    });
  }

  addCategory('dota');
  addCategory('misc');
  helpEmbed.setFooter(`You can send '${prefix}help [command name]' to get info on a specific command!`);
  return helpEmbed;
}

function specificInformation (args, helpEmbed, commands) {
  // Check if the command exists
  const name = args[0].toLowerCase();
  const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));
  if (!command) throw Error('Command given was not valid!');

  // Else find information on the command
  helpEmbed.setTitle(`Help for: ${command.name}`);
  const data = [];
  if (command.aliases) {
    data.push(`**Aliases:** ${command.aliases.join(', ')}`);
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
