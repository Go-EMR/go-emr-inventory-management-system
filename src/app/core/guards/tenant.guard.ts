import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { TenantService } from '@core/services/tenant.service';
import { AuthService } from '@core/services/auth.service';

/**
 * Guard that requires a valid tenant context to be set.
 * Redirects to tenant selector if no tenant is selected.
 */
export const tenantGuard: CanActivateFn = () => {
  const tenantService = inject(TenantService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Must be authenticated first
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Check if user has any tenants
  if (!tenantService.hasMultipleTenants() && !tenantService.currentTenant()) {
    // User has no tenants - this is an error state
    console.error('User has no tenant memberships');
    router.navigate(['/auth/login']);
    return false;
  }

  // Check if a tenant is selected
  if (tenantService.currentTenant()) {
    return true;
  }

  // If user has multiple tenants but none selected, redirect to selector
  if (tenantService.hasMultipleTenants()) {
    router.navigate(['/tenant/select']);
    return false;
  }

  // Single tenant user - auto-select their tenant
  const availableTenants = tenantService.availableTenants();
  if (availableTenants.length === 1) {
    tenantService.switchTenant(availableTenants[0].id);
    return true;
  }

  router.navigate(['/tenant/select']);
  return false;
};

/**
 * Guard for tenant admin routes - requires tenant admin role
 */
export const tenantAdminGuard: CanActivateFn = () => {
  const tenantService = inject(TenantService);
  const router = inject(Router);

  if (tenantService.isTenantAdmin()) {
    return true;
  }

  // Redirect to dashboard if not tenant admin
  router.navigate(['/dashboard']);
  return false;
};

/**
 * Guard for super admin routes - requires super admin role
 */
export const superAdminGuard: CanActivateFn = () => {
  const tenantService = inject(TenantService);
  const router = inject(Router);

  if (tenantService.isSuperAdmin()) {
    return true;
  }

  // Redirect to dashboard if not super admin
  router.navigate(['/dashboard']);
  return false;
};

/**
 * Guard that allows access to tenant selection even without tenant context
 */
export const tenantSelectorGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/auth/login']);
  return false;
};
