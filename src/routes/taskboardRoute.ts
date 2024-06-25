import express from "express";
import { Types } from "mongoose";
import Taskboard from "../models/TaskboardModel";
import { decodedToken, notifyWebsocketServer } from "../helpers/helpers";
import { IComment, ITask, IToken } from "../types/types";
import Task from "../models/TaskModel";
import User from "../models/UserModel";

const router = express.Router();

router.get("/:taskboardId", async (req, res, next) => {
  const { taskboardId } = req.params;
  let taskboard;

  try {
    decodedToken(req);
    taskboard = await Taskboard.findById(taskboardId).populate({
      path: "tasks",
      model: "Task",
      populate: {
        path: "comments",
        populate: [
          { path: "createdBy", model: "User" },
          { path: "replies", populate: { path: "createdBy", model: "User" } },
        ],
      },
    });
  } catch (error) {
    console.error("Error getting taskboard", error);
    return next(error);
  }

  if (taskboard === null)
    return res.status(404).json({ error: "Taskboard not found" });

  return res.status(200).json(taskboard);
});

router.put("/:taskboardId/task/:taskId", async (req, res, next) => {
  const { title, description, status } = req.body;
  const { taskboardId, taskId } = req.params;
  let task;

  try {
    task = await Task.findById(taskId);
  } catch (err) {
    console.error("Error finding task", err);
    return next(err);
  }

  if (task?.taskboardId.toString() !== taskboardId.trim())
    return res.status(404).json({ error: "Taskboard not matching the task" });

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

  notifyWebsocketServer(updatedTask as ITask);
  return res.status(201).json(updatedTask);
});

// only admins can create new taskboards
router.post("/", async (req, res, next) => {
  const { name, description, users } = req.body;
  let token;

  // validate user from token
  try {
    token = decodedToken(req);
  } catch (err) {
    return next(err);
  }

  const user = await User.findById(token.id);

  if (!user) return res.status(404).json({ error: "User not found" });

  const isAdmin = user.role === "admin";

  if (!isAdmin)
    return res.status(403).json({
      error: "Your role does not allow you to perform this operation",
    });

  // convert string id to object id
  const idAsObjectId = new Types.ObjectId(token.id);

  const newTaskboard = new Taskboard({
    name,
    description,
    createdBy: idAsObjectId,
    users: [idAsObjectId, ...users],
    admins: [idAsObjectId],
  });

  let savedTaskboard;
  try {
    savedTaskboard = await newTaskboard.save();
  } catch (err) {
    next(err);
  }

  if (savedTaskboard) user.taskboards.push(savedTaskboard._id);

  try {
    await user.save();
  } catch (error) {
    console.error("Error saving user");
    return next(error);
  }

  return res.status(201).json(savedTaskboard);
});

router.post("/:taskboardId/task", async (req, res, next) => {
  const { title, description, status } = req.body;
  const { taskboardId } = req.params;

  if (!taskboardId)
    return res.status(401).json({ error: "Taskboard id required" });

  if (!(title.trim() && description.trim() && status.trim()))
    return res
      .status(400)
      .json({ error: "Fields title, description, status required" });

  let token;

  try {
    token = decodedToken(req);
  } catch (err) {
    return next(err);
  }

  const taskboardById = await Taskboard.findById(taskboardId);

  if (!taskboardById)
    return res.status(404).json({ error: "Taskboard not found" });

  const isUserInTaskboard = taskboardById.users.find(
    (userId) => userId.toString() === (token as IToken).id.toString(),
  );

  if (!isUserInTaskboard)
    return res.status(401).json({ error: "User not included in taskboard" });

  const newTask = new Task({
    title,
    description,
    status,
    taskboardId,
    createdBy: isUserInTaskboard,
  });

  let updatedTaskboard;

  try {
    const task = await newTask.save();

    // add the new task to taskboard
    taskboardById.tasks.push(task._id);
    updatedTaskboard = await taskboardById.save();
  } catch (err) {
    return next(err);
  }

  return res.status(201).json(updatedTaskboard);
});

router.post("/:taskboardId/task/:taskId/comment", async (req, res, next) => {
  const { taskboardId, taskId } = req.params;

  if (!taskboardId)
    return res.status(401).json({ error: "Taskboard id required" });
  if (!taskId) return res.status(401).json({ error: "Task id required" });

  const { comment, commentType } = req.body;

  if (!comment?.trim())
    return res.status(400).json({ error: "Comment cannot be empty" });

  let token;
  let taskboardById;

  try {
    token = decodedToken(req);
    taskboardById = await Taskboard.findById(taskboardId);
  } catch (err) {
    return next(err);
  }

  if (!taskboardById)
    return res.status(404).json({ error: "Taskboard not found" });

  const isUserInTaskboard = taskboardById.users.find(
    (userId) => userId.toString() === (token as IToken).id.toString(),
  );

  if (!isUserInTaskboard)
    return res.status(401).json({ error: "User not included in taskboard" });

  const newComment: IComment = {
    text: comment,
    commentType: commentType || "comment",
    createdBy: isUserInTaskboard._id,
    createdAt: new Date(),
    resolved: false,
    markedResolvedBy: null,
    replies: [],
  };

  const task = await Task.findById(taskId);

  if (!task)
    return res.status(404).json({ error: "Task not found in taskboard" });

  task.comments.push(newComment);

  let updatedTask;

  try {
    updatedTask = await task.save();
  } catch (error) {
    return next(error);
  }

  return res.status(201).json(updatedTask);
});

export default router;
