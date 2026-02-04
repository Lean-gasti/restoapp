import { ICatalogItemProduct } from "../../core/models/catalog-item.model";
import { ICatalogConfiguration } from "../../core/models/catalog.model";

export interface ICatalogItemCreate {
  name: string;
  description?: string;
  order: number;
  catalogId: string;
  products: ICatalogItemProduct[];
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
