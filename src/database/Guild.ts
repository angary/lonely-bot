import { Schema, Model, model, models } from "mongoose";
import { IGuild } from "../interfaces/Mongoose";

export const Guild = new Schema({
  guildId: { type: String, required: true },
  prefix: { type: String, required: true },
});

export const GuildModel: Model<IGuild> =
  models.Guild || model<IGuild>("Guild", Guild);
