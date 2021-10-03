import { Client } from "../../src/types/Client";
import { Message } from "discord.js";

describe("ping command", () => {
  const message = {
    channel: {
      send: jest.fn(),
    },
  } as unknown as Message;

  const client = new Client("src/commands", "src/events");
  const ping = client.commands.get("ping");
  it("ping should respond with 'Pong!'", () => {
    ping.execute(message);
    expect(message.channel.send).toHaveBeenCalledTimes(1);
    expect(message.channel.send).toBeCalledWith(
      "Pong! Your ping is **NaN ms**"
    );
  });
});
