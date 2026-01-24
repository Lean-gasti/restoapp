import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CatalogList } from './catalog-list/catalog-list';
import { CatalogBuilder } from './catalog-builder/catalog-builder';

const routes: Routes = [
  {
    path: '',
    component: CatalogList
  },
  {
    path: ':id/builder',
    component: CatalogBuilder
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CatalogsRoutingModule { }
