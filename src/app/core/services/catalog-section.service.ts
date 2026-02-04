import { Injectable, signal, WritableSignal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';

import { API_ENDPOINTS } from '../constants/api-endpoints.constant';
import { ApiResponse } from '../models/api-response.model';
import { ApiService } from '../infrastructure/api.service';
import { response } from 'express';
import { ICatalogItemCreate } from '../../shared/interfaces/catalog-item.interface';
import { ICatalogItem } from '../models/catalog-item.model';

/**
 * Servicio para gestionar las secciones (ICatalogItem) de un catálogo.
 * Las secciones agrupan productos dentro de un catálogo.
 */
@Injectable({
  providedIn: 'root'
})
export class CatalogSectionService {
  private _sections: WritableSignal<ICatalogItem[]> = signal([]);
  public sections = this._sections.asReadonly();

  constructor(private apiService: ApiService) {}

  /**
   * Obtiene todas las secciones de un catálogo específico
   */
  getSectionsByCatalog(catalogId: string): Observable<ICatalogItem[]> {
    return this.apiService.get<ICatalogItem[]>(
      API_ENDPOINTS.CATALOG_ITEMS.GET_ALL(catalogId)
    ).pipe(
      tap(response => {
        if (response) {
          this._sections.set(response);
        }
      })
    );
  }

  /**
   * Crea una nueva sección en el catálogo
   */
  create(section: ICatalogItemCreate): Observable<ICatalogItem> {
    return this.apiService.post<ICatalogItem>(
      API_ENDPOINTS.CATALOG_ITEMS.CREATE(section.catalogId),
      section
    ).pipe(
      tap(response => {
        if (response) {
          const current = this.sections();
          this._sections.set([...current, response]);
        }
      }),
      catchError((error) => {
        this._sections.set([...this.sections(), section as ICatalogItem]);
        return of(section as ICatalogItem);
      })
    );
  }

  /**
   * Actualiza una sección existente
   */
  update(catalogId: string, id: string, section: Partial<ICatalogItemCreate>): Observable<ICatalogItem> {
    return this.apiService.put<ICatalogItem>(
      API_ENDPOINTS.CATALOG_ITEMS.MODIFY(catalogId, id),
      section
    ).pipe(
      tap(response => {
        if (response) {
          const current = this.sections();
          const index = current.findIndex(s => s._id === id);
          if (index !== -1) {
            const updated = [...current];
            updated[index] = response;
            this._sections.set(updated);
          }
        }
      })
    );
  }

  /**
   * Elimina una sección
   */
  delete(catalogId: string, id: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(
      API_ENDPOINTS.CATALOG_ITEMS.DELETE(catalogId, id)
    ).pipe(
      tap(response => {
        if (response?.success) {
          const current = this.sections();
          this._sections.set(current.filter(s => s._id !== id));
        }
      })
    );
  }

  /**
   * Limpia el estado de secciones
   */
  clearSections(): void {
    this._sections.set([]);
  }
}
