import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Layout } from './shared/components/layout/layout';

const routes: Routes = [
  // Redirect root to auth/login
  { 
    path: '', 
    redirectTo: '/auth', 
    pathMatch: 'full' 
  },
  // Public routes
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
  },
  // Private routes (protected by Layout)
  {
    path: '',
    component: Layout,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule)
      },
      {
        path: 'categories',
        loadChildren: () => import('./features/categories/categories.module').then(m => m.CategoriesModule)
      },
      {
        path: 'catalogs',
        loadChildren: () => import('./features/catalogs/catalogs.module').then(m => m.CatalogsModule)
      },
      {
        path: 'company',
        loadChildren: () => import('./features/company/company.module').then(m => m.CompanyModule)
      }
    ]
  },
  // Wildcard route - must be last
  { 
    path: '**', 
    redirectTo: '/auth' 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
