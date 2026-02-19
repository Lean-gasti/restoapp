import { NgModule } from '@angular/core';

import { DragDropModule } from '@angular/cdk/drag-drop';

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
    CatalogsRoutingModule,
    DragDropModule
  ]
})
export class CatalogsModule { }
