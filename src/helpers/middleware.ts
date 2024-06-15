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
  if (err.name === "JsonWebTokenError") {
    console.error("Invalid token", err);
    return res.status(401).json({ error: "Invalid token" });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ error: "Malformatted id" });
  }
  return next(err);
};

export { unknownEndpoint, errorHandler };
