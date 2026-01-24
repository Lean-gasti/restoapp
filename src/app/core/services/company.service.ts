import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api-endpoints.constant';
import { ApiResponse } from '../models/api-response.model';
import { ICompany, ICompanyUpdate } from '../models/company.model';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private readonly baseUrl = API_ENDPOINTS.BASE_URL;
  
  private companySubject = new BehaviorSubject<ICompany | null>(null);
  public company$ = this.companySubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  getById(id: string): Observable<ApiResponse<ICompany>> {
    this.loadingSubject.next(true);
    
    return this.http.get<ApiResponse<ICompany>>(
      `${this.baseUrl}${API_ENDPOINTS.COMPANIES.BY_ID(id)}`
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.companySubject.next(response.data);
        }
        this.loadingSubject.next(false);
      })
    );
  }

  getBySlug(slug: string): Observable<ApiResponse<ICompany>> {
    return this.http.get<ApiResponse<ICompany>>(
      `${this.baseUrl}${API_ENDPOINTS.COMPANIES.BY_SLUG(slug)}`
    );
  }

  update(id: string, company: ICompanyUpdate): Observable<ApiResponse<ICompany>> {
    return this.http.put<ApiResponse<ICompany>>(
      `${this.baseUrl}${API_ENDPOINTS.COMPANIES.BY_ID(id)}`,
      company
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.companySubject.next(response.data);
        }
      })
    );
  }

  updateLogo(id: string, logoFile: File): Observable<ApiResponse<ICompany>> {
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    return this.http.patch<ApiResponse<ICompany>>(
      `${this.baseUrl}${API_ENDPOINTS.COMPANIES.LOGO(id)}`,
      formData
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.companySubject.next(response.data);
        }
      })
    );
  }

  getCompanyValue(): ICompany | null {
    return this.companySubject.value;
  }

  setCompany(company: ICompany): void {
    this.companySubject.next(company);
  }
}
