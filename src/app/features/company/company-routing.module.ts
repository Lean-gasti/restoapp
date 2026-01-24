import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CompanySettings } from './company-settings/company-settings';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'settings',
    pathMatch: 'full'
  },
  {
    path: 'settings',
    component: CompanySettings
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompanyRoutingModule { }
