export interface ICatalogItem {
  _id?: string;
  name: string;
  description: string;
  order: number;
  catalogId: string;
  products: ICatalogItemProduct[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICatalogItemProduct {
  productId: string;
  customName?: string;
  customDescription?: string;
}
