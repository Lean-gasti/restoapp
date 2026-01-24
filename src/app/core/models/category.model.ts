export interface ICategory {
  _id?: string;
  name: string;
  companyId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICategoryCreate {
  name: string;
}

export interface ICategoryUpdate {
  name: string;
}
