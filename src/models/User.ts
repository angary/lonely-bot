import { User } from "../interfaces/Mongoose";
import { Schema, Model, model, models } from "mongoose";

export const UserSchema = new Schema({
  discordID: { type: String, required: true },
  steamID: { type: String, required: true },
});

export const UserModel: Model<User> =
  models.User || model<User>("User", UserSchema);
