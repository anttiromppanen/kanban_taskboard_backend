import { Schema } from "mongoose";
import { ITask } from "../types/types";

const TaskSchema = new Schema<ITask>({
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
  },
  createdAt: { type: Date, default: Date.now },
  createdBy: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

export default TaskSchema;
