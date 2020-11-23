const { prefix } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
  name: 'help',
  description: 'List all of my commands or info about a specific command.',
  aliases: ['commands'],
  args: false,
  usage: '[command name]',
  cooldown: 0,
  execute (message, args) {
    const data = [];
    const { commands } = message.client;

    // If they didn't specify a specific commmand
    if (!args.length) {
      // Add all the details of the commands
      data.push(
        commands.map(command => `**${command.name}**: ${command.description}`).join('\n')
      );

      // Format data and send am embed to channel
      const helpEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('Avaliable commands')
        .setAuthor(
          'Lonely Bot',
          'https://i.imgur.com/b0sTfNL.png',
          'https://github.com/Gy74S/Lonely-Bot'
        )
        .setDescription(data)
        .setFooter(`You can send \`${prefix}help [command name]\` to get info on a specific command!`);
      return message.channel.send(helpEmbed);
    }

    // Else find information about the single command
    const name = args[0].toLowerCase();
    const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

    // If it cannot find a proper commmand name then respond
    if (!command) return message.reply("that's not a valid command!");

    // Else collect relevant information and send
    if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
    if (command.information) data.push(`**Information:** ${command.information}`);
    else if (command.description) data.push(`**Information:** ${command.description}`);
    if (command.usage) data.push(`**Usage:** \`${prefix}${command.name} ${command.usage}\``);
    data.push(`**Cooldown:** ${command.cooldown} second(s)`);

    const helpEmbed = new Discord.MessageEmbed()
      .setColor('#0099ff')
      .setTitle(`Help for => ${command.name}`)
      .setDescription(data);

    message.channel.send(helpEmbed);
  }
};
