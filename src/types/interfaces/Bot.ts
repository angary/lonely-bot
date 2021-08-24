import { Command } from "../Command";
import {
  Client,
  Collection,
  Message,
  TextChannel,
  VoiceChannel,
  VoiceConnection,
} from "discord.js";

import ytdl = require("ytdl-core");

export interface IBot extends Client {
  commands: Collection<string, Command>;
  prefixes: { [key: number]: string };
  musicQueue: Map<string, IServerMusicQueue>;
}

export interface IHero {
  name: string;
  count: number;
  winrate: number;
  disadvantage: number;
}

export interface ISong {
  info: ytdl.videoInfo;
  title: string;
  url: string;
  duration: number;
  formattedDuration: string;
}

export interface IServerMusicQueue {
  voiceChannel: VoiceChannel;
  textChannel: TextChannel;
  connection: VoiceConnection;
  songs: ISong[];
  playingMessage: Message;
  playing: boolean;
  isRepeating: boolean;
}
