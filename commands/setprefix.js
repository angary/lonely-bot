const Guild = require('../database/guild');
const { prefix } = require('../config.json');

module.exports = {
  name: 'setprefix',
  description: 'Change the prefix of the bot for the current server',
  information: `Change the prefix of the bot for the current server. If you would like to remove your server's prefix, you may set it back to \`${prefix}\`.`,
  aliases: false,
  args: true,
  usage: '[new prefix]',
  example: '>>',
  cooldown: 1,
  category: 'misc',
  execute (message, args) {
    const guildId = message.guild.id;
    const newPrefix = args[0];

    const query = { guildId: guildId };
    const update = { prefix: newPrefix };
    const options = { returnNewDocument: true };

    if (prefix === newPrefix) {
      Guild.remove(query)
        .then(() => {
          message.channel.send(`Successfully reset server prefix to be **${prefix}**`);
        })
        .catch(err => message.channel.send(`${message.author} Failed to find and reset prefix ${err}`));
      return;
    }

    Guild.findOneAndUpdate(query, update, options)
      .then(updatedDocument => {
        if (updatedDocument) {
          message.channel.send(`Successfully updated server prefix to be **${newPrefix}**`);
        } else {
          const newGuild = new Guild({ guildId, prefix: newPrefix });
          newGuild.save()
            .then(() => {
              message.channel.send(`Added server prefix to be **${newPrefix}**`);
            })
            .catch(err => message.channel.send('Error: ' + err));
        }
      })
      .catch(err => message.channel.send(`${message.author} Failed to find and add/ update prefix ${err}`));
  }
};
