import * as config from "../config.json";
import { Client } from "../src/types/Client";
import { Message } from "discord.js";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

describe("client", () => {
  const client = new Client("src/commands", "src/events");
  const message = {
    author: {
      bot: false,
    },
    channel: {
      send: jest.fn(),
    },
    content: "",
    guild: {
      id: "",
    },
    reply: jest.fn(),
  } as unknown as Message;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should print to console after it has logged in", () => {
    console.log = jest.fn();
    client.login(process.env.BOT_TOKEN).then(() => {
      expect(console.log).toHaveBeenCalledWith(
        `Active in ${client.guilds.cache.size} servers!`
      );
      expect(console.log).toHaveBeenCalledWith(`${client.user.tag} is ready!`);
    });
  });

  it("should be triggered by commands with its prefix", () => {
    message.content = `${config.prefix}ping`;
    client.emit("messageCreate", message);
    expect(message.channel.send).toHaveBeenCalledTimes(1);
    expect(message.channel.send).toBeCalledWith(
      "Pong! Your ping is **NaN ms**"
    );
  });

  it("should not be triggered by commands without its prefix", () => {
    message.content = "ping";
    client.emit("messageCreate", message);
    expect(message.channel.send).toHaveBeenCalledTimes(0);
  });
});
