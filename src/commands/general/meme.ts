import { Command } from "../Command";
import axios from "axios";
import { Message, MessageEmbed } from "discord.js";

export default class Meme extends Command {
  name = "meme";
  visible = true;
  description = "Get a random meme from r/dankmemes";
  information = "";
  aliases: string[] = [];
  args = false;
  usage = "";
  example = "";
  cooldown = 0;
  category = "general";
  guildOnly = false;
  execute = (message: Message): Promise<Message> => {
    message.channel.startTyping();
    axios
      .get("https://www.reddit.com/r/dankmemes/random/.json")
      .then((response) => {
        const [list] = response.data[0].data.children;
        const post = list.data;
        const memeUrl = `https://www.reddit.com${post.permalink}`;

        const date = new Date(post.created * 1000);
        const [day, month, year] = [
          date.getDate(),
          date.getMonth() + 1,
          date.getFullYear(),
        ];

        const memeEmbed = new MessageEmbed()
          .setColor("#0099ff")
          .setTitle(post.title)
          .setDescription(`**${post.author}**`)
          .setURL(memeUrl)
          .setImage(post.url)
          .setFooter(
            `⬆ ${post.ups} 💬 ${post.num_comments} 📅 ${day}/${month}/${year}`
          );
        message.channel.stopTyping();
        return message.channel.send(memeEmbed);
      })
      .then((message) => {
        message.react("👍");
        message.react("👎");
      })
      .catch((error) => {
        message.channel.stopTyping();
        return message.channel.send(`There was an error: ${error}`);
      });
    return;
  };
}
