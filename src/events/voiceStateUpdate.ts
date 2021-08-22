import { Event } from "../types/Event";
import { GuildMember } from "discord.js";

export default class VoiceStateUpdate extends Event {
  run = async (args: GuildMember[]): Promise<void> => {
    const oldMember = args[0];
    const guild = oldMember.guild;

    // If the guild has music playing
    const serverQueue = this.client.musicQueue.get(guild.id);
    if (!serverQueue) {
      return;
    }

    // Check if the voice channel is empty
    if (serverQueue.voiceChannel.members.size === 1) {
      serverQueue.songs = [];

      // If the bot is the last person connected
      if (serverQueue.connection !== null) {
        serverQueue.connection.dispatcher.end();
        return serverQueue.textChannel.send(
          "Stopping music as all members have left the voice channel"
        );
      }
    }
  };
}
