import { inject, Injectable, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { ApiService } from '../infrastructure/api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints.constant';
import { IProduct, IProductCreate, IProductUpdate, IProductFilter } from '../models/product.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private api = inject(ApiService);

  private _productsState = signal<IProduct[]>([]);
  public products = this._productsState.asReadonly();
  

  getAll(): Observable<IProduct[]> {
    let params = new HttpParams();
    return this.api.get<IProduct[]>(API_ENDPOINTS.PRODUCTS.BASE, params).pipe(
      tap((products) => this._productsState.set(products))
    );
  }

  getById(id: string): Observable<IProduct> {
    const localProduct = this._productsState().find(p => p._id === id);
    if (localProduct) {
      return of(localProduct);
    }
    return this.api.get<IProduct>(API_ENDPOINTS.PRODUCTS.BY_ID(id));
  }

  create(product: IProductCreate | FormData): Observable<IProduct> {
    return this.api.post<IProduct>(API_ENDPOINTS.PRODUCTS.BASE, product).pipe(
      tap(newProduct => {
        this._productsState.update(products => [...products, newProduct]);
      })
    );
  }

  update(id: string, product: IProductUpdate | FormData): Observable<IProduct> {
    return this.api.put<IProduct>(API_ENDPOINTS.PRODUCTS.BY_ID(id), product).pipe(
      tap(updatedProduct => {
        this._productsState.update(products => 
          products.map(p => p._id === id ? updatedProduct : p)
        );
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(API_ENDPOINTS.PRODUCTS.BY_ID(id)).pipe(
      tap(() => {
        this._productsState.update(products => products.filter(p => p._id !== id));
      })
    );
  }
}
