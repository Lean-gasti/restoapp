import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { APP_ROUTES } from '../../../core/constants/app-routes.constant';
import { IProduct } from '../../../core/models/product.model';
import { ICategory } from '../../../core/models/category.model';
import { ICatalog } from '../../../core/models/catalog.model';

interface DashboardStats {
  totalProducts: number;
  availableProducts: number;
  unavailableProducts: number;
  totalCategories: number;
  totalCatalogs: number;
  activeCatalogs: number;
}

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: false,
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.scss'
})
export class DashboardHome implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  stats: DashboardStats = {
    totalProducts: 0,
    availableProducts: 0,
    unavailableProducts: 0,
    totalCategories: 0,
    totalCatalogs: 0,
    activeCatalogs: 0
  };
  
  products: IProduct[] = [];
  categories: ICategory[] = [];
  catalogs: ICatalog[] = [];
  
  productsByCategory: { category: string; count: number }[] = [];
  
  quickActions: QuickAction[] = [
    { 
      label: 'Nuevo Producto', 
      icon: 'add_circle', 
      route: APP_ROUTES.PRODUCTS.NEW,
      color: '#667eea'
    },
    { 
      label: 'Nueva Categoría', 
      icon: 'folder_open', 
      route: APP_ROUTES.CATEGORIES.NEW,
      color: '#10b981'
    },
    { 
      label: 'Nuevo Catálogo', 
      icon: 'menu_book', 
      route: APP_ROUTES.CATALOGS.NEW,
      color: '#f59e0b'
    },
    { 
      label: 'Configuración', 
      icon: 'settings', 
      route: APP_ROUTES.COMPANY.SETTINGS,
      color: '#8b5cf6'
    }
  ];
  
  isLoading = true;
  
  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private catalogService: CatalogService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadData(): void {
    this.isLoading = true;
    
    // Load products
    this.productService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.products = response.data;
            this.updateStats();
          }
        },
        error: () => {
          // Mock data for demo
          this.products = this.getMockProducts();
          this.updateStats();
        }
      });
    
    // Load categories
    this.categoryService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.categories = response.data;
            this.stats.totalCategories = this.categories.length;
            this.calculateProductsByCategory();
          }
        },
        error: () => {
          this.categories = this.getMockCategories();
          this.stats.totalCategories = this.categories.length;
          this.calculateProductsByCategory();
        }
      });
    
    // Load catalogs
    this.catalogService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.catalogs = response.data;
            this.stats.totalCatalogs = this.catalogs.length;
            this.stats.activeCatalogs = this.catalogs.filter(c => c.isActive).length;
          }
          this.isLoading = false;
        },
        error: () => {
          this.catalogs = this.getMockCatalogs();
          this.stats.totalCatalogs = this.catalogs.length;
          this.stats.activeCatalogs = this.catalogs.filter(c => c.isActive).length;
          this.isLoading = false;
        }
      });
  }
  
  private updateStats(): void {
    this.stats.totalProducts = this.products.length;
    this.stats.availableProducts = this.products.filter(p => p.available).length;
    this.stats.unavailableProducts = this.products.filter(p => !p.available).length;
  }
  
  private calculateProductsByCategory(): void {
    const categoryMap = new Map<string, string>();
    this.categories.forEach(c => {
      if (c._id) categoryMap.set(c._id, c.name);
    });
    
    const counts = new Map<string, number>();
    this.products.forEach(p => {
      const categoryName = categoryMap.get(p.categoryId) || 'Sin categoría';
      counts.set(categoryName, (counts.get(categoryName) || 0) + 1);
    });
    
    this.productsByCategory = Array.from(counts.entries()).map(([category, count]) => ({
      category,
      count
    }));
  }
  
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
  
  // Mock data for demo purposes
  private getMockProducts(): IProduct[] {
    return [
      { _id: '1', name: 'Bruschetta al Pomodoro', price: 8.50, available: true, categoryId: '1', companyId: '1' },
      { _id: '2', name: 'Calamari Fritti', price: 12.00, available: true, categoryId: '1', companyId: '1' },
      { _id: '3', name: 'Truffle Pasta', price: 22.00, available: true, categoryId: '2', companyId: '1' },
      { _id: '4', name: 'Grilled Salmon', price: 25.00, available: true, categoryId: '2', companyId: '1' },
      { _id: '5', name: 'Mojito Classic', price: 9.00, available: true, categoryId: '3', companyId: '1' },
      { _id: '6', name: 'Tiramisu', price: 7.50, available: false, categoryId: '4', companyId: '1' }
    ];
  }
  
  private getMockCategories(): ICategory[] {
    return [
      { _id: '1', name: 'Starters', companyId: '1' },
      { _id: '2', name: 'Main Course', companyId: '1' },
      { _id: '3', name: 'Drinks', companyId: '1' },
      { _id: '4', name: 'Desserts', companyId: '1' }
    ];
  }
  
  private getMockCatalogs(): ICatalog[] {
    return [
      { _id: '1', name: 'Menú Principal', description: 'Carta principal del restaurante', companyId: '1', isActive: true, configuration: { view_prices: true } }
    ];
  }
}
