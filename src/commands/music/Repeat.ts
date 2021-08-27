import { Command } from "../../types/Command";
import { Message, MessageEmbed } from "discord.js";

export default class Repeat extends Command {
  name = "repeat";
  visible = true;
  description = "Repeat the queue";
  information =
    "After the current song is complete, it is automatically added to the end of the queue";
  aliases = ["r"];
  args = false;
  usage = "";
  example: "";
  cooldown = 0;
  category = "music";
  guildOnly = true;
  execute = (message: Message): Promise<Message> => {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      message.channel.send("You need to be in a voice channel to play music!");
      return;
    }

    // Check if teh bot has permissions to play music in that server
    if (!this.hasPermissions(voiceChannel, message)) {
      return;
    }

    const musicQueue = this.client.musicQueue;
    const serverQueue = musicQueue.get(message.guild.id);

    if (!serverQueue) {
      message.channel.send("There is no active queue in this server!");
    } else {
      serverQueue.isRepeating = !serverQueue.isRepeating;
      const repeatEmbed = new MessageEmbed()
        .setColor("#0099ff")
        .setDescription(
          `Queue is now **${
            serverQueue.isRepeating ? "repeating" : "not repeating"
          }**`
        );
      message.channel.send({ embeds: [repeatEmbed] });
    }
  };
}
