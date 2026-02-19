import { Injectable, signal, computed } from '@angular/core';
import { catchError, of, tap } from 'rxjs';

import { PublicCatalogService } from '../../../core/services/public-catalog.service';
import { ICompany } from '../../../core/models/company.model';
import { ICatalog } from '../../../core/models/catalog.model';

export interface IPublicMenuState {
  company: ICompany | null;
  catalog: (ICatalog & { items: any[] }) | null;
  catalogs: ICatalog[];
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PublicCatalogFacade {
  // State signals
  private readonly _state = signal<IPublicMenuState>({
    company: null,
    catalog: null,
    catalogs: [],
    isLoading: false,
    error: null
  });

  // Public readonly selectors
  readonly company = computed(() => this._state().company);
  readonly catalog = computed(() => this._state().catalog);
  readonly catalogs = computed(() => this._state().catalogs);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly error = computed(() => this._state().error);
  
  // Computed: catalog sections with products
  readonly sections = computed(() => {
    const catalog = this._state().catalog;
    return catalog?.items || [];
  });

  constructor(private publicCatalogService: PublicCatalogService) {}

  loadMenu(slug: string, catalogId?: string): void {
    this._state.update(state => ({ ...state, isLoading: true, error: null }));

    if (catalogId) {
      // Load specific catalog
      this.publicCatalogService.getCatalogById(slug, catalogId).pipe(
        tap(response => {
          this._state.update(state => ({
            ...state,
            company: response.company,
            catalog: response.catalog,
            isLoading: false
          }));
        }),
        catchError(error => {
          this._state.update(state => ({
            ...state,
            isLoading: false,
            error: 'No se pudo cargar el menú'
          }));
          return of(null);
        })
      ).subscribe();
    } else {
      // Load company and list of catalogs
      this.publicCatalogService.getCompanyBySlug(slug).pipe(
        tap(company => {
          this._state.update(state => ({
            ...state,
            company,
            isLoading: false
          }));
        }),
        catchError(error => {
          this._state.update(state => ({
            ...state,
            isLoading: false,
            error: 'Empresa no encontrada'
          }));
          return of(null);
        })
      ).subscribe();
    }
  }

  loadCatalogs(slug: string): void {
    this._state.update(state => ({ ...state, isLoading: true }));
    
    this.publicCatalogService.getCatalogsBySlug(slug).pipe(
      tap(response => {
        this._state.update(state => ({
          ...state,
          catalogs: response.data,
          isLoading: false
        }));
      }),
      catchError(() => {
        this._state.update(state => ({
          ...state,
          isLoading: false
        }));
        return of(null);
      })
    ).subscribe();
  }

  reset(): void {
    this._state.set({
      company: null,
      catalog: null,
      catalogs: [],
      isLoading: false,
      error: null
    });
  }
}
