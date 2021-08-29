import { Command } from "../../types/Command";
import { AudioPlayerPlayingState, AudioPlayerStatus } from "@discordjs/voice";
import { Message } from "discord.js";

export default class Queue extends Command {
  name = "queue";
  visible = true;
  description = "Prints out the first 10 songs of the queue";
  information = "";
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
      return this.createAndSendEmbed(
        message.channel,
        "There's no active queue"
      );
    }

    const songs = serverQueue.songs;
    const song = songs[0];
    let songsInQueue = "";

    // Collect first song detail
    let currStreamTime = 0;
    const audioPlayerState = serverQueue.audioPlayer.state;
    if (audioPlayerState.status === AudioPlayerStatus.Playing) {
      // Type cast so that we can extract .playbackDuration
      currStreamTime =
        (audioPlayerState as AudioPlayerPlayingState).playbackDuration / 1000;
    }
    const currTimestamp = `${this.formatDuration(currStreamTime)}/${
      song.formattedDuration
    }`;

    // Initialise as duration left in first song
    let totalDuration = song.duration - currStreamTime;

    // Collect all song details
    for (let i = 0; i < songs.length; i++) {
      // Only add duration if it is not the first song as it is already added
      if (i > 0) {
        totalDuration += songs[i].duration;
      }

      // Only add details of first 10 songs
      if (i < 10) {
        const duration = this.formatDuration(songs[i].duration);
        songsInQueue += `${i + 1}: ${this.getFormattedLink(
          songs[i]
        )} (${duration})\n`;
      }
    }

    const queueEmbed = this.createColouredEmbed()
      .setTitle("Queue")
      .setDescription(
        `Song count: **${songs.length}** | Duration: **${this.formatDuration(
          totalDuration
        )}** | Repeat: **${serverQueue.isRepeating ? "On" : "Off"}**`
      )
      .addField(
        "Now playing",
        `${this.getFormattedLink(song)} (${currTimestamp})`,
        false
      )
      .addField("Songs", songsInQueue, false);
    message.channel.send({ embeds: [queueEmbed] });
  };
}
