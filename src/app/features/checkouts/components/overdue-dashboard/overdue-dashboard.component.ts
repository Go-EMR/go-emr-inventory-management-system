import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { Textarea } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CheckoutService } from '@core/services/checkout.service';
import { OverdueCheckoutSummary, Checkout, CheckoutStatus } from '@shared/models';

@Component({
  selector: 'app-overdue-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    ToastModule,
    DialogModule,
    SelectModule,
    Textarea,
    DatePickerModule,
    ConfirmDialogModule,
    TooltipModule,
    ChartModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="overdue-dashboard">
      <div class="page-header">
        <div class="header-content">
          <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/checkouts']"></button>
          <div>
            <h1>Overdue Checkouts</h1>
            <p class="subtitle">Track and manage overdue equipment returns</p>
          </div>
        </div>
        <div class="header-actions">
          @if (selectedCheckouts.length > 0) {
            <button pButton label="Send Reminders ({{ selectedCheckouts.length }})" icon="pi pi-envelope" class="p-button-warning" (click)="sendBulkReminders()"></button>
          }
          <button pButton label="Refresh" icon="pi pi-refresh" class="p-button-outlined" (click)="loadOverdueData()" [loading]="loading()"></button>
        </div>
      </div>

      @if (summary()) {
        <!-- Summary Cards -->
        <div class="summary-cards">
          <div class="summary-card total" (click)="filterByRange(null)">
            <div class="card-value">{{ summary()?.totalOverdue }}</div>
            <div class="card-label">Total Overdue</div>
            <div class="card-icon"><i class="pi pi-exclamation-triangle"></i></div>
          </div>
          <div class="summary-card warning" [class.active]="activeFilter === '1-7'" (click)="filterByRange('1-7')">
            <div class="card-value">{{ summary()?.overdue1To7Days }}</div>
            <div class="card-label">1-7 Days Overdue</div>
            <div class="card-icon"><i class="pi pi-clock"></i></div>
          </div>
          <div class="summary-card danger" [class.active]="activeFilter === '8-14'" (click)="filterByRange('8-14')">
            <div class="card-value">{{ summary()?.overdue8To14Days }}</div>
            <div class="card-label">8-14 Days Overdue</div>
            <div class="card-icon"><i class="pi pi-exclamation-circle"></i></div>
          </div>
          <div class="summary-card critical" [class.active]="activeFilter === '15+'" (click)="filterByRange('15+')">
            <div class="card-value">{{ summary()?.overdue15PlusDays }}</div>
            <div class="card-label">15+ Days Overdue</div>
            <div class="card-icon"><i class="pi pi-ban"></i></div>
          </div>
        </div>

        <!-- Chart and Filters Row -->
        <div class="chart-row">
          <div class="chart-card">
            <h3>Overdue by Department</h3>
            <div class="chart-container">
              <p-chart type="doughnut" [data]="departmentChartData" [options]="chartOptions" height="200px"></p-chart>
            </div>
          </div>
          <div class="filters-card">
            <h3>Quick Actions</h3>
            <div class="quick-actions">
              <button pButton label="Email All Overdue" icon="pi pi-envelope" class="p-button-outlined w-full" (click)="sendRemindersToAll()"></button>
              <button pButton label="Export Report" icon="pi pi-download" class="p-button-outlined w-full" (click)="exportReport()"></button>
              <button pButton label="Escalate Critical" icon="pi pi-exclamation-triangle" class="p-button-outlined p-button-danger w-full" (click)="escalateCritical()"></button>
            </div>
          </div>
        </div>
      }

      <!-- Overdue Table -->
      <div class="overdue-table">
        <p-table
          [value]="filteredCheckouts()"
          [loading]="loading()"
          styleClass="p-datatable-sm"
          [(selection)]="selectedCheckouts"
          dataKey="id"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
        >
          <ng-template pTemplate="caption">
            <div class="table-header">
              <span>{{ filteredCheckouts().length }} overdue checkout(s)</span>
              @if (activeFilter) {
                <button pButton label="Clear Filter" icon="pi pi-times" class="p-button-text p-button-sm" (click)="filterByRange(null)"></button>
              }
            </div>
          </ng-template>
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 3rem">
                <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
              </th>
              <th pSortableColumn="itemName">Item <p-sortIcon field="itemName"></p-sortIcon></th>
              <th pSortableColumn="checkedOutByName">Checked Out By <p-sortIcon field="checkedOutByName"></p-sortIcon></th>
              <th pSortableColumn="department">Department <p-sortIcon field="department"></p-sortIcon></th>
              <th pSortableColumn="expectedReturnDate">Expected Return <p-sortIcon field="expectedReturnDate"></p-sortIcon></th>
              <th pSortableColumn="daysOverdue">Days Overdue <p-sortIcon field="daysOverdue"></p-sortIcon></th>
              <th>Last Reminder</th>
              <th style="width: 180px">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-checkout>
            <tr [class]="getRowClass(checkout)">
              <td>
                <p-tableCheckbox [value]="checkout"></p-tableCheckbox>
              </td>
              <td>
                <div class="item-info">
                  <strong>{{ checkout.itemName }}</strong>
                  <small>{{ checkout.itemSku }}</small>
                </div>
              </td>
              <td>
                <div class="user-info">
                  <span class="user-name">{{ checkout.checkedOutByName }}</span>
                  @if (checkout.checkedOutByEmail) {
                    <small>{{ checkout.checkedOutByEmail }}</small>
                  }
                </div>
              </td>
              <td>
                <span class="department-badge">{{ checkout.department }}</span>
              </td>
              <td>{{ checkout.expectedReturnDate | date:'mediumDate' }}</td>
              <td>
                <p-tag
                  [value]="checkout.daysOverdue + ' days'"
                  [severity]="getOverdueSeverity(checkout.daysOverdue)"
                ></p-tag>
              </td>
              <td>
                @if (checkout.lastReminderSent) {
                  <span class="reminder-date">{{ checkout.lastReminderSent | date:'short' }}</span>
                } @else {
                  <span class="no-reminder">Never</span>
                }
              </td>
              <td>
                <div class="actions">
                  <button pButton icon="pi pi-envelope" class="p-button-text p-button-sm" pTooltip="Send Reminder" (click)="showReminderDialog(checkout)"></button>
                  <button pButton icon="pi pi-clock" class="p-button-text p-button-sm" pTooltip="Extend" (click)="showExtendDialog(checkout)"></button>
                  <button pButton icon="pi pi-sign-in" class="p-button-text p-button-success p-button-sm" pTooltip="Check In" (click)="showCheckinDialog(checkout)"></button>
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Details" [routerLink]="['/checkouts', checkout.id]"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="text-center p-4">
                <div class="empty-state">
                  <i class="pi pi-check-circle"></i>
                  <h3>No Overdue Items</h3>
                  <p>All equipment has been returned on time</p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Reminder Dialog -->
      <p-dialog
        [(visible)]="reminderDialogVisible"
        header="Send Return Reminder"
        [modal]="true"
        [style]="{ width: '450px' }"
      >
        @if (selectedCheckout) {
          <div class="reminder-info">
            <div class="checkout-details">
              <strong>{{ selectedCheckout.itemName }}</strong>
              <p>Checked out by: {{ selectedCheckout.checkedOutByName }}</p>
              <p class="overdue-text">{{ selectedCheckout.daysOverdue }} days overdue</p>
            </div>
          </div>
        }

        <div class="form-group">
          <label>Reminder Method</label>
          <p-select
            [options]="reminderMethodOptions"
            [(ngModel)]="reminderForm.method"
            [style]="{'width': '100%'}"
          ></p-select>
        </div>
        <div class="form-group">
          <label>Message (optional)</label>
          <textarea pTextarea [(ngModel)]="reminderForm.customMessage" rows="3" placeholder="Add a custom message..."></textarea>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="reminderDialogVisible = false"></button>
          <button pButton label="Send Reminder" icon="pi pi-send" (click)="sendReminder()" [loading]="sending()"></button>
        </ng-template>
      </p-dialog>

      <!-- Extend Dialog -->
      <p-dialog
        [(visible)]="extendDialogVisible"
        header="Extend Checkout"
        [modal]="true"
        [style]="{ width: '400px' }"
      >
        @if (selectedCheckout) {
          <div class="extend-info">
            <p>Item: <strong>{{ selectedCheckout.itemName }}</strong></p>
            <p>Current due date: <strong>{{ selectedCheckout.expectedReturnDate | date:'mediumDate' }}</strong></p>
          </div>
        }

        <div class="form-group">
          <label>New Return Date *</label>
          <p-datepicker [(ngModel)]="extendForm.newDate" [minDate]="minDate" [showIcon]="true" [style]="{'width': '100%'}"></p-datepicker>
        </div>
        <div class="form-group">
          <label>Reason *</label>
          <textarea pTextarea [(ngModel)]="extendForm.reason" rows="2" placeholder="Reason for extension"></textarea>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="extendDialogVisible = false"></button>
          <button pButton label="Extend" icon="pi pi-clock" (click)="performExtend()" [loading]="sending()"></button>
        </ng-template>
      </p-dialog>

      <!-- Checkin Dialog -->
      <p-dialog
        [(visible)]="checkinDialogVisible"
        header="Check In Equipment"
        [modal]="true"
        [style]="{ width: '400px' }"
      >
        @if (selectedCheckout) {
          <div class="checkin-info">
            <p>Item: <strong>{{ selectedCheckout.itemName }}</strong></p>
            <p>Was {{ selectedCheckout.daysOverdue }} days overdue</p>
          </div>
        }

        <div class="form-group">
          <label>Return Condition *</label>
          <p-select
            [options]="conditionOptions"
            [(ngModel)]="checkinForm.returnCondition"
            placeholder="Select condition"
            [style]="{'width': '100%'}"
          ></p-select>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea pTextarea [(ngModel)]="checkinForm.returnNotes" rows="2" placeholder="Any notes about the return..."></textarea>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="checkinDialogVisible = false"></button>
          <button pButton label="Complete Check-In" icon="pi pi-check" (click)="performCheckin()" [loading]="sending()"></button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .overdue-dashboard {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;

      .header-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        h1 {
          margin: 0 0 0.25rem 0;
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .subtitle {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
      }

      .header-actions {
        display: flex;
        gap: 0.5rem;
      }
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .summary-card {
      position: relative;
      padding: 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition-fast);
      overflow: hidden;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      &.active {
        border-color: var(--primary-500);
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
      }

      .card-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1;
      }

      .card-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-top: 0.5rem;
      }

      .card-icon {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 2.5rem;
        opacity: 0.1;
      }

      &.total {
        border-top: 4px solid var(--primary-500);
        .card-icon { color: var(--primary-500); }
      }

      &.warning {
        border-top: 4px solid #eab308;
        .card-icon { color: #eab308; }
      }

      &.danger {
        border-top: 4px solid #f97316;
        .card-icon { color: #f97316; }
      }

      &.critical {
        border-top: 4px solid #ef4444;
        .card-icon { color: #ef4444; }
      }
    }

    .chart-row {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 1rem;
      margin-bottom: 1.5rem;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .chart-card, .filters-card {
      padding: 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);

      h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        color: var(--text-primary);
      }
    }

    .chart-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      .w-full {
        width: 100%;
      }
    }

    .overdue-table {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    :host ::ng-deep tr.critical-row {
      background: rgba(239, 68, 68, 0.08);
    }

    :host ::ng-deep tr.danger-row {
      background: rgba(249, 115, 22, 0.05);
    }

    .item-info {
      display: flex;
      flex-direction: column;

      strong {
        color: var(--text-primary);
      }

      small {
        color: var(--text-muted);
        font-family: monospace;
      }
    }

    .user-info {
      display: flex;
      flex-direction: column;

      .user-name {
        color: var(--text-primary);
        font-weight: 500;
      }

      small {
        color: var(--text-muted);
      }
    }

    .department-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .reminder-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .no-reminder {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-style: italic;
    }

    .actions {
      display: flex;
      gap: 0.125rem;
    }

    .empty-state {
      padding: 3rem;
      text-align: center;

      i {
        font-size: 4rem;
        color: var(--primary-500);
        margin-bottom: 1rem;
      }

      h3 {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
      }

      p {
        margin: 0;
        color: var(--text-secondary);
      }
    }

    /* Dialog Styles */
    .reminder-info, .extend-info, .checkin-info {
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      margin-bottom: 1rem;

      .checkout-details {
        strong {
          color: var(--text-primary);
          font-size: 1.1rem;
        }

        p {
          margin: 0.25rem 0 0 0;
          font-size: 0.875rem;
          color: var(--text-secondary);

          &.overdue-text {
            color: #ef4444;
            font-weight: 500;
          }
        }
      }

      p {
        margin: 0.25rem 0;
        font-size: 0.875rem;
        color: var(--text-secondary);

        strong {
          color: var(--text-primary);
        }
      }
    }

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      textarea {
        width: 100%;
      }
    }
  `]
})
export class OverdueDashboardComponent implements OnInit {
  private readonly checkoutService = inject(CheckoutService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  summary = signal<OverdueCheckoutSummary | null>(null);
  overdueCheckouts = signal<Checkout[]>([]);
  filteredCheckouts = signal<Checkout[]>([]);
  loading = signal(false);
  sending = signal(false);

  selectedCheckouts: Checkout[] = [];
  selectedCheckout: Checkout | null = null;
  activeFilter: string | null = null;

  reminderDialogVisible = false;
  extendDialogVisible = false;
  checkinDialogVisible = false;

  minDate = new Date();

  departmentChartData: any = null;
  chartOptions = {
    plugins: {
      legend: {
        position: 'right'
      }
    },
    maintainAspectRatio: false
  };

  reminderMethodOptions = [
    { label: 'Email', value: 'email' },
    { label: 'SMS', value: 'sms' },
    { label: 'Both', value: 'both' }
  ];

  conditionOptions = [
    { label: 'Excellent', value: 'excellent' },
    { label: 'Good', value: 'good' },
    { label: 'Fair', value: 'fair' },
    { label: 'Poor', value: 'poor' },
    { label: 'Damaged', value: 'damaged' }
  ];

  reminderForm = {
    method: 'email' as 'email' | 'sms' | 'both',
    customMessage: ''
  };

  extendForm = {
    newDate: null as Date | null,
    reason: ''
  };

  checkinForm = {
    returnCondition: '',
    returnNotes: ''
  };

  ngOnInit(): void {
    this.loadOverdueData();
  }

  loadOverdueData(): void {
    this.loading.set(true);
    this.checkoutService.getOverdueCheckouts().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.overdueCheckouts.set(data.overdueCheckouts);
        this.applyFilter();
        this.buildDepartmentChart(data.overdueCheckouts);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load overdue data' });
      }
    });
  }

  buildDepartmentChart(checkouts: Checkout[]): void {
    const deptCounts = checkouts.reduce((acc, c) => {
      const dept = c.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(deptCounts);
    const data = Object.values(deptCounts);
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
      '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'
    ];

    this.departmentChartData = {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        hoverBackgroundColor: colors.slice(0, labels.length).map(c => c + 'dd')
      }]
    };
  }

  filterByRange(range: string | null): void {
    this.activeFilter = range;
    this.applyFilter();
  }

  applyFilter(): void {
    const all = this.overdueCheckouts();
    if (!this.activeFilter) {
      this.filteredCheckouts.set(all);
      return;
    }

    let filtered: Checkout[];
    switch (this.activeFilter) {
      case '1-7':
        filtered = all.filter(c => c.daysOverdue >= 1 && c.daysOverdue <= 7);
        break;
      case '8-14':
        filtered = all.filter(c => c.daysOverdue >= 8 && c.daysOverdue <= 14);
        break;
      case '15+':
        filtered = all.filter(c => c.daysOverdue >= 15);
        break;
      default:
        filtered = all;
    }
    this.filteredCheckouts.set(filtered);
  }

  getRowClass(checkout: Checkout): string {
    if (checkout.daysOverdue >= 15) return 'critical-row';
    if (checkout.daysOverdue >= 8) return 'danger-row';
    return '';
  }

  getOverdueSeverity(days: number): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    if (days >= 15) return 'danger';
    if (days >= 8) return 'warn';
    return 'info';
  }

  showReminderDialog(checkout: Checkout): void {
    this.selectedCheckout = checkout;
    this.reminderForm = { method: 'email', customMessage: '' };
    this.reminderDialogVisible = true;
  }

  showExtendDialog(checkout: Checkout): void {
    this.selectedCheckout = checkout;
    this.extendForm = { newDate: null, reason: '' };
    this.extendDialogVisible = true;
  }

  showCheckinDialog(checkout: Checkout): void {
    this.selectedCheckout = checkout;
    this.checkinForm = { returnCondition: '', returnNotes: '' };
    this.checkinDialogVisible = true;
  }

  sendReminder(): void {
    if (!this.selectedCheckout) return;

    this.sending.set(true);
    this.checkoutService.sendReminder({
      checkoutId: this.selectedCheckout.id,
      method: this.reminderForm.method,
      customMessage: this.reminderForm.customMessage
    }).subscribe({
      next: (result) => {
        this.messageService.add({ severity: 'success', summary: 'Sent', detail: result.message });
        this.reminderDialogVisible = false;
        this.sending.set(false);
      },
      error: () => {
        this.sending.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to send reminder' });
      }
    });
  }

  sendBulkReminders(): void {
    this.confirmationService.confirm({
      message: `Send reminders to ${this.selectedCheckouts.length} users?`,
      header: 'Confirm Bulk Reminders',
      icon: 'pi pi-envelope',
      accept: () => {
        const ids = this.selectedCheckouts.map(c => c.id);
        this.checkoutService.sendBulkReminders(ids, 'email').subscribe({
          next: (result) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Reminders Sent',
              detail: `${result.sent} reminder(s) sent`
            });
            this.selectedCheckouts = [];
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to send reminders' });
          }
        });
      }
    });
  }

  sendRemindersToAll(): void {
    const overdue = this.overdueCheckouts();
    if (overdue.length === 0) {
      this.messageService.add({ severity: 'info', summary: 'Info', detail: 'No overdue checkouts' });
      return;
    }

    this.confirmationService.confirm({
      message: `Send reminders to all ${overdue.length} overdue checkouts?`,
      header: 'Confirm Send All',
      icon: 'pi pi-envelope',
      accept: () => {
        const ids = overdue.map(c => c.id);
        this.checkoutService.sendBulkReminders(ids, 'email').subscribe({
          next: (result) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Reminders Sent',
              detail: `${result.sent} reminder(s) sent to all overdue users`
            });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to send reminders' });
          }
        });
      }
    });
  }

  performExtend(): void {
    if (!this.selectedCheckout || !this.extendForm.newDate || !this.extendForm.reason) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please fill all fields' });
      return;
    }

    this.sending.set(true);
    this.checkoutService.extendCheckout(
      this.selectedCheckout.id,
      this.extendForm.newDate.toISOString(),
      this.extendForm.reason
    ).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Checkout extended' });
        this.extendDialogVisible = false;
        this.loadOverdueData();
        this.sending.set(false);
      },
      error: () => {
        this.sending.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to extend checkout' });
      }
    });
  }

  performCheckin(): void {
    if (!this.selectedCheckout || !this.checkinForm.returnCondition) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please select return condition' });
      return;
    }

    this.sending.set(true);
    this.checkoutService.checkin(this.selectedCheckout.id, this.checkinForm).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Equipment checked in' });
        this.checkinDialogVisible = false;
        this.loadOverdueData();
        this.sending.set(false);
      },
      error: () => {
        this.sending.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to check in' });
      }
    });
  }

  exportReport(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Export',
      detail: 'Generating overdue report...'
    });
  }

  escalateCritical(): void {
    const critical = this.overdueCheckouts().filter(c => c.daysOverdue >= 15);
    if (critical.length === 0) {
      this.messageService.add({ severity: 'info', summary: 'Info', detail: 'No critical overdue items' });
      return;
    }

    this.confirmationService.confirm({
      message: `Escalate ${critical.length} critical overdue item(s) to management?`,
      header: 'Confirm Escalation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Escalated',
          detail: `${critical.length} critical item(s) escalated to management`
        });
      }
    });
  }
}
