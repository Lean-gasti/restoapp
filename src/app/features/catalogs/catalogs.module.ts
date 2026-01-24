import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared-module';
import { CatalogsRoutingModule } from './catalogs-routing.module';
import { CatalogList } from './catalog-list/catalog-list';
import { CatalogBuilder } from './catalog-builder/catalog-builder';

@NgModule({
  declarations: [
    CatalogList,
    CatalogBuilder
  ],
  imports: [
    SharedModule,
    CatalogsRoutingModule
  ]
})
export class CatalogsModule { }
