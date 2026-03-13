import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { APP_ROUTES } from '../constants/app-routes.constant';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'Ha ocurrido un error inesperado';
        const isLogin = request.url.includes('auth/login');
    
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = error.error.message;
        } else if (isLogin) {
            errorMessage = error.error?.message || 'Credenciales inválidas.';
        } else {
          // Server-side error
          switch (error.status) {
            case 401:
              // Unauthorized - redirect to login
              this.authService.logout();
              this.router.navigate([APP_ROUTES.AUTH.LOGIN]);
              errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
              break;
            case 403:
              errorMessage = 'No tienes permisos para realizar esta acción.';
              break;
            case 404:
              errorMessage = 'El recurso solicitado no fue encontrado.';
              break;
            case 422:
              errorMessage = error.error?.message || 'Datos inválidos.';
              break;
            case 500:
              errorMessage = 'Error del servidor. Intenta nuevamente más tarde.';
              break;
            default:
              errorMessage = error.error?.message || errorMessage;
          }
        }
        
        return throwError(() => ({
          status: error.status,
          message: errorMessage,
          errors: error.error?.errors || []
        }));
      })
    );
  }
}
