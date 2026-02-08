import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { User, UserRole, TenantRole, UserTenantMembership } from '@shared/models';

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

export interface UserWithMemberships extends User {
  tenantMemberships?: UserTenantMembership[];
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
  
  // Demo users for different roles with tenant memberships
  private readonly demoUsers: Record<string, { password: string; user: UserWithMemberships }> = {
    'admin': {
      password: 'admin123',
      user: {
        id: '1',
        tenantId: 'tenant-1',
        username: 'admin',
        email: 'admin@goemr.com',
        firstName: 'System',
        lastName: 'Administrator',
        role: UserRole.ADMIN,
        department: 'IT',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        tenantMemberships: [
          { id: 'mem-1', userId: '1', tenantId: 'tenant-1', tenantName: 'GoEMR Demo Hospital', tenantSlug: 'goemr-demo', role: TenantRole.SUPER_ADMIN, isDefault: true, status: 'active', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
          { id: 'mem-2', userId: '1', tenantId: 'tenant-2', tenantName: 'Metro General Hospital', tenantSlug: 'metro-general', role: TenantRole.TENANT_ADMIN, isDefault: false, status: 'active', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
          { id: 'mem-3', userId: '1', tenantId: 'tenant-3', tenantName: 'City Medical Center', tenantSlug: 'city-medical', role: TenantRole.VIEWER, isDefault: false, status: 'active', createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') }
        ]
      }
    },
    'manager': {
      password: 'manager123',
      user: {
        id: '2',
        tenantId: 'tenant-1',
        username: 'manager',
        email: 'manager@goemr.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: UserRole.MANAGER,
        department: 'Biomedical Engineering',
        isActive: true,
        createdAt: new Date('2024-01-15'),
        tenantMemberships: [
          { id: 'mem-4', userId: '2', tenantId: 'tenant-1', tenantName: 'GoEMR Demo Hospital', tenantSlug: 'goemr-demo', role: TenantRole.MANAGER, isDefault: true, status: 'active', createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-01-15') }
        ]
      }
    },
    'technician': {
      password: 'tech123',
      user: {
        id: '3',
        tenantId: 'tenant-1',
        username: 'technician',
        email: 'technician@goemr.com',
        firstName: 'Michael',
        lastName: 'Chen',
        role: UserRole.TECHNICIAN,
        department: 'Maintenance',
        isActive: true,
        createdAt: new Date('2024-02-01'),
        tenantMemberships: [
          { id: 'mem-5', userId: '3', tenantId: 'tenant-1', tenantName: 'GoEMR Demo Hospital', tenantSlug: 'goemr-demo', role: TenantRole.STAFF, isDefault: true, status: 'active', createdAt: new Date('2024-02-01'), updatedAt: new Date('2024-02-01') },
          { id: 'mem-6', userId: '3', tenantId: 'tenant-2', tenantName: 'Metro General Hospital', tenantSlug: 'metro-general', role: TenantRole.STAFF, isDefault: false, status: 'active', createdAt: new Date('2024-02-01'), updatedAt: new Date('2024-02-01') }
        ]
      }
    },
    'viewer': {
      password: 'viewer123',
      user: {
        id: '4',
        tenantId: 'tenant-1',
        username: 'viewer',
        email: 'viewer@goemr.com',
        firstName: 'Emily',
        lastName: 'Davis',
        role: UserRole.VIEWER,
        department: 'Operations',
        isActive: true,
        createdAt: new Date('2024-02-15'),
        tenantMemberships: [
          { id: 'mem-7', userId: '4', tenantId: 'tenant-1', tenantName: 'GoEMR Demo Hospital', tenantSlug: 'goemr-demo', role: TenantRole.VIEWER, isDefault: true, status: 'active', createdAt: new Date('2024-02-15'), updatedAt: new Date('2024-02-15') }
        ]
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

  // Get tenant memberships for the current user
  getTenantMemberships(): UserTenantMembership[] {
    const user = this._user() as UserWithMemberships | null;
    return user?.tenantMemberships || [];
  }

  // Check if user has a specific tenant role
  hasTenantRole(tenantId: string, role: TenantRole): boolean {
    const memberships = this.getTenantMemberships();
    const membership = memberships.find(m => m.tenantId === tenantId);
    return membership?.role === role;
  }

  // Check if user has any of the specified tenant roles
  hasAnyTenantRole(tenantId: string, roles: TenantRole[]): boolean {
    const memberships = this.getTenantMemberships();
    const membership = memberships.find(m => m.tenantId === tenantId);
    return membership ? roles.includes(membership.role) : false;
  }

  // Check if user is at least a manager in the tenant (manager, tenant_admin, or super_admin)
  isTenantManagerOrAbove(tenantId: string): boolean {
    return this.hasAnyTenantRole(tenantId, [
      TenantRole.MANAGER,
      TenantRole.TENANT_ADMIN,
      TenantRole.SUPER_ADMIN
    ]);
  }

  // Check if user is a tenant admin or super admin
  isTenantAdminOrAbove(tenantId: string): boolean {
    return this.hasAnyTenantRole(tenantId, [
      TenantRole.TENANT_ADMIN,
      TenantRole.SUPER_ADMIN
    ]);
  }

  // Check if user is a super admin in any tenant
  isSuperAdmin(): boolean {
    const memberships = this.getTenantMemberships();
    return memberships.some(m => m.role === TenantRole.SUPER_ADMIN);
  }
}
