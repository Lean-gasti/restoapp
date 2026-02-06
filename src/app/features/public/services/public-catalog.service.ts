import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ICompany } from '../../../core/models/company.model';
import { ICatalog } from '../../../core/models/catalog.model';

export interface IPublicCatalogResponse {
  company: ICompany;
  catalog: ICatalog & { items: any[] };
}

export interface ICatalogsListResponse {
  data: ICatalog[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class PublicCatalogService {
  private readonly baseUrl = `${environment.apiUrl}/public`;

  constructor(private http: HttpClient) {}

  getCompanyBySlug(slug: string): Observable<ICompany> {
    return this.http.get<ICompany>(`${this.baseUrl}/${slug}`);
  }

  getCatalogsBySlug(slug: string): Observable<ICatalogsListResponse> {
    return this.http.get<ICatalogsListResponse>(`${this.baseUrl}/${slug}/catalogs`);
  }

  getCatalogById(slug: string, catalogId: string): Observable<IPublicCatalogResponse> {
    return this.http.get<IPublicCatalogResponse>(`${this.baseUrl}/${slug}/catalogs/${catalogId}`);
  }
}
