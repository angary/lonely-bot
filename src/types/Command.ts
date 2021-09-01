import { Client } from "./Client";
import { ISong } from "./interfaces/Bot";
import {
  CommandInteraction,
  Message,
  MessageEmbed,
  StageChannel,
  TextBasedChannels,
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
  data: any;
  abstract execute: (message: Message, args?: string[]) => Promise<Message>;
  executeSlash: (interaction: CommandInteraction) => Promise<void>;

  public constructor(client: Client) {
    this.client = client;
  }

  /**
   * Creates a new embed with that message and sends it to the channel, and
   * stop typing in the channel
   *
   * @param channel the channel to send the message in
   * @param message the message to send
   * @returns a promise for the sent message
   */
  protected createAndSendEmbed(
    channel: TextBasedChannels,
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
  protected createColouredEmbed(description?: string): MessageEmbed {
    const embed = new MessageEmbed().setColor("#0099ff");
    if (description) {
      embed.setDescription(description);
    }
    return embed;
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
  protected getFormattedLink(song: ISong): string {
    return `[${song.title}](${song.url})`;
  }
}
