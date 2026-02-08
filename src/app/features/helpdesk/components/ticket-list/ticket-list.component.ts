import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuModule } from 'primeng/menu';
import { HelpdeskService } from '@core/services/helpdesk.service';
import { AuthService } from '@core/services/auth.service';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  SLAStatus
} from '@shared/models';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    MenuModule
  ],
  template: `
    <div class="ticket-list-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Tickets</h1>
          <p>Manage and track all support tickets</p>
        </div>
        <div class="header-actions">
          <button pButton
            label="Create Ticket"
            icon="pi pi-plus"
            [routerLink]="['/helpdesk/create']"
            class="p-button-primary"
          ></button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-row">
          <p-iconfield class="search-field">
            <p-inputicon styleClass="pi pi-search" />
            <input
              pInputText
              type="text"
              placeholder="Search tickets..."
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
            />
          </p-iconfield>

          <p-select
            [options]="statusOptions"
            [(ngModel)]="selectedStatus"
            placeholder="All Statuses"
            [showClear]="true"
            (onChange)="applyFilters()"
            styleClass="filter-select"
          />

          <p-select
            [options]="priorityOptions"
            [(ngModel)]="selectedPriority"
            placeholder="All Priorities"
            [showClear]="true"
            (onChange)="applyFilters()"
            styleClass="filter-select"
          />

          <p-select
            [options]="categoryOptions"
            [(ngModel)]="selectedCategory"
            placeholder="All Categories"
            [showClear]="true"
            (onChange)="applyFilters()"
            styleClass="filter-select"
          />

          <button pButton
            icon="pi pi-filter-slash"
            class="p-button-outlined p-button-secondary"
            (click)="clearFilters()"
            pTooltip="Clear Filters"
          ></button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-container">
        <p-table
          [value]="helpdeskService.tickets()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [loading]="helpdeskService.loading()"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} tickets"
          styleClass="p-datatable-sm p-datatable-gridlines"
          [globalFilterFields]="['ticketNumber', 'subject', 'requesterName']"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="ticketNumber" style="width: 140px">
                Ticket <p-sortIcon field="ticketNumber" />
              </th>
              <th pSortableColumn="subject">
                Subject <p-sortIcon field="subject" />
              </th>
              <th pSortableColumn="requesterName" style="width: 160px">
                Requester <p-sortIcon field="requesterName" />
              </th>
              <th pSortableColumn="category" style="width: 160px">
                Category <p-sortIcon field="category" />
              </th>
              <th pSortableColumn="priority" style="width: 100px">
                Priority <p-sortIcon field="priority" />
              </th>
              <th pSortableColumn="status" style="width: 120px">
                Status <p-sortIcon field="status" />
              </th>
              <th style="width: 100px">SLA</th>
              <th pSortableColumn="assignedToName" style="width: 140px">
                Assignee <p-sortIcon field="assignedToName" />
              </th>
              <th pSortableColumn="createdAt" style="width: 140px">
                Created <p-sortIcon field="createdAt" />
              </th>
              <th style="width: 60px"></th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-ticket>
            <tr>
              <td>
                <a [routerLink]="['/helpdesk', ticket.id]" class="ticket-number-link">
                  {{ ticket.ticketNumber }}
                </a>
              </td>
              <td>
                <div class="subject-cell">
                  <span class="subject-text">{{ ticket.subject }}</span>
                  @if (ticket.relatedEquipmentName) {
                    <span class="related-item">
                      <i class="pi pi-box"></i> {{ ticket.relatedEquipmentName }}
                    </span>
                  }
                  @if (ticket.relatedInventoryItemName) {
                    <span class="related-item">
                      <i class="pi pi-database"></i> {{ ticket.relatedInventoryItemName }}
                    </span>
                  }
                </div>
              </td>
              <td>{{ ticket.requesterName }}</td>
              <td>
                <span class="category-badge" [attr.data-category]="getCategoryKey(ticket.category)">
                  {{ ticket.category }}
                </span>
              </td>
              <td>
                <p-tag [value]="ticket.priority" [severity]="getPrioritySeverity(ticket.priority)" />
              </td>
              <td>
                <p-tag [value]="ticket.status" [severity]="getStatusSeverity(ticket.status)" />
              </td>
              <td>
                <p-tag
                  [value]="getSLALabel(ticket)"
                  [severity]="getSLASeverity(ticket)"
                  [pTooltip]="getSLATooltip(ticket)"
                />
              </td>
              <td>
                @if (ticket.assignedToName) {
                  <div class="assignee-cell">
                    <span class="assignee-avatar">{{ getInitials(ticket.assignedToName) }}</span>
                    <span class="assignee-name">{{ ticket.assignedToName }}</span>
                  </div>
                } @else {
                  <span class="unassigned">Unassigned</span>
                }
              </td>
              <td>
                <span class="date-cell">{{ ticket.createdAt | date:'MMM d, y' }}</span>
              </td>
              <td>
                <button
                  pButton
                  icon="pi pi-ellipsis-v"
                  class="p-button-text p-button-sm"
                  (click)="openMenu($event, ticket)"
                ></button>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="10" class="empty-message">
                <div class="empty-state">
                  <i class="pi pi-inbox"></i>
                  <h3>No tickets found</h3>
                  <p>Try adjusting your filters or create a new ticket.</p>
                  <button pButton
                    label="Create Ticket"
                    icon="pi pi-plus"
                    [routerLink]="['/helpdesk/create']"
                  ></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <p-menu #menu [model]="menuItems" [popup]="true" />
    </div>
  `,
  styles: [`
    .ticket-list-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-content h1 {
      margin: 0 0 0.25rem 0;
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .header-content p {
      margin: 0;
      color: var(--text-muted);
    }

    .filters-section {
      background: var(--bg-card);
      padding: 1rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
    }

    .filters-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-field {
      flex: 1;
      min-width: 200px;
    }

    :host ::ng-deep .filter-select {
      min-width: 150px;
    }

    .table-container {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .ticket-number-link {
      font-weight: 600;
      color: var(--primary-600);
      text-decoration: none;
    }

    .ticket-number-link:hover {
      text-decoration: underline;
    }

    .subject-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .subject-text {
      font-weight: 500;
      color: var(--text-primary);
    }

    .related-item {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .related-item i {
      font-size: 0.625rem;
    }

    .category-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 500;
      background: var(--bg-secondary);
      color: var(--text-secondary);
    }

    .category-badge[data-category="equipment"] {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .category-badge[data-category="inventory"] {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .category-badge[data-category="maintenance"] {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .category-badge[data-category="it"] {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
    }

    .assignee-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .assignee-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.625rem;
      font-weight: 600;
    }

    .assignee-name {
      font-size: 0.875rem;
      color: var(--text-primary);
    }

    .unassigned {
      font-size: 0.875rem;
      color: var(--text-muted);
      font-style: italic;
    }

    .date-cell {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
    }

    .empty-state i {
      font-size: 3rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
    }

    .empty-state p {
      margin: 0 0 1.5rem 0;
      color: var(--text-muted);
    }
  `]
})
export class TicketListComponent implements OnInit {
  helpdeskService = inject(HelpdeskService);
  authService = inject(AuthService);

