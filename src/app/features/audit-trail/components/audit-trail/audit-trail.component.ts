import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { MessageService } from 'primeng/api';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import {
  AuditLog,
  AuditAction,
  AuditResourceType,
  UserRole
} from '@shared/models';

@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TooltipModule,
    DialogModule,
    ToastModule,
    DatePickerModule,
    IconFieldModule,
    InputIconModule,
    CardModule,
    AvatarModule
  ],
  providers: [MessageService],
  template: `
    <div class="audit-page">
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Audit Trail</h1>
            <p>Track and monitor all system activities and changes</p>
          </div>
          <div class="header-actions">
            @if (authService.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER])) {
              <button pButton label="Export Log" icon="pi pi-download" class="p-button-outlined"></button>
            }
          </div>
        </div>

        <!-- Stats Summary -->
        <div class="stats-row">
          <div class="stat-pill">
            <span class="stat-value">{{ auditLogs().length }}</span>
            <span class="stat-label">Total Events</span>
          </div>
          <div class="stat-pill stat-pill--success">
            <span class="stat-value">{{ successCount() }}</span>
            <span class="stat-label">Successful</span>
          </div>
          <div class="stat-pill stat-pill--danger">
            <span class="stat-value">{{ failureCount() }}</span>
            <span class="stat-label">Failed</span>
          </div>
          <div class="stat-pill stat-pill--info">
            <span class="stat-value">{{ todayCount() }}</span>
            <span class="stat-label">Today</span>
          </div>
        </div>
      </header>

      <!-- Filters Bar -->
      <div class="filters-bar">
        <div class="filters-left">
          <p-iconfield>
            <p-inputicon styleClass="pi pi-search"></p-inputicon>
            <input 
              type="text" 
              pInputText 
              [(ngModel)]="searchQuery"
              placeholder="Search audit logs..." 
              class="search-input" />
          </p-iconfield>
          
          <p-select 
            [options]="actionOptions" 
            [(ngModel)]="selectedAction"
            placeholder="All Actions"
            [showClear]="true"
            class="filter-select">
          </p-select>
          
          <p-select 
            [options]="resourceTypeOptions" 
            [(ngModel)]="selectedResourceType"
            placeholder="All Resources"
            [showClear]="true"
            class="filter-select">
          </p-select>
          
          <p-select 
            [options]="statusOptions" 
            [(ngModel)]="selectedStatus"
            placeholder="All Status"
            [showClear]="true"
            class="filter-select">
          </p-select>
          
          <p-datepicker 
            [(ngModel)]="dateRange"
            selectionMode="range"
            [showIcon]="true"
            placeholder="Date Range"
            dateFormat="mm/dd/yy"
            class="date-filter">
          </p-datepicker>
        </div>
        
        <div class="filters-right">
          <button 
            pButton 
            icon="pi pi-filter-slash" 
            class="p-button-text p-button-sm" 
            pTooltip="Clear all filters"
            (click)="clearFilters()">
          </button>
        </div>
      </div>

      <!-- Audit Logs Table -->
      <div class="table-card">
        <p-table 
          [value]="filteredAuditLogs()" 
          [paginator]="true" 
          [rows]="15"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} events"
          [rowsPerPageOptions]="[10, 15, 25, 50]"
          styleClass="p-datatable-sm"
          [globalFilterFields]="['userName', 'resourceName', 'description', 'action']"
          sortField="timestamp"
          [sortOrder]="-1">
          
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="timestamp" style="width: 160px">
                Timestamp <p-sortIcon field="timestamp"></p-sortIcon>
              </th>
              <th style="width: 180px">User</th>
              <th pSortableColumn="action" style="width: 120px">
                Action <p-sortIcon field="action"></p-sortIcon>
              </th>
              <th pSortableColumn="resourceType" style="width: 120px">
                Resource Type <p-sortIcon field="resourceType"></p-sortIcon>
              </th>
              <th>Description</th>
              <th style="width: 100px">Status</th>
              <th style="width: 80px">Details</th>
            </tr>
          </ng-template>
          
          <ng-template pTemplate="body" let-log>
            <tr>
              <td>
                <div class="timestamp-cell">
                  <span class="date">{{ formatDate(log.timestamp) }}</span>
                  <span class="time">{{ formatTime(log.timestamp) }}</span>
                </div>
              </td>
              <td>
                <div class="user-cell">
                  <p-avatar 
                    [label]="getInitials(log.userName)" 
                    [style]="{ 'background-color': getRoleColor(log.userRole), 'color': '#fff' }"
                    shape="circle">
                  </p-avatar>
                  <div class="user-info">
                    <span class="user-name">{{ log.userName }}</span>
                    <span class="user-role">{{ log.userRole }}</span>
                  </div>
                </div>
              </td>
              <td>
                <p-tag 
                  [value]="log.action" 
                  [severity]="getActionSeverity(log.action)"
                  [icon]="getActionIcon(log.action)">
                </p-tag>
              </td>
              <td>
                <div class="entity-cell">
                  <i [class]="getResourceIcon(log.resourceType)" class="entity-icon"></i>
                  <span>{{ log.resourceType }}</span>
                </div>
              </td>
              <td>
                <div class="description-cell">
                  <span class="entity-name">{{ log.resourceName }}</span>
                  <span class="description-text">{{ log.description }}</span>
                </div>
              </td>
              <td>
                <p-tag 
                  [value]="log.status" 
                  [severity]="getStatusSeverity(log.status)">
                </p-tag>
              </td>
              <td>
                <button 
                  pButton 
                  icon="pi pi-eye" 
                  class="p-button-text p-button-rounded p-button-sm"
                  pTooltip="View details"
                  (click)="viewDetails(log)">
                </button>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7">
                <div class="empty-state">
                  <i class="pi pi-history"></i>
                  <h3>No audit logs found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                  <button pButton label="Clear Filters" icon="pi pi-filter-slash" class="p-button-outlined" (click)="clearFilters()"></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Detail Dialog -->
      <p-dialog 
        header="Audit Log Details" 
        [(visible)]="showDetailDialog" 
        [modal]="true"
        [style]="{ width: '600px' }"
        [draggable]="false"
        [resizable]="false">
        @if (selectedLog) {
          <div class="detail-content">
            <!-- Header Info -->
            <div class="detail-header">
              <div class="detail-user">
                <p-avatar 
                  [label]="getInitials(selectedLog.userName)" 
                  [style]="{ 'background-color': getRoleColor(selectedLog.userRole), 'color': '#fff' }"
                  size="large"
                  shape="circle">
                </p-avatar>
                <div class="detail-user-info">
                  <span class="detail-user-name">{{ selectedLog.userName }}</span>
                  <span class="detail-user-role">{{ selectedLog.userRole }}</span>
                </div>
              </div>
              <p-tag 
                [value]="selectedLog.status" 
                [severity]="getStatusSeverity(selectedLog.status)">
              </p-tag>
            </div>

            <!-- Info Grid -->
            <div class="detail-grid">
              <div class="detail-item">
                <label>Timestamp</label>
                <span>{{ formatDateTime(selectedLog.timestamp) }}</span>
              </div>
              <div class="detail-item">
                <label>Action</label>
                <p-tag [value]="selectedLog.action" [severity]="getActionSeverity(selectedLog.action)"></p-tag>
              </div>
              <div class="detail-item">
                <label>Resource Type</label>
                <span><i [class]="getResourceIcon(selectedLog.resourceType)"></i> {{ selectedLog.resourceType }}</span>
              </div>
              <div class="detail-item">
                <label>Resource ID</label>
                <code>{{ selectedLog.resourceId }}</code>
              </div>
              <div class="detail-item full-width">
                <label>Resource Name</label>
                <span>{{ selectedLog.resourceName }}</span>
              </div>
              <div class="detail-item full-width">
                <label>Description</label>
                <span>{{ selectedLog.description }}</span>
              </div>
              <div class="detail-item">
                <label>IP Address</label>
                <code>{{ selectedLog.ipAddress }}</code>
              </div>
              <div class="detail-item">
                <label>Session ID</label>
                <code>{{ selectedLog.sessionId }}</code>
              </div>
            </div>

            <!-- Changes Section -->
            @if (selectedLog.changes && selectedLog.changes.length > 0) {
              <div class="changes-section">
                <h4><i class="pi pi-pencil"></i> Changes Made</h4>
                <div class="changes-list">
                  @for (change of selectedLog.changes; track change.field) {
                    <div class="change-item">
                      <span class="change-field">{{ change.fieldLabel }}</span>
                      <div class="change-values">
                        <span class="old-value">
                          <i class="pi pi-minus-circle"></i>
                          {{ change.oldValue || '(empty)' }}
                        </span>
                        <i class="pi pi-arrow-right change-arrow"></i>
                        <span class="new-value">
                          <i class="pi pi-plus-circle"></i>
                          {{ change.newValue || '(empty)' }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Metadata Section -->
            @if (selectedLog.metadata) {
              <div class="metadata-section">
                <h4><i class="pi pi-info-circle"></i> Additional Information</h4>
                <div class="metadata-grid">
                  @for (item of getMetadataEntries(selectedLog.metadata); track item.key) {
                    <div class="metadata-item">
                      <label>{{ item.key }}</label>
                      <span>{{ item.value }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
        <ng-template pTemplate="footer">
          <button pButton label="Close" class="p-button-text" (click)="showDetailDialog = false"></button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .audit-page {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    /* Page Header */
    .page-header {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .header-text h1 {
      font-family: var(--font-display);
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 var(--space-1) 0;
    }

    .header-text p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: var(--space-3);
    }

    /* Stats Row */
    .stats-row {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .stat-pill {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
    }

    .stat-pill .stat-value {
      font-family: var(--font-display);
      font-weight: 700;
      font-size: var(--text-lg);
      color: var(--text-primary);
    }

    .stat-pill .stat-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .stat-pill--success .stat-value { color: var(--primary-600); }
    .stat-pill--warning .stat-value { color: var(--warning-600); }
    .stat-pill--danger .stat-value { color: var(--alert-600); }
    .stat-pill--info .stat-value { color: var(--secondary-600); }

    /* Filters Bar */
    .filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .filters-left {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
      flex: 1;
    }

    .search-input {
      min-width: 250px;
    }

    .filter-select {
      min-width: 150px;
    }

    .date-filter {
      min-width: 200px;
    }

    /* Table Card */
    .table-card {
      background: var(--surface-card);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    /* Table Cells */
    .timestamp-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .timestamp-cell .date {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-primary);
    }

    .timestamp-cell .time {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-primary);
    }

    .user-role {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .entity-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .entity-icon {
      color: var(--text-tertiary);
      font-size: var(--text-sm);
    }

    .description-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .entity-name {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-primary);
    }

    .description-text {
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-12);
      text-align: center;
    }

    .empty-state i {
      font-size: 3rem;
      color: var(--text-muted);
      margin-bottom: var(--space-4);
    }

    .empty-state h3 {
      font-size: var(--text-lg);
      color: var(--text-primary);
      margin: 0 0 var(--space-2) 0;
    }

    .empty-state p {
      color: var(--text-secondary);
      margin: 0 0 var(--space-4) 0;
    }

    /* Detail Dialog */
    .detail-content {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--border-color);
    }

    .detail-user {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .detail-user-info {
      display: flex;
      flex-direction: column;
    }

    .detail-user-name {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--text-primary);
    }

    .detail-user-role {
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .detail-item.full-width {
      grid-column: span 2;
    }

    .detail-item label {
      font-size: var(--text-xs);
      font-weight: 500;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .detail-item span {
      font-size: var(--text-sm);
      color: var(--text-primary);
    }

    .detail-item code {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      background: var(--surface-ground);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
    }

    .detail-item i {
      margin-right: var(--space-1);
      color: var(--text-tertiary);
    }

    /* Changes Section */
    .changes-section {
      background: var(--surface-ground);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .changes-section h4 {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--space-3) 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .changes-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .change-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .change-field {
      font-size: var(--text-xs);
      font-weight: 500;
      color: var(--text-secondary);
    }

    .change-values {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .old-value {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-sm);
      color: var(--alert-600);
      background: var(--alert-50);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
    }

    .new-value {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-sm);
      color: var(--primary-600);
      background: var(--primary-50);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
    }

    .change-arrow {
      color: var(--text-muted);
      font-size: var(--text-xs);
    }

    /* Metadata Section */
    .metadata-section {
      background: var(--surface-ground);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .metadata-section h4 {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--space-3) 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-3);
    }

    .metadata-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .metadata-item label {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      text-transform: capitalize;
    }

    .metadata-item span {
      font-size: var(--text-sm);
      color: var(--text-primary);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .filters-left {
        flex-direction: column;
      }
      
      .search-input, .filter-select, .date-filter {
        width: 100%;
        min-width: unset;
      }

      .detail-grid {
        grid-template-columns: 1fr;
      }

      .detail-item.full-width {
        grid-column: span 1;
      }
    }
  `]
})
export class AuditTrailComponent {
  mockDataService = inject(MockDataService);
  authService = inject(AuthService);
  messageService = inject(MessageService);

