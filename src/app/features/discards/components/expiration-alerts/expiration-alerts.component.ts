import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { Textarea } from 'primeng/textarea';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DiscardService, ExpirationAlertFilter, ScanExpiredItemsResult } from '@core/services/discard.service';
import { ExpirationAlert, ExpirationAlertType, ResolutionType, DisposalMethod, DiscardSummary } from '@shared/models';

@Component({
  selector: 'app-expiration-alerts',
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
    CardModule,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    Textarea,
    ProgressBarModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="expiration-alerts">
      <div class="page-header">
        <div class="header-content">
          <button pButton icon="pi pi-arrow-left" class="p-button-text" (click)="goBack()"></button>
          <div>
            <h1>Expiration Alerts</h1>
            <p class="subtitle">Monitor and manage expiring inventory items</p>
          </div>
        </div>
        <div class="header-actions">
          <button pButton label="Scan for Expired" icon="pi pi-sync" class="p-button-outlined" (click)="scanForExpired()" [loading]="scanning()"></button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card expired">
          <div class="card-icon">
            <i class="pi pi-times-circle"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.expiredAlerts || 0 }}</span>
            <span class="card-label">Expired Items</span>
          </div>
        </div>
        <div class="summary-card expiring">
          <div class="card-icon">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.expiringAlerts || 0 }}</span>
            <span class="card-label">Expiring Soon</span>
          </div>
        </div>
      </div>

      @if (scanResult()) {
        <div class="scan-result-banner">
          <i class="pi pi-info-circle"></i>
          <span>
            Last scan found {{ scanResult()!.expiredCount }} expired and {{ scanResult()!.expiringSoonCount }} expiring items.
            Created {{ scanResult()!.alertsCreated }} new alerts, updated {{ scanResult()!.alertsUpdated }} existing.
          </span>
          <button pButton icon="pi pi-times" class="p-button-text p-button-sm" (click)="dismissScanResult()"></button>
        </div>
      }

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-controls">
          <p-select
            [options]="alertTypeOptions"
            [(ngModel)]="alertTypeFilter"
            placeholder="Alert Type"
            [showClear]="true"
            (onChange)="applyFilters()"
          ></p-select>
          <p-select
            [options]="statusOptions"
            [(ngModel)]="statusFilter"
            placeholder="Status"
            [showClear]="true"
            (onChange)="applyFilters()"
          ></p-select>
          <p-select
            [options]="timeframeOptions"
            [(ngModel)]="timeframeFilter"
            placeholder="Timeframe"
            [showClear]="true"
            (onChange)="applyFilters()"
          ></p-select>
        </div>
      </div>

      <!-- Alerts Table -->
      <div class="table-container">
        <p-table
          [value]="alerts()"
          [loading]="loading()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [rowHover]="true"
          dataKey="id"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} alerts"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="alertType">Type <p-sortIcon field="alertType"></p-sortIcon></th>
              <th pSortableColumn="itemName">Item <p-sortIcon field="itemName"></p-sortIcon></th>
              <th>Lot / Qty</th>
              <th pSortableColumn="expirationDate">Expiration <p-sortIcon field="expirationDate"></p-sortIcon></th>
              <th pSortableColumn="daysUntilExpiry">Days <p-sortIcon field="daysUntilExpiry"></p-sortIcon></th>
              <th>Status</th>
              <th style="width: 12rem">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-alert>
            <tr [class.expired-row]="alert.alertType === 'expired'" [class.expiring-row]="alert.alertType === 'expiring_soon'">
              <td>
                <p-tag
                  [value]="alert.alertType === 'expired' ? 'EXPIRED' : 'Expiring Soon'"
                  [severity]="alert.alertType === 'expired' ? 'danger' : 'warn'"
                  [icon]="alert.alertType === 'expired' ? 'pi pi-times-circle' : 'pi pi-exclamation-triangle'"
                ></p-tag>
              </td>
              <td>
                <div class="item-info">
                  <span class="item-name">{{ alert.itemName }}</span>
                  <span class="item-sku">{{ alert.itemSku }}</span>
                </div>
              </td>
              <td>
                <div class="lot-info">
                  @if (alert.lotNumber) {
                    <span class="lot-number">{{ alert.lotNumber }}</span>
                  }
                  <span class="quantity">Qty: {{ alert.quantity }}</span>
                </div>
              </td>
              <td>
                <span class="expiration-date" [class.expired]="alert.daysUntilExpiry < 0">
                  {{ alert.expirationDate | date:'mediumDate' }}
                </span>
              </td>
              <td>
                <span class="days-value" [class]="getDaysClass(alert.daysUntilExpiry)">
                  {{ getDaysText(alert.daysUntilExpiry) }}
                </span>
              </td>
              <td>
                @if (alert.isResolved) {
                  <p-tag value="Resolved" severity="success" icon="pi pi-check"></p-tag>
                } @else if (alert.isAcknowledged) {
                  <p-tag value="Acknowledged" severity="info" icon="pi pi-eye"></p-tag>
                } @else {
                  <p-tag value="New" severity="warn" icon="pi pi-bell"></p-tag>
                }
              </td>
              <td>
                <div class="action-buttons">
                  @if (!alert.isAcknowledged && !alert.isResolved) {
                    <button
                      pButton
                      icon="pi pi-eye"
                      class="p-button-rounded p-button-info p-button-text p-button-sm"
                      pTooltip="Acknowledge"
                      (click)="acknowledgeAlert(alert)"
                    ></button>
                  }
                  @if (!alert.isResolved) {
                    <button
                      pButton
                      icon="pi pi-trash"
                      class="p-button-rounded p-button-danger p-button-text p-button-sm"
                      pTooltip="Discard Items"
                      (click)="openDiscardDialog(alert)"
                    ></button>
                    <button
                      pButton
                      icon="pi pi-check-circle"
                      class="p-button-rounded p-button-success p-button-text p-button-sm"
                      pTooltip="Mark Used"
                      (click)="markAsUsed(alert)"
                    ></button>
                  }
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="empty-message">
                <i class="pi pi-check-circle"></i>
                <p>No expiration alerts</p>
                <small>All inventory is within acceptable expiration dates</small>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Discard Dialog -->
      <p-dialog
        header="Discard Expired Items"
        [(visible)]="showDiscardDialog"
        [style]="{ width: '500px' }"
        [modal]="true"
      >
        @if (selectedAlert) {
          <div class="discard-dialog-content">
            <div class="alert-info">
              <div class="info-row">
                <span class="label">Item:</span>
                <span class="value">{{ selectedAlert.itemName }}</span>
              </div>
              <div class="info-row">
                <span class="label">Lot #:</span>
                <span class="value">{{ selectedAlert.lotNumber || 'N/A' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Quantity:</span>
                <span class="value">{{ selectedAlert.quantity }}</span>
              </div>
              <div class="info-row">
                <span class="label">Expiration:</span>
                <span class="value expired">{{ selectedAlert.expirationDate | date:'mediumDate' }}</span>
              </div>
            </div>

            <div class="form-field">
              <label>Disposal Method</label>
              <p-select
                [options]="disposalMethodOptions"
                [(ngModel)]="disposalMethod"
                placeholder="Select disposal method"
                [style]="{ width: '100%' }"
              ></p-select>
            </div>

            <div class="form-field">
              <label>Disposal Location</label>
              <input pInputText [(ngModel)]="disposalLocation" placeholder="e.g., Waste Room A" [style]="{ width: '100%' }" />
            </div>

            <div class="form-field">
              <label>Notes (optional)</label>
              <textarea pTextarea [(ngModel)]="discardNotes" rows="3" [style]="{ width: '100%' }"></textarea>
            </div>
          </div>
        }
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showDiscardDialog = false"></button>
          <button pButton label="Create Discard Record" icon="pi pi-trash" severity="danger" (click)="createDiscardFromAlert()" [disabled]="!disposalMethod"></button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .expiration-alerts {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;

      .header-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        h1 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .subtitle {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
      }
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
      max-width: 500px;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: var(--radius-lg);

      &.expired {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.2);

        .card-icon {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
      }

      &.expiring {
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.2);

        .card-icon {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }
      }

      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;

        i { font-size: 1.5rem; }
      }

      .card-content {
        display: flex;
        flex-direction: column;

        .card-value {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .card-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      }
    }

    .scan-result-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: var(--radius-md);
      margin-bottom: 1rem;

      i {
        color: #3b82f6;
        font-size: 1.25rem;
      }

      span {
        flex: 1;
        color: #3b82f6;
        font-size: 0.875rem;
      }
    }

    .filters-section {
      margin-bottom: 1rem;

      .filter-controls {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
    }

    .table-container {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .expired-row {
      background: rgba(239, 68, 68, 0.05);
    }

    .expiring-row {
      background: rgba(245, 158, 11, 0.05);
    }

    .item-info {
      display: flex;
      flex-direction: column;

      .item-name {
        font-weight: 500;
        color: var(--text-primary);
      }

      .item-sku {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-family: monospace;
      }
    }

    .lot-info {
      display: flex;
      flex-direction: column;
      font-size: 0.875rem;

      .lot-number {
        font-family: monospace;
        color: var(--text-secondary);
      }

      .quantity {
        color: var(--text-muted);
      }
    }

    .expiration-date {
      &.expired {
        color: #ef4444;
        font-weight: 500;
      }
    }

    .days-value {
      font-weight: 600;

      &.expired {
        color: #ef4444;
      }

      &.critical {
        color: #f59e0b;
      }

      &.warning {
        color: #eab308;
      }

      &.ok {
        color: var(--text-secondary);
      }
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .empty-message {
      text-align: center;
      padding: 3rem;
      color: var(--text-muted);

      i {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: var(--primary-500);
      }

      p {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
      }

      small {
        color: var(--text-muted);
      }
    }

    .discard-dialog-content {
      .alert-info {
        background: var(--bg-secondary);
        padding: 1rem;
        border-radius: var(--radius-md);
        margin-bottom: 1.5rem;

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 0.25rem 0;

          .label {
            color: var(--text-muted);
          }

          .value {
            font-weight: 500;
            color: var(--text-primary);

            &.expired {
              color: #ef4444;
            }
          }
        }
      }

      .form-field {
        margin-bottom: 1rem;

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--text-primary);
        }
      }
    }
  `]
})
export class ExpirationAlertsComponent implements OnInit {
  private readonly discardService = inject(DiscardService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

  alerts = signal<ExpirationAlert[]>([]);
  summary = signal<DiscardSummary | null>(null);
  loading = signal(false);
  scanning = signal(false);
  scanResult = signal<ScanExpiredItemsResult | null>(null);

  alertTypeFilter: ExpirationAlertType | null = null;
  statusFilter: string | null = null;
  timeframeFilter: number | null = null;

  showDiscardDialog = false;
  selectedAlert: ExpirationAlert | null = null;
  disposalMethod: DisposalMethod | null = null;
  disposalLocation = '';
  discardNotes = '';

  alertTypeOptions = [
    { label: 'Expired', value: ExpirationAlertType.EXPIRED },
    { label: 'Expiring Soon', value: ExpirationAlertType.EXPIRING_SOON }
  ];

  statusOptions = [
    { label: 'New (Unacknowledged)', value: 'new' },
    { label: 'Acknowledged', value: 'acknowledged' },
    { label: 'Resolved', value: 'resolved' }
  ];

  timeframeOptions = [
    { label: 'Expiring in 7 days', value: 7 },
    { label: 'Expiring in 14 days', value: 14 },
    { label: 'Expiring in 30 days', value: 30 },
    { label: 'Expiring in 60 days', value: 60 }
  ];

  disposalMethodOptions = [
    { label: 'General Waste', value: DisposalMethod.GENERAL },
    { label: 'Biohazard', value: DisposalMethod.BIOHAZARD },
    { label: 'Sharps', value: DisposalMethod.SHARPS },
    { label: 'Pharmaceutical', value: DisposalMethod.PHARMACEUTICAL },
    { label: 'Controlled Substance', value: DisposalMethod.CONTROLLED },
    { label: 'Chemical', value: DisposalMethod.CHEMICAL },
    { label: 'Recyclable', value: DisposalMethod.RECYCLABLE }
  ];

  ngOnInit(): void {
    this.loadAlerts();
    this.loadSummary();
  }

  loadAlerts(): void {
    this.loading.set(true);
    const filter: ExpirationAlertFilter = {};

    if (this.alertTypeFilter) {
      filter.alertType = this.alertTypeFilter;
    }
    if (this.statusFilter === 'new') {
      filter.unacknowledgedOnly = true;
      filter.unresolvedOnly = true;
    } else if (this.statusFilter === 'acknowledged') {
      filter.unresolvedOnly = true;
    } else if (this.statusFilter !== 'resolved') {
      filter.unresolvedOnly = true;
    }
    if (this.timeframeFilter) {
      filter.expiringWithinDays = this.timeframeFilter;
    }

    this.discardService.listExpirationAlerts(filter).subscribe({
      next: (response) => {
        this.alerts.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load alerts' });
        this.loading.set(false);
      }
    });
  }

  loadSummary(): void {
    this.discardService.getDiscardSummary().subscribe({
      next: (summary) => this.summary.set(summary)
    });
  }

  applyFilters(): void {
    this.loadAlerts();
  }

  getDaysClass(days: number): string {
    if (days < 0) return 'expired';
    if (days <= 7) return 'critical';
    if (days <= 30) return 'warning';
    return 'ok';
  }

  getDaysText(days: number): string {
    if (days < 0) return `${Math.abs(days)} days ago`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  }

  scanForExpired(): void {
    this.scanning.set(true);
    this.discardService.scanExpiredItems(30).subscribe({
      next: (result) => {
        this.scanResult.set(result);
        this.scanning.set(false);
        this.loadAlerts();
        this.loadSummary();
        this.messageService.add({
          severity: 'success',
          summary: 'Scan Complete',
          detail: `Found ${result.expiredCount + result.expiringSoonCount} items needing attention`
        });
      },
      error: () => {
        this.scanning.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to scan for expired items' });
      }
    });
  }

  dismissScanResult(): void {
    this.scanResult.set(null);
  }

  acknowledgeAlert(alert: ExpirationAlert): void {
    this.discardService.acknowledgeAlert(alert.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Alert acknowledged' });
        this.loadAlerts();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to acknowledge alert' });
      }
    });
  }

  openDiscardDialog(alert: ExpirationAlert): void {
    this.selectedAlert = alert;
    this.disposalMethod = null;
    this.disposalLocation = '';
    this.discardNotes = '';
    this.showDiscardDialog = true;
  }

  createDiscardFromAlert(): void {
    if (!this.selectedAlert || !this.disposalMethod) return;

    this.discardService.discardFromAlert(
      this.selectedAlert.id,
      this.disposalMethod,
      this.disposalLocation,
      this.discardNotes
    ).subscribe({
      next: (result) => {
        this.showDiscardDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Discard record ${result.discard.discardNumber} created`
        });
        this.loadAlerts();
        this.loadSummary();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create discard record' });
      }
    });
  }

  markAsUsed(alert: ExpirationAlert): void {
    this.confirmationService.confirm({
      message: `Mark ${alert.quantity} ${alert.itemName} as used? This will resolve the alert without creating a discard record.`,
      header: 'Mark as Used',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.discardService.resolveAlert(alert.id, ResolutionType.USED, 'Items were used before expiration').subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Alert resolved - items marked as used' });
            this.loadAlerts();
            this.loadSummary();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to resolve alert' });
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/discards']);
  }
}
