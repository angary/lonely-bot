import { prefix, activity } from "../../config.json";
import { Event } from "../types/Event";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/rest/v9";

export default class Ready extends Event {
  run = async (): Promise<void> => {
    try {
      const { slashCommands, token, testGuildId, user } = this.client;

      // Load up slash commands
      if (token !== undefined) {
        const rest = new REST({ version: "9" }).setToken(token);
        const slashCommandsJSON = [];
        slashCommands.forEach((command) =>
          slashCommandsJSON.push(command.data.toJSON())
        );

        // Load up commands of test server
        if (testGuildId !== undefined) {
          (async () => {
            try {
              console.log("Started refreshing application (/) commands.");

              await rest.put(
                Routes.applicationGuildCommands(user.id, testGuildId),
                {
                  body: slashCommandsJSON,
                }
              );

              console.log("Successfully reloaded application (/) commands.");
            } catch (error) {
              console.error(error);
            }
          })();
        }
        rest.put(Routes.applicationCommands(user.id), {
          body: slashCommandsJSON,
        });
      }
      this.client.user.setActivity(`${prefix}${activity}`);
      console.log(`Active in ${this.client.guilds.cache.size} servers!`);
      console.log(`${this.client.user.tag} is ready!`);
    } catch (err) {
      console.log(err);
    }
  };
}
