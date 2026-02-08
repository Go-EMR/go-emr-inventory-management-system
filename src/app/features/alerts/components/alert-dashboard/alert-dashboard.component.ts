import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DateAlertService } from '@core/services/date-alert.service';
import { DateAlert, DateAlertSeverity, TrackedDateType } from '@shared/models';

@Component({
  selector: 'app-alert-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    TableModule,
    TagModule,
    SelectModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="alert-dashboard">
      <div class="page-header">
        <div class="header-content">
          <h1>Date Alerts</h1>
          <p class="subtitle">Track maintenance, calibration, and warranty dates</p>
        </div>
        <div class="header-actions">
          <button pButton label="Configure Alerts" icon="pi pi-cog" class="p-button-outlined" [routerLink]="['config']"></button>
        </div>
      </div>

      <div class="alert-summary">
        <div class="summary-card critical">
          <div class="card-icon">
            <i class="pi pi-exclamation-circle"></i>
          </div>
          <div class="card-content">
            <span class="count">{{ criticalCount() }}</span>
            <span class="label">Critical</span>
          </div>
        </div>
        <div class="summary-card urgent">
          <div class="card-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="card-content">
            <span class="count">{{ urgentCount() }}</span>
            <span class="label">Urgent</span>
          </div>
        </div>
        <div class="summary-card warning">
          <div class="card-icon">
            <i class="pi pi-info-circle"></i>
          </div>
          <div class="card-content">
            <span class="count">{{ warningCount() }}</span>
            <span class="label">Warning</span>
          </div>
        </div>
        <div class="summary-card info">
          <div class="card-icon">
            <i class="pi pi-bell"></i>
          </div>
          <div class="card-content">
            <span class="count">{{ infoCount() }}</span>
            <span class="label">Info</span>
          </div>
        </div>
      </div>

      <div class="alerts-section">
        <div class="section-header">
          <h3>Upcoming Alerts</h3>
          <p-select
            [options]="dateTypeOptions"
            [(ngModel)]="selectedDateType"
            placeholder="All Types"
            [showClear]="true"
            (onChange)="loadAlerts()"
          ></p-select>
        </div>

        <p-table [value]="alerts()" [loading]="loading()" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Severity</th>
              <th>Item</th>
              <th>Type</th>
              <th>Due Date</th>
              <th>Days Until Due</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-alert>
            <tr>
              <td>
                <p-tag
                  [value]="alert.severity"
                  [severity]="getSeverityColor(alert.severity)"
                ></p-tag>
              </td>
              <td>
                <strong>{{ alert.itemName }}</strong>
              </td>
              <td>{{ formatDateType(alert.dateType) }}</td>
              <td>{{ alert.dueDate | date:'mediumDate' }}</td>
              <td>
                <span [class]="getDaysClass(alert.daysUntilDue)">
                  @if (alert.daysUntilDue < 0) {
                    {{ Math.abs(alert.daysUntilDue) }} days overdue
                  } @else if (alert.daysUntilDue === 0) {
                    Due today
                  } @else {
                    {{ alert.daysUntilDue }} days
                  }
                </span>
              </td>
              <td>
                <div class="actions">
                  <button pButton icon="pi pi-check" class="p-button-text p-button-success p-button-sm" pTooltip="Mark Complete" (click)="acknowledgeAlert(alert)"></button>
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Item"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center p-4">
                <div class="empty-state">
                  <i class="pi pi-check-circle"></i>
                  <p>No upcoming alerts</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .alert-dashboard {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .header-content h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      color: var(--text-primary);
    }

    .subtitle {
      margin: 0;
      color: var(--text-secondary);
    }

    .alert-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      border-left: 4px solid;

      &.critical {
        border-left-color: #ef4444;
        .card-icon { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
      }

      &.urgent {
        border-left-color: #f97316;
        .card-icon { color: #f97316; background: rgba(249, 115, 22, 0.1); }
      }

      &.warning {
        border-left-color: #eab308;
        .card-icon { color: #eab308; background: rgba(234, 179, 8, 0.1); }
      }

      &.info {
        border-left-color: #3b82f6;
        .card-icon { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
      }
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.5rem;
      }
    }

    .card-content {
      display: flex;
      flex-direction: column;

      .count {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .label {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    .alerts-section {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);

      h3 {
        margin: 0;
        font-size: 1rem;
        color: var(--text-primary);
      }
    }

    .actions {
      display: flex;
      gap: 0.25rem;
    }

    .days-overdue {
      color: #ef4444;
      font-weight: 500;
    }

    .days-today {
      color: #f97316;
      font-weight: 500;
    }

    .days-soon {
      color: #eab308;
    }

    .days-normal {
      color: var(--text-secondary);
    }

    .empty-state {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);

      i {
        font-size: 2rem;
        color: var(--primary-500);
        margin-bottom: 0.5rem;
      }

      p {
        margin: 0;
      }
    }
  `]
})
export class AlertDashboardComponent implements OnInit {
  private readonly alertService = inject(DateAlertService);
  private readonly messageService = inject(MessageService);

  Math = Math;

  alerts = signal<DateAlert[]>([]);
  loading = signal(false);
  selectedDateType: TrackedDateType | null = null;

  dateTypeOptions = [
    { label: 'Maintenance', value: TrackedDateType.MAINTENANCE_DUE },
    { label: 'Calibration', value: TrackedDateType.CALIBRATION_DUE },
    { label: 'Warranty', value: TrackedDateType.WARRANTY_EXPIRY },
    { label: 'Inspection', value: TrackedDateType.INSPECTION_DUE },
    { label: 'Certification', value: TrackedDateType.CERTIFICATION_EXPIRY }
  ];

  criticalCount = () => this.alerts().filter(a => a.severity === DateAlertSeverity.CRITICAL).length;
  urgentCount = () => this.alerts().filter(a => a.severity === DateAlertSeverity.URGENT).length;
  warningCount = () => this.alerts().filter(a => a.severity === DateAlertSeverity.WARNING).length;
  infoCount = () => this.alerts().filter(a => a.severity === DateAlertSeverity.INFO).length;

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.loading.set(true);
    this.alertService.getUpcomingAlerts(30, this.selectedDateType || undefined).subscribe({
      next: (alerts) => {
        this.alerts.set(alerts);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load alerts' });
      }
    });
  }

  getSeverityColor(severity: DateAlertSeverity): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (severity) {
      case DateAlertSeverity.CRITICAL: return 'danger';
      case DateAlertSeverity.URGENT: return 'warn';
      case DateAlertSeverity.WARNING: return 'info';
      default: return 'secondary';
    }
  }

  formatDateType(type: TrackedDateType): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getDaysClass(days: number): string {
    if (days < 0) return 'days-overdue';
    if (days === 0) return 'days-today';
    if (days <= 7) return 'days-soon';
    return 'days-normal';
  }

  acknowledgeAlert(alert: DateAlert): void {
    this.alertService.acknowledgeAlert(alert.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Alert acknowledged' });
        this.loadAlerts();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to acknowledge alert' });
      }
    });
  }
}
