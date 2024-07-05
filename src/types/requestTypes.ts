import { Request } from "express";

export interface TaskRequest extends Request {
  params: {
    taskboardId: string;
    taskId: string;
  };
}

export interface CommentRequest extends Request {
  params: {
    taskboardId: string;
    taskId: string;
    commentId: string;
  };
}

export interface ReplyRequest extends Request {
  params: {
    taskboardId: string;
    taskId: string;
    commentId: string;
    replyId: string;
  };
}
