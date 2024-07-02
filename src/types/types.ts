import { Types, Document } from "mongoose";

type StatusType = "Backlog" | "To do" | "In progress" | "Done";
type UserRoles = "admin" | "user";
type CommentType = "comment" | "question" | "bug";

export interface IReply extends Document {
  text: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

export interface IComment extends Document {
  text: string;
  task: Types.ObjectId;
  commentType: CommentType;
  createdBy: Types.ObjectId;
  createdAt: Date;
  resolved: boolean | Date;
  markedResolvedBy: Types.ObjectId | null;
  replies: IReply[];
}

export interface ITask extends Document {
  title: string;
  description: string;
  status: StatusType;
  taskboardId: Types.ObjectId;
  createdAt: Date;
  createdBy: Types.ObjectId;
  users: Types.ObjectId[];
  comments: Types.ObjectId[];
}

export interface ITaskboard extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: Types.ObjectId;
  tasks: Types.ObjectId[];
  users: Types.ObjectId[];
  admins: Types.ObjectId[];
}

export interface IUser extends Document {
  username: string;
  password: string;
  role: UserRoles;
  createdAt: Date;
  taskboards: Types.ObjectId[];
}

export interface IToken {
  username: string;
  id: Types.ObjectId;
  role: UserRoles;
  iat: number;
}
