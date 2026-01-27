import { Routes } from '@angular/router';
import { authGuard, publicGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [publicGuard],
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('@features/auth/components/login/login.component')
          .then(m => m.LoginComponent),
        title: 'Login - GoEMR Inventory'
      }
    ]
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('@layout/components/main-layout/main-layout.component')
      .then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('@features/dashboard/components/dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
        title: 'Dashboard - GoEMR Inventory'
      },
      {
        path: 'equipment',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/equipment/components/equipment-list/equipment-list.component')
              .then(m => m.EquipmentListComponent),
            title: 'Equipment - GoEMR Inventory'
          },
          {
            path: ':id',
            loadComponent: () => import('@features/equipment/components/equipment-detail/equipment-detail.component')
              .then(m => m.EquipmentDetailComponent),
            title: 'Equipment Details - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'inventory',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/inventory/components/inventory-list/inventory-list.component')
              .then(m => m.InventoryListComponent),
            title: 'Inventory - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'maintenance',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/maintenance/components/maintenance-list/maintenance-list.component')
              .then(m => m.MaintenanceListComponent),
            title: 'Maintenance - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'vendors',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/vendors/components/vendor-list/vendor-list.component')
              .then(m => m.VendorListComponent),
            title: 'Vendors - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'reports',
        loadComponent: () => import('@features/reports/components/reports/reports.component')
          .then(m => m.ReportsComponent),
        title: 'Reports - GoEMR Inventory'
      },
      {
        path: 'compliance',
        loadComponent: () => import('@features/compliance/components/compliance-dashboard/compliance-dashboard.component')
          .then(m => m.ComplianceDashboardComponent),
        title: 'Compliance Center - GoEMR Inventory'
      },
      {
        path: 'audit-trail',
        loadComponent: () => import('@features/audit-trail/components/audit-trail/audit-trail.component')
          .then(m => m.AuditTrailComponent),
        title: 'Audit Trail - GoEMR Inventory'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
