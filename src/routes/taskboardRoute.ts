import express from "express";
import { Types } from "mongoose";
import Taskboard from "../models/TaskboardModel";
import { decodedToken, notifyWebsocketServer } from "../helpers/helpers";
import { ITask, IToken } from "../types/types";
import Task from "../models/TaskModel";
import User from "../models/UserModel";

const router = express.Router();

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
  const { name, description } = req.body;
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
    users: [idAsObjectId],
    admins: [idAsObjectId],
  });

  let savedTaskboard;
  try {
    savedTaskboard = await newTaskboard.save();
  } catch (err) {
    next(err);
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

export default router;
