module.exports = {
  name: "ping",
  description: 'Sends back "Pong!" and the latency of user from bot server',
  information: "",
  aliases: false,
  args: false,
  usage: "",
  cooldown: 0,
  category: "misc",
  execute: ping,
};

function ping(message, args, client) {
  const ping = `${Date.now() - message.createdTimestamp} ms`;
  message.channel.send(`Pong! Your ping is **${ping}**.`);
}