  // Expose enum for template use
  UserRole = UserRole;

  auditLogs = this.mockDataService.auditLogs;
  
  searchQuery = '';
  selectedAction: AuditAction | null = null;
  selectedResourceType: AuditResourceType | null = null;
  selectedStatus: string | null = null;
  dateRange: Date[] | null = null;
  showDetailDialog = false;
  selectedLog: AuditLog | null = null;

  actionOptions = Object.values(AuditAction).map(a => ({ label: a, value: a }));
  resourceTypeOptions = Object.values(AuditResourceType).map(e => ({ label: e, value: e }));
  statusOptions = [
    { label: 'Success', value: 'Success' },
    { label: 'Failed', value: 'Failed' },
    { label: 'Blocked', value: 'Blocked' }
  ];

  filteredAuditLogs = computed(() => {
    let result = this.auditLogs();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(log => 
        log.userName.toLowerCase().includes(query) ||
        log.resourceName.toLowerCase().includes(query) ||
        log.description.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query)
      );
    }

    if (this.selectedAction) {
      result = result.filter(log => log.action === this.selectedAction);
    }

    if (this.selectedResourceType) {
      result = result.filter(log => log.resourceType === this.selectedResourceType);
    }

    if (this.selectedStatus) {
      result = result.filter(log => log.status === this.selectedStatus);
    }

