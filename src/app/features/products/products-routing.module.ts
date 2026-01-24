import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProductList } from './product-list/product-list';
import { ProductForm } from './product-form/product-form';

const routes: Routes = [
  {
    path: '',
    component: ProductList
  },
  {
    path: 'new',
    component: ProductForm
  },
  {
    path: ':id/edit',
    component: ProductForm
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductsRoutingModule { }
