import { Command } from "../../types/Command";
import { ISong } from "../../types/interfaces/Bot";
import { Message } from "discord.js";

export default class Remove extends Command {
  name = "remove";
  visible: true;
  description = "Remove a song with the same name from the queue";
  information =
    "Remove a song with the same name from the queue. Will not remove the currently playing song.";
  aliases = [];
  args = true;
  usage: "[song_name]";
  example = "whitley nova";
  cooldown = 0;
  category = "music";
  guildOnly = true;
  execute = (message: Message, args: string[]): Promise<Message> => {
    // Check if there is a music queue
    const serverQueue = this.client.musicQueue.get(message.guild.id);
    if (!serverQueue || serverQueue.songs.length === 0) {
      return this.createAndSendEmbed(
        message.channel,
        "There's no active queue"
      );
    }

    const removeSongName = args.join(" ").toLowerCase();
    let removedSong: ISong = null;
    const songs = serverQueue.songs;

    for (let i = 1; i < songs.length; i++) {
      const song = songs[i];
      if (song.title.toLowerCase().includes(removeSongName)) {
        songs.splice(i);
        removedSong = song;
        break;
      }
    }

    const description =
      removedSong === null
        ? `Could not find ${removeSongName} in the queue`
        : `Removed ${this.getFormattedLink(removedSong)} from the queue`;
    this.createAndSendEmbed(message.channel, description);
  };
}
