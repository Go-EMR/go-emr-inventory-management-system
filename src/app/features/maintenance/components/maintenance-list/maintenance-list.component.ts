import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';
import { CalendarModule } from 'primeng/calendar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService } from 'primeng/api';
import { MockDataService } from '@core/services/mock-data.service';
import { AuthService } from '@core/services/auth.service';
import {
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceType,
  Equipment,
  UserRole
} from '@shared/models';

@Component({
  selector: 'app-maintenance-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TooltipModule,
    DialogModule,
    ToastModule,
    TabsModule,
    CalendarModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService],
  template: `
    <div class="maintenance-page">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Maintenance Management</h1>
            <p>Schedule and track equipment maintenance activities</p>
          </div>
          <div class="header-actions">
            @if (authService.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN])) {
              <button pButton label="Export" icon="pi pi-download" class="p-button-outlined"></button>
              <button pButton label="Schedule Maintenance" icon="pi pi-plus" class="p-button-primary" (click)="showScheduleDialog = true"></button>
            }
          </div>
        </div>

        <!-- Stats Summary -->
        <div class="stats-row">
          <div class="stat-pill">
            <span class="stat-value">{{ maintenance().length }}</span>
            <span class="stat-label">Total Records</span>
          </div>
          <div class="stat-pill stat-pill--info">
            <span class="stat-value">{{ scheduledCount() }}</span>
            <span class="stat-label">Scheduled</span>
          </div>
          <div class="stat-pill stat-pill--warning">
            <span class="stat-value">{{ inProgressCount() }}</span>
            <span class="stat-label">In Progress</span>
          </div>
          <div class="stat-pill stat-pill--danger">
            <span class="stat-value">{{ overdueCount() }}</span>
            <span class="stat-label">Overdue</span>
          </div>
          <div class="stat-pill stat-pill--success">
            <span class="stat-value">{{ completedCount() }}</span>
            <span class="stat-label">Completed</span>
          </div>
        </div>
      </header>

      <!-- View Tabs -->
      <p-tabs [(value)]="activeTab">
        <p-tablist>
          <p-tab value="list">
            <i class="pi pi-list"></i>
            List View
          </p-tab>
          <p-tab value="calendar">
            <i class="pi pi-calendar"></i>
            Calendar View
          </p-tab>
        </p-tablist>

        <p-tabpanels>
          <!-- List View -->
          <p-tabpanel value="list">
            <!-- Filters Bar -->
            <div class="filters-bar">
              <div class="filters-left">
                <p-iconfield>
                  <p-inputicon styleClass="pi pi-search"></p-inputicon>
                  <input 
                    type="text" 
                    pInputText 
                    placeholder="Search maintenance records..." 
                    [(ngModel)]="searchQuery"
                    class="search-input" />
                </p-iconfield>
              </div>
              
              <div class="filters-right">
                <p-select 
                  [options]="typeOptions" 
                  [(ngModel)]="selectedType" 
                  placeholder="Type"
                  [showClear]="true">
                </p-select>

                <p-select 
                  [options]="statusOptions" 
                  [(ngModel)]="selectedStatus" 
                  placeholder="Status"
                  [showClear]="true">
                </p-select>

                <button 
                  pButton 
                  icon="pi pi-filter-slash" 
                  class="p-button-outlined p-button-secondary"
                  pTooltip="Clear filters"
                  (click)="clearFilters()">
                </button>
              </div>
            </div>

            <!-- Data Table -->
            <div class="table-container">
              <p-table
                [value]="filteredMaintenance()"
                [rows]="10"
                [paginator]="true"
                [rowsPerPageOptions]="[10, 25, 50]"
                [showCurrentPageReport]="true"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                styleClass="p-datatable-sm"
                responsiveLayout="scroll"
                [rowHover]="true">
                
                <ng-template pTemplate="header">
                  <tr>
                    <th pSortableColumn="scheduledDate" style="min-width: 120px">
                      Date <p-sortIcon field="scheduledDate"></p-sortIcon>
                    </th>
                    <th style="min-width: 200px">Equipment</th>
                    <th pSortableColumn="type" style="min-width: 140px">
                      Type <p-sortIcon field="type"></p-sortIcon>
                    </th>
                    <th style="min-width: 200px">Description</th>
                    <th pSortableColumn="technician" style="min-width: 140px">
                      Technician <p-sortIcon field="technician"></p-sortIcon>
                    </th>
                    <th pSortableColumn="status" style="min-width: 120px">
                      Status <p-sortIcon field="status"></p-sortIcon>
                    </th>
                    <th pSortableColumn="cost" style="min-width: 100px">
                      Cost <p-sortIcon field="cost"></p-sortIcon>
                    </th>
                    <th style="width: 120px; text-align: center">Actions</th>
                  </tr>
                </ng-template>

                <ng-template pTemplate="body" let-record>
                  <tr [class.overdue-row]="record.status === 'Overdue'">
                    <td>
                      <div class="date-cell">
                        <span class="date-main">{{ formatDate(record.scheduledDate) }}</span>
                        @if (record.completedDate && record.status === 'Completed') {
                          <span class="date-completed">Completed: {{ formatDate(record.completedDate) }}</span>
                        }
                      </div>
                    </td>
                    <td>
                      <div class="equipment-cell">
                        <a [routerLink]="['/equipment', record.equipmentId]" class="equipment-name">
                          {{ getEquipmentName(record.equipmentId) }}
                        </a>
                        <span class="equipment-id">{{ getEquipmentNumber(record.equipmentId) }}</span>
                      </div>
                    </td>
                    <td>
                      <p-tag [value]="record.type" [severity]="getTypeSeverity(record.type)"></p-tag>
                    </td>
                    <td>
                      <span class="description-cell" [pTooltip]="record.description">{{ record.description }}</span>
                    </td>
                    <td>
                      <div class="technician-cell">
                        <i class="pi pi-user"></i>
                        <span>{{ record.technician }}</span>
                      </div>
                    </td>
                    <td>
                      <p-tag [value]="record.status" [severity]="getStatusSeverity(record.status)"></p-tag>
                    </td>
                    <td>
                      <span class="cost-cell">{{ formatCurrency(record.cost) }}</span>
                    </td>
                    <td>
                      <div class="actions-cell">
                        <button 
                          pButton 
                          icon="pi pi-eye" 
                          class="p-button-text p-button-rounded p-button-sm"
                          pTooltip="View details"
                          (click)="viewRecord(record)">
                        </button>
                        @if (authService.hasAnyRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN])) {
                          @if (record.status === 'Scheduled' || record.status === 'In Progress') {
                            <button 
                              pButton 
                              icon="pi pi-check" 
                              class="p-button-text p-button-rounded p-button-sm p-button-success"
                              pTooltip="Mark complete"
                              (click)="completeRecord(record)">
                            </button>
                          }
                          <button 
                            pButton 
                            icon="pi pi-pencil" 
                            class="p-button-text p-button-rounded p-button-sm"
                            pTooltip="Edit"
                            (click)="editRecord(record)">
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                </ng-template>

                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="8">
                      <div class="empty-state">
                        <i class="pi pi-wrench"></i>
                        <h3>No maintenance records found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                        <button pButton label="Clear Filters" icon="pi pi-filter-slash" class="p-button-outlined" (click)="clearFilters()"></button>
                      </div>
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </p-tabpanel>

          <!-- Calendar View -->
          <p-tabpanel value="calendar">
            <div class="calendar-container">
              <div class="calendar-header">
                <h3>{{ currentMonth }}</h3>
                <div class="calendar-nav">
                  <button pButton icon="pi pi-chevron-left" class="p-button-text" (click)="previousMonth()"></button>
                  <button pButton label="Today" class="p-button-text" (click)="goToToday()"></button>
                  <button pButton icon="pi pi-chevron-right" class="p-button-text" (click)="nextMonth()"></button>
                </div>
              </div>
              <div class="calendar-grid">
                <div class="calendar-weekdays">
                  @for (day of weekdays; track day) {
                    <div class="weekday">{{ day }}</div>
                  }
                </div>
                <div class="calendar-days">
                  @for (day of calendarDays(); track day.date) {
                    <div 
                      class="calendar-day" 
                      [class.other-month]="!day.currentMonth"
                      [class.today]="day.isToday"
                      [class.has-events]="day.events.length > 0">
                      <span class="day-number">{{ day.dayNumber }}</span>
                      @if (day.events.length > 0) {
                        <div class="day-events">
                          @for (event of day.events.slice(0, 2); track event.id) {
                            <div 
                              class="event-dot" 
                              [class]="'event-' + event.status.toLowerCase().replace(' ', '-')"
                              [pTooltip]="event.description">
                            </div>
                          }
                          @if (day.events.length > 2) {
                            <span class="more-events">+{{ day.events.length - 2 }}</span>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
              <div class="calendar-legend">
                <div class="legend-item">
                  <span class="legend-dot event-scheduled"></span>
                  <span>Scheduled</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot event-in-progress"></span>
                  <span>In Progress</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot event-overdue"></span>
                  <span>Overdue</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot event-completed"></span>
                  <span>Completed</span>
                </div>
              </div>
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

      <!-- Overdue Alert -->
      @if (overdueRecords().length > 0) {
        <div class="alert-panel">
          <div class="alert-header">
            <i class="pi pi-exclamation-circle"></i>
            <h3>Overdue Maintenance</h3>
            <span class="alert-count">{{ overdueRecords().length }} items require immediate attention</span>
          </div>
          <div class="alert-items">
            @for (record of overdueRecords(); track record.id) {
              <div class="alert-item">
                <div class="alert-item-info">
                  <span class="alert-item-name">{{ getEquipmentName(record.equipmentId) }}</span>
                  <span class="alert-item-detail">{{ record.type }} - {{ record.description }}</span>
                  <span class="alert-item-date">Due: {{ formatDate(record.scheduledDate) }}</span>
                </div>
                <button pButton label="Start Now" icon="pi pi-play" class="p-button-sm" (click)="startMaintenance(record)"></button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Schedule Dialog -->
      <p-dialog 
        [(visible)]="showScheduleDialog" 
        header="Schedule Maintenance"
        [modal]="true"
        [style]="{ width: '550px' }"
        [draggable]="false"
        [resizable]="false">
        <div class="dialog-content">
          <p class="dialog-placeholder">Maintenance scheduling form with: Equipment selection, Maintenance type, Scheduled date, Technician assignment, Description, Estimated cost, Parts needed, etc.</p>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showScheduleDialog = false"></button>
          <button pButton label="Schedule" icon="pi pi-calendar" (click)="scheduleMaintenance()"></button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .maintenance-page {
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

    .stat-pill--info .stat-value { color: var(--secondary-600); }
    .stat-pill--warning .stat-value { color: var(--warning-600); }
    .stat-pill--danger .stat-value { color: var(--alert-600); }
    .stat-pill--success .stat-value { color: var(--primary-600); }

    /* Tabs */
    :host ::ng-deep .p-tablist {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: var(--space-2);
      margin-bottom: var(--space-5);
    }

    :host ::ng-deep .p-tab {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      font-weight: 500;
    }

    :host ::ng-deep .p-tab-active {
      background: var(--primary-50);
      color: var(--primary-600);
    }

    :host-context([data-theme="dark"]) ::ng-deep .p-tab-active {
      background: rgba(16, 185, 129, 0.15);
    }

    :host ::ng-deep .p-tabpanels {
      padding: 0;
    }

    /* Filters Bar */
    .filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-4);
      flex-wrap: wrap;
      padding: var(--space-4);
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      margin-bottom: var(--space-5);
    }

    .filters-left {
      flex: 1;
      min-width: 250px;
      max-width: 400px;
    }

    .search-input {
      width: 100%;
    }

    .filters-right {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .filters-right :deep(.p-select) {
      min-width: 140px;
    }

    /* Table Container */
    .table-container {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      overflow: hidden;
    }

    .table-container :deep(.p-datatable) {
      border: none;
    }

    .table-container :deep(.p-datatable-thead > tr > th) {
      background: var(--surface-ground);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: var(--space-3) var(--space-4);
      border-color: var(--border-color);
    }

    .table-container :deep(.p-datatable-tbody > tr > td) {
      padding: var(--space-3) var(--space-4);
      border-color: var(--border-color);
    }

    .table-container :deep(.p-datatable-tbody > tr:hover) {
      background: var(--surface-hover);
    }

    .table-container :deep(.p-paginator) {
      border: none;
      background: transparent;
      padding: var(--space-4);
    }

    .overdue-row {
      background: rgba(244, 63, 94, 0.05) !important;
    }

    /* Table Cell Styles */
    .date-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .date-main {
      font-size: var(--text-sm);
      color: var(--text-primary);
    }

    .date-completed {
      font-size: var(--text-xs);
      color: var(--primary-600);
    }

    .equipment-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .equipment-name {
      font-weight: 500;
      color: var(--text-primary);
      text-decoration: none;
      transition: color var(--transition-fast);
    }

    .equipment-name:hover {
      color: var(--primary-600);
    }

    .equipment-id {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .description-cell {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .technician-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .technician-cell i {
      color: var(--text-tertiary);
    }

    .cost-cell {
      font-family: var(--font-mono);
      font-size: var(--text-sm);
      color: var(--text-primary);
    }

    .actions-cell {
      display: flex;
      justify-content: center;
      gap: var(--space-1);
    }

    /* Calendar View */
    .calendar-container {
      background: var(--surface-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
    }

    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-5);
    }

    .calendar-header h3 {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .calendar-nav {
      display: flex;
      gap: var(--space-1);
    }

    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: var(--space-1);
      margin-bottom: var(--space-2);
    }

    .weekday {
      text-align: center;
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: var(--space-2);
    }

    .calendar-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: var(--space-1);
    }

    .calendar-day {
      aspect-ratio: 1;
      padding: var(--space-2);
      border-radius: var(--radius-lg);
      background: var(--surface-ground);
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: background var(--transition-fast);
    }

    .calendar-day:hover {
      background: var(--surface-hover);
    }

    .calendar-day.other-month {
      opacity: 0.4;
    }

    .calendar-day.today {
      background: var(--primary-50);
      border: 2px solid var(--primary-500);
    }

    :host-context([data-theme="dark"]) .calendar-day.today {
      background: rgba(16, 185, 129, 0.15);
    }

    .day-number {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-primary);
    }

    .day-events {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      margin-top: auto;
    }

    .event-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .event-scheduled { background: var(--secondary-500); }
    .event-in-progress { background: var(--warning-500); }
    .event-overdue { background: var(--alert-500); }
    .event-completed { background: var(--primary-500); }

    .more-events {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .calendar-legend {
      display: flex;
      justify-content: center;
      gap: var(--space-5);
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border-color);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    /* Alert Panel */
    .alert-panel {
      background: var(--surface-card);
      border: 1px solid var(--alert-200);
      border-left: 4px solid var(--alert-500);
      border-radius: var(--radius-xl);
      overflow: hidden;
    }

    :host-context([data-theme="dark"]) .alert-panel {
      border-color: var(--alert-900);
      border-left-color: var(--alert-500);
    }

    .alert-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--alert-50);
      border-bottom: 1px solid var(--alert-200);
    }

    :host-context([data-theme="dark"]) .alert-header {
      background: rgba(244, 63, 94, 0.1);
      border-bottom-color: var(--alert-900);
    }

    .alert-header i {
      font-size: 1.25rem;
      color: var(--alert-600);
    }

    .alert-header h3 {
      font-family: var(--font-display);
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      flex: 1;
    }

    .alert-count {
      font-size: var(--text-sm);
      color: var(--alert-600);
    }

    .alert-items {
      padding: var(--space-2);
    }

    .alert-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-3);
      border-radius: var(--radius-lg);
      transition: background var(--transition-fast);
    }

    .alert-item:hover {
      background: var(--surface-hover);
    }

    .alert-item-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .alert-item-name {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-primary);
    }

    .alert-item-detail {
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    .alert-item-date {
      font-size: var(--text-xs);
      color: var(--alert-600);
    }

    /* Empty State */
    .empty-state {
      padding: var(--space-12);
      text-align: center;
    }

    .empty-state i {
      font-size: 3rem;
      color: var(--text-tertiary);
      margin-bottom: var(--space-4);
    }

    .empty-state h3 {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--space-2) 0;
    }

    .empty-state p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0 0 var(--space-4) 0;
    }

    /* Dialog */
    .dialog-content {
      padding: var(--space-4) 0;
    }

    .dialog-placeholder {
      padding: var(--space-8);
      background: var(--surface-ground);
      border-radius: var(--radius-lg);
      text-align: center;
      color: var(--text-secondary);
    }

    @media (max-width: 768px) {
      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .filters-left {
        max-width: none;
      }

      .filters-right {
        justify-content: flex-start;
      }

      .calendar-legend {
        flex-wrap: wrap;
        gap: var(--space-3);
      }
    }
  `]
})
export class MaintenanceListComponent {
  mockDataService = inject(MockDataService);
  authService = inject(AuthService);
  messageService = inject(MessageService);

