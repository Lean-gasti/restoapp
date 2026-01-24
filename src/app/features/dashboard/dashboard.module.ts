import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared-module';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardHome } from './dashboard-home/dashboard-home';

@NgModule({
  declarations: [
    DashboardHome
  ],
  imports: [
    SharedModule,
    DashboardRoutingModule
  ]
})
export class DashboardModule { }
