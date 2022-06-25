import { Client } from "./Client";
import { Song } from "./interfaces/Bot";
import { SlashCommandBuilder } from "@discordjs/builders";
import {
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageComponentInteraction,
  MessageEmbed,
  StageChannel,
  TextBasedChannel,
  VoiceChannel,
} from "discord.js";

export abstract class Command {
  client: Client;
  abstract name: string;
  abstract visible: boolean;
  abstract description: string;
  abstract information: string;
  abstract aliases: string[];
  abstract args: boolean;
  abstract usage: string;
  abstract example: string;
  abstract cooldown: number;
  abstract category: string;
  abstract guildOnly: boolean;
  abstract data: Omit<
    SlashCommandBuilder,
    "addSubcommand" | "addSubcommandGroup"
  >;
  abstract execute: (message: Message, args?: string[]) => Promise<Message>;
  abstract executeSlash: (interaction: CommandInteraction) => Promise<void>;

  public constructor(client: Client) {
    this.client = client;
  }

  /**
   * @param isDisabled whether the buttons of the row is disabled or not
   * @returns the a new message action row with buttons "First", "Prev", "Next",
   *          and "Last" option
   */
  protected createScrollButtonRow(isDisabled: boolean): MessageActionRow {
    const row = new MessageActionRow();
    const options = ["First", "Prev", "Next", "Last"];
    for (const option of options) {
      row.addComponents(
        new MessageButton()
          .setCustomId(option)
          .setLabel(option)
          .setStyle("SECONDARY")
          .setDisabled(isDisabled)
      );
    }
    return row;
  }

  protected createActiveScrollBar(
    interaction: CommandInteraction,
    maxPages: number,
    cls: Command,
    generateEmbed: CallableFunction,
    args: unknown[],
    duration = 120_000
  ): MessageActionRow {
    const boundGenerateEmbed = generateEmbed.bind(cls);
    let row = this.createScrollButtonRow(false);
    const collector = interaction.channel.createMessageComponentCollector({
      time: duration,
    });
    let page = 0;
    collector.on("collect", async (i: MessageComponentInteraction) => {
      switch (i.customId) {
        case "First":
          page = 0;
          break;
        case "Prev":
          page = Math.max(0, page - 1);
          break;
        case "Next":
          page = Math.min(Math.floor(maxPages), page + 1);
          break;
        case "Last":
          page = maxPages;
      }
      try {
        await i.update({
          embeds: [boundGenerateEmbed(...args, page)],
          components: [row],
        });
      } catch (error) {
        console.log(error);
      }
    });
    collector.on("end", () => {
      (row = this.createScrollButtonRow(true)),
        interaction.editReply({
          embeds: [boundGenerateEmbed(...args, page)],
          components: [row],
        });
    });
    return row;
  }

  /**
   * Creates a new embed with that description and sends it to the channel, and
   * stop typing in the channel
   *
   * @param channel the channel to send the message in
   * @param description the description to send
   * @returns a promise for the sent message
   */
  protected createAndSendEmbed(
    channel: TextBasedChannel,
    description?: string
  ): Promise<Message> {
    return channel.send({
      embeds: [this.createColouredEmbed(description)],
    });
  }

  /**
   * @param description (optional) the description for the embed
   * @returns a new MessageEmbed with the blue colouring
   */
  protected createColouredEmbed(description = ""): MessageEmbed {
    return new MessageEmbed().setColor("#0099ff").setDescription(description);
  }

  /**
   * Check if the bot has permissions to join the voice channel.
   *
   * @param voiceChannel the voice channel to join
   * @returns a string with the issue preventing the bot from connecting, else
   *          null if there are no issues
   */
  protected hasPermissions(voiceChannel: VoiceChannel | StageChannel): string {
    const permissions = voiceChannel.permissionsFor(this.client.user);
    if (!permissions.has("CONNECT")) {
      return "I need the permissions to join your voice channel!";
    } else if (!permissions.has("SPEAK")) {
      return "I need the permissions to speak in your voice channel!";
    }
    return null;
  }

  /**
   * Returns a duration formatted in (MM:HH:SS) or (MM:SS) if it is less than an
   * hour. If it is a livestream, then send the string "livestream"
   *
   * @param seconds the duration in seconds
   * @returns a formatted version of the duration
   */
  protected formatDuration(seconds: number): string {
    if (seconds === 0) {
      return "livestream";
    } else if (seconds < 3600) {
      return new Date(seconds * 1000).toISOString().substr(14, 5);
    } else {
      return new Date(seconds * 1000).toISOString().substr(11, 8);
    }
  }

  /**
   * Given a song, return the markdown formatted string to link to a song's URL
   * where the text is the title of the song
   *
   * @param song the current song
   * @returns a markdown formatted link
   */
  protected getFormattedLink(song: Song): string {
    return `[${song.title}](${song.url})`;
  }
}
