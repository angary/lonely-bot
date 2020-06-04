module.exports = {
	name: '>ping',
	description: 'Ping!',
	aliases: false,
	args: false,
	usage: "",
	cooldown: false,
	execute(message, args) {
		let ping = `${Date.now() - message.createdTimestamp} ms`;
        message.channel.send(`Pong! Your ping is **${ping}**.`);
	},
};