import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { USER_ROLE } from '../constants/user-roles.constant';
import { APP_ROUTES } from '../constants/app-routes.constant';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    const requiredRoles = route.data['roles'] as USER_ROLE[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    const currentUser = this.authService.getCurrentUserValue();
    
    if (!currentUser) {
      return this.router.createUrlTree([APP_ROUTES.AUTH.LOGIN]);
    }
    
    const hasRequiredRole = requiredRoles.includes(currentUser.role);
    
    if (hasRequiredRole) {
      return true;
    }
    
    // User doesn't have required role, redirect to dashboard
    console.warn('User does not have required role:', requiredRoles);
    return this.router.createUrlTree([APP_ROUTES.DASHBOARD]);
  }
}
