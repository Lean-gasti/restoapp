import { Component, Input, Output, EventEmitter } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { IUser } from '../../../core/models/user.model';

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
  
  constructor(private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }
  
  onAddClick(): void {
    this.addClick.emit();
  }
}
