import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { Layout } from './shared/components/layout/layout';
import { Login } from './pages/login/login';

const routes: Routes = [
  { 
    path: '', 
    redirectTo: '/auth/login', 
    pathMatch: 'full' 
  },
  { 
    path: 'auth/login', 
    component: Login 
  },
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
  { 
    path: '**', 
    redirectTo: '/dashboard' 
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
