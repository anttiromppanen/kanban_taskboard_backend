/* eslint-disable max-classes-per-file */
export class RoleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoleError";
  }
}

export class TaskboardNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskboardNotFoundError";
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserNotFoundError";
  }
}

export class UserNotInTaskboardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserNotInTaskboardError";
  }
}

export class TaskNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskNotFoundError";
  }
}

export class CommentNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommentNotFoundError";
  }
}

export class IdsNotMatchingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdsNotMatchingError";
  }
}
