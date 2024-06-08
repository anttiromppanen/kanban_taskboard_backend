import { Schema, model } from "mongoose";
import { ITaskboard } from "../types/types";

export const TaskboardSchema = new Schema<ITaskboard>({
  name: {
    required: true,
    type: String,
  },
  description: String,
  createdAt: { type: Date, default: Date.now },
  createdBy: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  tasks: {
    type: Schema.Types.ObjectId,
    ref: "Task",
    default: [],
  },
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: [],
    },
  ],
  admins: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: [],
    },
  ],
});

const Taskboard = model<ITaskboard>("Taskboard", TaskboardSchema);

export default Taskboard;
