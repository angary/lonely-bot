import { Message } from "discord.js";
import { IBot, ICommand } from "../../interfaces/Bot";

export default class Stop implements ICommand {
  name: string = "stop";
  description: string = "Remove all songs from the current queue";
  information: string = "";
  aliases: string[] = [];
  args: boolean = false;
  usage: string = "";
  example: string = "";
  cooldown: number = 0;
  category: string = "music";
  guildOnly: boolean = false;
  execute: (message: Message, args: string[], client: IBot) => void =
    _stop;
}

async function _stop(message, args, client) {
  // Check if we are in a voice channel
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) {
    message.channel.send(
      "You need to be in a voice channel to stop the queue!"
    );
    return;
  }

  // Check if there is a music queue
  const serverQueue = client.musicQueue.get(message.guild.id);
  if (!serverQueue) {
    return message.channel.send("There's no active queue");
  }

  serverQueue.songs = [];
  serverQueue.connection.dispatcher.end();
  return message.channel.send("Removed all songs from the queue");
}
