const Discord = require("discord.js");

module.exports = {
  name: "queue",
  description: "Print out the current queue of songs",
  information: "",
  aliases: ["q"],
  args: false,
  usage: "",
  cooldown: 0,
  category: "music",
  execute: queue,
};
  
async function queue(message, args, client) {

  // Check if there is a music queue
  const serverQueue = client.musicQueue.get(message.guild.id);
  if (!serverQueue) {
    return message.channel.send("There's no active queue");
  }
 
  const songs = serverQueue.songs;
  let songsInQueue = "";
  let totalDuration = 0;

  // Collect all song details
  for (let i = 0; i < songs.length; i++) {
    totalDuration += parseInt(songs[i].duration);

    // Only print out the first ten songs
    if (i < 10) {
      duration = formatDuration(songs[i].duration);
      songsInQueue += `${i + 1}: **${songs[i].title}** (${duration})\n`;
    }
  }

  const queueEmbed = new Discord.MessageEmbed()
    .setColor("#0099ff")
    .setDescription(`**${songs.length}** song(s) in queue (${formatDuration(totalDuration)})`)
    .addField("Songs", songsInQueue, false);
  message.channel.send(queueEmbed);
}


function formatDuration(seconds) {
  if (seconds < 3600) {
    return new Date(seconds * 1000).toISOString().substr(14, 5);
  } else {
    return new Date(seconds * 1000).toISOString().substr(11, 8);
  }
}
