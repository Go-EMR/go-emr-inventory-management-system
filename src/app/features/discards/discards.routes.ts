import { Routes } from '@angular/router';

export const DISCARDS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/discard-list/discard-list.component').then(
        (m) => m.DiscardListComponent
      ),
    title: 'Discard Management'
  },
  {
    path: 'alerts',
    loadComponent: () =>
      import('./components/expiration-alerts/expiration-alerts.component').then(
        (m) => m.ExpirationAlertsComponent
      ),
    title: 'Expiration Alerts'
  },
  {
    path: 'report',
    loadComponent: () =>
      import('./components/waste-report/waste-report.component').then(
        (m) => m.WasteReportComponent
      ),
    title: 'Waste Report'
  }
];
