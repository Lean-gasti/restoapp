import { Component, inject, signal, computed } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Validators } from '@angular/forms';

import { CategoryService } from '../../../core/services/category.service';
import { ProductService } from '../../../core/services/product.service';
import { ICategory } from '../../../core/models/category.model';
import { FormDialogComponent } from '../form-dialog/form-dialog';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-category-manager-dialog',
  standalone: false,
  templateUrl: './category-manager-dialog.html',
  styleUrl: './category-manager-dialog.scss'
})
export class CategoryManagerDialog {
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  categories = this.categoryService.categories;
  products = this.productService.products;

  searchText = signal('');
  isCreating = signal(false);

  filteredCategories = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    const cats = this.categories();
    if (!search) return cats;
    return cats.filter(c => c.name.toLowerCase().includes(search));
  });

  /** True when the input text is a new name not matching any existing category */
  canCreate = computed(() => {
    const name = this.searchText().trim();
    if (!name) return false;
    return !this.categories().some(c => c.name.toLowerCase() === name.toLowerCase());
  });

  constructor(public dialogRef: MatDialogRef<CategoryManagerDialog>) {}

  getProductCount(categoryId: string): number {
    return this.products().filter(p => p.categoryId === categoryId).length;
  }

  createFromSearch(): void {
    const name = this.searchText().trim();
    if (!name || !this.canCreate()) return;

    this.isCreating.set(true);
    this.categoryService.create({ name }).subscribe({
      next: () => {
        this.snackBar.open(`Categoría "${name}" creada`, 'Cerrar', { duration: 3000 });
        this.searchText.set('');
        this.isCreating.set(false);
      },
      error: () => {
        this.snackBar.open('Error al crear categoría', 'Cerrar', { duration: 3000 });
        this.isCreating.set(false);
      }
    });
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.canCreate()) {
      event.preventDefault();
      this.createFromSearch();
    }
  }

  editCategory(category: ICategory): void {
    const ref = this.dialog.open(FormDialogComponent, {
      width: '400px',
      data: {
        title: 'Editar Categoría',
        fields: [
          { name: 'name', label: 'Nombre de la categoría', type: 'text', value: category.name, validators: [Validators.required] }
        ],
        submitText: 'Guardar',
        cancelText: 'Cancelar'
      }
    });

    ref.afterClosed().subscribe(result => {
      if (result && category._id) {
        this.categoryService.update(category._id, { name: result.name }).subscribe({
          next: () => this.snackBar.open('Categoría actualizada', 'Cerrar', { duration: 3000 }),
          error: () => this.snackBar.open('Error al actualizar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

  deleteCategory(category: ICategory): void {
    const count = this.getProductCount(category._id || '');
    if (count > 0) {
      this.snackBar.open(`No se puede eliminar: tiene ${count} producto(s) asociado(s)`, 'Cerrar', { duration: 3000 });
      return;
    }

    const ref = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Eliminar Categoría',
        message: `¿Estás seguro de que deseas eliminar "${category.name}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    ref.afterClosed().subscribe(confirmed => {
      if (confirmed && category._id) {
        this.categoryService.delete(category._id).subscribe({
          next: () => this.snackBar.open('Categoría eliminada', 'Cerrar', { duration: 3000 }),
          error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
