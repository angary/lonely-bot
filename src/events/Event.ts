import { IBot, IEvent } from "../interfaces/Bot";

export abstract class Event implements IEvent {
  client: IBot;
  run: (args?: any[]) => void;

  constructor(client: IBot) {
    this.client = client;
  }
}
