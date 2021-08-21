module.exports = async (client, oldMember, newMember) => {
  // Check the guild they are in
  const guild = oldMember.guild;

  // If the guild has music playing
  const serverQueue = client.musicQueue.get(guild.id);
  if (!serverQueue) {
    return;
  }

  // Check if the voice channel is empty
  if (serverQueue.voiceChannel.members.size === 1) {
    serverQueue.songs = [];

    // If the bot is the last person connected
    if (serverQueue.connection != null) {
      serverQueue.connection.dispatcher.end();
      return serverQueue.textChannel.send(
        "Stopping music as all members have left the voice channel"
      );
    }
  }
};
