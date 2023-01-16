import { AudioPlayer } from "@discordjs/voice";
import {
  Collection,
  GuildMember,
  Message,
  StageChannel,
  TextChannel,
  VoiceChannel,
} from "discord.js";

import ytdl = require("ytdl-core");

/**
 * Contains data for a hero in the counter command
 */
export interface Hero {
  name: string;
  count: number;
  winrate: number;
  disadvantage: number;
}

/**
 * Contains all the data for each song in the play song command
 */
export interface Song {
  info: ytdl.videoInfo;
  title: string;
  url: string;
  duration: number;
  formattedDuration: string;
  member: GuildMember;
}

/**
 * Contains data for the music queue of a server
 */
export interface ServerMusicQueue {
  voiceChannel: VoiceChannel | StageChannel;
  textChannel: TextChannel;
  songs: Song[];
  audioPlayer: AudioPlayer;
  playingMessage: Message;
  isPlaying: boolean;
  isRepeating: boolean;
}

/**
 * Contains data for the player profile in profile command
 */
export interface PlayerData {
  name: string;
  accountId: number;
  mmrEstimate: number;
  country: string;
  avatar: string;
  win: number;
  lose: number;
  winRate: number;
  rankTier: number;
  leaderboardRank: number;
  heroes: PlayerHeroData[];
  recent: PlayerRecentData;
  lanes: PlayerLanes[];
  lobbies: PlayerLobbies[];
}

/**
 * Contains data for one hero in the profile command
 */
export interface PlayerHeroData {
  name: string;
  games: number;
  winRate: number;
  percentile: string;
}

/**
 * Contains data about the player's recent match in the profile command
 */
export interface PlayerRecentData {
  id: number;
  outcome: string;
  skill: string;
  lobbyType: string;
  gameMode: string;
  hero: string;
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  xpm: number;
  heroDmg: number;
  buildingDmg: number;
  heroHealing: number;
  date: string;
  duration: string;
}

/**
 * Contains data for a hero in the meta command
 */
export interface MetaHeroData {
  name: string;
  pickRate: string;
  winRate: string;
  index: number;
  popularity: number;
}

/**
 * Contains data about a player's laning types
 */
export interface PlayerLanes {
  lane: string;
  games: number;
  winRate: number;
}

/**
 * Contains data about a player's lobby types
 */
export interface PlayerLobbies {
  lobby: string;
  games: number;
  winRate: number;
}

export type Cooldown = Collection<string, number>;
