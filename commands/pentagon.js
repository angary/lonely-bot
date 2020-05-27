module.exports = {
    name: 'pentagon',
    aliases: [`areapentagon`, `dotapentagon`],
    description: `Given 5 values of the player's pentagon, it gives the area of the pentagon`,
    usage: [`[Fighting] [Farming] [Supporting] [Pushing] [Versatility]`],
	execute(message, args) {

        // If there were not enough arguments
        if (args.length != 5) {
            return message.channel.send(`You didn't give 5 values`);
        }
        let area = 0;
        for (let i = 0; i < 4; i++) {
            if (0 <= args[i] && args[i] <= 10) {
                area += (0.5) * (args[i]) * (args[i + 1]) * (Math.sin(72 * Math.PI / 180));
            }
            else {
                return message.channel.send(`${args[i]} was not a valid value`);
            }
        }
        area += (0.5) * (args[0]) * (args[4]) * (Math.sin(72 * Math.PI / 180));
        
        return message.channel.send(`The area of your pentagon is ${area}!`);
	},
};