  // Expose enum for template use
  UserRole = UserRole;

  maintenance = this.mockDataService.maintenanceRecords;
  equipment = this.mockDataService.equipment;

  activeTab = 'list';
  searchQuery = '';
  selectedType: MaintenanceType | null = null;
  selectedStatus: MaintenanceStatus | null = null;
  showScheduleDialog = false;
  currentDate = signal(new Date());

  weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  typeOptions = Object.values(MaintenanceType).map(t => ({ label: t, value: t }));
  statusOptions = Object.values(MaintenanceStatus).map(s => ({ label: s, value: s }));

  filteredMaintenance = computed(() => {
    let result = this.maintenance();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(m => 
        m.description.toLowerCase().includes(query) ||
        (m.technician?.toLowerCase().includes(query) ?? false) ||
        this.getEquipmentName(m.equipmentId).toLowerCase().includes(query)
      );
    }

    if (this.selectedType) {
      result = result.filter(m => m.type === this.selectedType);
    }

    if (this.selectedStatus) {
      result = result.filter(m => m.status === this.selectedStatus);
    }

    return result.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
  });

  scheduledCount = computed(() => 
    this.maintenance().filter(m => m.status === MaintenanceStatus.SCHEDULED).length
  );

  inProgressCount = computed(() => 
    this.maintenance().filter(m => m.status === MaintenanceStatus.IN_PROGRESS).length
  );

  overdueCount = computed(() => 
    this.maintenance().filter(m => m.status === MaintenanceStatus.OVERDUE).length
  );

  completedCount = computed(() => 
    this.maintenance().filter(m => m.status === MaintenanceStatus.COMPLETED).length
  );

  overdueRecords = computed(() => 
    this.maintenance().filter(m => m.status === MaintenanceStatus.OVERDUE)
  );

  get currentMonth(): string {
    return this.currentDate().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    
    const days: any[] = [];
    
    // Previous month days
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({
        date: d,
        dayNumber: d.getDate(),
        currentMonth: false,
        isToday: false,
        events: []
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const dayEvents = this.maintenance().filter(m => {
        const mDate = new Date(m.scheduledDate);
        return mDate.getDate() === i && mDate.getMonth() === month && mDate.getFullYear() === year;
      });
      
      days.push({
        date: d,
        dayNumber: i,
        currentMonth: true,
        isToday: d.toDateString() === today.toDateString(),
        events: dayEvents
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dayNumber: i,
        currentMonth: false,
        isToday: false,
        events: []
      });
    }
    
    return days;
  });

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedType = null;
    this.selectedStatus = null;
  }

  previousMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  goToToday(): void {
    this.currentDate.set(new Date());
  }

  getEquipmentName(equipmentId: string): string {
    const eq = this.equipment().find(e => e.id === equipmentId);
    return eq?.name || 'Unknown Equipment';
  }

  getEquipmentNumber(equipmentId: string): string {
    const eq = this.equipment().find(e => e.id === equipmentId);
    return eq?.inventoryNumber || '';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  getTypeSeverity(type: MaintenanceType): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<MaintenanceType, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      [MaintenanceType.PREVENTIVE]: 'success',
      [MaintenanceType.CORRECTIVE]: 'warn',
      [MaintenanceType.CALIBRATION]: 'info',
      [MaintenanceType.SAFETY_INSPECTION]: 'info',
      [MaintenanceType.PERFORMANCE_VERIFICATION]: 'info',
      [MaintenanceType.EMERGENCY]: 'danger'
    };
    return map[type] || 'info';
  }

  getStatusSeverity(status: MaintenanceStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    const map: Record<MaintenanceStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary'> = {
      [MaintenanceStatus.SCHEDULED]: 'info',
      [MaintenanceStatus.IN_PROGRESS]: 'warn',
      [MaintenanceStatus.COMPLETED]: 'success',
      [MaintenanceStatus.OVERDUE]: 'danger',
      [MaintenanceStatus.CANCELLED]: 'secondary'
    };
    return map[status] || 'info';
  }

  viewRecord(record: MaintenanceRecord): void {
    this.messageService.add({
      severity: 'info',
      summary: 'View Record',
      detail: `Viewing maintenance record: ${record.description}`
    });
  }

  editRecord(record: MaintenanceRecord): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Edit Record',
      detail: `Editing maintenance record: ${record.description}`
    });
  }

  completeRecord(record: MaintenanceRecord): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Completed',
      detail: `Maintenance marked as complete: ${record.description}`
    });
  }

  startMaintenance(record: MaintenanceRecord): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Started',
      detail: `Started maintenance for ${this.getEquipmentName(record.equipmentId)}`
    });
  }

  scheduleMaintenance(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Scheduled',
      detail: 'Maintenance has been scheduled successfully'
    });
    this.showScheduleDialog = false;
  }
}
