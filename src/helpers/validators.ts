import { Types } from "mongoose";
import { NextFunction, Request } from "express";
import { IComment, ITask, ITaskboard, IToken, IUser } from "../types/types";
import {
  CommentNotFoundError,
  IdsNotMatchingError,
  RoleError,
  TaskNotFoundError,
  TaskboardNotFoundError,
  UserNotFoundError,
  UserNotInTaskboardError,
} from "./customErrors";
import Comment from "../models/CommentModel";
import { decodedToken } from "./helpers";
import Task from "../models/TaskModel";
import Taskboard from "../models/TaskboardModel";
import User from "../models/UserModel";

export const checkAdminRole = (user: IUser) => {
  const isAdmin = user.role === "admin";
  if (!isAdmin) {
    throw new RoleError(
      "Your role does not allow you to perform this operation",
    );
  }
};

export const checkUserExists = async (userId: string | Types.ObjectId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new UserNotFoundError("User not found");
  }
  return user;
};

export const checkTaskboardExists = async (taskboardId: string) => {
  const taskboard = await Taskboard.findById(taskboardId)
    .populate({
      path: "tasks",
      model: "Task",
      populate: {
        path: "comments",
        populate: [
          { path: "createdBy", model: "User" },
          { path: "markedResolvedBy", model: "User" },
          { path: "replies", populate: { path: "createdBy", model: "User" } },
        ],
      },
    })
    .populate({
      path: "users",
      model: "User",
    });

  if (!taskboard) {
    throw new TaskboardNotFoundError("Taskboard not found");
  }

  return taskboard;
};

export const checkTaskExists = async (taskId: string) => {
  const task = (await Task.findById(taskId)) as ITask;
  if (!task) {
    throw new TaskNotFoundError("Task not found");
  }
  return task;
};

export const checkCommentExists = async (
  commentId: Types.ObjectId | string,
) => {
  const comment = (await Comment.findById(commentId)) as IComment;
  if (!comment) {
    throw new CommentNotFoundError("Comment not found");
  }
  return comment;
};

export const checkTaskboardIdsMatch = (
  id1: Types.ObjectId | string,
  id2: Types.ObjectId | string,
) => {
  if (id1.toString() !== id2.toString()) {
    throw new IdsNotMatchingError(
      "Taskboard ids do not match in task and taskboard",
    );
  }
};

export const checkUserInTaskboard = (
  taskboard: ITaskboard,
  userId: Types.ObjectId | string,
) => {
  const id = new Types.ObjectId(userId as string);
  if (!taskboard.users.includes(id)) {
    throw new UserNotInTaskboardError("User not found in taskboard");
  }
};

export const checkTaskInTaskboard = (
  taskboard: ITaskboard,
  taskId: Types.ObjectId | string,
) => {
  const isTaskInTaskboard = taskboard.tasks.find(
    (x) => x._id.toString() === taskId.toString(),
  );

  if (!isTaskInTaskboard) {
    throw new TaskNotFoundError("Task not found in taskboard");
  }
};

export const checkCommentInTask = (
  task: ITask,
  commentId: Types.ObjectId | string,
) => {
  const comment = task.comments.find(
    (c) => c.toString() === commentId.toString(),
  );

  if (!comment) {
    throw new CommentNotFoundError(
      `Comment ${commentId} not found in task ${task._id}`,
    );
  }
};

export const validateToken = (req: Request, next: NextFunction) => {
  try {
    return decodedToken(req);
  } catch (error) {
    console.log("Error validating token", error);
    return next(error);
  }
};
