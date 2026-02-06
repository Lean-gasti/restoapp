import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CompanyService } from '../../../core/services/company.service';
import { AuthService } from '../../../core/services/auth.service';
import { ICompany } from '../../../core/models/company.model';

@Component({
  selector: 'app-company-settings',
  standalone: false,
  templateUrl: './company-settings.html',
  styleUrl: './company-settings.scss'
})
export class CompanySettings implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  companyForm: FormGroup;
  company: ICompany | null = null;
  
  isLoading = signal(true);
  isSaving = false;
  logoPreview: string | null = null;
  
  constructor(
    private fb: FormBuilder,
    private companyService: CompanyService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.companyForm = this.fb.group({
      name: [''],
      slug: ['', [Validators.pattern(/^[a-z0-9-]+$/)]],
      logoUrl: [''],
      location: [''],
      whatsapp: ['', [Validators.pattern(/^\+?[0-9]{10,15}$/)]]
    });
  }
  
  ngOnInit(): void {
    this.loadCompany();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadCompany(): void {
    this.isLoading.set(true);
    const user = this.authService.getCurrentUserValue();
    
    if (user?.companyId) {
      this.companyService.getById(user.companyId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response) {
              this.company = response;
              this.patchForm(response);
            }
            this.isLoading.set(false);
          },
          error: () => {
            // Mock data for demo
            this.company = {
              _id: '1',
              name: 'Bistro Vibe',
              slug: 'bistro-vibe',
              logoUrl: '',
              location: '123 Restaurant Street, Food City',
              whatsapp: '+1234567890'
            };
            this.patchForm(this.company);
            this.isLoading.set(false);
          }
        });
    } else {
      this.isLoading.set(false);
    }
  }
  
  patchForm(company: ICompany): void {
    this.companyForm.patchValue({
      name: company.name,
      slug: company.slug,
      logoUrl: company.logoUrl || '',
      location: company.location || '',
      whatsapp: company.whatsapp || ''
    });
    
    if (company.logoUrl) {
      this.logoPreview = company.logoUrl;
    }
  }
  
  onLogoUrlChange(): void {
    const logoUrl = this.companyForm.get('logoUrl')?.value;
    this.logoPreview = logoUrl || null;
  }
  
  generateSlug(): void {
    const name = this.companyForm.get('name')?.value || '';
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    this.companyForm.get('slug')?.setValue(slug);
  }
  
  onSubmit(): void {
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }
    
    if (!this.company?._id) {
      console.warn('No company ID available');
      return;
    }
    
    this.isSaving = true;
    const formData = this.companyForm.value;
    
    this.companyService.update(this.company._id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response) {
            this.company = response;
          }
          this.onSuccess();
        },
        error: (error) => {
          console.error('Error updating company:', error);
          this.isSaving = false;
          this.snackBar.open('Error al guardar la configuración', 'Cerrar', { duration: 3000 });
        }
      });
  }
  
  onSuccess(): void {
    this.isSaving = false;
    this.snackBar.open('Configuración guardada exitosamente', 'Cerrar', { duration: 3000 });
  }
  
  get publicUrl(): string {
    const slug = this.companyForm.get('slug')?.value || 'tu-restaurante';
    return `https://menu.app/${slug}`;
  }
  
  // Form getters
  get nameControl() { return this.companyForm.get('name'); }
  get slugControl() { return this.companyForm.get('slug'); }
  get whatsappControl() { return this.companyForm.get('whatsapp'); }
}
