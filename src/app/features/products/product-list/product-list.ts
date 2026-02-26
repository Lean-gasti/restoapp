import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { APP_ROUTES } from '../../../core/constants/app-routes.constant';
import { IProduct } from '../../../core/models/product.model';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';
import { CategoryManagerDialog } from '../../../shared/components/category-manager-dialog/category-manager-dialog';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  allProducts = this.productService.products;
  categories = this.categoryService.categories;
  isLoading = signal(false);

  // Filters
  searchText = signal('');
  selectedCategory = signal('');
  selectedStatus = signal('');

  // Filtered products computed
  filteredProducts = computed(() => {
    const products = this.allProducts();
    const search = this.searchText().toLowerCase().trim();
    const category = this.selectedCategory();
    const status = this.selectedStatus();

    return products.filter(p => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search) || (p.description || '').toLowerCase().includes(search);
      const matchesCategory = !category || p.categoryId === category;
      const matchesStatus = !status || (status === 'available' ? p.available : !p.available);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.categoryService.getAll().subscribe();
    this.productService.getAll().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  getCategoryName(categoryId: string): string {
    const cat = this.categories().find(c => c._id === categoryId);
    return cat?.name || '';
  }

  clearFilters(): void {
    this.searchText.set('');
    this.selectedCategory.set('');
    this.selectedStatus.set('');
  }

  hasActiveFilters(): boolean {
    return !!this.searchText() || !!this.selectedCategory() || !!this.selectedStatus();
  }

  // ── Category Management ──
  openCategoryManager(): void {
    this.dialog.open(CategoryManagerDialog, {
      width: '600px',
      maxHeight: '80vh',
      panelClass: 'category-manager-panel'
    });
  }

  // ── Product Actions ──  
  addProduct(): void {
    this.router.navigate([APP_ROUTES.PRODUCTS.NEW]);
  }
  
  editProduct(product: IProduct): void {
    if (product._id) {
      this.router.navigate([APP_ROUTES.PRODUCTS.EDIT(product._id)]);
    }
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
        this.productService.delete(product._id).subscribe({
          next: () => this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 3000 }),
          error: () => this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

  toggleAvailability(product: IProduct): void {
    if (!product._id) return;
    this.productService.update(product._id, { available: !product.available }).subscribe({
      next: () => {
        this.snackBar.open(
          product.available ? 'Producto deshabilitado' : 'Producto habilitado',
          'Cerrar', { duration: 3000 }
        );
      },
      error: () => {
        this.snackBar.open('Error al actualizar disponibilidad', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
