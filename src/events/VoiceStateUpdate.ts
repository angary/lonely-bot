import { Event } from "../types/Event";
import { IServerMusicQueue } from "../types/interfaces/Bot";
import { GuildMember, Message } from "discord.js";

export default class VoiceStateUpdate extends Event {
  run = async (args: GuildMember[]): Promise<Message> => {
    const oldMember = args[0];
    const guildId = oldMember.guild.id;
    const musicQueue = this.client.musicQueue;

    // If the guild has music playing
    const serverQueue = musicQueue.get(guildId);
    if (!serverQueue) {
      return;
    }

    // Check if the voice channel is empty
    if (shouldLeave(serverQueue)) {
      setTimeout(() => leaveVoiceChannel(musicQueue, guildId), 60_000);
    }
  };
}

/**
 * If the voice channel is empty and there is no music playing then leave
 * the channel and send a message in the text channel notifying members,
 * else do nothing
 *
 * @param musicQueue the music queue map for all servers
 * @param guildId the id of the relevant server
 */
function leaveVoiceChannel(
  musicQueue: Map<string, IServerMusicQueue>,
  guildId: string
): void {
  const serverQueue = musicQueue.get(guildId);
  if (serverQueue !== null && shouldLeave(serverQueue)) {
    serverQueue.connection.dispatcher.end();
    serverQueue.songs = [];
  }
}

/**
 * If the bot is the only member in the voice channel is the bot, then the
 * bot can leave
 *
 * @param serverQueue a server's music queue object
 * @returns if the the bot should leave or not
 */
function shouldLeave(serverQueue: IServerMusicQueue): boolean {
  return serverQueue.voiceChannel.members.size === 1;
}
