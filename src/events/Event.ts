import { Client } from "../Client";
import { IEvent } from "../interfaces/Bot";

export abstract class Event implements IEvent {
  client: Client;
  run: (args?: any[]) => void;

  constructor(client: Client) {
    this.client = client;
  }
}
