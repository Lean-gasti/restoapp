import { Component, OnInit, inject, Signal, computed, signal, WritableSignal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { CatalogService } from '../../../core/services/catalog.service';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { APP_ROUTES } from '../../../core/constants/app-routes.constant';
import { ICatalog } from '../../../core/models/catalog.model';
import { IProduct } from '../../../core/models/product.model';
import { ICategory } from '../../../core/models/category.model';

@Component({
  selector: 'app-catalog-builder',
  standalone: false,
  templateUrl: './catalog-builder.html',
  styleUrl: './catalog-builder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogBuilder implements OnInit {
  private catalogService: CatalogService = inject(CatalogService);
  private productService: ProductService = inject(ProductService);
  private categoryService: CategoryService = inject(CategoryService);

  catalog: Signal<ICatalog | null> = computed(() => this.catalogService.catalogs().data.find(c => c._id === this.catalogId) || null);
  catalogId: string | null = null;

  availableProducts: Signal<IProduct[]> = this.productService.products;
  catalogProducts: WritableSignal<IProduct[]> = signal<IProduct[]>([]);
  categories: Signal<ICategory[]> = this.categoryService.categories;
  
  selectedCategory = signal('');
  isLoading = signal(true);
  isSaving = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.catalogId = this.route.snapshot.paramMap.get('id');
    console.log(this.catalogId);
    if (this.catalogId) {
      this.loadData();
    }
  }
  
  loadData(): void {
    this.isLoading.set(true);
    
    // Load categories and products
    this.categoryService.getAll().subscribe();
    this.productService.getAll().subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Error al cargar productos', 'Cerrar', { duration: 3000 });
      }
    });
  }
  
  filteredProducts: Signal<IProduct[]> = computed(() => {
    const searchCategory = this.selectedCategory();
    const currentCatalogProducts = this.catalogProducts();
    const available = this.availableProducts();
    
    return available.filter((p: IProduct) => {
      const matchesCategory = !searchCategory || p.categoryId === searchCategory;
      const notInCatalog = !currentCatalogProducts.some((cp: IProduct) => cp._id === p._id);
      return matchesCategory && notInCatalog;
    });
  });
  
  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c._id === categoryId);
    return category?.name || '';
  }
  
  drop(event: CdkDragDrop<IProduct[]>): void {
    if (event.previousContainer === event.container) {
      if (event.container.id === 'catalogList') {
        const data = [...this.catalogProducts()];
        moveItemInArray(data, event.previousIndex, event.currentIndex);
        this.catalogProducts.set(data);
      }
    } else {
      if (event.container.id === 'catalogList') {
        // Adding from available to catalog
        const product = event.previousContainer.data[event.previousIndex];
        this.addToCatalog(product);
      } else {
        // Removing from catalog to available
        const product = event.previousContainer.data[event.previousIndex];
        this.removeFromCatalog(product);
      }
    }
  }
  
  addToCatalog(product: IProduct): void {
    const current = this.catalogProducts();
    if (!current.some((p: IProduct) => p._id === product._id)) {
      this.catalogProducts.set([...current, product]);
    }
  }
  
  removeFromCatalog(product: IProduct): void {
    const current = this.catalogProducts();
    this.catalogProducts.set(current.filter((p: IProduct) => p._id !== product._id));
  }
  
  updateOrder(): void {
    this.catalogProducts().forEach((p: IProduct, index: number) => {
      
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

}
