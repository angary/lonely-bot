import { Command } from "../../types/Command";
import { ISong } from "../../types/interfaces/Bot";
import { Message, MessageEmbed } from "discord.js";

export default class Remove extends Command {
  name = "remove";
  visible: true;
  description = "Remove a song with the same name from the queue";
  information =
    "Remove a song with the same name from the queue. Will not remove the currently playing song.";
  aliases = [];
  args = true;
  usage: "";
  example = "";
  cooldown = 0;
  category = "music";
  guildOnly = true;
  execute = (message: Message, args: string[]): Promise<Message> => {
    // Check if there is a music queue
    const serverQueue = this.client.musicQueue.get(message.guild.id);
    if (!serverQueue || serverQueue.songs.length === 0) {
      return message.channel.send("There's no active queue");
    }

    const removeSongName = args.join(" ").toLowerCase();
    let removedSong: ISong = null;
    console.log(removeSongName);
    const songs = serverQueue.songs;

    for (let i = 1; i < songs.length; i++) {
      const song = songs[i];
      if (song.title.toLowerCase().includes(removeSongName)) {
        songs.splice(i);
        removedSong = song;
        break;
      }
    }

    if (removedSong === null) {
      message.channel.send(
        new MessageEmbed()
          .setColor("#0099ff")
          .setDescription(`Could not find song ${removeSongName} in the queue`)
      );
    } else {
      message.channel.send(
        new MessageEmbed()
          .setColor("#0099ff")
          .setDescription(
            `Removed ${this.getFormattedLink(removedSong)} from the queue`
          )
      );
    }
  };
}
