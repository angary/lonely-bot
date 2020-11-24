module.exports = {
  name: 'ping',
  description: 'Sends back "Pong!" and the latency of user from bot server',
  information: '',
  aliases: false,
  args: false,
  usage: '',
  cooldown: false,
  category: 'misc',
  execute (message, args) {
    const ping = `${Date.now() - message.createdTimestamp} ms`;
    message.channel.send(`Pong! Your ping is **${ping}**.`);
  }
};
