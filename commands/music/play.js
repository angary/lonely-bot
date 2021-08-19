const ytdl = require('ytdl-core');

module.exports = {
  name: "play",
  description: "WORK IN PROGRESS Play a song from url",
  information: "",
  aliases: ["p"],
  args: true,
  usage: "",
  cooldown: 0,
  category: "general",
  execute: play,
};

async function play(message, args, client) {
  
  // Check if we are in a voice channel
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    message.channel.send("You need to be in a voice channel to play music!");
    return;
  }

  // Check if teh bot has permissions to play music in that server
  if (!hasPermissions(voiceChannel, message)) {
    return;
  }

  // Find the song details from URL
  const songInfo = await ytdl.getInfo(args[0]);
  if (!songInfo) {
    message.channel.send("Could not find details from youtube");
  }

  const song = {
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url,
  };

  message.channel.send(`Found **${song.title}**`);

  try {
    const connection = await voiceChannel.join();
    const dispatcher = connection
      .play(ytdl(song.url))
      .on("finish", () => {
        message.channel.send(`Finished playing ${song.title}`);
      });
  } catch (error) {
    console.log(error);
  }
}

function hasPermissions(voiceChannel, message) {
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT")) {
    message.channel.send("I need the permissions to join your voice channel!");
    return false;
  } else if (!permissions.has("SPEAK")) {
    message.channel.send("I need the permissions to speak in your voice channel!");
    return false;
  } 
  return true;
}
