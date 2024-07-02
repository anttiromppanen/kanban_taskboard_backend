import { NextFunction, Request, Response } from "express";

const unknownEndpoint = (request: Request, response: Response) => {
  console.error("Error: Unknown endpoint");
  return response.status(404).json({ error: "unknown endpoint" });
};

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === "JsonWebTokenError") {
    console.error("Invalid token", err);
    return res.status(401).json({ error: "Invalid token" });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ error: "Malformatted id" });
  }
  if (err.name === "RoleError") {
    return res
      .status(403)
      .json({ error: err.message || "Operation not allowed" });
  }
  if (err.name === "TaskboardNotFoundError") {
    return res.status(404).json({ error: err.message });
  }
  if (err.name === "UserNotFoundError") {
    return res.status(404).json({ error: err.message });
  }
  if (err.name === "UserNotInTaskboardError") {
    return res.status(403).json({ error: err.message });
  }
  if (err.name === "TaskNotFoundError") {
    return res.status(404).json({ error: err.message });
  }
  if (err.name === "IdsNotMatchingError") {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === "CommentNotFoundError") {
    return res.status(404).json({ error: err.message });
  }
  return next(err);
};

export { unknownEndpoint, errorHandler };