    if (this.dateRange && this.dateRange[0]) {
      const startDate = this.dateRange[0];
      const endDate = this.dateRange[1] || new Date();
      result = result.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= startDate && logDate <= endDate;
      });
    }

    return result;
  });

  successCount = computed(() => 
    this.auditLogs().filter(log => log.status === 'Success').length
  );

  failureCount = computed(() => 
    this.auditLogs().filter(log => log.status === 'Failed').length
  );

  todayCount = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.auditLogs().filter(log => {
      const logDate = new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === today.getTime();
    }).length;
  });

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedAction = null;
    this.selectedResourceType = null;
    this.selectedStatus = null;
    this.dateRange = null;
  }

  viewDetails(log: AuditLog): void {
    this.selectedLog = log;
    this.showDetailDialog = true;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      'Admin': '#7c3aed',
      'Manager': '#0284c7',
      'Technician': '#059669',
      'Viewer': '#6b7280'
    };
    return colors[role] || '#6b7280';
  }

  getActionSeverity(action: AuditAction): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const successActions = [AuditAction.CREATE, AuditAction.IMPORT, AuditAction.APPROVE, AuditAction.COMPLETE, AuditAction.CONSENT_GRANTED, AuditAction.RESTORE];
    const dangerActions = [AuditAction.DELETE, AuditAction.REJECT, AuditAction.LOGIN_FAILED, AuditAction.CONSENT_REVOKED, AuditAction.BREACH_REPORTED];
    const warnActions = [AuditAction.UPDATE, AuditAction.CANCEL, AuditAction.TRANSFER, AuditAction.PERMISSION_CHANGE, AuditAction.SYSTEM_CONFIG_CHANGE];
    const secondaryActions = [AuditAction.LOGOUT, AuditAction.ARCHIVE];

    if (successActions.includes(action)) return 'success';
    if (dangerActions.includes(action)) return 'danger';
    if (warnActions.includes(action)) return 'warn';
    if (secondaryActions.includes(action)) return 'secondary';
    return 'info';
  }

  getActionIcon(action: AuditAction): string {
    const icons: Record<string, string> = {
      [AuditAction.CREATE]: 'pi pi-plus',
      [AuditAction.READ]: 'pi pi-eye',
      [AuditAction.UPDATE]: 'pi pi-pencil',
      [AuditAction.DELETE]: 'pi pi-trash',
      [AuditAction.LOGIN]: 'pi pi-sign-in',
      [AuditAction.LOGOUT]: 'pi pi-sign-out',
      [AuditAction.EXPORT]: 'pi pi-download',
      [AuditAction.IMPORT]: 'pi pi-upload',
      [AuditAction.PRINT]: 'pi pi-print',
      [AuditAction.APPROVE]: 'pi pi-check',
      [AuditAction.REJECT]: 'pi pi-times',
      [AuditAction.SUBMIT]: 'pi pi-send',
      [AuditAction.CANCEL]: 'pi pi-ban',
      [AuditAction.COMPLETE]: 'pi pi-check-circle',
      [AuditAction.SCHEDULE]: 'pi pi-calendar',
      [AuditAction.ASSIGN]: 'pi pi-user-plus',
      [AuditAction.TRANSFER]: 'pi pi-arrows-h',
      [AuditAction.ARCHIVE]: 'pi pi-box',
      [AuditAction.RESTORE]: 'pi pi-replay',
      [AuditAction.LOGIN_FAILED]: 'pi pi-exclamation-triangle',
      [AuditAction.PASSWORD_CHANGE]: 'pi pi-key',
      [AuditAction.PERMISSION_CHANGE]: 'pi pi-lock',
      [AuditAction.CONSENT_GRANTED]: 'pi pi-check-square',
      [AuditAction.CONSENT_REVOKED]: 'pi pi-minus-circle',
      [AuditAction.DATA_ACCESS_REQUEST]: 'pi pi-database',
      [AuditAction.DATA_DELETION_REQUEST]: 'pi pi-trash',
      [AuditAction.DATA_EXPORT_REQUEST]: 'pi pi-file-export',
      [AuditAction.BREACH_REPORTED]: 'pi pi-shield',
      [AuditAction.SYSTEM_CONFIG_CHANGE]: 'pi pi-cog'
    };
    return icons[action] || 'pi pi-circle';
  }

  getResourceIcon(resourceType: AuditResourceType): string {
    const icons: Record<string, string> = {
      [AuditResourceType.EQUIPMENT]: 'pi pi-server',
      [AuditResourceType.INVENTORY]: 'pi pi-box',
      [AuditResourceType.MAINTENANCE]: 'pi pi-wrench',
      [AuditResourceType.VENDOR]: 'pi pi-building',
      [AuditResourceType.USER]: 'pi pi-user',
      [AuditResourceType.PATIENT]: 'pi pi-id-card',
      [AuditResourceType.HEALTH_RECORD]: 'pi pi-file',
      [AuditResourceType.CONSENT]: 'pi pi-check-square',
      [AuditResourceType.REPORT]: 'pi pi-chart-bar',
      [AuditResourceType.SYSTEM_CONFIG]: 'pi pi-cog',
      [AuditResourceType.COMPLIANCE_CONFIG]: 'pi pi-shield',
      [AuditResourceType.SYSTEM]: 'pi pi-desktop',
      [AuditResourceType.ALERT]: 'pi pi-bell',
      [AuditResourceType.COMPLIANCE]: 'pi pi-verified'
    };
    return icons[resourceType] || 'pi pi-circle';
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      'Success': 'success',
      'Failed': 'danger',
      'Blocked': 'warn'
    };
    return map[status] || 'info';
  }

  getMetadataEntries(metadata: Record<string, any>): { key: string; value: any }[] {
    return Object.entries(metadata).map(([key, value]) => ({ key, value }));
  }
}
