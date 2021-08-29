import { Command } from "../../types/Command";
import { IServerMusicQueue, ISong } from "../../types/interfaces/Bot";
import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  StreamType,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { Message, StageChannel, TextChannel, VoiceChannel } from "discord.js";

import ytdl = require("ytdl-core");
import ytsr = require("ytsr");

export default class Play extends Command {
  name = "play";
  visible = true;
  description = "Add a song from url to the queue";
  information =
    "Add a song from url to the queue. Once there are no more songs / all users have left the channel, the bot stays in the channel for 1 minute. If no further songs have been added, or there are still no members, then the bot leaves.";
  aliases = ["p"];
  args = true;
  usage = "[song_name] or [song_url]";
  example = "whitley nova";
  cooldown = 0;
  category = "music";
  guildOnly = true;
  execute = async (message: Message, args: string[]): Promise<Message> => {
    message.channel.sendTyping();

    // Check if they are in a voice channel
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.channel.send(
        "You need to be in a voice channel to play music!"
      );
    }

    // Check if the bot has permissions to play music in that server
    if (!this.hasPermissions(voiceChannel, message)) {
      return;
    }

    // Get the song info
    const songInfo: ytdl.videoInfo = await this.getSongInfo(message, args);

    // Create the song object
    const duration = parseInt(songInfo.videoDetails.lengthSeconds);
    const song: ISong = {
      info: songInfo,
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
      duration: duration,
      formattedDuration: this.formatDuration(duration),
    };

