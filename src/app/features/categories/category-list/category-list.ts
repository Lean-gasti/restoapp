import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CategoryService } from '../../../core/services/category.service';
import { ProductService } from '../../../core/services/product.service';
import { ICategory } from '../../../core/models/category.model';
import { IProduct } from '../../../core/models/product.model';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-category-list',
  standalone: false,
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss'
})
export class CategoryList implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  categories: ICategory[] = [];
  products: IProduct[] = [];
  
  isLoading = true;
  showAddForm = false;
  editingCategoryId: string | null = null;
  
  newCategoryControl = new FormControl('', [Validators.required, Validators.minLength(2)]);
  editCategoryControl = new FormControl('', [Validators.required, Validators.minLength(2)]);
  
  constructor(
    private categoryService: CategoryService,
    private productService: ProductService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.categories = response.data;
          }
          this.isLoading = false;
        },
        error: () => {
          this.categories = this.getMockCategories();
          this.isLoading = false;
        }
      });
  }
  
  loadProducts(): void {
    this.productService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.products = response.data;
          }
        },
        error: () => {
          this.products = [];
        }
      });
  }
  
  getProductCount(categoryId: string): number {
    return this.products.filter(p => p.categoryId === categoryId).length;
  }
  
  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      this.newCategoryControl.reset();
    }
  }
  
  addCategory(): void {
    if (this.newCategoryControl.invalid) {
      this.newCategoryControl.markAsTouched();
      return;
    }
    
    const name = this.newCategoryControl.value!;
    this.categoryService.create({ name })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.categories.push(response.data);
          }
          this.onCategoryAdded(name);
        },
        error: () => {
          // Mock add for demo
          const newCategory: ICategory = {
            _id: Date.now().toString(),
            name,
            companyId: '1'
          };
          this.categories.push(newCategory);
          this.onCategoryAdded(name);
        }
      });
  }
  
  onCategoryAdded(name: string): void {
    this.newCategoryControl.reset();
    this.showAddForm = false;
    this.snackBar.open(`Categoría "${name}" creada`, 'Cerrar', { duration: 3000 });
  }
  
  startEdit(category: ICategory): void {
    this.editingCategoryId = category._id || null;
    this.editCategoryControl.setValue(category.name);
  }
  
  cancelEdit(): void {
    this.editingCategoryId = null;
    this.editCategoryControl.reset();
  }
  
  saveEdit(category: ICategory): void {
    if (this.editCategoryControl.invalid) {
      this.editCategoryControl.markAsTouched();
      return;
    }
    
    const name = this.editCategoryControl.value!;
    
    if (category._id) {
      this.categoryService.update(category._id, { name })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            category.name = name;
            this.onCategoryUpdated(name);
          },
          error: () => {
            // Mock update for demo
            category.name = name;
            this.onCategoryUpdated(name);
          }
        });
    }
  }
  
  onCategoryUpdated(name: string): void {
    this.editingCategoryId = null;
    this.editCategoryControl.reset();
    this.snackBar.open(`Categoría actualizada a "${name}"`, 'Cerrar', { duration: 3000 });
  }
  
  deleteCategory(category: ICategory): void {
    const productCount = this.getProductCount(category._id || '');
    
    if (productCount > 0) {
      this.snackBar.open(
        `No se puede eliminar: tiene ${productCount} producto(s) asociado(s)`,
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }
    
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Eliminar Categoría',
        message: `¿Estás seguro de que deseas eliminar "${category.name}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && category._id) {
        this.categoryService.delete(category._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.categories = this.categories.filter(c => c._id !== category._id);
              this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000 });
            },
            error: () => {
              // Mock delete for demo
              this.categories = this.categories.filter(c => c._id !== category._id);
              this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000 });
            }
          });
      }
    });
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
