import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api-endpoints.constant';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { IProduct, IProductCreate, IProductUpdate, IProductFilter } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = API_ENDPOINTS.BASE_URL;
  
  private productsSubject = new BehaviorSubject<IProduct[]>([]);
  public products$ = this.productsSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAll(filter?: IProductFilter): Observable<ApiResponse<IProduct[]>> {
    let params = new HttpParams();
    
    if (filter?.categoryId) {
      params = params.set('categoryId', filter.categoryId);
    }
    if (filter?.available !== undefined) {
      params = params.set('available', filter.available.toString());
    }
    if (filter?.search) {
      params = params.set('search', filter.search);
    }

    this.loadingSubject.next(true);
    
    return this.http.get<ApiResponse<IProduct[]>>(
      `${this.baseUrl}${API_ENDPOINTS.PRODUCTS.BASE}`,
      { params }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.productsSubject.next(response.data);
        }
        this.loadingSubject.next(false);
      })
    );
  }

  getById(id: string): Observable<ApiResponse<IProduct>> {
    return this.http.get<ApiResponse<IProduct>>(
      `${this.baseUrl}${API_ENDPOINTS.PRODUCTS.BY_ID(id)}`
    );
  }

  getByCategory(categoryId: string): Observable<ApiResponse<IProduct[]>> {
    return this.http.get<ApiResponse<IProduct[]>>(
      `${this.baseUrl}${API_ENDPOINTS.PRODUCTS.BY_CATEGORY(categoryId)}`
    );
  }

  search(query: string): Observable<ApiResponse<IProduct[]>> {
    const params = new HttpParams().set('q', query);
    return this.http.get<ApiResponse<IProduct[]>>(
      `${this.baseUrl}${API_ENDPOINTS.PRODUCTS.SEARCH}`,
      { params }
    );
  }

  create(product: IProductCreate): Observable<ApiResponse<IProduct>> {
    return this.http.post<ApiResponse<IProduct>>(
      `${this.baseUrl}${API_ENDPOINTS.PRODUCTS.BASE}`,
      product
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          const current = this.productsSubject.value;
          this.productsSubject.next([...current, response.data]);
        }
      })
    );
  }

  update(id: string, product: IProductUpdate): Observable<ApiResponse<IProduct>> {
    return this.http.put<ApiResponse<IProduct>>(
      `${this.baseUrl}${API_ENDPOINTS.PRODUCTS.BY_ID(id)}`,
      product
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          const current = this.productsSubject.value;
          const index = current.findIndex(p => p._id === id);
          if (index !== -1) {
            current[index] = response.data;
            this.productsSubject.next([...current]);
          }
        }
      })
    );
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}${API_ENDPOINTS.PRODUCTS.BY_ID(id)}`
    ).pipe(
      tap(response => {
        if (response.success) {
          const current = this.productsSubject.value;
          this.productsSubject.next(current.filter(p => p._id !== id));
        }
      })
    );
  }

  toggleAvailability(id: string, available: boolean): Observable<ApiResponse<IProduct>> {
    return this.http.patch<ApiResponse<IProduct>>(
      `${this.baseUrl}${API_ENDPOINTS.PRODUCTS.AVAILABILITY(id)}`,
      { available }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          const current = this.productsSubject.value;
          const index = current.findIndex(p => p._id === id);
          if (index !== -1) {
            current[index] = response.data;
            this.productsSubject.next([...current]);
          }
        }
      })
    );
  }

  bulkUpload(products: IProductCreate[]): Observable<ApiResponse<IProduct[]>> {
    return this.http.post<ApiResponse<IProduct[]>>(
      `${this.baseUrl}${API_ENDPOINTS.PRODUCTS.BULK_UPLOAD}`,
      { products }
    );
  }
}
