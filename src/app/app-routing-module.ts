import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Layout } from './shared/components/layout/layout';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  // Redirect root to products (AuthGuard will handle unauthenticated users)
  { 
    path: '', 
    redirectTo: '/auth', 
    pathMatch: 'full' 
  },
  // Public routes (only for non-authenticated users)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
  },
  // Private routes (protected by Layout)
  {
    path: '',
    component: Layout,
    children: [
      // {
      //   path: 'dashboard',
      //   loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
      // },
      {
        path: 'products',
        canActivate: [AuthGuard],
        loadChildren: () => import('./features/products/products.module').then(m => m.ProductsModule)
      },
      {
        path: 'catalogs',
        canActivate: [AuthGuard],
        loadChildren: () => import('./features/catalogs/catalogs.module').then(m => m.CatalogsModule)
      },
      {
        path: 'company',
        canActivate: [AuthGuard],
        loadChildren: () => import('./features/company/company.module').then(m => m.CompanyModule)
      }
    ]
  },
  // Public menu route (no auth required)
  {
    path: 'menu',
    loadChildren: () => import('./features/public/public.module').then(m => m.PublicModule)
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
