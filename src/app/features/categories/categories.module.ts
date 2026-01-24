import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared-module';
import { CategoriesRoutingModule } from './categories-routing.module';
import { CategoryList } from './category-list/category-list';

@NgModule({
  declarations: [
    CategoryList
  ],
  imports: [
    SharedModule,
    CategoriesRoutingModule
  ]
})
export class CategoriesModule { }
