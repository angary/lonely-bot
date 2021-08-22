import { Message } from "discord.js";
import { Command } from "../Command";

const ytdl = require("ytdl-core");
const ytsr = require("ytsr");

export default class Play extends Command {
  name: string = "play";
  description: string = "Add a song from url to the queue";
  information: string = "Add a song from url to the queue. Currently only supports youtube URLs.";
  aliases: string[] = ["p"];
  args: boolean = true;
  usage: string = "";
  example: string = "193480093";
  cooldown: number = 0;
  category: string = "music";
  guildOnly: boolean = false;
  execute = async (message: Message, args: string[]): Promise<any> => {
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
    
    let songInfo = null;
    if (ytdl.validateURL(args[0])) {
      // Find the song details from URL
      songInfo = await ytdl.getInfo(args[0]);
      if (!songInfo) {
        return message.channel.send("Could not find details from youtube");
      }
    } else {
      try {
        const searchString = await ytsr.getFilters(args.join(" "));
        const videoSearch = searchString.get("Type").get("Video");
        const results = await ytsr(videoSearch.url, { limit: 1 });
        songInfo = await ytdl.getInfo(results.items[0].url);
      } catch (error) {
        console.log(error);
        return message.channel.send("There was an error searching for that song");
      }
    }
    
    // Collect song details
    const song = {
      info: songInfo,
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
      duration: songInfo.videoDetails.lengthSeconds,
    };
    
    // Check if there is a music queue
    const musicQueue = this.client.musicQueue;
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
        playSong(message, this.client);
      } catch (error) {
        // Catch error and remove the server's queue
        console.log(error);
        musicQueue.delete(message.guild.id);
      }
    } else {
      // Add the new song to the queue
      serverQueue.songs.push(song);
      message.channel.send(
        `Added **${song.title}** (${formatDuration(song.duration)}) to the queue`
      );
    }

  }
}

function hasPermissions(voiceChannel, message) {
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT")) {
    message.channel.send("I need the permissions to join your voice channel!");
    return false;
  } else if (!permissions.has("SPEAK")) {
    message.channel.send(
      "I need the permissions to speak in your voice channel!"
    );
    return false;
  }
  return true;
}

async function playSong(message, client) {
  const musicQueue = client.musicQueue;
  const serverQueue = musicQueue.get(message.guild.id);

  if (serverQueue.songs.length === 0) {
    serverQueue.voiceChannel.leave();
    musicQueue.delete(message.guild.id);
    return;
  }

  const song = serverQueue.songs[0];

  const dispatcher = serverQueue.connection
    .play(
      await ytdl.downloadFromInfo(song.info, {
        highWaterMark: 1 << 25, // Increase memory for song to 32 mb
        filter: "audioonly",
      })
    )
    .on("finish", () => {
      serverQueue.songs.shift();
      playSong(message, client);
    })
    .on("error", (error) => {
      console.log("Issue with ytdl playing");
      console.log(error);
    });
  serverQueue.textChannel.send(
    `Playing **${song.title}** (${formatDuration(song.duration)})`
  );
}

function formatDuration(seconds) {
  seconds = parseInt(seconds);
  if (seconds === 0) {
    return "livestream";
  } else if (seconds < 3600) {
    return new Date(seconds * 1000).toISOString().substr(14, 5);
  } else {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
  }
}
