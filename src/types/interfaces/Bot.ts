import {
  Message,
  TextChannel,
  VoiceChannel,
  VoiceConnection,
} from "discord.js";

import ytdl = require("ytdl-core");

/**
 * Contains data for a hero in the counter command
 */
export interface IHero {
  name: string;
  count: number;
  winrate: number;
  disadvantage: number;
}

/**
 * Contains all the data for each song in the play song command
 */
export interface ISong {
  info: ytdl.videoInfo;
  title: string;
  url: string;
  duration: number;
  formattedDuration: string;
}

/**
 * Contains data for the music queue of a server
 */
export interface IServerMusicQueue {
  voiceChannel: VoiceChannel;
  textChannel: TextChannel;
  connection: VoiceConnection;
  songs: ISong[];
  playingMessage: Message;
  playing: boolean;
  isRepeating: boolean;
}
