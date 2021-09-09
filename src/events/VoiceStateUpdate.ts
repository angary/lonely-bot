import { vcStandbyDuration } from "../../config.json";
import { Event } from "../types/Event";
import { IServerMusicQueue } from "../types/interfaces/Bot";
import { getVoiceConnection } from "@discordjs/voice";
import { Message, VoiceState } from "discord.js";

export default class VoiceStateUpdate extends Event {
  run = async (args: VoiceState[]): Promise<Message> => {
    const [oldState, newState] = args;
    const guildId = oldState.guild.id;
    const musicQueue = this.client.musicQueue;

    // If the guild does not have music playing
    const serverQueue = musicQueue.get(guildId);
    if (!serverQueue) {
      return;
    }

    // If the member who left was the bot
    const clientUser = this.client.user;
    if (oldState.member.id === clientUser.id) {
      if (newState.channel !== null) {
        // We have moved to a new channel
        serverQueue.voiceChannel = newState.channel;
      } else {
        // We have been disconnected from the call
        musicQueue.delete(guildId);
      }
    }
    // Check if the voice channel is empty
    else if (this.shouldLeave(serverQueue)) {
      setTimeout(
        () => this.leaveVoiceChannel(musicQueue, guildId),
        vcStandbyDuration
      );
    }
  };

  /**
   * If the voice channel is empty and there is no music playing then leave
   * the channel and send a message in the text channel notifying members,
   * else do nothing
   *
   * @param musicQueue the music queue map for all servers
   * @param guildId the id of the relevant server
   */
  private leaveVoiceChannel(
    musicQueue: Map<string, IServerMusicQueue>,
    guildId: string
  ): void {
    const serverQueue = musicQueue.get(guildId);
    if (serverQueue !== null && this.shouldLeave(serverQueue)) {
      const connection = getVoiceConnection(guildId);
      connection.destroy();
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
  private shouldLeave(serverQueue: IServerMusicQueue): boolean {
    return serverQueue.voiceChannel.members.size === 1;
  }
}
