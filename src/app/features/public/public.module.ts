import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

import { PublicRoutingModule } from './public-routing.module';
import { MenuView } from './menu-view/menu-view';

@NgModule({
  declarations: [
    MenuView
  ],
  imports: [
    CommonModule,
    RouterModule,
    PublicRoutingModule,
    MatProgressSpinnerModule,
    MatIconModule
  ]
})
export class PublicModule { }
