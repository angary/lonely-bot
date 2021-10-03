import { Command } from "./Command";
import { Event } from "./Event";
import { IServerMusicQueue } from "./interfaces/Bot";
import { Collection, Client as DiscordClient, Intents } from "discord.js";
import { readdirSync, statSync } from "fs";
import { join } from "path";

export class Client extends DiscordClient {
  commands: Collection<string, Command>;
  slashCommands: Collection<string, Command>;
  prefixes: { [key: number]: string };
  musicQueue: Map<string, IServerMusicQueue>;
  token: string;
  testGuildId: string;

  /**
   * @param commandsPath the path from root to the commands directory
   * @param eventsPath the path from root to the events directory
   */
  public constructor(
    commandsPath: string,
    eventsPath: string,
    token?: string,
    testGuildId?: string
  ) {
    super({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      ],
    });
    this.commands = new Collection();
    this.slashCommands = new Collection();
    this.prefixes = {};
    this.musicQueue = new Map();
    this.token = token;
    this.testGuildId = testGuildId;

    // Load all the commands
    readdirSync(commandsPath).forEach((dir) => {
      if (statSync(join(commandsPath, dir)).isDirectory()) {
        const commandFiles = readdirSync(`${commandsPath}/${dir}`).filter(
          (f) => f.endsWith(".js") || f.endsWith(".ts")
        );

        for (const file of commandFiles) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const FoundCommand = require(`../commands/${dir}/${file}`).default;
          const command: Command = new FoundCommand(this);

          console.log(`Loaded command ${dir}/${file}`);
          this.commands.set(command.name, command);

          // Slash commands
          if (command.data !== null) {
            this.slashCommands.set(command.name, command);
          }
        }
      }
    });

    // Load all the events
    const eventFiles = readdirSync(eventsPath).filter(
      (f) => f.endsWith(".js") || f.endsWith(".ts")
    );
    for (const file of eventFiles) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const FoundEvent = require(join(`../events/${file}`)).default;
      const event: Event = new FoundEvent(this);
      const eventFileName = file.split(".")[0];
      const eventName =
        eventFileName.charAt(0).toLowerCase() + eventFileName.slice(1);
      console.log(`Loaded event ${eventName}`);
      this.on(eventName, (...args: unknown[]) => {
        event.run(args);
      });
    }
  }
}
