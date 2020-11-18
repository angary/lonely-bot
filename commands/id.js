let User = require('../models/user')

module.exports = {
    name: '>id',
    description: 'Link your current Discord ID to your Steam ID',
    aliases: false,
    args: true,
    usage: "[Steam32 ID]",
    cooldown: 1,
    execute(message, args) {

        // If the user has already set their IDs


        // If the usre hasn't set their IDs
        const discordID = message.author.id;
        const steamID = args[0]

        const newUser = new User({discordID, steamID});
        newUser.save()
            .then(() => message.channel.send(`Mapped Discord ID **${discordID}** to  Steam ID **${steamID}**`))
            .catch(err => message.channel.send('Error: ' + err))
    },
};