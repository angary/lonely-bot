import { Command } from "./Command";
import { Event } from "./Event";
import { IServerMusicQueue } from "./interfaces/Bot";
import { Collection, Client as DiscordClient } from "discord.js";
import { readdirSync, statSync } from "fs";
import { join } from "path";

export class Client extends DiscordClient {
  commands: Collection<string, Command>;
  prefixes: { [key: number]: string };
  musicQueue: Map<string, IServerMusicQueue>;

  /**
   * @param relativePath path from this file to the events and command directory
   * @param commandsPath the path from root to the commands directory
   * @param eventsPath the path from root to the events directory
   */
  public constructor(
    relativePath: string,
    commandsPath: string,
    eventsPath: string
  ) {
    super();
    this.commands = new Collection();
    this.prefixes = {};
    this.musicQueue = new Map();

    // Load all the commands
    readdirSync(commandsPath).forEach((dir) => {
      if (statSync(join(commandsPath, dir)).isDirectory()) {
        const commandFiles = readdirSync(`${commandsPath}/${dir}`).filter(
          (f) => f.endsWith(".js" || ".ts") || f.endsWith(".ts")
        );

        for (const file of commandFiles) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const FoundCommand = require(join(
            relativePath,
            `commands/${dir}/${file}`
          )).default;
          const command: Command = new FoundCommand(this);

          console.log(`Loaded command ${dir}/${file}`);
          this.commands.set(command.name, command);
        }
      }
    });

    // Load all the events
    const eventFiles = readdirSync(eventsPath).filter(
      (f) => f.endsWith(".js") || f.endsWith(".ts")
    );
    for (const file of eventFiles) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const FoundEvent = require(join(relativePath, `events/${file}`)).default;
      const event: Event = new FoundEvent(this);
      const eventName = file.split(".")[0];

      this.on(
        eventName.charAt(0).toLowerCase() + eventName.slice(1),
        (...args: unknown[]) => event.run(args)
      );
    }
  }
}
