module.exports = {
  name: "skip",
  description: "Skip the current song in the queue",
  information: "",
  aliases: [],
  args: false,
  usage: "",
  cooldown: 0,
  category: "music",
  execute: skip,
};

async function skip(message, args, client) {
  // Check if we are in a voice channel
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    message.channel.send(
      "You need to be in a voice channel to stop the queue!"
    );
    return;
  }

  // Check if there is a music queue
  const serverQueue = client.musicQueue.get(message.guild.id);
  if (!serverQueue) {
    return message.channel.send("There's no active queue");
  }

  // Check if they are in the same channel
  if (message.member.voice.channel !== serverQueue.voiceChannel) {
    return message.channel.send("You are not in the same channel");
  }

  try {
    serverQueue.connection.dispatcher.end();
  } catch (error) {
    serverQueue.songs = [];
    console.log(error);
  }
}
