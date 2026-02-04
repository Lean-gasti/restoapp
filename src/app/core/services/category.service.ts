import { Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api-endpoints.constant';
import { ApiResponse } from '../models/api-response.model';
import { ICategory, ICategoryCreate, ICategoryUpdate } from '../models/category.model';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly baseUrl = environment.apiUrl;
  
  private _categories: WritableSignal<ICategory[]> = signal([]);
  public categories = this._categories.asReadonly();

  constructor(private http: HttpClient) {}

  getAll(): Observable<ICategory[]> {
    return this.http.get<ICategory[]>(
      `${this.baseUrl}${API_ENDPOINTS.CATEGORIES.GET_ALL}`
    ).pipe(
      tap(response => {
        if (response) {
          this._categories.set(response);
        }
      })
    );
  }

  create(category: ICategoryCreate): Observable<ICategory> {
    return this.http.post<ICategory>(
      `${this.baseUrl}${API_ENDPOINTS.CATEGORIES.CREATE}`,
      category
    ).pipe(
      tap(response => {
        if (response && response) {
          const current = this.categories();
          this._categories.set([...current, response]);
        }
      })
    );
  }

  update(id: string, category: ICategoryUpdate): Observable<ICategory> {
    return this.http.put<ICategory>(
      `${this.baseUrl}${API_ENDPOINTS.CATEGORIES.MODIFY(id)}`,
      category
    ).pipe(
      tap(response => {
        if (response) {
          const current = this.categories();
          const index = current.findIndex(c => c._id === id);
          if (index !== -1) {
            current[index] = response;
            this._categories.set([...current]);
          }
        }
      })
    );
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}${API_ENDPOINTS.CATEGORIES.DELETE(id)}`
    ).pipe(
      tap(() => {
        const current = this.categories();
        this._categories.set(current.filter(c => c._id !== id));
      }),
    );
  }

}
