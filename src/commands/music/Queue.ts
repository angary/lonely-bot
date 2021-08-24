import { Command } from "../../types/Command";
import { Message, MessageEmbed } from "discord.js";

export default class Queue extends Command {
  name = "queue";
  visible = true;
  description = "Print out the current queue of songs";
  information =
    "Add a song from url to the queue. Currently only supports youtube URLs.";
  aliases: string[] = ["q"];
  args = false;
  usage = "";
  example = "";
  cooldown = 0;
  category = "music";
  guildOnly = false;
  execute = (message: Message): Promise<Message> => {
    // Check if there is a music queue
    const serverQueue = this.client.musicQueue.get(message.guild.id);
    if (!serverQueue) {
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
        const duration = formatDuration(songs[i].duration);
        songsInQueue += `${i + 1}: **${songs[i].title}** (${duration})\n`;
      }
    }

    const queueEmbed = new MessageEmbed()
      .setColor("#0099ff")
      .setDescription(
        `**${songs.length}** song(s) in queue (${formatDuration(
          totalDuration
        )})`
      )
      .addField("Songs", songsInQueue, false);
    message.channel.send(queueEmbed);
  };
}

/**
 * Returns a duration formatted in (MM:HH:SS) or (MM:SS) if it is less than an
 * hour. If it is a livestream, then send the string "livestream"
 *
 * @param seconds the duration in seconds
 * @return a formatted version of the duration
 */
function formatDuration(seconds: number): string {
  if (seconds === 0) {
    return "livestream";
  } else if (seconds < 3600) {
    return new Date(seconds * 1000).toISOString().substr(14, 5);
  } else {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
  }
}
