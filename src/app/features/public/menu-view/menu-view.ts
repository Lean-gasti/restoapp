import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PublicCatalogFacade } from '../facades/public-catalog.facade';

@Component({
  selector: 'app-menu-view',
  standalone: false,
  templateUrl: './menu-view.html',
  styleUrl: './menu-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuView implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private facade = inject(PublicCatalogFacade);
  
  // Expose facade signals to template
  readonly company = this.facade.company;
  readonly catalog = this.facade.catalog;
  readonly catalogs = this.facade.catalogs;
  readonly sections = this.facade.sections;
  readonly isLoading = this.facade.isLoading;
  readonly error = this.facade.error;
  
  // Expanded sections state
  private expandedSections = signal<Set<number>>(new Set());
  
  private slug: string = '';
  private catalogId: string | null = null;
  
  constructor(private route: ActivatedRoute) {}
  
  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.slug = params.get('slug') || '';
      this.catalogId = params.get('catalogId');
      
      if (this.slug) {
        if (this.catalogId) {
          this.facade.loadMenu(this.slug, this.catalogId);
        } else {
          this.facade.loadMenu(this.slug);
          this.facade.loadCatalogs(this.slug);
        }
      }
    });

    // Expand all sections by default after data loads
    setTimeout(() => {
      const sections = this.sections();
      if (sections.length > 0) {
        const all = new Set<number>(sections.map((_, i) => i));
        this.expandedSections.set(all);
      }
    }, 500);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.facade.reset();
  }
  
  toggleSection(index: number): void {
    const current = new Set(this.expandedSections());
    if (current.has(index)) {
      current.delete(index);
    } else {
      current.add(index);
    }
    this.expandedSections.set(current);
  }
  
  isSectionExpanded(index: number): boolean {
    return this.expandedSections().has(index);
  }
  
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price);
  }
}
