import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { API_ENDPOINTS } from '../constants/api-endpoints.constant';
import { APP_ROUTES } from '../constants/app-routes.constant';
import { 
  ApiResponse, 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest,
  ResetPasswordRequest,
  SetNewPasswordRequest
} from '../models/api-response.model';
import { IUser } from '../models/user.model';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = environment.apiUrl;
  
  private currentUserSubject = new BehaviorSubject<IUser | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.baseUrl}${API_ENDPOINTS.AUTH.LOGIN}`,
      credentials
    ).pipe(
      tap(response => {
        if (response) {
          this.setSession(response);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(
      `${this.baseUrl}${API_ENDPOINTS.AUTH.REGISTER}`,
      data
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  requestPasswordReset(data: ResetPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.baseUrl}${API_ENDPOINTS.AUTH.REQUEST_RESET}`,
      data
    );
  }

  resetPassword(data: SetNewPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.baseUrl}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`,
      data
    );
  }

  refreshToken(): Observable<ApiResponse<{ token: string }>> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<ApiResponse<{ token: string }>>(
      `${this.baseUrl}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
      { refreshToken }
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setToken(response.data.token);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate([APP_ROUTES.AUTH.LOGIN]);
  }

  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  }

  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  getCurrentUserValue(): IUser | null {
    return this.currentUserSubject.value;
  }

  private setSession(authResult: LoginResponse): void {
    this.setToken(authResult.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, authResult.refreshToken);
    const user: IUser = {
      _id: authResult.user.id,
      email: authResult.user.email,
      role: authResult.user.role as any,
      companyId: authResult.user.companyId
    };
    this.setUser(user);
    this.isAuthenticatedSubject.next(true);
  }

  private setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  private setUser(user: IUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private getStoredUser(): IUser | null {
    if (typeof localStorage !== 'undefined') {
      const userStr = localStorage.getItem(USER_KEY);
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // TODO: Add JWT expiration check
    return true;
  }
}
