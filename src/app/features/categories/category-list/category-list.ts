import { Component, OnInit, OnDestroy, inject, signal, Signal } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CategoryService } from '../../../core/services/category.service';
import { ICategory } from '../../../core/models/category.model';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-category-list',
  standalone: false,
  templateUrl: './category-list.html',
  styleUrl: './category-list.scss'
})
export class CategoryList implements OnInit {
  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  categories: Signal<ICategory[]> = this.categoryService.categories;
  isLoading = signal(true);
  showAddForm = false;
  editingCategoryId: string | null = null;
  
  newCategoryControl = new FormControl('', [Validators.required, Validators.minLength(2)]);
  editCategoryControl = new FormControl('', [Validators.required, Validators.minLength(2)]);
  
  ngOnInit(): void {
    this.loadCategories();
  }
  
  loadCategories(): void {
    this.isLoading.set(true);
    this.categoryService.getAll()
      .subscribe({
        next: () => {
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
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
      .subscribe({
        next: () => {
          this.onCategoryAdded(name);
        },
        error: () => {
          // TODO: handle error
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
          .subscribe({
            next: () => {
              this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000 });
            },
            error: () => {
              this.snackBar.open('Error al eliminar categoría', 'Cerrar', { duration: 3000 });
            }
          });
      }
    });
  }

}
