const { prefix } = require('../config.json');

module.exports = async(client) => {
    try {
        client.user.setActivity(`${prefix}jebeta`);
        console.log(`${client.user.tag} is ready!`);
    } catch (err) {
        console.log(err);
    }
};