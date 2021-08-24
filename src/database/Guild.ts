import { IGuild } from "../types/interfaces/Mongoose";
import { Schema, Model, model, models } from "mongoose";

export const Guild = new Schema({
  guildId: { type: String, required: true },
  prefix: { type: String, required: true },
});

export const GuildModel: Model<IGuild> =
  models.Guild || model<IGuild>("Guild", Guild);
