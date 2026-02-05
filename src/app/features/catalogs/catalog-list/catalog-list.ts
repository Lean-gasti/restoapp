import { Component, OnInit, OnDestroy, inject, Signal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Validators } from '@angular/forms';

import { CatalogService } from '../../../core/services/catalog.service';
import { APP_ROUTES } from '../../../core/constants/app-routes.constant';
import { ICatalog } from '../../../core/models/catalog.model';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';
import { FormDialogComponent } from '../../../shared/components/form-dialog/form-dialog';
import { PaginatedResponse } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-catalog-list',
  standalone: false,
  templateUrl: './catalog-list.html',
  styleUrl: './catalog-list.scss'
})
export class CatalogList implements OnInit {
  private catalogService = inject(CatalogService);
  catalogs: Signal<PaginatedResponse<ICatalog>> = this.catalogService.catalogs;
  isLoading = signal(true);
  
  constructor(
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadCatalogs();
  }
  
  loadCatalogs(): void {
    this.isLoading.set(true);
    this.catalogService.getAll()
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
  }
  
  createCatalog(): void {
    const dialogRef = this.dialog.open(FormDialogComponent, {
      width: '400px',
      data: {
        title: 'Nuevo Catálogo',
        fields: [
          { name: 'name', label: 'Nombre del catálogo', type: 'text', validators: [Validators.required] },
          { name: 'description', label: 'Descripción (opcional)', type: 'textarea' }
        ]
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const newCatalog = {
          name: result.name,
          description: result.description || '',
          configuration: { view_prices: true }
        };
        
        this.catalogService.create(newCatalog)
          .subscribe({
            next: (response) => {
              this.snackBar.open('Catálogo creado', 'Cerrar', { duration: 3000 });
              this.openBuilder(response);
            },
            error: () => {
              this.snackBar.open('Error al crear catálogo', 'Cerrar', { duration: 3000 });
            }
          });
      }
    });
  }
  
  openBuilder(catalog: ICatalog): void {
    if (catalog._id) {
      this.router.navigate([APP_ROUTES.CATALOGS.BUILDER(catalog._id)]);
    }
  }
  
  toggleActive(catalog: ICatalog): void {
    if (!catalog._id) return;
    
    this.catalogService.update(catalog._id, { isActive: !catalog.isActive })
      .subscribe({
        next: () => {
          catalog.isActive = !catalog.isActive;
          this.snackBar.open('Catálogo desactivado', 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Error al desactivar catálogo', 'Cerrar', { duration: 3000 });
        }
      });
  }
  
  deleteCatalog(catalog: ICatalog): void {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Eliminar Catálogo',
        message: `¿Estás seguro de que deseas eliminar "${catalog.name}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });
    
    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && catalog._id) {
        this.catalogService.delete(catalog._id)
          .subscribe({
            next: () => {
              this.snackBar.open('Catálogo eliminado', 'Cerrar', { duration: 3000 });
            },
            error: () => {
              this.snackBar.open('Error al eliminar catálogo', 'Cerrar', { duration: 3000 });
            }
          });
      }
    });
  }

}
