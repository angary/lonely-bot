import { Command } from "../../types/Command";
import { getVoiceConnection } from "@discordjs/voice";
import { Message } from "discord.js";

export default class Skip extends Command {
  name = "skip";
  visible = true;
  description = "Skip the current song in the queue";
  information = "";
  aliases = [];
  args = false;
  usage = "";
  example = "";
  cooldown = 0;
  category = "music";
  guildOnly = true;
  execute = (message: Message): Promise<Message> => {
    // Check if we are in a voice channel
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return this.createAndSendEmbed(
        message.channel,
        "You need to be in a voice channel to skip the queue!"
      );
    }

    // Check if there is a music queue
    const serverQueue = this.client.musicQueue.get(message.guild.id);
    if (!serverQueue) {
      return this.createAndSendEmbed(
        message.channel,
        "There's no active queue"
      );
    }

    // Check if they are in the same channel
    if (message.member.voice.channel !== serverQueue.voiceChannel) {
      return this.createAndSendEmbed(
        message.channel,
        "You are not in the same channel"
      );
    }

    try {
      const connection = getVoiceConnection(message.guild.id);
      connection.destroy();
    } catch (error) {
      serverQueue.songs = [];
      console.log(error);
    }
  };
}
