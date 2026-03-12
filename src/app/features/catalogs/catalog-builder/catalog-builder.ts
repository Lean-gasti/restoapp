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
  
  // Estado original de las secciones para detectar cambios (productIds|order)
  private originalSectionsState: Map<string, { products: string, order: number }> = new Map();
  
  // Estado UI para secciones expandidas (por índice)
  expandedSections = signal<Set<number>>(new Set());
  
  selectedCategory = signal('');
  searchText = signal('');
  isLoading = signal(true);
  isSaving = signal(false);
  
  // Computed para detectar si hay cambios pendientes
  hasChanges = computed(() => {
    const sections = this.catalogSections();
    return sections.some(s => this.hasSectionChanged(s));
  });
  
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
        this.catalogSections.set(sectionsWithProducts.sort((a, b) => a.section.order - b.section.order));
        
        // Guardar estado original para detectar cambios
        this.saveOriginalState(sectionsWithProducts);
        
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
  
  /** Mapea una sección con sus productos completos, ordenados por order */
  private mapSectionWithProducts(section: ICatalogItem): ICatalogSectionWithProducts {
    const allProducts = this.availableProducts();
    // Ordenar productos por order antes de mapear
    const sortedSectionProducts = [...section.products].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const products = sortedSectionProducts
      .map(p => allProducts.find(ap => ap._id === p.productId))
      .filter((p): p is IProduct => p !== undefined);
    
    return { section, products };
  }
  
  /** Productos disponibles filtrados (que no están en ninguna sección) */
  filteredProducts: Signal<IProduct[]> = computed(() => {
    const searchCategory = this.selectedCategory();
    const searchQuery = this.searchText().toLowerCase().trim();
    const available = this.availableProducts();
    const sections = this.catalogSections();
    
    // Obtener todos los IDs de productos ya en el catálogo
    const productsInCatalog = new Set<string>();
    sections.forEach(s => {
      s.section.products.forEach(p => productsInCatalog.add(p.productId));
    });
    
    return available.filter((p: IProduct) => {
      const matchesCategory = !searchCategory || p.categoryId === searchCategory;
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery);
      const notInCatalog = !productsInCatalog.has(p._id!);
      return matchesCategory && matchesSearch && notInCatalog;
    });
  });
  
  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c._id === categoryId);
    return category?.name || '';
  }
  
  // ================== Secciones ==================
  
  /** Reordena las secciones al hacer drag & drop */
  dropSection(event: CdkDragDrop<ICatalogSectionWithProducts[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    
    const sections = [...this.catalogSections()];
    moveItemInArray(sections, event.previousIndex, event.currentIndex);
    
    // Actualizar el order de cada sección
    sections.forEach((s, index) => {
      s.section.order = index;
    });
    
    this.catalogSections.set(sections);
    
    // Reorganizar las secciones expandidas para mantener consistencia
    this.updateExpandedSectionsAfterReorder(event.previousIndex, event.currentIndex);
  }
  
  /** Actualiza los índices de secciones expandidas después de reordenar */
  private updateExpandedSectionsAfterReorder(previousIndex: number, currentIndex: number): void {
    const expanded = this.expandedSections();
    const newExpanded = new Set<number>();
    
    expanded.forEach(index => {
      if (index === previousIndex) {
        // La sección movida va a su nueva posición
        newExpanded.add(currentIndex);
      } else if (previousIndex < currentIndex) {
        // Movimiento hacia abajo: índices entre prev+1 y curr bajan 1
        if (index > previousIndex && index <= currentIndex) {
          newExpanded.add(index - 1);
        } else {
          newExpanded.add(index);
        }
      } else {
        // Movimiento hacia arriba: índices entre curr y prev-1 suben 1
        if (index >= currentIndex && index < previousIndex) {
          newExpanded.add(index + 1);
        } else {
          newExpanded.add(index);
        }
      }
    });
    
    this.expandedSections.set(newExpanded);
  }
  
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
      if (!product) return;
      
      // Primero remover de la sección origen si viene de otra sección
      const sourceSectionIndex = this.findSectionIndexByProduct(product._id!);
      if (sourceSectionIndex !== -1) {
        this.removeProductFromSectionByIndex(sourceSectionIndex, product._id!);
      }
      
      // Luego agregar a la sección destino (re-obtener sections después de la modificación)
      const updatedSections = this.catalogSections();
      const targetSectionData = updatedSections[sectionIndex];
      
      // Verificar que no esté ya en la sección destino
      if (!targetSectionData.products.some(p => p._id === product._id)) {
        const newProducts = [...targetSectionData.products];
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
    // Actualizar los productos de la sección con order
    const newProducts: ICatalogItemProduct[] = sectionData.products.map((p, index) => ({
      productId: p._id!,
      order: index
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
    
    const newOrder = sectionData.products.length;
    sectionData.products = [...sectionData.products, product];
    sectionData.section.products = [...sectionData.section.products, { productId: product._id!, order: newOrder }];
    
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
      
    // Filtrar solo las secciones que tienen cambios
    const changedSections = sections.filter(s => this.hasSectionChanged(s));
    
    if (changedSections.length === 0) {
      this.isSaving.set(false);
      this.snackBar.open('No hay cambios para guardar', 'Cerrar', { duration: 3000 });
      return;
    }
    
    const updatePromises = changedSections.map(s => {
      // Limpiar products: enviar productId y order, sin _ids de MongoDB
      const cleanProducts = s.section.products.map((p, index) => ({
        productId: p.productId,
        order: p.order ?? index
      }));
      
      // Construir el objeto de actualización
      const updateData: { order: number; products?: { productId: string; order: number }[] } = {
        order: s.section.order,
        products: cleanProducts
      };
      
      return this.sectionService.update(this.catalogId!, s.section._id!, updateData)
    });
    
    forkJoin(updatePromises).subscribe({
      next: () => {
        // Normalizar el order en todas las secciones actuales antes de guardar estado
        const normalizedSections = this.catalogSections().map(s => ({
          section: {
            ...s.section,
            products: s.section.products.map((p, i) => ({ ...p, order: p.order ?? i }))
          },
          products: s.products
        }));
        this.catalogSections.set(normalizedSections);
        
        // Ahora guardar el estado original (hasChanges() retornará false)
        this.saveOriginalState(normalizedSections);
        this.isSaving.set(false);
        this.snackBar.open(`${changedSections.length} sección(es) guardada(s)`, 'Cerrar', { duration: 3000 });
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
  
  previewCatalog(): void {
    if (this.catalogId) {
      this.router.navigate([APP_ROUTES.CATALOGS.PREVIEW(this.catalogId)]);
    }
  }
  
  editCatalogName(): void {
    const currentCatalog = this.catalog();
    if (!currentCatalog) return;
    
    const dialogRef = this.dialog.open(FormDialogComponent, {
      width: '400px',
      data: {
        title: 'Editar Catálogo',
        fields: [
          { name: 'name', label: 'Nombre del catálogo', type: 'text', value: currentCatalog.name, validators: [Validators.required] },
          { name: 'description', label: 'Descripción (opcional)', type: 'textarea', value: currentCatalog.description || '' }
        ]
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && this.catalogId) {
        this.catalogService.update(this.catalogId, {
          name: result.name,
          description: result.description || ''
        }).subscribe({
          next: () => {
            this.snackBar.open('Catálogo actualizado', 'Cerrar', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Error al actualizar el catálogo', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  /** Helper para conectar drop lists - usa índice para IDs únicos */
  getSectionDropListIds(): string[] {
    return this.catalogSections().map((_, index) => `section-${index}`);
  }
  
  /** Actualiza los productos de una sección por índice, incluyendo order */
  private updateSectionProductsByIndex(sectionIndex: number, products: IProduct[]): void {
    const sections = this.catalogSections();
    const sectionData = sections[sectionIndex];
    
    const newSection: ICatalogSectionWithProducts = {
      section: {
        ...sectionData.section,
        products: products.map((p, index) => ({ productId: p._id!, order: index }))
      },
      products: products
    };
    
    const newSections = [...sections];
    newSections[sectionIndex] = newSection;
    this.catalogSections.set(newSections);
  }
  
  /** Busca el índice de la sección que contiene un producto */
  private findSectionIndexByProduct(productId: string): number {
    const sections = this.catalogSections();
    return sections.findIndex(s => s.products.some(p => p._id === productId));
  }
  
  /** Remueve un producto de una sección por índice */
  private removeProductFromSectionByIndex(sectionIndex: number, productId: string): void {
    const sections = this.catalogSections();
    const sectionData = sections[sectionIndex];
    
    const newSection: ICatalogSectionWithProducts = {
      section: {
        ...sectionData.section,
        products: sectionData.section.products.filter(p => p.productId !== productId)
      },
      products: sectionData.products.filter(p => p._id !== productId)
    };
    
    const newSections = [...sections];
    newSections[sectionIndex] = newSection;
    this.catalogSections.set(newSections);
  }
  
  /** Guarda el estado original de las secciones para detectar cambios */
  private saveOriginalState(sections: ICatalogSectionWithProducts[]): void {
    this.originalSectionsState.clear();
    sections.forEach(s => {
      if (s.section._id) {
        // Incluir productId y order para detectar cambios de orden de productos
        const productsWithOrder = s.section.products.map(p => `${p.productId}:${p.order ?? 0}`).join(',');
        this.originalSectionsState.set(s.section._id, {
          products: productsWithOrder,
          order: s.section.order
        });
      }
    });
  }
  
  /** Verifica si una sección tiene cambios respecto al estado original */
  private hasSectionChanged(sectionData: ICatalogSectionWithProducts): boolean {
    if (!sectionData.section._id) return true;
    
    const original = this.originalSectionsState.get(sectionData.section._id);
    if (original === undefined) return true;
    
    // Comparar productId y order para detectar cambios de orden de productos
    const currentProducts = sectionData.section.products.map(p => `${p.productId}:${p.order ?? 0}`).join(',');
    const productsChanged = original.products !== currentProducts;
    const orderChanged = original.order !== sectionData.section.order;
    
    return productsChanged || orderChanged;
  }
}
