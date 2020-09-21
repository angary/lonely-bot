const mongoose = require('mongoose');
const mongoPath = '';

module.exports = {
	name: 'id',
	description: 'Link your current Discord ID to your Steam ID	',
	aliases: false,
	args: false,
	usage: "[Steam32 ID]",
	cooldown: 1,
	execute(message, args) {
		message.channel.send('Still implementing atm.')
	},
};