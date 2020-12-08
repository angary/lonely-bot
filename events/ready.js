const { prefix, activity } = require('../config.json');

module.exports = async (client) => {
  try {
    client.user.setActivity(`${prefix}${activity}`);
    console.log(`Active in ${client.guilds.cache.size} servers!`);
    console.log(`${'Region'.padEnd(12)} | ${'Members'.padEnd(8)} | Name`);
    console.log('-'.repeat(50));
    client.guilds.cache.forEach(guild => {
      console.log(`${guild.region.padEnd(12)} | ${guild.memberCount.toString().padEnd(8)} | ${guild.name}`);
    });
    console.log(`${client.user.tag} is ready!`);
  } catch (err) {
    console.log(err);
  }
};
