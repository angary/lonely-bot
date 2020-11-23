const { prefix } = require('../config.json');

module.exports = {
  name: 'help',
  description: 'List all of my commands or info about a specific command.',
  aliases: ['commands'],
  args: false,
  usage: '[command name]',
  cooldown: 5,
  execute (message, args) {
    const data = [];
    const { commands } = message.client;

    // If they didn't specify a specific commmand
    if (!args.length) {
      data.push('Here\'s a list of all my commands:');

      // Makes it into a code block
      data.push('```');
      data.push(commands.map(command => command.name).join('\n'));
      data.push('```');

      data.push(`You can send \`${prefix}help [command name]\` to get info on a specific command!`);

      return message.author.send(data, { split: true })
        .then(() => {
          if (message.channel.type == 'dm') return;
          message.reply('I\'ve sent you a DM with all my commands!');
        })
        .catch(error => {
          console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
          message.reply('it seems like I can\'t DM you!');
        });
    }

    // Else send them more specific information regarding how to use the command
    const name = args[0].toLowerCase();
    const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

    // If it cannot find a proper commmand name then respond
    if (!command) {
      return message.reply('that\'s not a valid command!');
    }

    data.push(`**Name:** ${command.name}`);

    if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
    if (command.description) data.push(`**Description:** ${command.description}`);
    if (command.usage) data.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);

    data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

    message.channel.send(data, { split: true });
  }
};
