const Guild = require('../database/guild');

module.exports = {
  name: 'setprefix',
  description: 'Change the prefix of the bot for the current server',
  information: '',
  aliases: false,
  args: true,
  usage: '[new prefix]',
  example: '>>',
  cooldown: 1,
  category: 'misc',
  execute (message, args) {
    const guildId = message.guild.id;
    const prefix = args[0];

    const query = { guildId: guildId };
    const update = { prefix: prefix };
    const options = { returnNewDocument: true };

    Guild.findOneAndUpdate(query, update, options)
      .then(updatedDocument => {
        if (updatedDocument) {
          message.channel.send(`Successfully updated server prefix to be **${prefix}**`);
        } else {
          const newGuild = new Guild({ guildId, prefix });
          newGuild.save()
            .then(() => {
              message.channel.send(`Added server prefix to be **${prefix}**`);
            })
            .catch(err => message.channel.send('Error: ' + err));
        }
      })
      .catch(err => message.channel.send(`${message.author} Failed to find and add/ update ID. ${err}`));
  }
};
