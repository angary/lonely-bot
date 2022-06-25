import { Guild } from "../interfaces/Mongoose";
import { Schema, Model, model, models } from "mongoose";

export const GuildSchema = new Schema({
  guildId: { type: String, required: true },
  prefix: { type: String, required: true },
});

export const GuildModel: Model<Guild> =
  models.Guild || model<Guild>("Guild", GuildSchema);
