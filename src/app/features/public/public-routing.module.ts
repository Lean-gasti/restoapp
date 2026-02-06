import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MenuView } from './menu-view/menu-view';

const routes: Routes = [
  {
    path: ':slug',
    component: MenuView
  },
  {
    path: ':slug/:catalogId',
    component: MenuView
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PublicRoutingModule { }
