import { Command } from "../../types/Command";
import { Message, MessageEmbed } from "discord.js";

export default class Queue extends Command {
  name = "queue";
  visible = true;
  description = "Print out the current queue of songs";
  information = "Prints out the first 10 songs of the queue";
  aliases: string[] = ["q"];
  args = false;
  usage = "";
  example = "";
  cooldown = 0;
  category = "music";
  guildOnly = true;
  execute = (message: Message): Promise<Message> => {
    // Check if there is a music queue
    const serverQueue = this.client.musicQueue.get(message.guild.id);
    if (!serverQueue || serverQueue.songs.length === 0) {
      return message.channel.send("There's no active queue");
    }

    const songs = serverQueue.songs;
    let songsInQueue = "";
    let totalDuration = 0;

    // Collect all song details
    for (let i = 0; i < songs.length; i++) {
      totalDuration += songs[i].duration;

      // Only print out the first ten songs
      if (i < 10) {
        const duration = this.formatDuration(songs[i].duration);
        songsInQueue += `${i + 1}: **${songs[i].title}** (${duration})\n`;
      }
    }

    const queueEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setDescription(
        `Song count: **${songs.length}** | Duration: **${this.formatDuration(
          totalDuration
        )}** | Repeat: **${serverQueue.isRepeating ? "On" : "Off"}**`
      )
      .addField("Songs", songsInQueue, false);
    message.channel.send(queueEmbed);
  };
}
