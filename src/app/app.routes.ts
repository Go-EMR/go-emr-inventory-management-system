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
          },
          {
            path: 'performance',
            loadComponent: () => import('@features/vendors/components/vendor-performance/vendor-performance.component')
              .then(m => m.VendorPerformanceComponent),
            title: 'Vendor Performance - GoEMR Inventory'
          },
          {
            path: 'performance/:id',
            loadComponent: () => import('@features/vendors/components/vendor-scorecard/vendor-scorecard.component')
              .then(m => m.VendorScorecardComponent),
            title: 'Vendor Scorecard - GoEMR Inventory'
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
      },
      // New Feature Routes
      {
        path: 'tags',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/tags/components/tag-manager/tag-manager.component')
              .then(m => m.TagManagerComponent),
            title: 'Tags - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'scanning',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/scanning/components/scanner/scanner.component')
              .then(m => m.ScannerComponent),
            title: 'Barcode Scanner - GoEMR Inventory'
          },
          {
            path: 'receive',
            loadComponent: () => import('@features/scanning/components/scan-receive/scan-receive.component')
              .then(m => m.ScanReceiveComponent),
            title: 'Scan Receive - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'labels',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/labels/components/label-generator/label-generator.component')
              .then(m => m.LabelGeneratorComponent),
            title: 'Label Generator - GoEMR Inventory'
          },
          {
            path: 'templates',
            loadComponent: () => import('@features/labels/components/label-templates/label-templates.component')
              .then(m => m.LabelTemplatesComponent),
            title: 'Label Templates - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'alerts',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/alerts/components/alert-dashboard/alert-dashboard.component')
              .then(m => m.AlertDashboardComponent),
            title: 'Date Alerts - GoEMR Inventory'
          },
          {
            path: 'config',
            loadComponent: () => import('@features/alerts/components/alert-config/alert-config.component')
              .then(m => m.AlertConfigComponent),
            title: 'Alert Configuration - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'checkouts',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/checkouts/components/checkout-list/checkout-list.component')
              .then(m => m.CheckoutListComponent),
            title: 'Checkouts - GoEMR Inventory'
          },
          {
            path: 'overdue',
            loadComponent: () => import('@features/checkouts/components/overdue-dashboard/overdue-dashboard.component')
              .then(m => m.OverdueDashboardComponent),
            title: 'Overdue Checkouts - GoEMR Inventory'
          },
          {
            path: ':id',
            loadComponent: () => import('@features/checkouts/components/checkout-detail/checkout-detail.component')
              .then(m => m.CheckoutDetailComponent),
            title: 'Checkout Details - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'pick-lists',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/pick-lists/components/pick-list-list/pick-list-list.component')
              .then(m => m.PickListListComponent),
            title: 'Pick Lists - GoEMR Inventory'
          },
          {
            path: 'new',
            loadComponent: () => import('@features/pick-lists/components/pick-list-create/pick-list-create.component')
              .then(m => m.PickListCreateComponent),
            title: 'Create Pick List - GoEMR Inventory'
          },
          {
            path: ':id',
            loadComponent: () => import('@features/pick-lists/components/pick-list-detail/pick-list-detail.component')
              .then(m => m.PickListDetailComponent),
            title: 'Pick List Details - GoEMR Inventory'
          },
          {
            path: ':id/pick',
            loadComponent: () => import('@features/pick-lists/components/picking-interface/picking-interface.component')
              .then(m => m.PickingInterfaceComponent),
            title: 'Picking - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'kits',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/kits/components/kit-list/kit-list.component')
              .then(m => m.KitListComponent),
            title: 'Procedure Kits - GoEMR Inventory'
          },
          {
            path: 'new',
            loadComponent: () => import('@features/kits/components/kit-editor/kit-editor.component')
              .then(m => m.KitEditorComponent),
            title: 'Create Kit - GoEMR Inventory'
          },
          {
            path: ':id',
            loadComponent: () => import('@features/kits/components/kit-detail/kit-detail.component')
              .then(m => m.KitDetailComponent),
            title: 'Kit Details - GoEMR Inventory'
          },
          {
            path: ':id/edit',
            loadComponent: () => import('@features/kits/components/kit-editor/kit-editor.component')
              .then(m => m.KitEditorComponent),
            title: 'Edit Kit - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'import-export',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/import-export/components/import-export-dashboard/import-export-dashboard.component')
              .then(m => m.ImportExportDashboardComponent),
            title: 'Import/Export - GoEMR Inventory'
          },
          {
            path: 'import',
            loadComponent: () => import('@features/import-export/components/import-wizard/import-wizard.component')
              .then(m => m.ImportWizardComponent),
            title: 'Import Data - GoEMR Inventory'
          },
          {
            path: 'export',
            loadComponent: () => import('@features/import-export/components/export-dialog/export-dialog.component')
              .then(m => m.ExportDialogComponent),
            title: 'Export Data - GoEMR Inventory'
          },
          {
            path: 'jobs',
            loadComponent: () => import('@features/import-export/components/job-history/job-history.component')
              .then(m => m.JobHistoryComponent),
            title: 'Import/Export History - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'integrations',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/integrations/components/integrations-dashboard/integrations-dashboard.component')
              .then(m => m.IntegrationsDashboardComponent),
            title: 'Integrations - GoEMR Inventory'
          },
          {
            path: 'webhooks',
            loadComponent: () => import('@features/integrations/components/webhook-manager/webhook-manager.component')
              .then(m => m.WebhookManagerComponent),
            title: 'Webhooks - GoEMR Inventory'
          },
          {
            path: 'webhooks/new',
            loadComponent: () => import('@features/integrations/components/webhook-editor/webhook-editor.component')
              .then(m => m.WebhookEditorComponent),
            title: 'Create Webhook - GoEMR Inventory'
          },
          {
            path: 'webhooks/:id',
            loadComponent: () => import('@features/integrations/components/webhook-detail/webhook-detail.component')
              .then(m => m.WebhookDetailComponent),
            title: 'Webhook Details - GoEMR Inventory'
          },
          {
            path: 'api-keys',
            loadComponent: () => import('@features/integrations/components/api-key-manager/api-key-manager.component')
              .then(m => m.ApiKeyManagerComponent),
            title: 'API Keys - GoEMR Inventory'
          },
          {
            path: 'docs',
            loadComponent: () => import('@features/integrations/components/api-docs/api-docs.component')
              .then(m => m.ApiDocsComponent),
            title: 'API Documentation - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'shipments',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/shipments/components/shipment-list/shipment-list.component')
              .then(m => m.ShipmentListComponent),
            title: 'Shipment Tracking - GoEMR Inventory'
          },
          {
            path: ':id',
            loadComponent: () => import('@features/shipments/components/shipment-detail/shipment-detail.component')
              .then(m => m.ShipmentDetailComponent),
            title: 'Shipment Details - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'returns',
        children: [
          {
            path: '',
            loadComponent: () => import('@features/shipments/components/return-list/return-list.component')
              .then(m => m.ReturnListComponent),
            title: 'Return Requests - GoEMR Inventory'
          }
        ]
      },
      {
        path: 'lot-barcodes',
        loadChildren: () => import('@features/lot-barcodes/lot-barcodes.routes')
          .then(m => m.LOT_BARCODES_ROUTES),
        title: 'Lot Barcodes - GoEMR Inventory'
      },
      {
        path: 'discards',
        loadChildren: () => import('@features/discards/discards.routes')
          .then(m => m.DISCARDS_ROUTES),
        title: 'Discard Management - GoEMR Inventory'
      },
      {
        path: 'purchase-orders',
        loadChildren: () => import('@features/purchase-orders/purchase-orders.routes')
          .then(m => m.PURCHASE_ORDERS_ROUTES),
        title: 'Purchase Orders - GoEMR Inventory'
      },
      {
        path: 'helpdesk',
        loadChildren: () => import('@features/helpdesk/helpdesk.routes')
          .then(m => m.HELPDESK_ROUTES),
        title: 'Help Desk - GoEMR Inventory'
      },
      {
        path: 'depreciation',
        loadChildren: () => import('@features/depreciation/depreciation.routes')
          .then(m => m.DEPRECIATION_ROUTES),
        title: 'Depreciation - GoEMR Inventory'
      },
      // Tenant Management Routes (within main layout)
      {
        path: 'tenant',
        loadChildren: () => import('@features/tenant/tenant.routes')
          .then(m => m.TENANT_ROUTES),
        title: 'Organization - GoEMR Inventory'
      },
      // Admin Routes (Super Admin only)
      {
        path: 'admin',
        loadChildren: () => import('@features/admin/admin.routes')
          .then(m => m.ADMIN_ROUTES),
        title: 'Admin - GoEMR Inventory'
      }
    ]
  },
  // Tenant selector (outside main layout)
  {
    path: 'tenant/select',
    loadComponent: () => import('@features/tenant/components/tenant-selector/tenant-selector.component')
      .then(m => m.TenantSelectorComponent),
    title: 'Select Organization - GoEMR Inventory'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
