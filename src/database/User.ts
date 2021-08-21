import { Schema, Model, model, models } from "mongoose";
import { IGuild, IUser } from "../interfaces/Mongoose";

export const User = new Schema({
  discordID: { type: String, required: true },
  steamID: { type: String, required: true },
});

export const UserModel: Model<IUser> =
  models.User || model<IUser>("User", User);