    // Add the new song to the queue
    const serverQueue = this.addSongToQueue(song, message);
    const guildId = message.guild.id;
    if (serverQueue.isPlaying) {
      this.createAndSendEmbed(
        message.channel,
        `Queued ${this.getFormattedLink(song)} (${song.formattedDuration})`
      );
    } else {
      // If a new queue was created then we immediately play the song
      this.playSong(guildId, this.client.musicQueue);
    }
  };

  /**
   * Read the user's arguments and get the song from youtube
   *
   * @param message the message that triggered this command
   * @param args the arguments of the user
   * @returns the song info of their desired song
   */
  private async getSongInfo(
    message: Message,
    args: string[]
  ): Promise<ytdl.videoInfo> {
    let songInfo = null;
    if (ytdl.validateURL(args[0])) {
      // Find the song details from URL
      songInfo = await ytdl.getInfo(args[0]);
      if (!songInfo) {
        this.createAndSendEmbed(
          message.channel,
          "Could not find details from youtube"
        );
      }
    } else {
      try {
        const searchString = await ytsr.getFilters(args.join(" "));
        const videoSearch = searchString.get("Type").get("Video");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: any = await ytsr(videoSearch.url, {
          limit: 1,
        });
        songInfo = await ytdl.getInfo(results.items[0].url);
      } catch (error) {
        console.log(error);
        this.createAndSendEmbed(
          message.channel,
          "There was an error searching for that song"
        );
      }
    }
    return songInfo;
  }

  /**
   * Given the song, create an audio player for the song, or throw an
   * error if it does not start playing in 5 seconds
   *
   * @param song the song to play
   * @returns a promise to the created audio player
   */
  private async getSongPlayer(song: ISong): Promise<AudioPlayer> {
    const player = createAudioPlayer();
    const stream = ytdl(song.url, {
      filter: "audioonly",
    });
    const resource = createAudioResource(stream, {
      inputType: StreamType.Arbitrary,
    });
    player.play(resource);
    return entersState(player, AudioPlayerStatus.Playing, 5_000);
  }

  /**
   * Connect to a voice channel and returns the VoiceConnection. If we
   * cannot connect within 30 seconds, throw an error
   *
   * @param channel the voice channel to connect to
   * @returns the VoiceConnection after we connect
   */
  private async connectToChannel(
    channel: VoiceChannel | StageChannel
  ): Promise<VoiceConnection> {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      return connection;
    } catch (error) {
      connection.destroy();
      throw error;
    }
  }

  /**
   * Add the song info to the server's music queue. If there is no queue, a new
   * one is made.
   *
   * @param song the song to add to the queue
   * @param message the message that triggered this command
   * @returns the server's music queue
   */
  private addSongToQueue(song: ISong, message: Message): IServerMusicQueue {
    const guild = message.guild;
    let musicQueue: IServerMusicQueue = this.client.musicQueue.get(guild.id);
    if (musicQueue === undefined) {
      musicQueue = {
        voiceChannel: message.member.voice.channel,
        textChannel: message.channel as TextChannel,
        songs: [],
        playingMessage: null,
        isPlaying: false,
        isRepeating: false,
      };
      this.client.musicQueue.set(guild.id, musicQueue);
    }

    musicQueue.songs.push(song);
    return musicQueue;
  }

  /**
   * Plays the next song in the queue. Once the song ends, pop it from the
   * queue and recursively call this function
   *
   * @param guildId the id of the server the bot is playing music in
   * @param musicQueue a map from a server's id to it's music queue
   * @returns a message saying which song it is currently playing
   */
  private async playSong(
    guildId: string,
    musicQueue: Map<string, IServerMusicQueue>
  ): Promise<void> {
    const serverQueue = musicQueue.get(guildId);
    if (!serverQueue) {
      return;
    }
    // Base case
    if (serverQueue.songs.length === 0) {
      return this.handleEmptyQueue(guildId, musicQueue, serverQueue, 60_000);
    }
    const song = serverQueue.songs[0];
    const connection = await this.connectToChannel(serverQueue.voiceChannel);
    const player = await this.getSongPlayer(song);
    connection.subscribe(player);
    serverQueue.isPlaying = true;

    player.on(AudioPlayerStatus.Idle, () => {
      serverQueue.isPlaying = false;
      console.log("Finished song");
      this.createAndSendEmbed(
        serverQueue.textChannel,
        `Finished current song `
      );
      this.handleSongFinish(guildId, musicQueue, serverQueue);
    });

    // Send to channel which song we are playing
    this.sendPlayingEmbed(serverQueue);
  }

  /**
   * Handles what to do when the the current song finishes. If the server has
   * repeat active, then add the new song. If the queue is not empty, plays the
   * next song.
   *
   * @param guildId the id of the relevant server
   * @param musicQueue the mapping of server ids to their music queue
   * @param serverQueue the relevant server's music queue
   */
  handleSongFinish(
    guildId: string,
    musicQueue: Map<string, IServerMusicQueue>,
    serverQueue: IServerMusicQueue
  ): void {
    if (serverQueue !== null) {
      const song = serverQueue.songs[0];
      if (serverQueue.isRepeating) {
        serverQueue.songs.push(song);
      }
      serverQueue.songs.shift();
      this.playSong(guildId, musicQueue);
    }
  }

  /**
   * Handles what to do when the queue is empty. If there are no more members,
   * then leave immediate, else wait for a specified duration, and then leave.
   *
   * @param guildId the id of the relevant server
   * @param musicQueue the mapping of server ids to their music queue
   * @param serverQueue the relevant server's music queue
   * @param timeoutDuration how long to stay in the voice channel before leaving
   */
  handleEmptyQueue(
    guildId: string,
    musicQueue: Map<string, IServerMusicQueue>,
    serverQueue: IServerMusicQueue,
    timeoutDuration: number
  ): void {
    const connection = getVoiceConnection(guildId);
    if (serverQueue.voiceChannel.members.size === 0) {
      // If there are no more members
      connection.destroy();
      this.createAndSendEmbed(
        serverQueue.textChannel,
        "Stopping music as all members have left the voice channel"
      );
      musicQueue.delete(guildId);
      return;
    }
    // Wait for 1 minute and if there is no new songs, leave
    setTimeout(() => {
      if (serverQueue.songs.length === 0) {
        connection.destroy();
        musicQueue.delete(guildId);
        return;
      }
    }, timeoutDuration);
  }

  /**
   * Sends a message about the current playing song. If the bot had sent a
   * message like this for the previous song it played, delete that message
   *
   * @param serverQueue the queue for the relevant server
   */
  sendPlayingEmbed(serverQueue: IServerMusicQueue): void {
    const song = serverQueue.songs[0];
    const songLink = this.getFormattedLink(song);
    this.createAndSendEmbed(
      serverQueue.textChannel,
      `Now playing ${songLink} (${song.formattedDuration})`
    ).then((message) => {
      if (serverQueue.playingMessage !== null) {
        serverQueue.playingMessage.delete();
      }
      serverQueue.playingMessage = message;
    });
    return;
  }
}
