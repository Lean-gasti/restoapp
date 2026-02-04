import { Component, OnInit, inject, Signal, computed, signal, WritableSignal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';

import { CatalogService } from '../../../core/services/catalog.service';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { CatalogSectionService } from '../../../core/services/catalog-section.service';
import { APP_ROUTES } from '../../../core/constants/app-routes.constant';

import { IProduct } from '../../../core/models/product.model';
import { ICategory } from '../../../core/models/category.model';
import { FormDialogComponent } from '../../../shared/components/form-dialog/form-dialog';
import { Validators } from '@angular/forms';
import { ICatalogItem, ICatalogItemProduct } from '../../../core/models/catalog-item.model';
import { ICatalog } from '../../../core/models/catalog.model';
import { ICatalogItemCreate } from '../../../shared/interfaces/catalog-item.interface';

/** Interfaz interna para manejar secciones con sus productos expandidos */
interface ICatalogSectionWithProducts {
  section: ICatalogItem;
  products: IProduct[];
}

@Component({
  selector: 'app-catalog-builder',
  standalone: false,
  templateUrl: './catalog-builder.html',
  styleUrl: './catalog-builder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogBuilder implements OnInit {
  private catalogService: CatalogService = inject(CatalogService);
  private productService: ProductService = inject(ProductService);
  private categoryService: CategoryService = inject(CategoryService);
  private sectionService: CatalogSectionService = inject(CatalogSectionService);

  catalog: Signal<ICatalog | null> = computed(() => this.catalogService.catalogs().data.find(c => c._id === this.catalogId) || null);
  catalogId: string | null = null;

  availableProducts: Signal<IProduct[]> = this.productService.products;
  categories: Signal<ICategory[]> = this.categoryService.categories;
  
  // Secciones del catálogo con sus productos
  catalogSections: WritableSignal<ICatalogSectionWithProducts[]> = signal<ICatalogSectionWithProducts[]>([]);
  
  // Estado UI para secciones expandidas (por índice)
  expandedSections = signal<Set<number>>(new Set());
  
  selectedCategory = signal('');
  isLoading = signal(true);
  isSaving = signal(false);
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.catalogId = this.route.snapshot.paramMap.get('id');
    if (this.catalogId) {
      this.loadData();
    }
  }
  
  loadData(): void {
    this.isLoading.set(true);
    
    forkJoin({
      categories: this.categoryService.getAll(),
      products: this.productService.getAll(),
      sections: this.sectionService.getSectionsByCatalog(this.catalogId!)
    }).subscribe({
      next: ({ sections }) => {
        // Mapear secciones con sus productos
        const sectionsWithProducts = sections.map(section => this.mapSectionWithProducts(section));
        this.catalogSections.set(sectionsWithProducts);
        
        // Expandir todas las secciones por defecto (por índice)
        const expandedIndices = new Set(sectionsWithProducts.map((_, index) => index));
        this.expandedSections.set(expandedIndices);
        
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Error al cargar datos', 'Cerrar', { duration: 3000 });
      }
    });
  }
  
  /** Mapea una sección con sus productos completos */
  private mapSectionWithProducts(section: ICatalogItem): ICatalogSectionWithProducts {
    const allProducts = this.availableProducts();
    const products = section.products
      .map(p => allProducts.find(ap => ap._id === p.productId))
      .filter((p): p is IProduct => p !== undefined);
    
    return { section, products };
  }
  
  /** Productos disponibles filtrados (que no están en ninguna sección) */
  filteredProducts: Signal<IProduct[]> = computed(() => {
    const searchCategory = this.selectedCategory();
    const available = this.availableProducts();
    const sections = this.catalogSections();
    
    // Obtener todos los IDs de productos ya en el catálogo
    const productsInCatalog = new Set<string>();
    sections.forEach(s => {
      s.section.products.forEach(p => productsInCatalog.add(p.productId));
    });
    
    return available.filter((p: IProduct) => {
      const matchesCategory = !searchCategory || p.categoryId === searchCategory;
      const notInCatalog = !productsInCatalog.has(p._id!);
      return matchesCategory && notInCatalog;
    });
  });
  
  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c._id === categoryId);
    return category?.name || '';
  }
  
  // ================== Secciones ==================
  
  toggleSection(sectionIndex: number): void {
    const expanded = new Set(this.expandedSections());
    if (expanded.has(sectionIndex)) {
      expanded.delete(sectionIndex);
    } else {
      expanded.add(sectionIndex);
    }
    this.expandedSections.set(expanded);
  }
  
  isSectionExpanded(sectionIndex: number): boolean {
    return this.expandedSections().has(sectionIndex);
  }
  
  addSection(): void {
    const dialogRef = this.dialog.open(FormDialogComponent, {
      width: '400px',
      data: {
        title: 'Nueva Sección',
        fields: [
          { name: 'name', label: 'Nombre de la sección', type: 'text', validators: [Validators.required] },
          { name: 'description', label: 'Descripción (opcional)', type: 'textarea' }
        ]
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && this.catalogId) {
        const sections = this.catalogSections();
        const newSection: ICatalogItemCreate = {
          name: result.name,
          description: result.description || '',
          order: sections.length,
          catalogId: this.catalogId,
          products: []
        };
        
        this.sectionService.create(newSection).subscribe({
          next: (created) => {
            const updated = [...sections, { section: created, products: [] }];
            this.catalogSections.set(updated);
            
            // Expandir la nueva sección (usar el nuevo índice)
            const expanded = new Set(this.expandedSections());
            expanded.add(updated.length - 1);
            this.expandedSections.set(expanded);
            
            this.snackBar.open('Sección creada', 'Cerrar', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Error al crear sección', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }
  
  editSection(sectionData: ICatalogSectionWithProducts): void {
    const dialogRef = this.dialog.open(FormDialogComponent, {
      width: '400px',
      data: {
        title: 'Editar Sección',
        fields: [
          { name: 'name', label: 'Nombre de la sección', type: 'text', value: sectionData.section.name, validators: [Validators.required] },
          { name: 'description', label: 'Descripción (opcional)', type: 'textarea', value: sectionData.section.description }
        ]
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && sectionData.section._id) {
        this.sectionService.update(this.catalogId!, sectionData.section._id, {
          name: result.name,
          description: result.description || '',
          order: sectionData.section.order,
          catalogId: sectionData.section.catalogId,
          products: sectionData.section.products
        }).subscribe({
          next: (updated) => {
            const sections = this.catalogSections();
            const index = sections.findIndex(s => s.section._id === updated._id);
            if (index !== -1) {
              const newSections = [...sections];
              newSections[index] = { ...newSections[index], section: updated };
              this.catalogSections.set(newSections);
            }
            this.snackBar.open('Sección actualizada', 'Cerrar', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Error al actualizar sección', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }
  
  deleteSection(sectionData: ICatalogSectionWithProducts): void {
    if (!sectionData.section._id) return;
    
    if (sectionData.products.length > 0) {
      this.snackBar.open('Elimina los productos de la sección primero', 'Cerrar', { duration: 3000 });
      return;
    }
    
    this.sectionService.delete(this.catalogId!, sectionData.section._id).subscribe({
      next: () => {
        const sections = this.catalogSections();
        this.catalogSections.set(sections.filter(s => s.section._id !== sectionData.section._id));
        this.snackBar.open('Sección eliminada', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Error al eliminar sección', 'Cerrar', { duration: 3000 });
      }
    });
  }
  
  // ================== Drag & Drop ==================
  
  dropInSection(event: CdkDragDrop<IProduct[]>, sectionIndex: number): void {
    const sections = this.catalogSections();
    const sectionData = sections[sectionIndex];
    
    if (event.previousContainer === event.container) {
      // Reordenar dentro de la misma sección
      const newProducts = [...sectionData.products];
      moveItemInArray(newProducts, event.previousIndex, event.currentIndex);
      this.updateSectionProductsByIndex(sectionIndex, newProducts);
    } else {
      // Transferir desde otra lista (availableList u otra sección)
      const product = event.item.data as IProduct;
      if (product && !sectionData.products.some(p => p._id === product._id)) {
        const newProducts = [...sectionData.products];
        newProducts.splice(event.currentIndex, 0, product);
        this.updateSectionProductsByIndex(sectionIndex, newProducts);
      }
    }
  }
  
  dropInAvailable(event: CdkDragDrop<IProduct[]>): void {
    if (event.previousContainer !== event.container) {
      // Remover producto de una sección
      const product = event.previousContainer.data[event.previousIndex];
      this.removeProductFromSection(product);
    }
  }
  
  private updateSectionProducts(sectionData: ICatalogSectionWithProducts): void {
    // Actualizar los productos de la sección
    const newProducts: ICatalogItemProduct[] = sectionData.products.map(p => ({
      productId: p._id!
    }));
    
    sectionData.section.products = newProducts;
    
    // Actualizar el state
    const sections = this.catalogSections();
    const index = sections.findIndex(s => s.section._id === sectionData.section._id);
    if (index !== -1) {
      const newSections = [...sections];
      newSections[index] = { ...sectionData };
      this.catalogSections.set(newSections);
    }
  }
  
  addProductToSection(product: IProduct, sectionData: ICatalogSectionWithProducts): void {
    // Verificar que no esté ya en la sección
    if (sectionData.products.some(p => p._id === product._id)) return;
    
    sectionData.products = [...sectionData.products, product];
    sectionData.section.products = [...sectionData.section.products, { productId: product._id! }];
    
    // Actualizar el state
    const sections = this.catalogSections();
    const index = sections.findIndex(s => s.section._id === sectionData.section._id);
    if (index !== -1) {
      const newSections = [...sections];
      newSections[index] = { ...sectionData };
      this.catalogSections.set(newSections);
    }
  }
  
  removeProductFromSection(product: IProduct): void {
    const sections = this.catalogSections();
    const newSections = sections.map(s => {
      const hasProduct = s.products.some(p => p._id === product._id);
      if (hasProduct) {
        return {
          section: {
            ...s.section,
            products: s.section.products.filter(p => p.productId !== product._id)
          },
          products: s.products.filter(p => p._id !== product._id)
        };
      }
      return s;
    });
    this.catalogSections.set(newSections);
  }
  
  // ================== Guardar ==================
  
  saveCatalog(): void {
    this.isSaving.set(true);
    
    const sections = this.catalogSections();
    console.log(this.catalogSections());
    return;
    const updatePromises = sections.map(s => 
      this.sectionService.update(this.catalogId!, s.section._id!, {
        name: s.section.name,
        description: s.section.description,
        order: s.section.order,
        catalogId: s.section.catalogId,
        products: s.section.products
      })
    );
    
    if (updatePromises.length === 0) {
      this.isSaving.set(false);
      this.snackBar.open('Catálogo guardado', 'Cerrar', { duration: 3000 });
      return;
    }
    
    forkJoin(updatePromises).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.snackBar.open('Catálogo guardado exitosamente', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.isSaving.set(false);
        this.snackBar.open('Error al guardar catálogo', 'Cerrar', { duration: 3000 });
      }
    });
  }
  
  goBack(): void {
    this.router.navigate([APP_ROUTES.CATALOGS.LIST]);
  }

  /** Helper para conectar drop lists - usa índice para IDs únicos */
  getSectionDropListIds(): string[] {
    return this.catalogSections().map((_, index) => `section-${index}`);
  }
  
  /** Actualiza los productos de una sección por índice */
  private updateSectionProductsByIndex(sectionIndex: number, products: IProduct[]): void {
    const sections = this.catalogSections();
    const sectionData = sections[sectionIndex];
    
    const newSection: ICatalogSectionWithProducts = {
      section: {
        ...sectionData.section,
        products: products.map(p => ({ productId: p._id! }))
      },
      products: products
    };
    
    const newSections = [...sections];
    newSections[sectionIndex] = newSection;
    this.catalogSections.set(newSections);
  }
}
