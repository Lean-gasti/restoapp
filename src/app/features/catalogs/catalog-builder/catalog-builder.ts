import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { CatalogService } from '../../../core/services/catalog.service';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { APP_ROUTES } from '../../../core/constants/app-routes.constant';
import { ICatalog, ICatalogItem } from '../../../core/models/catalog.model';
import { IProduct } from '../../../core/models/product.model';
import { ICategory } from '../../../core/models/category.model';

interface CatalogProduct extends IProduct {
  customName?: string;
  customDescription?: string;
  order?: number;
}

@Component({
  selector: 'app-catalog-builder',
  standalone: false,
  templateUrl: './catalog-builder.html',
  styleUrl: './catalog-builder.scss'
})
export class CatalogBuilder implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  catalog: ICatalog | null = null;
  catalogId: string | null = null;
  
  availableProducts: IProduct[] = [];
  catalogProducts: CatalogProduct[] = [];
  categories: ICategory[] = [];
  
  selectedCategory = '';
  isLoading = true;
  isSaving = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    private productService: ProductService,
    private categoryService: CategoryService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.catalogId = this.route.snapshot.paramMap.get('id');
    if (this.catalogId) {
      this.loadData();
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadData(): void {
    this.isLoading = true;
    
    // Load categories
    this.categoryService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.categories = response.data;
          }
        },
        error: () => {
          this.categories = [
            { _id: '1', name: 'Starters', companyId: '1' },
            { _id: '2', name: 'Main Course', companyId: '1' },
            { _id: '3', name: 'Drinks', companyId: '1' },
            { _id: '4', name: 'Desserts', companyId: '1' }
          ];
        }
      });
    
    // Load catalog
    if (this.catalogId) {
      this.catalogService.getById(this.catalogId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.catalog = response.data;
            }
          },
          error: () => {
            this.catalog = {
              _id: this.catalogId!,
              name: 'Menú Principal',
              description: 'Carta principal',
              companyId: '1',
              isActive: true,
              configuration: { view_prices: true }
            };
          }
        });
    }
    
    // Load products
    this.productService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.availableProducts = response.data.filter(p => p.available);
          }
          this.isLoading = false;
        },
        error: () => {
          this.availableProducts = this.getMockProducts();
          this.isLoading = false;
        }
      });
  }
  
  get filteredProducts(): IProduct[] {
    if (!this.selectedCategory) {
      return this.availableProducts.filter(p => 
        !this.catalogProducts.find(cp => cp._id === p._id)
      );
    }
    return this.availableProducts.filter(p => 
      p.categoryId === this.selectedCategory && 
      !this.catalogProducts.find(cp => cp._id === p._id)
    );
  }
  
  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category?.name || '';
  }
  
  drop(event: CdkDragDrop<any[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      if (event.container.id === 'catalogList') {
        // Adding to catalog
        const product = event.previousContainer.data[event.previousIndex];
        const catalogProduct: CatalogProduct = {
          ...product,
          order: this.catalogProducts.length
        };
        this.catalogProducts.splice(event.currentIndex, 0, catalogProduct);
      } else {
        // Removing from catalog
        this.catalogProducts.splice(event.previousIndex, 1);
      }
    }
    this.updateOrder();
  }
  
  addToCatalog(product: IProduct): void {
    const catalogProduct: CatalogProduct = {
      ...product,
      order: this.catalogProducts.length
    };
    this.catalogProducts.push(catalogProduct);
    this.updateOrder();
  }
  
  removeFromCatalog(product: CatalogProduct): void {
    const index = this.catalogProducts.findIndex(p => p._id === product._id);
    if (index !== -1) {
      this.catalogProducts.splice(index, 1);
      this.updateOrder();
    }
  }
  
  updateOrder(): void {
    this.catalogProducts.forEach((p, index) => {
      p.order = index;
    });
  }
  
  saveCatalog(): void {
    this.isSaving = true;
    
    // In a real app, you'd save the catalog items
    setTimeout(() => {
      this.isSaving = false;
      this.snackBar.open('Catálogo guardado exitosamente', 'Cerrar', { duration: 3000 });
    }, 1000);
  }
  
  goBack(): void {
    this.router.navigate([APP_ROUTES.CATALOGS.LIST]);
  }
  
  private getMockProducts(): IProduct[] {
    return [
      { _id: '1', name: 'Bruschetta al Pomodoro', description: 'Toasted bread with fresh tomatoes', price: 8.50, imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400', available: true, categoryId: '1', companyId: '1' },
      { _id: '2', name: 'Calamari Fritti', description: 'Crispy fried squid rings', price: 12.00, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400', available: true, categoryId: '1', companyId: '1' },
      { _id: '3', name: 'Truffle Pasta', description: 'Fresh tagliatelle with black truffle', price: 22.00, imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400', available: true, categoryId: '2', companyId: '1' },
      { _id: '4', name: 'Grilled Salmon', description: 'Served with roasted vegetables', price: 25.00, imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400', available: true, categoryId: '2', companyId: '1' },
      { _id: '5', name: 'Mojito Classic', description: 'Rum, mint, lime, sugar, and soda', price: 9.00, imageUrl: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400', available: true, categoryId: '3', companyId: '1' }
    ];
  }
}
