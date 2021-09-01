import { Command } from "../../types/Command";
import { SlashCommandBuilder } from "@discordjs/builders";
import {
  CommandInteraction,
  GuildMember,
  Message,
  VoiceChannel,
} from "discord.js";

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
  data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description);
  execute = (message: Message): Promise<Message> => {
    return message.channel.send({
      embeds: [
        this.repeat(
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
        this.repeat(
          interaction.member.voice.channel as VoiceChannel,
          interaction.guild.id
        ),
      ],
    });
  };

  /**
   * Attempts to toggle the repeat option of the server's music queue.
   *
   * @param voiceChannel the voice channel the user is in
   * @param guildId the id of the server this command is used in
   * @returns a message embed with the status of the repeat option
   */
  private repeat(voiceChannel: VoiceChannel, guildId: string) {
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

    serverQueue.isRepeating = !serverQueue.isRepeating;
    return this.createColouredEmbed(
      `Queue is now **${
        serverQueue.isRepeating ? "repeating" : "not repeating"
      }**`
    );
  }
}
