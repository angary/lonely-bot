module.exports = {
	name: 'kick',
    description: 'prints that it\'s going to kick someone but it actually doesn\'t',
    guildOnly: true,
	execute(message, args) {
        const taggedUser = message.mentions.users.first();
        if (!message.mentions.users.size) {
            return message.reply('you need to tag a user in order to kick them!');
        }
        message.channel.send(`You wanted to kick: ${taggedUser.id}`);
	},
};