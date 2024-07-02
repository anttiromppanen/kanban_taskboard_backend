import { Schema, model } from "mongoose";
import { IComment } from "../types/types";

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

export const CommentSchema = new Schema<IComment>({
  text: { type: String, required: true },
  task: {
    type: Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
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
});

const Comment = model<IComment>("Comment", CommentSchema);

export default Comment;
