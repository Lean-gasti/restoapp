export interface ICatalogItemProduct {
  productId: string;
  customName?: string;
  customDescription?: string;
}

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

export interface ICatalogItemCreate {
  name: string;
  description?: string;
  order: number;
  catalogId: string;
  products: ICatalogItemProduct[];
}

export interface ICatalogConfiguration {
  view_prices: boolean;
}

export interface ICatalog {
  _id?: string;
  name: string;
  description: string;
  companyId: string;
  isActive?: boolean;
  configuration: ICatalogConfiguration;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICatalogCreate {
  name: string;
  description?: string;
  configuration?: ICatalogConfiguration;
}

export interface ICatalogUpdate {
  name?: string;
  description?: string;
  isActive?: boolean;
  configuration?: ICatalogConfiguration;
}
