import { Routes } from '@angular/router';

export const DEPRECIATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/depreciation-dashboard/depreciation-dashboard.component')
      .then(m => m.DepreciationDashboardComponent)
  },
  {
    path: 'configure',
    loadComponent: () => import('./components/depreciation-config/depreciation-config.component')
      .then(m => m.DepreciationConfigComponent)
  },
  {
    path: 'configure/:id',
    loadComponent: () => import('./components/depreciation-config/depreciation-config.component')
      .then(m => m.DepreciationConfigComponent)
  },
  {
    path: 'schedule/:id',
    loadComponent: () => import('./components/depreciation-schedule/depreciation-schedule.component')
      .then(m => m.DepreciationScheduleComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./components/depreciation-reports/depreciation-reports.component')
      .then(m => m.DepreciationReportsComponent)
  }
];