  searchQuery = '';
  selectedStatus: TicketStatus | null = null;
  selectedPriority: TicketPriority | null = null;
  selectedCategory: TicketCategory | null = null;

  statusOptions = Object.values(TicketStatus).map(s => ({ label: s, value: s }));
  priorityOptions = Object.values(TicketPriority).map(p => ({ label: p, value: p }));
  categoryOptions = Object.values(TicketCategory).map(c => ({ label: c, value: c }));

  menuItems: MenuItem[] = [];
  selectedTicket: Ticket | null = null;

  private searchTimeout: any;

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    const filter: any = {};
    if (this.searchQuery) filter.search = this.searchQuery;
    if (this.selectedStatus) filter.status = [this.selectedStatus];
    if (this.selectedPriority) filter.priority = [this.selectedPriority];
    if (this.selectedCategory) filter.category = [this.selectedCategory];

    this.helpdeskService.listTickets(filter).subscribe();
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadTickets();
    }, 300);
  }

  applyFilters(): void {
    this.loadTickets();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.selectedPriority = null;
    this.selectedCategory = null;
    this.loadTickets();
  }

  openMenu(event: Event, ticket: Ticket): void {
    this.selectedTicket = ticket;
    this.menuItems = [
      {
        label: 'View Details',
        icon: 'pi pi-eye',
        routerLink: ['/helpdesk', ticket.id]
      },
      {
        label: 'Edit Ticket',
        icon: 'pi pi-pencil',
        command: () => this.editTicket(ticket)
      },
      { separator: true },
      {
        label: 'Assign',
        icon: 'pi pi-user-plus',
        command: () => this.assignTicket(ticket),
        visible: !ticket.assignedToId
      },
      {
        label: 'Change Status',
        icon: 'pi pi-refresh',
        items: [
          { label: 'Open', command: () => this.changeStatus(ticket, TicketStatus.OPEN) },
          { label: 'In Progress', command: () => this.changeStatus(ticket, TicketStatus.IN_PROGRESS) },
          { label: 'Pending', command: () => this.changeStatus(ticket, TicketStatus.PENDING) },
          { label: 'Resolved', command: () => this.changeStatus(ticket, TicketStatus.RESOLVED) },
          { label: 'Closed', command: () => this.changeStatus(ticket, TicketStatus.CLOSED) }
        ]
      }
    ];
  }

  editTicket(ticket: Ticket): void {
    // Navigate to edit or open dialog
  }

  assignTicket(ticket: Ticket): void {
    // Open assignment dialog
  }

  changeStatus(ticket: Ticket, status: TicketStatus): void {
    this.helpdeskService.updateTicket(ticket.id, { status }).subscribe();
  }

  getPrioritySeverity(priority: TicketPriority): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (priority) {
      case TicketPriority.LOW: return 'success';
      case TicketPriority.MEDIUM: return 'info';
      case TicketPriority.HIGH: return 'warn';
      case TicketPriority.URGENT: return 'danger';
      default: return 'secondary';
    }
  }

  getStatusSeverity(status: TicketStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case TicketStatus.OPEN: return 'info';
      case TicketStatus.IN_PROGRESS: return 'warn';
      case TicketStatus.PENDING: return 'secondary';
      case TicketStatus.RESOLVED: return 'success';
      case TicketStatus.CLOSED: return 'secondary';
      default: return 'secondary';
    }
  }

  getSLALabel(ticket: Ticket): string {
    if (ticket.slaResponseStatus === SLAStatus.BREACHED || ticket.slaResolutionStatus === SLAStatus.BREACHED) {
      return 'Breached';
    }
    if (ticket.slaResponseStatus === SLAStatus.AT_RISK || ticket.slaResolutionStatus === SLAStatus.AT_RISK) {
      return 'At Risk';
    }
    return 'On Track';
  }

  getSLASeverity(ticket: Ticket): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    if (ticket.slaResponseStatus === SLAStatus.BREACHED || ticket.slaResolutionStatus === SLAStatus.BREACHED) {
      return 'danger';
    }
    if (ticket.slaResponseStatus === SLAStatus.AT_RISK || ticket.slaResolutionStatus === SLAStatus.AT_RISK) {
      return 'warn';
    }
    return 'success';
  }

  getSLATooltip(ticket: Ticket): string {
    return `Response: ${ticket.slaResponseStatus}, Resolution: ${ticket.slaResolutionStatus}`;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getCategoryKey(category: TicketCategory): string {
    switch (category) {
      case TicketCategory.EQUIPMENT_ISSUE: return 'equipment';
      case TicketCategory.INVENTORY_REQUEST: return 'inventory';
      case TicketCategory.MAINTENANCE_REQUEST: return 'maintenance';
      case TicketCategory.IT_SUPPORT: return 'it';
      default: return 'general';
    }
  }
}
