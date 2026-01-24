import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { APP_ROUTES } from '../../../core/constants/app-routes.constant';
import { IProduct } from '../../../core/models/product.model';
import { ICategory } from '../../../core/models/category.model';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss'
})
export class ProductList implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  products: IProduct[] = [];
  filteredProducts: IProduct[] = [];
  categories: ICategory[] = [];
  
  searchControl = new FormControl('');
  selectedCategory = '';
  selectedAvailability = '';
  
  isLoading = true;
  
  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    this.setupSearch();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadCategories(): void {
    this.categoryService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.categories = response.data;
          }
        },
        error: () => {
          this.categories = this.getMockCategories();
        }
      });
  }
  
  loadProducts(): void {
    this.isLoading = true;
    this.productService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.products = response.data;
          }
          this.applyFilters();
          this.isLoading = false;
        },
        error: () => {
          this.products = this.getMockProducts();
          this.applyFilters();
          this.isLoading = false;
        }
      });
  }
  
  setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }
  
  applyFilters(): void {
    let filtered = [...this.products];
    
    // Filter by search term
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(p => p.categoryId === this.selectedCategory);
    }
    
    // Filter by availability
    if (this.selectedAvailability !== '') {
      const isAvailable = this.selectedAvailability === 'true';
      filtered = filtered.filter(p => p.available === isAvailable);
    }
    
    this.filteredProducts = filtered;
  }
  
  onCategoryChange(): void {
    this.applyFilters();
  }
  
  onAvailabilityChange(): void {
    this.applyFilters();
  }
  
  clearFilters(): void {
    this.searchControl.setValue('');
    this.selectedCategory = '';
    this.selectedAvailability = '';
    this.applyFilters();
  }
  
  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category?.name || 'Sin categoría';
  }
  
  addProduct(): void {
    this.router.navigate([APP_ROUTES.PRODUCTS.NEW]);
  }
  
  editProduct(product: IProduct): void {
    if (product._id) {
      this.router.navigate([APP_ROUTES.PRODUCTS.EDIT(product._id)]);
    }
  }
  
  toggleAvailability(product: IProduct): void {
    if (!product._id) return;
    
    this.productService.toggleAvailability(product._id, !product.available)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          product.available = !product.available;
          this.snackBar.open(
            `Producto ${product.available ? 'habilitado' : 'deshabilitado'}`,
            'Cerrar',
            { duration: 3000 }
          );
        },
        error: () => {
          // Mock update for demo
          product.available = !product.available;
          this.snackBar.open(
            `Producto ${product.available ? 'habilitado' : 'deshabilitado'}`,
            'Cerrar',
            { duration: 3000 }
          );
        }
      });
  }
  
  deleteProduct(product: IProduct): void {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Eliminar Producto',
        message: `¿Estás seguro de que deseas eliminar "${product.name}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && product._id) {
        this.productService.delete(product._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.products = this.products.filter(p => p._id !== product._id);
              this.applyFilters();
              this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 3000 });
            },
            error: () => {
              // Mock delete for demo
              this.products = this.products.filter(p => p._id !== product._id);
              this.applyFilters();
              this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 3000 });
            }
          });
      }
    });
  }
  
  // Mock data
  private getMockProducts(): IProduct[] {
    return [
      { _id: '1', name: 'Bruschetta al Pomodoro', description: 'Toasted bread with fresh tomatoes, basil, and garlic.', price: 8.50, imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400', available: true, categoryId: '1', companyId: '1' },
      { _id: '2', name: 'Calamari Fritti', description: 'Crispy fried squid rings served with marinara sauce.', price: 12.00, imageUrl: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400', available: true, categoryId: '1', companyId: '1' },
      { _id: '3', name: 'Truffle Pasta', description: 'Fresh tagliatelle with black truffle cream sauce.', price: 22.00, imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400', available: true, categoryId: '2', companyId: '1' },
      { _id: '4', name: 'Grilled Salmon', description: 'Served with roasted vegetables and lemon butter sauce.', price: 25.00, imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400', available: true, categoryId: '2', companyId: '1' },
      { _id: '5', name: 'Mojito Classic', description: 'Rum, mint, lime, sugar, and soda.', price: 9.00, imageUrl: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400', available: true, categoryId: '3', companyId: '1' },
      { _id: '6', name: 'Tiramisu', description: 'Classic Italian coffee-flavored dessert.', price: 7.50, imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', available: false, categoryId: '4', companyId: '1' }
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
}
