import express from "express";
import { Types } from "mongoose";
import taskRoute from "./taskRoute";
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

router.use("/:taskboardId/task", taskRoute);

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

router.get("/:taskboardId/users", async (req, res, next) => {
  const { taskboardId } = req.params;
  let taskboard;

  try {
    validateToken(req, next) as IToken;
    taskboard = await checkTaskboardExists(taskboardId);
  } catch (error) {
    console.error("Error checking taskboard", error);
    return next(error);
  }

  return res.status(200).json(taskboard.users);
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
  const userAsObjectId = new Types.ObjectId(validatedToken.id);

  const newTaskboard = new Taskboard({
    name,
    description,
    createdBy: userAsObjectId,
    users: [userAsObjectId, ...users],
    admins: [userAsObjectId],
  });

  let savedTaskboard;
  try {
    savedTaskboard = await newTaskboard.save();
  } catch (err) {
    return next(err);
  }

  const usersFromDb = await User.find({
    _id: { $in: [userAsObjectId, ...users] },
  });

  // add taskboard to all users
  usersFromDb.forEach(async (x) => {
    x.taskboards.push(savedTaskboard._id as Types.ObjectId);

    try {
      await x.save();
    } catch (error) {
      console.error("Error saving user");
      return next(error);
    }

    return undefined;
  });

  return res.status(201).json(savedTaskboard);
});

export default router;
