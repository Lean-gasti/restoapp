import { USER_ROLE } from '../constants/user-roles.constant';

export interface IUser {
  _id?: string;
  email: string;
  password?: string;
  role: USER_ROLE;
  companyId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserCreate {
  email: string;
  password: string;
  role: USER_ROLE;
  companyId: string;
}

export interface IUserUpdate {
  email?: string;
  role?: USER_ROLE;
}
