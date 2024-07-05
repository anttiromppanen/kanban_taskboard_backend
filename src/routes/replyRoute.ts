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
import { CommentRequest, ReplyRequest } from "../types/requestTypes";
import { IComment, IReply, ITask, ITaskboard, IToken } from "../types/types";

const router = express.Router({ mergeParams: true });

router.post("/", async (req: CommentRequest, res, next) => {
  const { text } = req.body;
  const { taskboardId, taskId, commentId } = req.params;

  if (!text?.trim().length)
    return res.status(400).json({ error: "Text field required" });

  let validatedToken;
  let taskboard;
  let task;

  try {
    validatedToken = validateToken(req, next) as IToken;
    taskboard = (await checkTaskboardExists(taskboardId)) as ITaskboard;
    task = (await checkTaskExists(taskId)) as ITask;
  } catch (error) {
    console.error("Error checking taskboard or task", error);
    return next(error);
  }

  // check if task, comment exist
  try {
    checkTaskInTaskboard(taskboard, taskId);
    checkCommentInTask(task, commentId);
  } catch (error) {
    console.log("Error checking taskboard or task", error);
    return next(error);
  }

  const newReply = {
    text,
    createdBy: validatedToken.id,
    createdAt: new Date(),
  };

  let comment;

  try {
    comment = (await checkCommentExists(commentId)) as IComment;
    comment.replies.push(newReply as IReply);
  } catch (error) {
    console.error("Error fetching comment", error);
    return next(error);
  }

  try {
    checkCommentInTask(task, commentId);
    await comment.save();
    await task.save();
  } catch (error) {
    console.log(error);
    return next(error);
  }

  return res.status(201).json(comment);
});

router.delete("/:replyId", async (req: ReplyRequest, res, next) => {
  const { taskboardId, taskId, commentId, replyId } = req.params;

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

  // remove reply from comment
  comment.replies = comment.replies.filter(
    (r) => (r._id as Types.ObjectId).toString() !== replyId,
  );

  try {
    await comment.save();
  } catch (error) {
    console.error("Error deleting reply", error);
    return next(error);
  }

  return res.status(204).end();
});

export default router;
