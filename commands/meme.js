const axios = require('axios');
const Discord = require('discord.js');

module.exports = {
  name: 'meme',
  description: 'Get a random meme from r/dankmemes',
  information: '',
  aliases: ['dm', 'dankmeme'],
  args: false,
  usage: '',
  cooldown: false,
  category: 'misc',
  execute: meme
};

async function meme (message, args) {
  message.channel.startTyping();
  axios.get('https://www.reddit.com/r/dankmemes/random/.json')
    .then(response => {
      const [list] = response.data[0].data.children;
      const post = list.data;
      const memeUrl = `https://www.reddit.com${post.permalink}`;

      const date = new Date(post.created * 1000);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const memeEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(post.title)
        .setDescription(`**${post.author}**`)
        .setURL(memeUrl)
        .setImage(post.url)
        .setFooter(`⬆ ${post.ups} 💬 ${post.num_comments} 📅 ${day}/${month}/${year}`);

      return sendMessage(message.channel, memeEmbed);
    })
    .then(message => {
      message.react('👍');
      message.react('👎');
    })
    .catch(error => {
      sendMessage(message.channel, `There was an error: ${error}`);
    });
}

function sendMessage (channel, message) {
  channel.stopTyping();
  return channel.send(message);
}
