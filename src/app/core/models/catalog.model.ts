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

export interface ICatalogConfiguration {
  view_prices: boolean;
}