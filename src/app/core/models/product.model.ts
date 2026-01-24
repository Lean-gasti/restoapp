export interface IProduct {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  companyId: string;
  categoryId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProductCreate {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  available?: boolean;
  categoryId: string;
}

export interface IProductUpdate {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  available?: boolean;
  categoryId?: string;
}

export interface IProductFilter {
  categoryId?: string;
  available?: boolean;
  search?: string;
}
