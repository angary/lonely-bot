import axios from "axios";
import { Message, MessageEmbed } from "discord.js";
import { IBot, ICommand } from "../../interfaces/Bot";

export default class Meme implements ICommand {
  name: string = "meme";
  description: string = "Get a random meme from r/dankmemes";
  information: string = "";
  aliases: string[] = [];
  args: boolean = false;
  usage: string = "";
  example: string = "";
  cooldown: number = 0;
  category: string = "general";
  guildOnly: boolean = false;
  execute: (message: Message, args: string[], client: IBot) => Promise<void> =
    meme;
}

async function meme(message, args, client) {
  message.channel.startTyping();
  axios
    .get("https://www.reddit.com/r/dankmemes/random/.json")
    .then((response) => {
      const [list] = response.data[0].data.children;
      const post = list.data;
      const memeUrl = `https://www.reddit.com${post.permalink}`;

      const date = new Date(post.created * 1000);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const memeEmbed = new MessageEmbed()
        .setColor("#0099ff")
        .setTitle(post.title)
        .setDescription(`**${post.author}**`)
        .setURL(memeUrl)
        .setImage(post.url)
        .setFooter(
          `⬆ ${post.ups} 💬 ${post.num_comments} 📅 ${day}/${month}/${year}`
        );

      return sendMessage(message.channel, memeEmbed);
    })
    .then((message) => {
      message.react("👍");
      message.react("👎");
    })
    .catch((error) => {
      sendMessage(message.channel, `There was an error: ${error}`);
    });
}

function sendMessage(channel, message) {
  channel.stopTyping();
  return channel.send(message);
}
