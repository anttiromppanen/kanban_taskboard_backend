import { Schema, model } from "mongoose";
import { IUser } from "../types/types";

export const UserSchema = new Schema<IUser>({
  username: {
    required: true,
    type: String,
    unique: true,
  },
  password: {
    required: true,
    type: String,
  },
  role: {
    required: true,
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  taskboards: [
    {
      type: Schema.Types.ObjectId,
      ref: "Taskboard",
      default: [],
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = model<IUser>("User", UserSchema);

export default User;
