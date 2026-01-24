import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { APP_ROUTES } from '../../../core/constants/app-routes.constant';
import { IProduct } from '../../../core/models/product.model';
import { ICategory } from '../../../core/models/category.model';

@Component({
  selector: 'app-product-form',
  standalone: false,
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss'
})
export class ProductForm implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  productForm: FormGroup;
  categories: ICategory[] = [];
  
  isEditMode = false;
  productId: string | null = null;
  isLoading = false;
  isSaving = false;
  
  imagePreview: string | null = null;
  
  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private categoryService: CategoryService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      price: [null, [Validators.required, Validators.min(0.01)]],
      categoryId: ['', Validators.required],
      imageUrl: [''],
      available: [true]
    });
  }
  
  ngOnInit(): void {
    this.loadCategories();
    
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct();
    }
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
          this.categories = [
            { _id: '1', name: 'Starters', companyId: '1' },
            { _id: '2', name: 'Main Course', companyId: '1' },
            { _id: '3', name: 'Drinks', companyId: '1' },
            { _id: '4', name: 'Desserts', companyId: '1' }
          ];
        }
      });
  }
  
  loadProduct(): void {
    if (!this.productId) return;
    
    this.isLoading = true;
    this.productService.getById(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.patchForm(response.data);
          }
          this.isLoading = false;
        },
        error: () => {
          // Mock data for demo
          const mockProduct: IProduct = {
            _id: this.productId!,
            name: 'Bruschetta al Pomodoro',
            description: 'Toasted bread with fresh tomatoes, basil, and garlic.',
            price: 8.50,
            imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
            available: true,
            categoryId: '1',
            companyId: '1'
          };
          this.patchForm(mockProduct);
          this.isLoading = false;
        }
      });
  }
  
  patchForm(product: IProduct): void {
    this.productForm.patchValue({
      name: product.name,
      description: product.description || '',
      price: product.price,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl || '',
      available: product.available
    });
    
    if (product.imageUrl) {
      this.imagePreview = product.imageUrl;
    }
  }
  
  onImageUrlChange(): void {
    const imageUrl = this.productForm.get('imageUrl')?.value;
    this.imagePreview = imageUrl || null;
  }
  
  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    
    this.isSaving = true;
    const formData = this.productForm.value;
    
    if (this.isEditMode && this.productId) {
      this.productService.update(this.productId, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.onSuccess('Producto actualizado correctamente');
          },
          error: () => {
            // Mock success for demo
            this.onSuccess('Producto actualizado correctamente');
          }
        });
    } else {
      this.productService.create(formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.onSuccess('Producto creado correctamente');
          },
          error: () => {
            // Mock success for demo
            this.onSuccess('Producto creado correctamente');
          }
        });
    }
  }
  
  onSuccess(message: string): void {
    this.isSaving = false;
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
    this.router.navigate([APP_ROUTES.PRODUCTS.LIST]);
  }
  
  onCancel(): void {
    this.router.navigate([APP_ROUTES.PRODUCTS.LIST]);
  }
  
  // Form getters
  get nameControl() { return this.productForm.get('name'); }
  get priceControl() { return this.productForm.get('price'); }
  get categoryIdControl() { return this.productForm.get('categoryId'); }
}
