const User = require('../models/user');

module.exports = {
  name: 'steamid',
  description: 'Link your current Discord ID to your Steam ID',
  information: 'Stores or updates your steam ID (it should consist of only numbers and be the number that you see in your steam URL, or the number at the end of your dotabuff/ opendota URL). Once your steam ID is saved, you do not need to type your steamID the next time you use the opendota command.',
  aliases: false,
  args: true,
  usage: '[Steam32 ID]',
  example: '193480093',
  cooldown: 1,
  category: 'dota',
  execute (message, args) {
    const discordID = message.author.id;
    const steamID = args[0];

    const query = { discordID: discordID };
    const update = { steamID: steamID };
    const options = { returnNewDocument: true };

    User.findOneAndUpdate(query, update, options)
      .then(updatedDocument => {
        if (updatedDocument) {
          message.channel.send(`${message.author} Successfully updated Steam ID to be **${steamID}**`);
        } else {
          const newUser = new User({ discordID, steamID });
          newUser.save()
            .then(() => message.channel.send(`${message.author} Added Steam ID to be **${steamID}**`))
            .catch(err => message.channel.send('Error: ' + err));
        }
      })
      .catch(err => message.channel.send(`${message.author} Failed to find and add/ update ID. ${err}`));
  }
};
