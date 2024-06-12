import { Schema, model } from "mongoose";
import { ITask } from "../types/types";

export const TaskSchema = new Schema<ITask>({
  title: {
    required: true,
    type: String,
  },
  description: {
    required: true,
    type: String,
  },
  status: {
    required: true,
    type: String,
    enum: ["Backlog", "To do", "In progress", "Done"],
    default: "Backlog",
  },
  taskboardId: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: "Taskboard",
  },
  createdAt: { type: Date, default: Date.now },
  createdBy: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const Task = model<ITask>("Task", TaskSchema);

export default Task;
