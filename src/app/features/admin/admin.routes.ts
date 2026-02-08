import { Routes } from '@angular/router';
import { superAdminGuard } from '@core/guards/tenant.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'tenants',
    canActivate: [superAdminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./components/tenant-management/tenant-management.component')
          .then(m => m.TenantManagementComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./components/tenant-editor/tenant-editor.component')
          .then(m => m.TenantEditorComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./components/tenant-editor/tenant-editor.component')
          .then(m => m.TenantEditorComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./components/tenant-editor/tenant-editor.component')
          .then(m => m.TenantEditorComponent)
      }
    ]
  }
];
