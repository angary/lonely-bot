module.exports = {
  name: "stop",
  description: "Remove all songs from the current queue",
  information: "",
  aliases: [],
  args: false,
  usage: "",
  cooldown: 0,
  category: "music",
  execute: stop,
};

async function stop(message, args, client) {
  
  // Check if we are in a voice channel
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    message.channel.send("You need to be in a voice channel to stop the queue!");
    return;
  }

  // Check if there is a music queue
  const serverQueue = client.musicQueue.get(message.guild.id);
  if (!serverQueue) {
    return message.channel.send("There's no active queue");
  }

  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
  return message.channel.send("Removed all songs from the queue");
}
