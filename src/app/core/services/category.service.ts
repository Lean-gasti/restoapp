import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api-endpoints.constant';
import { ApiResponse } from '../models/api-response.model';
import { ICategory, ICategoryCreate, ICategoryUpdate } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly baseUrl = API_ENDPOINTS.BASE_URL;
  
  private categoriesSubject = new BehaviorSubject<ICategory[]>([]);
  public categories$ = this.categoriesSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiResponse<ICategory[]>> {
    this.loadingSubject.next(true);
    
    return this.http.get<ApiResponse<ICategory[]>>(
      `${this.baseUrl}${API_ENDPOINTS.CATEGORIES.BASE}`
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.categoriesSubject.next(response.data);
        }
        this.loadingSubject.next(false);
      })
    );
  }

  getById(id: string): Observable<ApiResponse<ICategory>> {
    return this.http.get<ApiResponse<ICategory>>(
      `${this.baseUrl}${API_ENDPOINTS.CATEGORIES.BY_ID(id)}`
    );
  }

  create(category: ICategoryCreate): Observable<ApiResponse<ICategory>> {
    return this.http.post<ApiResponse<ICategory>>(
      `${this.baseUrl}${API_ENDPOINTS.CATEGORIES.BASE}`,
      category
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          const current = this.categoriesSubject.value;
          this.categoriesSubject.next([...current, response.data]);
        }
      })
    );
  }

  update(id: string, category: ICategoryUpdate): Observable<ApiResponse<ICategory>> {
    return this.http.put<ApiResponse<ICategory>>(
      `${this.baseUrl}${API_ENDPOINTS.CATEGORIES.BY_ID(id)}`,
      category
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          const current = this.categoriesSubject.value;
          const index = current.findIndex(c => c._id === id);
          if (index !== -1) {
            current[index] = response.data;
            this.categoriesSubject.next([...current]);
          }
        }
      })
    );
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}${API_ENDPOINTS.CATEGORIES.BY_ID(id)}`
    ).pipe(
      tap(response => {
        if (response.success) {
          const current = this.categoriesSubject.value;
          this.categoriesSubject.next(current.filter(c => c._id !== id));
        }
      })
    );
  }

  getCategoriesValue(): ICategory[] {
    return this.categoriesSubject.value;
  }
}
