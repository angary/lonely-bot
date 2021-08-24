import { Command } from "../../types/Command";
import { Message, MessageEmbed, VoiceChannel } from "discord.js";

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
  execute = (message: Message): Promise<Message> => {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      message.channel.send("You need to be in a voice channel to play music!");
      return;
    }

    // Check if teh bot has permissions to play music in that server
    if (!hasPermissions(voiceChannel, message)) {
      return;
    }

    const musicQueue = this.client.musicQueue;
    const serverQueue = musicQueue.get(message.guild.id);

    if (!serverQueue) {
      message.channel.send("There is no active queue in this server!");
    } else {
      serverQueue.isRepeating = !serverQueue.isRepeating;
      const repeatEmbed = new MessageEmbed()
        .setColor("#0099ff")
        .setDescription(
          `Queue is now **${
            serverQueue.isRepeating ? "repeating" : "not repeating"
          }**`
        );
      message.channel.send(repeatEmbed);
    }
  };
}

/**
 * Check if the bot has permissions to join the voice channel. Also
 * sends a message to the channel if the bot cannot join
 *
 * @param voiceChannel the voice channel to join
 * @param message the message where the play command was sent
 * @returns if the bot has permission to join the voice channel or not
 */
function hasPermissions(voiceChannel: VoiceChannel, message: Message): boolean {
  const permissions = voiceChannel.permissionsFor(message.client.user);
  if (!permissions.has("CONNECT")) {
    message.channel.send("I need the permissions to join your voice channel!");
    return false;
  } else if (!permissions.has("SPEAK")) {
    message.channel.send(
      "I need the permissions to speak in your voice channel!"
    );
    return false;
  }
  return true;
}
