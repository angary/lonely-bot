const ytdl = require('ytdl-core');

module.exports = {
  name: "play",
  description: "Add a song from url to the queue",
  information: "Add a song from url to the queue. Currently only supports youtube URLs.",
  aliases: ["p"],
  args: true,
  usage: "",
  cooldown: 0,
  category: "music",
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
    return;
  }

  // Collect song details
  const song = {
    title: songInfo.videoDetails.title,
    url: songInfo.videoDetails.video_url,
    duration: songInfo.videoDetails.lengthSeconds,
  };

  // Check if there is a music queue
  const musicQueue = client.musicQueue;
  const serverQueue = musicQueue.get(message.guild.id);

  if (!serverQueue) {
    // Create the new queue
    const queueConstruct = {
      voiceChannel: voiceChannel,
      textChannel: message.channel,
      connection: null,
      songs: [],
      playing: true,
    };
    
    // Add the queue
    musicQueue.set(message.guild.id, queueConstruct);
    queueConstruct.songs.push(song);

    // Play the song
    try {
      // Join the voice channel
      queueConstruct.connection = await voiceChannel.join();
      playSong(message, client);
    } catch (error) {
      // Catch error and remove the server's queue
      console.log(error);
      musicQueue.delete(message.guild.id);
    }
  } else {
    // Add the new song to the queue
    serverQueue.songs.push(song);
    message.channel.send(`Added **${song.title}** (${song.duration}) to the queue`);
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

function playSong(message, client) {
  const musicQueue = client.musicQueue;
  const serverQueue = musicQueue.get(message.guild.id);
  
  if (serverQueue.songs.length === 0) {
    message.channel.send("Finished queue");
    serverQueue.voiceChannel.leave();
    musicQueue.delete(message.guild.id);
    return;
  }

  const song = serverQueue.songs[0];

  serverQueue.connection
    .play(ytdl(song.url))
    .on("finish", () => {
      serverQueue.songs.shift();
      playSong(message, client);
    })
    .on("error", error => {
      console.log(error);
    });
  let duration = formatDuration(song.duration);
  serverQueue.textChannel.send(`Playing **${song.title}** (${duration})`);
}


function formatDuration(seconds) {
  if (seconds < 3600) {
    return new Date(seconds * 1000).toISOString().substr(14, 5);
  } else {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
  }
}
