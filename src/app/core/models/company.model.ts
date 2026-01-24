export interface ICompany {
  _id?: string;
  name: string;
  slug: string;
  logoUrl?: string;
  location?: string;
  whatsapp?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICompanyUpdate {
  name?: string;
  slug?: string;
  logoUrl?: string;
  location?: string;
  whatsapp?: string;
}
