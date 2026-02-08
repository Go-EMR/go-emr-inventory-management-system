import { Routes } from '@angular/router';

export const HELPDESK_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/ticket-dashboard/ticket-dashboard.component')
      .then(m => m.TicketDashboardComponent)
  },
  {
    path: 'list',
    loadComponent: () => import('./components/ticket-list/ticket-list.component')
      .then(m => m.TicketListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/ticket-create/ticket-create.component')
      .then(m => m.TicketCreateComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/ticket-detail/ticket-detail.component')
      .then(m => m.TicketDetailComponent)
  }
];
