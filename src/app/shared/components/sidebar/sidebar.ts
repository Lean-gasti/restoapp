import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { AuthService } from '../../../core/services/auth.service';
import { CompanyService } from '../../../core/services/company.service';
import { APP_ROUTES } from '../../../core/constants/app-routes.constant';
import { ICompany } from '../../../core/models/company.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  active?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  company: ICompany | null = null;
  
  navItems: NavItem[] = [
    // { label: 'Dashboard', icon: 'dashboard', route: APP_ROUTES.DASHBOARD },
    { label: 'Productos', icon: 'restaurant_menu', route: APP_ROUTES.PRODUCTS.LIST },
    { label: 'Catálogos', icon: 'menu_book', route: APP_ROUTES.CATALOGS.LIST }
  ];
  
  currentRoute = '';
  
  constructor(
    private authService: AuthService,
    private companyService: CompanyService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.companyService.company$
      .pipe(takeUntil(this.destroy$))
      .subscribe(company => {
        this.company = company;
      });
    
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.urlAfterRedirects;
      this.updateActiveState();
    });
    
    this.currentRoute = this.router.url;
    this.updateActiveState();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  isActive(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }
  
  private updateActiveState(): void {
    this.navItems.forEach(item => {
      item.active = this.isActive(item.route);
    });
  }
  
  onLogout(): void {
    this.authService.logout();
  }
  
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
