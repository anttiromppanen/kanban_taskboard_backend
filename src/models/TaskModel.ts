import { Schema, model } from "mongoose";
import { ITask } from "../types/types";

const replySchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

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
  users: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: [],
    },
  ],
  comments: [
    {
      text: { type: String, required: true },
      commentType: {
        type: String,
        required: true,
        enum: ["comment", "question", "bug"],
      },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      createdAt: { type: Date, default: Date.now },
      // resolved can be a boolean or a date if the comment is resolved
      resolved: { default: false, type: Schema.Types.Mixed },
      markedResolvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      replies: {
        type: [replySchema],
        default: [],
      },
    },
  ],
});

const Task = model<ITask>("Task", TaskSchema);

export default Task;
