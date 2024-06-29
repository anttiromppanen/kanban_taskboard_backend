import express from "express";
import { Types } from "mongoose";
import taskRoute from "./taskRoute";
import { decodedToken } from "../helpers/helpers";
import {
  checkAdminRole,
  checkTaskboardExists,
  checkUserExists,
  validateToken,
} from "../helpers/validators";
import Taskboard from "../models/TaskboardModel";
import User from "../models/UserModel";
import { IToken, IUser } from "../types/types";

const router = express.Router();

router.get("/:taskboardId", async (req, res, next) => {
  const { taskboardId } = req.params;
  let taskboard;

  try {
    taskboard = await checkTaskboardExists(taskboardId);
  } catch (error) {
    console.error("Error checking taskboard", error);
    return next(error);
  }

  return res.status(200).json(taskboard);
});

// only admins can create new taskboards
router.post("/", async (req, res, next) => {
  const { name, description, users } = req.body;

  const validatedToken = validateToken(req, next) as IToken;
  const user = (await checkUserExists(validatedToken.id)) as IUser;

  try {
    checkAdminRole(user);
  } catch (error) {
    console.error("Error checking user", error);
    return next(error);
  }

  // convert string id to object id
  const idAsObjectId = new Types.ObjectId(validatedToken.id);

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

  if (savedTaskboard)
    user.taskboards.push(savedTaskboard._id as Types.ObjectId);

  try {
    await user.save();
  } catch (error) {
    console.error("Error saving user");
    return next(error);
  }

  return res.status(201).json(savedTaskboard);
});

router.use("/:taskboardId/task", taskRoute);

export default router;
