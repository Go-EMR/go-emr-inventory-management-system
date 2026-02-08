import { Routes } from '@angular/router';

export const SHIPMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/shipment-list/shipment-list.component')
      .then(m => m.ShipmentListComponent),
    title: 'Shipment Tracking'
  },
  {
    path: ':id',
    loadComponent: () => import('./components/shipment-detail/shipment-detail.component')
      .then(m => m.ShipmentDetailComponent),
    title: 'Shipment Details'
  }
];
