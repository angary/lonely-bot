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
  commands: Collection<string, ICommand>;
  prefixes: { [key: number]: string };
  musicQueue: Map<string, IServerMusicQueue>;
}

export interface ICommand {
  name: string;
  visible: boolean;
  description: string;
  information: string;
  aliases: string[];
  args: boolean;
  usage: string;
  example: string;
  cooldown: number;
  category: string;
  guildOnly: boolean;
  execute: (message: Message, args: string[]) => Promise<Message>;
}

export interface IEvent {
  client: Client;
  run: (args?: unknown[]) => void;
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
  playing: boolean;
}
