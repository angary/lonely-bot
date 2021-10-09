import { Command } from "../../types/Command";
import { SlashCommandBuilder } from "@discordjs/builders";
import axios from "axios";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";

export default class Meme extends Command {
  name = "meme";
  visible = true;
  description = "Get a random meme from r/dankmemes";
  information = "";
  aliases = [];
  args = false;
  usage = "";
  example = "";
  cooldown = 0;
  category = "general";
  guildOnly = false;
  data = new SlashCommandBuilder()
    .setName(this.name)
    .setDescription(this.description);
  execute = async (message: Message): Promise<Message> => {
    const channel = message.channel;
    channel.sendTyping();
    const memeEmbed = await this.meme();
    return channel.send({ embeds: [memeEmbed] });
  };
  executeSlash = async (interaction: CommandInteraction): Promise<void> => {
    const memeEmbed = await this.meme();
    return interaction.reply({ embeds: [memeEmbed] });
  };

  /**
   * @returns an embed containing an image from r/dankmemes
   */
  private async meme(): Promise<MessageEmbed> {
    const response = await axios.get(
      "https://www.reddit.com/r/dankmemes/random/.json"
    );
    const [list] = response.data[0].data.children;
    const post = list.data;
    const memeUrl = `https://www.reddit.com${post.permalink}`;

    const date = new Date(post.created * 1000);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const memeEmbed = this.createColouredEmbed()
      .setTitle(post.title)
      .setDescription(`**${post.author}**`)
      .setURL(memeUrl)
      .setImage(post.url)
      .setFooter(
        `⬆ ${post.ups} | 💬 ${post.num_comments} | 📅 ${day}/${month}/${year}`
      );
    return memeEmbed;
  }
}
