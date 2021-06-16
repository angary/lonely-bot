const Discord = require("discord.js");
const cooldowns = new Discord.Collection();
const Guild = require("../database/guild");
const config = require("../config.json");

module.exports = async (client, message) => {
  // Does nothing if sender is a bot
  if (message.author.bot) return;

  // Check if there was a custom prefix, else use default
  const prefix = await findPrefix(message);

  if (!message.content.startsWith(prefix)) return;

  // Stores the arguments in a new array without the prefix and splits array into strings
  const args = message.content.slice(prefix.length).split(/ +/);

  // Removes the first argument as the command name, and converts to lower case
  const commandName = args.shift().toLowerCase();

  // Checks the commands folder if it has a command that the message requested
  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    );
  if (!command) return;

  // Errors with command
  // ---------------------------------------------------------------------------

  // DMs
  if (command.guildOnly && message.channel.type !== "text") {
    return message.reply("I can't execute that command inside DMs!");
  }

  // No Arguments
  if (command.args && !args.length) {
    let reply = `You didn't provide any arguments, ${message.author}`;
    if (command.usage) {
      reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
    }
    if (command.example) {
      reply += `\nExample: \`${prefix}${command.name} ${command.example}\``;
    }
    return message.channel.send(reply);
  }

  // Cooldowns
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Discord.Collection());
  }
  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = command.cooldown * 1000;
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        `please wait ${timeLeft.toFixed(1)} more seconds before reusing the \`${
          command.name
        }\` command.`
      );
    }
  }
  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

  // Else executes the command
  // ---------------------------------------------------------------------------
  try {
    command.execute(message, args);
  } catch (error) {
    message.reply("there was an error trying to execute that command");
  }
};

// Find the suitable prefix for the command
async function findPrefix(message) {
  if (message.guild) {
    const details = await findGuild(message.guild.id);
    if (details) {
      return details.prefix;
    }
  }
  return config.prefix;
}

// Find details about the guild given the guild ID
function findGuild(guildId) {
  const query = { guildId: guildId };
  return Guild.findOne(query);
}
