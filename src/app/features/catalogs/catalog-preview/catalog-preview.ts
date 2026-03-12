import { Component, OnInit, inject, Signal, computed, signal, ChangeDetectionStrategy, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';

import { CatalogService } from '../../../core/services/catalog.service';
import { ProductService } from '../../../core/services/product.service';
import { CatalogSectionService } from '../../../core/services/catalog-section.service';
import { APP_ROUTES } from '../../../core/constants/app-routes.constant';

import { IProduct } from '../../../core/models/product.model';
import { ICatalogItem } from '../../../core/models/catalog-item.model';
import { ICatalog } from '../../../core/models/catalog.model';
import QRCodeStyling from 'qr-code-styling';
import { CompanyService } from '../../../core/services/company.service';

export interface ICatalogSectionWithProducts {
  section: ICatalogItem;
  products: IProduct[];
}

@Component({
  selector: 'app-catalog-preview',
  standalone: false,
  templateUrl: './catalog-preview.html',
  styleUrl: './catalog-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogPreview implements OnInit {
  private catalogService: CatalogService = inject(CatalogService);
  private productService: ProductService = inject(ProductService);
  private sectionService: CatalogSectionService = inject(CatalogSectionService);
  private companyService: CompanyService = inject(CompanyService);

  catalog: Signal<ICatalog | null> = computed(() => this.catalogService.catalogs().data.find(c => c._id === this.catalogId) || null);
  catalogId: string | null = null;
  
  availableProducts: Signal<IProduct[]> = this.productService.products;
  catalogSections = signal<ICatalogSectionWithProducts[]>([]);
  
  isLoading = signal(true);
  qrDataUrl = signal('');
  qrCodeInstance: QRCodeStyling | null = null;

  @ViewChild('qrDialog') qrDialogTemplate!: TemplateRef<any>;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}
  
  ngOnInit(): void {
    this.catalogId = this.route.snapshot.paramMap.get('id');
    if (this.catalogId) {
      if(!this.catalog()) {
         this.catalogService.getAll().subscribe(); // Fetch if not present
      }
      this.loadData();
    }
  }
  
  loadData(): void {
    this.isLoading.set(true);
    
    forkJoin({
      products: this.productService.getAll(),
      sections: this.sectionService.getSectionsByCatalog(this.catalogId!)
    }).subscribe({
      next: ({ sections }) => {
        const sectionsWithProducts = sections.map(section => this.mapSectionWithProducts(section));
        // Only include sections that have products, or just all of them. Let's include all.
        this.catalogSections.set(sectionsWithProducts.sort((a, b) => a.section.order - b.section.order));
        
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Error al cargar datos', 'Cerrar', { duration: 3000 });
      }
    });
  }
  
  private mapSectionWithProducts(section: ICatalogItem): ICatalogSectionWithProducts {
    const allProducts = this.availableProducts();
    const sortedSectionProducts = [...section.products].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const products = sortedSectionProducts
      .map(p => allProducts.find(ap => ap._id === p.productId))
      .filter((p): p is IProduct => p !== undefined);
    
    return { section, products };
  }
  
  goBack(): void {
    if (this.catalogId) {
       this.router.navigate([APP_ROUTES.CATALOGS.BUILDER(this.catalogId)]);
    } else {
       this.router.navigate([APP_ROUTES.CATALOGS.LIST]);
    }
  }

  openQRDialog(): void {
    const currentUrl = window.location.href;
    const company = this.companyService.getCompanyValue();
    const logoUrl = company?.logoUrl || '';

    this.qrCodeInstance = new QRCodeStyling({
      width: 500,
      height: 500,
      data: currentUrl,
      image: logoUrl,
      margin: 10,
      qrOptions: {
        typeNumber: 0,
        mode: 'Byte',
        errorCorrectionLevel: 'Q'
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.4,
        margin: 10,
        crossOrigin: 'anonymous'
      },
      dotsOptions: {
        type: 'rounded',
        color: '#1a1a1a'
      },
      backgroundOptions: {
        color: '#ffffff'
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
        color: '#1a1a1a'
      },
      cornersDotOptions: {
        type: 'dot',
        color: '#1a1a1a'
      }
    });

    this.qrCodeInstance.getRawData('png').then((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob as Blob);
        this.qrDataUrl.set(url);
        
        const dialogRef = this.dialog.open(this.qrDialogTemplate, {
          width: '450px',
          panelClass: 'modern-qr-dialog'
        });

        dialogRef.afterClosed().subscribe(() => {
          URL.revokeObjectURL(url);
          this.qrDataUrl.set('');
        });
      }
    }).catch(() => {
      this.snackBar.open('Error al generar el QR', 'Cerrar', { duration: 3000 });
    });
  }

  downloadQR(): void {
    if (this.qrCodeInstance) {
      const fileName = `qr-${this.catalog()?.name?.toLowerCase().replace(/\s+/g, '-') || 'menu'}`;
      this.qrCodeInstance.download({ name: fileName, extension: 'png' });
    }
  }

  closeDialog(): void {
    this.dialog.closeAll();
  }
}
