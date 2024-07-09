import express from "express";
import { Types } from "mongoose";
import {
  checkAdminRole,
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
import { TaskRequest } from "../types/requestTypes";
import { ITask, ITaskboard, IToken, IUser } from "../types/types";
import commentRoute from "./commentRoute";

const router = express.Router({ mergeParams: true });

router.use("/:taskId/comment", commentRoute);

router.get("/:taskId", async (req: TaskRequest, res, next) => {
  const { taskboardId, taskId } = req.params;
  let taskboard;
  let task;

  try {
    validateToken(req, next) as IToken;

    task = await Task.findById(taskId)
      .populate("users")
      .populate("createdBy")
      .populate("taskboardId")
      .populate({
        path: "comments",
        populate: [
          { path: "createdBy", model: "User" },
          { path: "markedResolvedBy", model: "User" },
          { path: "replies", populate: { path: "createdBy", model: "User" } },
        ],
      });

    taskboard = (await checkTaskboardExists(taskboardId)) as ITaskboard;
    checkTaskInTaskboard(taskboard, taskId);
  } catch (err) {
    console.error("Error fetching tasks", err);
    return next(err);
  }

  return res.status(200).json(task);
});

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

export default router;
