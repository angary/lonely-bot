import { IUser } from "../types/interfaces/Mongoose";
import { Schema, Model, model, models } from "mongoose";

export const User = new Schema({
  discordID: { type: String, required: true },
  steamID: { type: String, required: true },
});

export const UserModel: Model<IUser> =
  models.User || model<IUser>("User", User);
