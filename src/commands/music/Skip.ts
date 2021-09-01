import { Command } from "../../types/Command";
import { SlashCommandBuilder } from "@discordjs/builders";
import {
  CommandInteraction,
  GuildMember,
  Message,
  MessageEmbed,
  VoiceChannel,
} from "discord.js";

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
  data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description);
  execute = (message: Message): Promise<Message> => {
    return message.channel.send({
      embeds: [
        this.skip(
          message.member.voice.channel as VoiceChannel,
          message.guild.id
        ),
      ],
    });
  };
  executeSlash = (interaction: CommandInteraction): Promise<void> => {
    interaction.member = interaction.member as GuildMember;
    return interaction.reply({
      embeds: [
        this.skip(
          interaction.member.voice.channel as VoiceChannel,
          interaction.guild.id
        ),
      ],
    });
  };

  /**
   * Attempts to skip the current song playing
   *
   * @param voiceChannel the voice channel the user is in
   * @param guildId the id of the server this command is used in
   * @returns a message embed with the status of the skip option
   */
  private skip(voiceChannel: VoiceChannel, guildId: string): MessageEmbed {
    const musicQueue = this.client.musicQueue;
    const serverQueue = musicQueue.get(guildId);

    if (!serverQueue) {
      return this.createColouredEmbed(
        "There is no active music queue in the server!"
      );
    }

    if (serverQueue.voiceChannel !== voiceChannel) {
      return this.createColouredEmbed("You are not in the right voice channel");
    }

    try {
      // Calling .stop() on AudioPlayer causes transition into the Idle state.
      // Because of a state transition listener defined in Play.ts
      // transitions into the Idle state mean the next song is played
      serverQueue.audioPlayer.stop();
      return this.createColouredEmbed("Skipped current song");
    } catch (error) {
      serverQueue.songs = [];
      console.log(error);
    }
  }
}
