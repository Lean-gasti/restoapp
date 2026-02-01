import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { APP_ROUTES } from '../../../core/constants/app-routes.constant';
import { IProduct } from '../../../core/models/product.model';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-product-list',
  standalone: false,
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  products = this.productService.products
  isLoading = signal(false);
  
  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading.set(true);
    this.productService.getAll().subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
  
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
        this.productService.delete(product._id)
          .subscribe({
            next: () => {
              this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 3000 });
            },
            error: () => {
              this.snackBar.open('Producto eliminado', 'Cerrar', { duration: 3000 });
            }
          });
      }
    });
  }

  toggleAvailability(_t67: IProduct) {
    throw new Error('Method not implemented.');
  }
}
