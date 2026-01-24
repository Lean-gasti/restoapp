import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared-module';
import { CompanyRoutingModule } from './company-routing.module';
import { CompanySettings } from './company-settings/company-settings';

@NgModule({
  declarations: [
    CompanySettings
  ],
  imports: [
    SharedModule,
    CompanyRoutingModule
  ]
})
export class CompanyModule { }
