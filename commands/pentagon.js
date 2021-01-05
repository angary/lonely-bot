module.exports = {
  name: 'pentagon',
  aliases: ['areapentagon', 'dotapentagon', 'p'],
  description: 'Return area of the dota 2 stat pentagon',
  information: "Given 5 values of the player's pentagon, it gives the area of the pentagon with those values, the maximum possible area by swapping balue positions, and the ratio of area of the given area to the maximum area.",
  args: true,
  usage: '[Fighting] [Farming] [Supporting] [Pushing] [Versatility]',
  example: '7.5 0.5 9.8 5.1 0.7',
  cooldown: 0,
  category: 'dota',
  execute (message, args) {
    if (args.length !== 5) {
      return message.channel.send("You didn't give 5 values");
    }

    // Strip commas and space from the numbers if there are any at the end
    for (let i = 0; i < 5; i++) {
      args[i] = args[i].replace(/[ ,]/g, '');
    }

    // Given the five lengths from center to corners of pentagon, calculate area
    function area (lengths) {
      let sum = 0;
      for (let i = 0; i < 4; i++) {
        if (isNaN(lengths[i])) {
          return message.channel.send(`${lengths[i]} is not a number - example usage is \`>pentagon 7.5 0.5 9.8 5.1 0.7\``);
        }
        if (lengths[i] > 0 && lengths[i] <= 10) {
          sum += (0.5) * (lengths[i]) * (lengths[i + 1]) * (Math.sin(72 * Math.PI / 180));
        } else {
          return message.channel.send(`${lengths[i]} was not a valid value`);
        }
      }
      sum += (0.5) * (lengths[0]) * (lengths[4]) * (Math.sin(72 * Math.PI / 180));
      return sum;
    }

    const unsortedArgs = [...args];
    args.sort((a, b) => a - b);
    const sortedArgs = [args[1], args[3], args[4], args[2], args[0]];
    const max = [10, 10, 10, 10, 10];
    const unsortedPercentage = (area(unsortedArgs) * 100) / area(max);
    const sortedPercentage = (area(sortedArgs) * 100 / area(max));

    message.channel.send(`The area of your pentagon is **${area(unsortedArgs).toFixed(2)}**, rating: **${unsortedPercentage.toFixed(2)}%**`);
    message.channel.send(`Max area of your pentagon is **${area(sortedArgs).toFixed(2)}**, rating: **${sortedPercentage.toFixed(2)}%**`);
  }
};
