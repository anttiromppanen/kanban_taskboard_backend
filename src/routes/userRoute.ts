import express from "express";
import bcrypt from "bcrypt";
import User from "../models/UserModel";
import { decodedToken } from "../helpers/helpers";
import { IUser } from "../types/types";

const router = express.Router();

router.get("/", async (_req, res) => {
  const response = await User.find({});
  return res.status(200).json(response);
});

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  if (!(username.trim().length > 0 && password.trim().length > 0)) {
    return res.status(401).json({ error: "No empty values allowed" });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    password: passwordHash,
  });

  const savedUser = await user.save();

  return res.status(201).json(savedUser);
});

router.get("/taskboards", async (req, res, next) => {
  let token;

  try {
    token = decodedToken(req);
  } catch (error) {
    console.error("Error gettings taskboards for user", error);
    return next(error);
  }

  const user = await User.findById(token.id)
    .populate({
      path: "taskboards",
      populate: [
        { path: "createdBy", model: "User", select: ["username"] },
        { path: "users", model: "User", select: ["username"] },
      ],
    })
    .exec();

  if (!user) return res.status(404).json({ error: "User not found" });

  return res.status(200).json(user.taskboards);
});

export default router;
