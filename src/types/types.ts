import { Types } from "mongoose";

type StatusType = "Backlog" | "To do" | "In progress" | "Done";

export interface ITask extends Document {
  title: string;
  description: string;
  status: StatusType;
  createdAt: Date;
  createdBy: Types.ObjectId;
}

export interface ITaskboard extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: Types.ObjectId;
  tasks: Types.ObjectId;
  users: Types.ObjectId[];
  admins: Types.ObjectId[];
}

export interface IUser extends Document {
  username: string;
  password: string;
  createdAt: Date;
  taskboards: Types.ObjectId[];
}

export interface IToken {
  username: string;
  id: Types.ObjectId;
  iat: number;
}
