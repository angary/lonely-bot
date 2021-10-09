import { Command } from "../../types/Command";
import { ISong } from "../../types/interfaces/Bot";
import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, Guild, Message, MessageEmbed } from "discord.js";

export default class Remove extends Command {
  name = "remove";
  visible = true;
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
  data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description)
    .addStringOption((option) =>
      option.setName("song").setDescription("The name of the song to remove")
    );
  execute = (message: Message, args: string[]): Promise<Message> => {
    return message.channel.send({ embeds: [this.remove(message.guild, args)] });
  };
  executeSlash = (interaction: CommandInteraction): Promise<void> => {
    return interaction.reply({
      embeds: [
        this.remove(interaction.guild, [
          interaction.options.get("song").value as string,
        ]),
      ],
    });
  };

  /**
   * Attempts to remove the song if there is one, and then sends an embed with
   * the outcome.
   *
   * @param guild the server where the command was triggered
   * @param args the arguments supplied by the user
   * @returns a message embed notifying whether a song was removed or not
   */
  private remove(guild: Guild, args: string[]): MessageEmbed {
    const serverQueue = this.client.musicQueue.get(guild.id);
    if (!serverQueue || serverQueue.songs.length === 0) {
      return this.createColouredEmbed("There's no active queue");
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
    return this.createColouredEmbed(description);
  }
}
