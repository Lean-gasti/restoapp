import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { IUser } from '../../../core/models/user.model';
import { APP_ROUTES } from '../../../core/constants/app-routes.constant';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showAddButton = false;
  @Input() addButtonText = 'Agregar';
  @Input() addButtonIcon = 'add';
  
  @Output() addClick = new EventEmitter<void>();
  
  user: IUser | null = null;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }
  
  onAddClick(): void {
    this.addClick.emit();
  }

  goToSettings(): void {
    this.router.navigate([APP_ROUTES.COMPANY.SETTINGS]);
  }

  onLogout(): void {
    this.authService.logout();
  }
}
