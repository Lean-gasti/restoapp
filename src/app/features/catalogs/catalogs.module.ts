import { NgModule } from '@angular/core';

import { DragDropModule } from '@angular/cdk/drag-drop';

import { SharedModule } from '../../shared/shared-module';
import { CatalogsRoutingModule } from './catalogs-routing.module';
import { CatalogList } from './catalog-list/catalog-list';
import { CatalogBuilder } from './catalog-builder/catalog-builder';

import { CatalogPreview } from './catalog-preview/catalog-preview';

@NgModule({
  declarations: [
    CatalogList,
    CatalogBuilder,
    CatalogPreview
  ],
  imports: [
    SharedModule,
    CatalogsRoutingModule,
    DragDropModule,
  ]
})
export class CatalogsModule { }
