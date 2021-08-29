import { Command } from "../../types/Command";
import { getVoiceConnection } from "@discordjs/voice";
import { Message } from "discord.js";

export default class Stop extends Command {
  name = "stop";
  visible = true;
  description = "Remove all songs from the current queue";
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
      this.createAndSendEmbed(
        message.channel,
        "You need to be in a voice channel to stop the queue!"
      );
      return;
    }

    // Check if there is a music queue
    const guildId = message.guild.id;
    const serverQueue = this.client.musicQueue.get(guildId);
    if (!serverQueue) {
      return this.createAndSendEmbed(
        message.channel,
        "There's no active queue"
      );
    }

    serverQueue.songs = [];
    const connection = getVoiceConnection(guildId);
    connection.destroy();
    return this.createAndSendEmbed(
      message.channel,
      "Removed all songs from the queue"
    );
  };
}
