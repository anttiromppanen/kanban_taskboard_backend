import express, { Request } from "express";
import { Types } from "mongoose";
import { notifyWebsocketServer } from "../helpers/helpers";
import {
  checkAdminRole,
  checkCommentExists,
  checkCommentInTask,
  checkTaskExists,
  checkTaskInTaskboard,
  checkTaskboardExists,
  checkTaskboardIdsMatch,
  checkUserExists,
  checkUserInTaskboard,
  validateToken,
} from "../helpers/validators";
import Comment from "../models/CommentModel";
import Task from "../models/TaskModel";
import {
  IComment,
  IReply,
  ITask,
  ITaskboard,
  IToken,
  IUser,
} from "../types/types";

const router = express.Router({ mergeParams: true });

interface TaskRequest extends Request {
  params: {
    taskboardId: string;
    taskId: string;
  };
}

interface CommentRequest extends Request {
  params: {
    taskboardId: string;
    taskId: string;
    commentId: string;
  };
}

interface ReplyRequest extends Request {
  params: {
    taskboardId: string;
    taskId: string;
    commentId: string;
    replyId: string;
  };
}

router.put("/:taskId", async (req: TaskRequest, res, next) => {
  const { title, description, status } = req.body;
  const { taskboardId, taskId } = req.params;

  let task;

  try {
    task = (await checkTaskExists(taskId)) as ITask;
    checkTaskboardIdsMatch(task.taskboardId, taskboardId);
  } catch (err) {
    console.error(err);
    return next(err);
  }

  task.title = title || task.title;
  task.description = description || task.description;
  task.status = status || task.status;

  let updatedTask;
  try {
    updatedTask = await task.save();
  } catch (err) {
    console.error("Error updating task", err);
    return next(err);
  }

  // notifyWebsocketServer(updatedTask as ITask);
  return res.status(200).json(updatedTask);
});

router.delete("/:taskId", async (req: TaskRequest, res, next) => {
  const { taskboardId, taskId } = req.params;

  let validatedToken;
  let user;
  let taskboard;
  let task;

  // validate everything, check should be admin
  try {
    validatedToken = validateToken(req, next) as IToken;
    taskboard = (await checkTaskboardExists(taskboardId)) as ITaskboard;
    task = (await checkTaskExists(taskId)) as ITask;
    user = (await checkUserExists(validatedToken.id)) as IUser;

    checkTaskInTaskboard(taskboard, taskId);
    checkUserInTaskboard(taskboard, validatedToken.id);
    checkAdminRole(user);
  } catch (error) {
    console.error("Error checking taskboard or task", error);
    return next(error);
  }

  // delete comments
  try {
    await Comment.deleteMany({ task: task._id });
  } catch (error) {
    console.error("Error deleting comments", error);
    return next(error);
  }

  // delete task
  try {
    await Task.findByIdAndDelete(taskId);
  } catch (error) {
    console.error("Error deleting task", error);
    return next(error);
  }

  // filter out task from taskboard
  taskboard.tasks = taskboard.tasks.filter((t) => t._id.toString() !== taskId);

  try {
    await taskboard.save();
  } catch (error) {
    console.error("Error saving taskboard", error);
    return next(error);
  }

  return res.status(204).end();
});

router.post("/", async (req: TaskRequest, res, next) => {
  const { title, description, status, users } = req.body;
  const { taskboardId } = req.params;

  if (!taskboardId)
    return res.status(401).json({ error: "Taskboard id required" });

  if (!(title?.trim() && description?.trim() && status?.trim()))
    return res
      .status(400)
      .json({ error: "Fields title, description, status required" });

  const validatedToken = validateToken(req, next) as IToken;
  const taskboardById = (await checkTaskboardExists(taskboardId)) as ITaskboard;

  try {
    checkUserInTaskboard(taskboardById, validatedToken.id);
  } catch (error) {
    console.error("Error checking taskboard", error);
    return next(error);
  }

  const newTask = new Task({
    title,
    description,
    status,
    taskboardId,
    users: users.length ? users : [],
    createdBy: validatedToken.id,
  });

  let updatedTaskboard;

  try {
    const task = await newTask.save();

    // add the new task to taskboard
    taskboardById.tasks.push(task._id as Types.ObjectId);
    updatedTaskboard = await taskboardById.save();
  } catch (err) {
    return next(err);
  }

  return res.status(201).json(updatedTaskboard);
});

router.post("/:taskId/comment", async (req: TaskRequest, res, next) => {
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

router.post(
  "/:taskId/comment/:commentId/reply",
  async (req: CommentRequest, res, next) => {
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
  },
);

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

router.delete(
  "/:taskId/comment/:commentId/reply/:replyId",
  async (req: ReplyRequest, res, next) => {
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
  },
);

export default router;
