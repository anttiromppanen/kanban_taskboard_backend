import express from "express";
import { Types } from "mongoose";
import {
  checkCommentExists,
  checkCommentInTask,
  checkTaskExists,
  checkTaskInTaskboard,
  checkTaskboardExists,
  checkUserInTaskboard,
  validateToken,
} from "../helpers/validators";
import Comment from "../models/CommentModel";
import replyRoute from "./replyRoute";
import { CommentRequest, TaskRequest } from "../types/requestTypes";
import { IComment, ITask, ITaskboard, IToken } from "../types/types";

const router = express.Router({ mergeParams: true });

router.use("/:commentId/reply", replyRoute);

router.post("/", async (req: TaskRequest, res, next) => {
  const { taskboardId, taskId } = req.params;
  const { text, commentType } = req.body;

  if (!text?.trim().length)
    return res.status(400).json({ error: "Text field required" });

  let validatedToken;
  let taskboard;
  let task;

  // validate token, taskboard, task
  try {
    validatedToken = validateToken(req, next) as IToken;
    taskboard = (await checkTaskboardExists(taskboardId)) as ITaskboard;
    task = (await checkTaskExists(taskId)) as ITask;
  } catch (error) {
    console.error("Error checking taskboard or task", error);
    return next(error);
  }

  try {
    checkTaskInTaskboard(taskboard, taskId);
  } catch (error) {
    console.error("Error checking taskboard or task", error);
    return next(error);
  }

  let newComment = new Comment({
    text,
    task: task._id,
    commentType,
    createdBy: validatedToken.id,
    createdAt: new Date(),
    resolved: false,
    markedResolvedBy: null,
    replies: [],
  });

  let savedTask;

  try {
    newComment = await newComment.save();
    task.comments.push(newComment._id as Types.ObjectId);
    savedTask = await task.save();
  } catch (error) {
    console.error("Error saving comment", error);
    return next(error);
  }

  return res.status(201).json(savedTask);
});

router.delete(
  "/:taskId/comment/:commentId",
  async (req: CommentRequest, res, next) => {
    const { taskboardId, taskId, commentId } = req.params;

    // validate
    let validatedToken;
    let taskboard;
    let task;
    let comment;

    try {
      validatedToken = validateToken(req, next) as IToken;
      taskboard = (await checkTaskboardExists(taskboardId)) as ITaskboard;
      task = (await checkTaskExists(taskId)) as ITask;
      comment = (await checkCommentExists(commentId)) as IComment;

      checkUserInTaskboard(taskboard, validatedToken.id);
      checkTaskInTaskboard(taskboard, taskId);
      checkCommentInTask(task, commentId);
    } catch (error) {
      console.error("Error checking taskboard or task", error);
      return next(error);
    }

    // creator or admin can delete comments
    if (
      validatedToken.id.toString() !== comment.createdBy.toString() &&
      validatedToken.role !== "admin"
    )
      return res.status(401).json({ error: "Unauthorized" });

    // delete comment and remove from task
    try {
      await Comment.findByIdAndDelete(commentId);
      task.comments = task.comments.filter((c) => c.toString() !== commentId);
      await task.save();
    } catch (error) {
      console.error("Error deleting comment", error);
      return next(error);
    }

    return res.status(204).end();
  },
);

export default router;
