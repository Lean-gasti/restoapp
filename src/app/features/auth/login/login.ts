import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { APP_ROUTES } from '../../../core/constants/app-routes.constant';
import { delay } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  hidePassword = true;
  isLoading = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cd: ChangeDetectorRef
  ) {}

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    
    this.isLoading.set(true);
    const { email, password } = this.loginForm.value;
    
    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.router.navigate([APP_ROUTES.PRODUCTS.LIST]);
      },
      error: (error) => {
        this.snackBar.open(error.message || 'Error al iniciar sesión', 'Cerrar', { duration: 3000 });
        this.isLoading.set(false);
        this.cd.detectChanges();
      },
    });
  }
}
