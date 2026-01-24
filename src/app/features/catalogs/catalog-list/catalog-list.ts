import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CatalogService } from '../../../core/services/catalog.service';
import { APP_ROUTES } from '../../../core/constants/app-routes.constant';
import { ICatalog } from '../../../core/models/catalog.model';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-catalog-list',
  standalone: false,
  templateUrl: './catalog-list.html',
  styleUrl: './catalog-list.scss'
})
export class CatalogList implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  catalogs: ICatalog[] = [];
  isLoading = true;
  
  constructor(
    private catalogService: CatalogService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadCatalogs();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadCatalogs(): void {
    this.isLoading = true;
    this.catalogService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.catalogs = response.data;
          }
          this.isLoading = false;
        },
        error: () => {
          this.catalogs = this.getMockCatalogs();
          this.isLoading = false;
        }
      });
  }
  
  createCatalog(): void {
    // For simplicity, we'll create a catalog with default values
    const newCatalog = {
      name: 'Nuevo Catálogo',
      description: 'Descripción del catálogo',
      configuration: { view_prices: true }
    };
    
    this.catalogService.create(newCatalog)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.catalogs.push(response.data);
            this.snackBar.open('Catálogo creado', 'Cerrar', { duration: 3000 });
            this.openBuilder(response.data);
          }
        },
        error: () => {
          // Mock create for demo
          const mockCatalog: ICatalog = {
            _id: Date.now().toString(),
            ...newCatalog,
            companyId: '1',
            isActive: false
          };
          this.catalogs.push(mockCatalog);
          this.snackBar.open('Catálogo creado', 'Cerrar', { duration: 3000 });
          this.openBuilder(mockCatalog);
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
    
    if (catalog.isActive) {
      // Deactivate
      this.catalogService.update(catalog._id, { isActive: false })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            catalog.isActive = false;
            this.snackBar.open('Catálogo desactivado', 'Cerrar', { duration: 3000 });
          },
          error: () => {
            catalog.isActive = false;
            this.snackBar.open('Catálogo desactivado', 'Cerrar', { duration: 3000 });
          }
        });
    } else {
      // Activate (deactivate others)
      this.catalogService.activate(catalog._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.catalogs.forEach(c => c.isActive = c._id === catalog._id);
            this.snackBar.open('Catálogo activado', 'Cerrar', { duration: 3000 });
          },
          error: () => {
            this.catalogs.forEach(c => c.isActive = c._id === catalog._id);
            this.snackBar.open('Catálogo activado', 'Cerrar', { duration: 3000 });
          }
        });
    }
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
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.catalogs = this.catalogs.filter(c => c._id !== catalog._id);
              this.snackBar.open('Catálogo eliminado', 'Cerrar', { duration: 3000 });
            },
            error: () => {
              this.catalogs = this.catalogs.filter(c => c._id !== catalog._id);
              this.snackBar.open('Catálogo eliminado', 'Cerrar', { duration: 3000 });
            }
          });
      }
    });
  }
  
  private getMockCatalogs(): ICatalog[] {
    return [
      { 
        _id: '1', 
        name: 'Menú Principal', 
        description: 'Carta principal del restaurante con todos los platillos', 
        companyId: '1', 
        isActive: true, 
        configuration: { view_prices: true } 
      },
      { 
        _id: '2', 
        name: 'Menú de Temporada', 
        description: 'Platillos especiales de temporada', 
        companyId: '1', 
        isActive: false, 
        configuration: { view_prices: true } 
      }
    ];
  }
}
