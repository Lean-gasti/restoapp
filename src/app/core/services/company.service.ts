import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { API_ENDPOINTS } from '../constants/api-endpoints.constant';
import { ICompany, ICompanyUpdate } from '../models/company.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private readonly baseUrl = environment.apiUrl;
  
  // Signal for company state
  private readonly _company = signal<ICompany | null>(null);
  
  // Public readonly access to company signal
  readonly company = this._company.asReadonly();
  
  // Observable for components that need RxJS (backward compatibility)
  readonly company$ = toObservable(this._company);
  
  // Computed signal for convenience
  readonly companyId = computed(() => this._company()?._id ?? null);

  constructor(private http: HttpClient) {}

  getById(id: string): Observable<ICompany> {
    return this.http.get<ICompany>(
      `${this.baseUrl}${API_ENDPOINTS.COMPANIES.BY_ID(id)}`
    ).pipe(
      tap(response => {
        if (response) {
          this._company.set(response);
        }
      })
    );
  }

  getBySlug(slug: string): Observable<ICompany> {
    return this.http.get<ICompany>(
      `${this.baseUrl}${API_ENDPOINTS.COMPANIES.BY_SLUG(slug)}`
    );
  }

  update(id: string, company: ICompanyUpdate): Observable<ICompany> {
    return this.http.put<ICompany>(
      `${this.baseUrl}${API_ENDPOINTS.COMPANIES.BY_ID(id)}`,
      company
    ).pipe(
      tap(response => {
        if (response) {
          this._company.set(response);
        }
      })
    );
  }

  getCompanyValue(): ICompany | null {
    return this._company();
  }

  setCompany(company: ICompany): void {
    this._company.set(company);
  }
}
