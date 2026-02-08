import { Routes } from '@angular/router';

export const PURCHASE_ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/po-list/po-list.component').then(m => m.PoListComponent)
  },
  {
    path: 'auto-po',
    loadComponent: () => import('./components/auto-po-dashboard/auto-po-dashboard.component').then(m => m.AutoPoDashboardComponent)
  },
  {
    path: 'auto-po/rules',
    loadComponent: () => import('./components/auto-po-rules/auto-po-rules.component').then(m => m.AutoPoRulesComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/po-detail/po-detail.component').then(m => m.PoDetailComponent)
  }
];
