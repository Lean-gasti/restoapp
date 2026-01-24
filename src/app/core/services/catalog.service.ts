import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api-endpoints.constant';
import { ApiResponse } from '../models/api-response.model';
import { 
  ICatalog, 
  ICatalogCreate, 
  ICatalogUpdate, 
  ICatalogItem, 
  ICatalogItemCreate 
} from '../models/catalog.model';

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  private readonly baseUrl = API_ENDPOINTS.BASE_URL;
  
  private catalogsSubject = new BehaviorSubject<ICatalog[]>([]);
  public catalogs$ = this.catalogsSubject.asObservable();
  
  private activeCatalogSubject = new BehaviorSubject<ICatalog | null>(null);
  public activeCatalog$ = this.activeCatalogSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Catalog CRUD
  getAll(): Observable<ApiResponse<ICatalog[]>> {
    this.loadingSubject.next(true);
    
    return this.http.get<ApiResponse<ICatalog[]>>(
      `${this.baseUrl}${API_ENDPOINTS.CATALOGS.BASE}`
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.catalogsSubject.next(response.data);
        }
        this.loadingSubject.next(false);
      })
    );
  }

  getById(id: string): Observable<ApiResponse<ICatalog>> {
    return this.http.get<ApiResponse<ICatalog>>(
      `${this.baseUrl}${API_ENDPOINTS.CATALOGS.BY_ID(id)}`
    );
  }

  getActive(): Observable<ApiResponse<ICatalog>> {
    return this.http.get<ApiResponse<ICatalog>>(
      `${this.baseUrl}${API_ENDPOINTS.CATALOGS.ACTIVE}`
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.activeCatalogSubject.next(response.data);
        }
      })
    );
  }

  create(catalog: ICatalogCreate): Observable<ApiResponse<ICatalog>> {
    return this.http.post<ApiResponse<ICatalog>>(
      `${this.baseUrl}${API_ENDPOINTS.CATALOGS.BASE}`,
      catalog
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          const current = this.catalogsSubject.value;
          this.catalogsSubject.next([...current, response.data]);
        }
      })
    );
  }

  update(id: string, catalog: ICatalogUpdate): Observable<ApiResponse<ICatalog>> {
    return this.http.put<ApiResponse<ICatalog>>(
      `${this.baseUrl}${API_ENDPOINTS.CATALOGS.BY_ID(id)}`,
      catalog
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          const current = this.catalogsSubject.value;
          const index = current.findIndex(c => c._id === id);
          if (index !== -1) {
            current[index] = response.data;
            this.catalogsSubject.next([...current]);
          }
        }
      })
    );
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}${API_ENDPOINTS.CATALOGS.BY_ID(id)}`
    ).pipe(
      tap(response => {
        if (response.success) {
          const current = this.catalogsSubject.value;
          this.catalogsSubject.next(current.filter(c => c._id !== id));
        }
      })
    );
  }

  activate(id: string): Observable<ApiResponse<ICatalog>> {
    return this.http.patch<ApiResponse<ICatalog>>(
      `${this.baseUrl}${API_ENDPOINTS.CATALOGS.ACTIVATE(id)}`,
      {}
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Update all catalogs to inactive except the activated one
          const current = this.catalogsSubject.value.map(c => ({
            ...c,
            isActive: c._id === id
          }));
          this.catalogsSubject.next(current);
          this.activeCatalogSubject.next(response.data);
        }
      })
    );
  }

  // Catalog Items
  getCatalogItems(catalogId: string): Observable<ApiResponse<ICatalogItem[]>> {
    return this.http.get<ApiResponse<ICatalogItem[]>>(
      `${this.baseUrl}${API_ENDPOINTS.CATALOG_ITEMS.BY_CATALOG(catalogId)}`
    );
  }

  createItem(item: ICatalogItemCreate): Observable<ApiResponse<ICatalogItem>> {
    return this.http.post<ApiResponse<ICatalogItem>>(
      `${this.baseUrl}${API_ENDPOINTS.CATALOG_ITEMS.BASE}`,
      item
    );
  }

  updateItem(id: string, item: Partial<ICatalogItem>): Observable<ApiResponse<ICatalogItem>> {
    return this.http.put<ApiResponse<ICatalogItem>>(
      `${this.baseUrl}${API_ENDPOINTS.CATALOG_ITEMS.BY_ID(id)}`,
      item
    );
  }

  deleteItem(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}${API_ENDPOINTS.CATALOG_ITEMS.BY_ID(id)}`
    );
  }

  reorderItem(id: string, newOrder: number): Observable<ApiResponse<ICatalogItem>> {
    return this.http.patch<ApiResponse<ICatalogItem>>(
      `${this.baseUrl}${API_ENDPOINTS.CATALOG_ITEMS.REORDER(id)}`,
      { order: newOrder }
    );
  }

  bulkAddItems(items: ICatalogItemCreate[]): Observable<ApiResponse<ICatalogItem[]>> {
    return this.http.post<ApiResponse<ICatalogItem[]>>(
      `${this.baseUrl}${API_ENDPOINTS.CATALOG_ITEMS.BULK_ADD}`,
      { items }
    );
  }
}
