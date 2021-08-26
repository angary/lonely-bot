import Ping from "../../src/commands/general/Ping";
import { Client } from "../../src/types/Client";
import { Message } from "discord.js";

describe("PingCommand", () => {
  const message = {
    channel: {
      send: jest.fn(),
    },
  } as unknown as Message;

  const ping = new Ping(new Client());
  it("ping should respond with 'Pong!'", () => {
    ping.execute(message);
    expect(message.channel.send).toHaveBeenCalledTimes(1);
    expect(message.channel.send).toBeCalledWith(
      "Pong! Your ping is **NaN ms**"
    );
  });
});
