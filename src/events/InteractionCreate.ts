import { Event } from "../types/Event";
import { CommandInteraction, Interaction } from "discord.js";

export default class InteractionCreate extends Event {
  run = (args: Interaction[]): Promise<void> => {
    const [interaction] = args;
    if (!interaction.isCommand()) {
      return;
    }
    const commandInteraction = interaction as CommandInteraction;
    const { commandName } = commandInteraction;
    const command = this.client.commands.get(commandName);
    command.executeSlash(commandInteraction);
  };
}
