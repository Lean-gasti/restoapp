import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared-module';
import { ProductsRoutingModule } from './products-routing.module';
import { ProductList } from './product-list/product-list';
import { ProductForm } from './product-form/product-form';

@NgModule({
  declarations: [
    ProductList,
    ProductForm
  ],
  imports: [
    SharedModule,
    ProductsRoutingModule
  ]
})
export class ProductsModule { }
