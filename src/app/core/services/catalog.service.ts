import { Injectable, signal, WritableSignal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints.constant';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { 
  ICatalog, 
  ICatalogCreate, 
  ICatalogUpdate, 
} from '../models/catalog.model';
import { ApiService } from '../infrastructure/api.service';
@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private _catalogs: WritableSignal<PaginatedResponse<ICatalog>> = signal({data: [], totalCount: 0, page: 1, limit: 10, totalPages: 1});
  public catalogs = this._catalogs.asReadonly();

  constructor(private apiService: ApiService) {}

  // Catalog CRUD
  getAll(): Observable<PaginatedResponse<ICatalog>> {
    
    return this.apiService.get<PaginatedResponse<ICatalog>>(
      `${API_ENDPOINTS.CATALOGS.BASE}`
    ).pipe(
      tap(response => {
        if (response) {
          this._catalogs.set(response);
        }
      })
    );
  }

  getById(id: string): Observable<ICatalog> {
    return this.apiService.get<ICatalog>(
      `${API_ENDPOINTS.CATALOGS.BY_ID(id)}`
    );
  }

  create(catalog: ICatalogCreate): Observable<ICatalog> {
    return this.apiService.post<ICatalog>(
      `${API_ENDPOINTS.CATALOGS.BASE}`,
      catalog
    ).pipe(
      tap(response => {
        if (response) {
          const current = this.catalogs();
          this._catalogs.set({...current, data: [...current.data, response]});
        }
      })
    );
  }

  update(id: string, catalog: ICatalogUpdate): Observable<ICatalog> {
    return this.apiService.put<ICatalog>(
      `${API_ENDPOINTS.CATALOGS.BY_ID(id)}`,
      catalog
    ).pipe(
      tap(response => {
        if (response) {
          const current = this.catalogs();
          const index = current.data.findIndex(c => c._id === id);
          if (index !== -1) {
            current.data[index] = response;
            this._catalogs.set({...current});
          }
        }
      })
    );
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(
      `${API_ENDPOINTS.CATALOGS.BY_ID(id)}`
    ).pipe(
      tap(response => {
        if (response.success) {
          const current = this.catalogs();
          this._catalogs.set({...current, data: current.data.filter(c => c._id !== id)});
        }
      })
    );
  }

}
