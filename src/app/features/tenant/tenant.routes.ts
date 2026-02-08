import { Routes } from '@angular/router';
import { tenantAdminGuard, tenantSelectorGuard } from '@core/guards/tenant.guard';

export const TENANT_ROUTES: Routes = [
  {
    path: 'select',
    canActivate: [tenantSelectorGuard],
    loadComponent: () => import('./components/tenant-selector/tenant-selector.component')
      .then(m => m.TenantSelectorComponent)
  },
  {
    path: 'settings',
    canActivate: [tenantAdminGuard],
    loadComponent: () => import('./components/tenant-settings/tenant-settings.component')
      .then(m => m.TenantSettingsComponent)
  },
  {
    path: 'users',
    canActivate: [tenantAdminGuard],
    loadComponent: () => import('./components/user-management/user-management.component')
      .then(m => m.UserManagementComponent)
  }
];
