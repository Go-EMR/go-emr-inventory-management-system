import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { User, UserRole } from '@shared/models';

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  private readonly AUTH_KEY = 'auth_user';
  
  // State signals
  private _user = signal<User | null>(this.loadUserFromStorage());
  private _isLoading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  
  // Public readonly signals
  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  
  // Computed properties
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly userRole = computed(() => this._user()?.role ?? null);
  readonly userFullName = computed(() => {
    const user = this._user();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });
  
  // Demo users for different roles
  private readonly demoUsers: Record<string, { password: string; user: User }> = {
    'admin': {
      password: 'admin123',
      user: {
        id: '1',
        username: 'admin',
        email: 'admin@goemr.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.ADMIN,
        department: 'IT',
        isActive: true,
        createdAt: new Date('2024-01-01')
      }
    },
    'manager': {
      password: 'manager123',
      user: {
        id: '2',
        username: 'manager',
        email: 'manager@goemr.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: UserRole.MANAGER,
        department: 'Biomedical Engineering',
        isActive: true,
        createdAt: new Date('2024-01-15')
      }
    },
    'technician': {
      password: 'tech123',
      user: {
        id: '3',
        username: 'technician',
        email: 'technician@goemr.com',
        firstName: 'Michael',
        lastName: 'Chen',
        role: UserRole.TECHNICIAN,
        department: 'Maintenance',
        isActive: true,
        createdAt: new Date('2024-02-01')
      }
    },
    'viewer': {
      password: 'viewer123',
      user: {
        id: '4',
        username: 'viewer',
        email: 'viewer@goemr.com',
        firstName: 'Emily',
        lastName: 'Davis',
        role: UserRole.VIEWER,
        department: 'Operations',
        isActive: true,
        createdAt: new Date('2024-02-15')
      }
    }
  };
  
  private loadUserFromStorage(): User | null {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(this.AUTH_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  }
  
  private saveUserToStorage(user: User): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
    }
  }
  
  private clearUserFromStorage(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.AUTH_KEY);
    }
  }
  
  async login(credentials: LoginCredentials): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const demoUser = this.demoUsers[credentials.username.toLowerCase()];
      
      if (!demoUser || demoUser.password !== credentials.password) {
        this._error.set('Invalid username or password');
        this._isLoading.set(false);
        return false;
      }
      
      const user = {
        ...demoUser.user,
        lastLogin: new Date()
      };
      
      this._user.set(user);
      
      if (credentials.rememberMe) {
        this.saveUserToStorage(user);
      }
      
      this._isLoading.set(false);
      return true;
    } catch (err) {
      this._error.set('An error occurred during login');
      this._isLoading.set(false);
      return false;
    }
  }
  
  logout(): void {
    this._user.set(null);
    this.clearUserFromStorage();
    this.router.navigate(['/auth/login']);
  }
  
  clearError(): void {
    this._error.set(null);
  }
  
  hasRole(role: UserRole): boolean {
    return this._user()?.role === role;
  }
  
  hasAnyRole(roles: UserRole[]): boolean {
    const userRole = this._user()?.role;
    return userRole ? roles.includes(userRole) : false;
  }
  
  // Quick login for demo purposes
  async quickLogin(role: UserRole): Promise<boolean> {
    const roleMap: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'admin',
      [UserRole.MANAGER]: 'manager',
      [UserRole.TECHNICIAN]: 'technician',
      [UserRole.VIEWER]: 'viewer'
    };
    
    const username = roleMap[role];
    const password = this.demoUsers[username].password;
    
    return this.login({ username, password, rememberMe: false });
  }
}
