import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { Textarea } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CheckoutService, CheckoutAuditEvent } from '@core/services/checkout.service';
import { Checkout, CheckoutStatus } from '@shared/models';

@Component({
  selector: 'app-checkout-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    TagModule,
    TimelineModule,
    ToastModule,
    DialogModule,
    SelectModule,
    DatePickerModule,
    Textarea,
    TooltipModule,
    ConfirmDialogModule,
    DividerModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="checkout-detail">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button pButton icon="pi pi-arrow-left" class="p-button-text" (click)="goBack()"></button>
          <div class="header-info">
            <h1>Checkout Details</h1>
            @if (checkout()) {
              <span class="checkout-id">#{{ checkout()?.id }}</span>
            }
          </div>
        </div>
        @if (checkout() && (checkout()?.status === 'active' || checkout()?.status === 'overdue')) {
          <div class="header-actions">
            <button pButton label="Send Reminder" icon="pi pi-envelope" class="p-button-outlined" (click)="showReminderDialog()"></button>
            <button pButton label="Extend" icon="pi pi-clock" class="p-button-outlined" (click)="showExtendDialog()"></button>
            <button pButton label="Check In" icon="pi pi-sign-in" class="p-button-success" (click)="showCheckinDialog()"></button>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
          <p>Loading checkout details...</p>
        </div>
      } @else if (checkout()) {
        <div class="detail-grid">
          <!-- Main Content -->
          <div class="main-column">
            <!-- Item Card -->
            <div class="detail-card">
              <div class="card-header">
                <div class="item-info">
                  <h2>{{ checkout()?.itemName }}</h2>
                  <span class="sku">{{ checkout()?.itemSku }}</span>
                </div>
                <p-tag
                  [value]="getStatusLabel(checkout()?.status)"
                  [severity]="getStatusSeverity(checkout()?.status)"
                  [style]="{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }"
                ></p-tag>
              </div>

              @if (checkout()?.isOverdue) {
                <div class="overdue-alert">
                  <i class="pi pi-exclamation-triangle"></i>
                  <span>This item is <strong>{{ checkout()?.daysOverdue }} days overdue</strong>. Please return or extend immediately.</span>
                </div>
              }

              <p-divider></p-divider>

              <!-- Checkout Information -->
              <div class="info-section">
                <h3>Checkout Information</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Checked Out By</label>
                    <div class="info-value">
                      <strong>{{ checkout()?.checkedOutByName }}</strong>
                      @if (checkout()?.checkedOutByEmail) {
                        <small>{{ checkout()?.checkedOutByEmail }}</small>
                      }
                    </div>
                  </div>
                  <div class="info-item">
                    <label>Department</label>
                    <span class="info-value">{{ checkout()?.department || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Purpose</label>
                    <span class="info-value">{{ checkout()?.purpose || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Quantity</label>
                    <span class="info-value">{{ checkout()?.quantity }}</span>
                  </div>
                  @if (checkout()?.lotNumber) {
                    <div class="info-item">
                      <label>Lot Number</label>
                      <span class="info-value monospace">{{ checkout()?.lotNumber }}</span>
                    </div>
                  }
                </div>
              </div>

              <p-divider></p-divider>

              <!-- Dates -->
              <div class="info-section">
                <h3>Dates</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Checkout Date</label>
                    <span class="info-value">{{ checkout()?.checkoutDate | date:'medium' }}</span>
                  </div>
                  <div class="info-item" [class.overdue-date]="checkout()?.isOverdue">
                    <label>Expected Return</label>
                    <span class="info-value">{{ checkout()?.expectedReturnDate | date:'medium' }}</span>
                  </div>
                  @if (checkout()?.actualReturnDate) {
                    <div class="info-item">
                      <label>Actual Return</label>
                      <span class="info-value success">{{ checkout()?.actualReturnDate | date:'medium' }}</span>
                    </div>
                  }
                  <div class="info-item">
                    <label>Duration</label>
                    <span class="info-value">{{ getCheckoutDuration() }} days</span>
                  </div>
                </div>
              </div>

              <!-- Return Information (if returned) -->
              @if (checkout()?.status === 'returned') {
                <p-divider></p-divider>
                <div class="info-section">
                  <h3>Return Information</h3>
                  <div class="info-grid">
                    <div class="info-item">
                      <label>Returned By</label>
                      <span class="info-value">{{ checkout()?.checkedInByName }}</span>
                    </div>
                    <div class="info-item">
                      <label>Return Condition</label>
                      <p-tag
                        [value]="checkout()?.returnCondition || 'N/A'"
                        [severity]="getConditionSeverity(checkout()?.returnCondition)"
                      ></p-tag>
                    </div>
                    @if (checkout()?.returnNotes) {
                      <div class="info-item full-width">
                        <label>Return Notes</label>
                        <span class="info-value">{{ checkout()?.returnNotes }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Add Note Section -->
            <div class="detail-card note-card">
              <h3>Add Note</h3>
              <div class="note-form">
                <textarea
                  pTextarea
                  [(ngModel)]="newNote"
                  rows="2"
                  placeholder="Add a note to this checkout..."
                  [style]="{'width': '100%'}"
                ></textarea>
                <button pButton label="Add Note" icon="pi pi-plus" class="p-button-sm" [disabled]="!newNote.trim()" (click)="addNote()" [loading]="addingNote()"></button>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="side-column">
            <!-- Activity Timeline -->
            <div class="detail-card">
              <h3>Activity Timeline</h3>
              @if (auditEvents().length > 0) {
                <p-timeline [value]="auditEvents()" align="left">
                  <ng-template pTemplate="marker" let-event>
                    <span class="timeline-marker" [class]="getEventClass(event.eventType)">
                      <i [class]="getEventIcon(event.eventType)"></i>
                    </span>
                  </ng-template>
                  <ng-template pTemplate="content" let-event>
                    <div class="timeline-event">
                      <div class="event-header">
                        <strong>{{ getEventTitle(event.eventType) }}</strong>
                        <small>{{ event.timestamp | date:'short' }}</small>
                      </div>
                      <p class="event-description">{{ event.description }}</p>
                      <small class="event-user">by {{ event.performedByName }}</small>
                    </div>
                  </ng-template>
                </p-timeline>
              } @else {
                <p class="no-events">No activity recorded yet</p>
              }
            </div>

            <!-- Quick Stats -->
            <div class="detail-card stats-card">
              <h3>Quick Stats</h3>
              <div class="stat-item">
                <span class="stat-label">Times Extended</span>
                <span class="stat-value">{{ checkout()?.extensionCount || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Reminders Sent</span>
                <span class="stat-value">{{ getReminderCount() }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Days Since Checkout</span>
                <span class="stat-value">{{ getDaysSinceCheckout() }}</span>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="not-found">
          <i class="pi pi-inbox"></i>
          <h3>Checkout Not Found</h3>
          <p>The checkout you're looking for doesn't exist or has been removed.</p>
          <button pButton label="Back to Checkouts" [routerLink]="['/checkouts']"></button>
        </div>
      }

      <!-- Checkin Dialog -->
      <p-dialog
        [(visible)]="checkinDialogVisible"
        header="Check In Equipment"
        [modal]="true"
        [style]="{ width: '450px' }"
      >
        <div class="dialog-info">
          <p>Checking in: <strong>{{ checkout()?.itemName }}</strong></p>
        </div>

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
          <label>Return Notes</label>
          <textarea pTextarea [(ngModel)]="checkinForm.returnNotes" rows="3" placeholder="Any notes about the return..."></textarea>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="checkinDialogVisible = false"></button>
          <button pButton label="Complete Check-In" icon="pi pi-check" (click)="performCheckin()" [loading]="saving()"></button>
        </ng-template>
      </p-dialog>

      <!-- Extend Dialog -->
      <p-dialog
        [(visible)]="extendDialogVisible"
        header="Extend Checkout"
        [modal]="true"
        [style]="{ width: '450px' }"
      >
        <div class="dialog-info">
          <p>Current due date: <strong>{{ checkout()?.expectedReturnDate | date:'mediumDate' }}</strong></p>
        </div>

        <div class="form-group">
          <label>New Return Date *</label>
          <p-datepicker
            [(ngModel)]="extendForm.newDate"
            [minDate]="getExtendMinDate()"
            [showIcon]="true"
            [style]="{'width': '100%'}"
          ></p-datepicker>
        </div>
        <div class="form-group">
          <label>Reason for Extension *</label>
          <textarea pTextarea [(ngModel)]="extendForm.reason" rows="2" placeholder="Why is an extension needed?"></textarea>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="extendDialogVisible = false"></button>
          <button pButton label="Extend Checkout" icon="pi pi-clock" (click)="performExtend()" [loading]="saving()"></button>
        </ng-template>
      </p-dialog>

      <!-- Reminder Dialog -->
      <p-dialog
        [(visible)]="reminderDialogVisible"
        header="Send Return Reminder"
        [modal]="true"
        [style]="{ width: '450px' }"
      >
        <div class="dialog-info">
          <p>Send reminder to: <strong>{{ checkout()?.checkedOutByName }}</strong></p>
        </div>

        <div class="form-group">
          <label>Reminder Method</label>
          <p-select
            [options]="reminderMethodOptions"
            [(ngModel)]="reminderForm.method"
            [style]="{'width': '100%'}"
          ></p-select>
        </div>
        <div class="form-group">
          <label>Custom Message (optional)</label>
          <textarea pTextarea [(ngModel)]="reminderForm.customMessage" rows="3" placeholder="Add a personal message..."></textarea>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="reminderDialogVisible = false"></button>
          <button pButton label="Send Reminder" icon="pi pi-send" (click)="sendReminder()" [loading]="saving()"></button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .checkout-detail {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .header-info {
        h1 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .checkout-id {
          font-size: 0.875rem;
          color: var(--text-muted);
          font-family: monospace;
        }
      }

      .header-actions {
        display: flex;
        gap: 0.5rem;
      }
    }

    .loading-state, .not-found {
      text-align: center;
      padding: 4rem;
      color: var(--text-muted);

      i {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      h3 {
        margin: 1rem 0 0.5rem 0;
        color: var(--text-primary);
      }

      p {
        margin: 0 0 1rem 0;
      }
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .main-column, .side-column {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .detail-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;

      h3 {
        margin: 0 0 1rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;

      .item-info {
        h2 {
          margin: 0 0 0.25rem 0;
          font-size: 1.25rem;
          color: var(--text-primary);
        }

        .sku {
          font-size: 0.875rem;
          color: var(--text-muted);
          font-family: monospace;
        }
      }
    }

    .overdue-alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: var(--radius-md);
      margin-bottom: 1rem;

      i {
        font-size: 1.25rem;
        color: #ef4444;
      }

      span {
        font-size: 0.875rem;
        color: #b91c1c;

        strong {
          font-weight: 600;
        }
      }
    }

    .info-section {
      margin-bottom: 0.5rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .info-item {
      &.full-width {
        grid-column: span 2;
      }

      &.overdue-date .info-value {
        color: #ef4444;
        font-weight: 500;
      }

      label {
        display: block;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
      }

      .info-value {
        font-size: 0.9375rem;
        color: var(--text-primary);

        &.success {
          color: #10b981;
        }

        &.monospace {
          font-family: monospace;
        }

        strong {
          display: block;
        }

        small {
          display: block;
          color: var(--text-muted);
          font-size: 0.75rem;
        }
      }
    }

    /* Note Card */
    .note-card {
      .note-form {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-end;
      }
    }

    /* Timeline */
    :host ::ng-deep .p-timeline-event-content {
      padding-left: 1rem;
    }

    .timeline-marker {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);

      i {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      &.checkout {
        background: rgba(59, 130, 246, 0.15);
        border-color: #3b82f6;
        i { color: #3b82f6; }
      }

      &.checkin {
        background: rgba(16, 185, 129, 0.15);
        border-color: #10b981;
        i { color: #10b981; }
      }

      &.extend {
        background: rgba(139, 92, 246, 0.15);
        border-color: #8b5cf6;
        i { color: #8b5cf6; }
      }

      &.reminder_sent {
        background: rgba(245, 158, 11, 0.15);
        border-color: #f59e0b;
        i { color: #f59e0b; }
      }

      &.note_added {
        background: rgba(99, 102, 241, 0.15);
        border-color: #6366f1;
        i { color: #6366f1; }
      }
    }

    .timeline-event {
      padding-bottom: 1rem;

      .event-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.25rem;

        strong {
          font-size: 0.875rem;
          color: var(--text-primary);
        }

        small {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      }

      .event-description {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .event-user {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .no-events {
      text-align: center;
      color: var(--text-muted);
      padding: 1rem;
    }

    /* Stats Card */
    .stats-card {
      .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--border-color);

        &:last-child {
          border-bottom: none;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .stat-value {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
        }
      }
    }

    /* Dialog Styles */
    .dialog-info {
      padding: 0.75rem 1rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      margin-bottom: 1rem;

      p {
        margin: 0;
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
        font-size: 0.875rem;
        color: var(--text-primary);
      }

      textarea {
        width: 100%;
      }
    }
  `]
})
export class CheckoutDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly checkoutService = inject(CheckoutService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  checkout = signal<Checkout | null>(null);
  auditEvents = signal<CheckoutAuditEvent[]>([]);
  loading = signal(false);
  saving = signal(false);
  addingNote = signal(false);

  newNote = '';

  checkinDialogVisible = false;
  extendDialogVisible = false;
  reminderDialogVisible = false;

  conditionOptions = [
    { label: 'Excellent - Like new', value: 'excellent' },
    { label: 'Good - Normal wear', value: 'good' },
    { label: 'Fair - Minor issues', value: 'fair' },
    { label: 'Poor - Needs attention', value: 'poor' },
    { label: 'Damaged - Requires repair', value: 'damaged' }
  ];

  reminderMethodOptions = [
    { label: 'Email', value: 'email' },
    { label: 'SMS', value: 'sms' },
    { label: 'Both Email & SMS', value: 'both' }
  ];

  checkinForm = {
    returnCondition: '',
    returnNotes: ''
  };

  extendForm = {
    newDate: null as Date | null,
    reason: ''
  };

  reminderForm = {
    method: 'email' as 'email' | 'sms' | 'both',
    customMessage: ''
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCheckout(id);
    }
  }

  loadCheckout(id: string): void {
    this.loading.set(true);
    this.checkoutService.getCheckout(id).subscribe({
      next: (checkout) => {
        this.checkout.set(checkout);
        this.loadAuditEvents(id);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load checkout' });
      }
    });
  }

  loadAuditEvents(checkoutId: string): void {
    this.checkoutService.getCheckoutHistory(checkoutId).subscribe({
      next: (events) => this.auditEvents.set(events),
      error: () => console.error('Failed to load audit events')
    });
  }

  goBack(): void {
    this.router.navigate(['/checkouts']);
  }

  getStatusLabel(status?: CheckoutStatus): string {
    switch (status) {
      case CheckoutStatus.ACTIVE: return 'Active';
      case CheckoutStatus.OVERDUE: return 'Overdue';
      case CheckoutStatus.RETURNED: return 'Returned';
      default: return status || '';
    }
  }

  getStatusSeverity(status?: CheckoutStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case CheckoutStatus.ACTIVE: return 'success';
      case CheckoutStatus.OVERDUE: return 'danger';
      case CheckoutStatus.RETURNED: return 'secondary';
      default: return 'info';
    }
  }

  getConditionSeverity(condition?: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (condition) {
      case 'excellent':
      case 'good': return 'success';
      case 'fair': return 'info';
      case 'poor': return 'warn';
      case 'damaged': return 'danger';
      default: return 'secondary';
    }
  }

  getCheckoutDuration(): number {
    const c = this.checkout();
    if (!c) return 0;
    const start = new Date(c.checkoutDate);
    const end = c.actualReturnDate ? new Date(c.actualReturnDate) : new Date();
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getDaysSinceCheckout(): number {
    const c = this.checkout();
    if (!c) return 0;
    const start = new Date(c.checkoutDate);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getReminderCount(): number {
    return this.auditEvents().filter(e => e.eventType === 'reminder_sent').length;
  }

  getExtendMinDate(): Date {
    const c = this.checkout();
    if (c) {
      const current = new Date(c.expectedReturnDate);
      current.setDate(current.getDate() + 1);
      return current;
    }
    return new Date();
  }

  getEventClass(eventType: string): string {
    return eventType;
  }

  getEventIcon(eventType: string): string {
    switch (eventType) {
      case 'checkout': return 'pi pi-sign-out';
      case 'checkin': return 'pi pi-sign-in';
      case 'extend': return 'pi pi-clock';
      case 'reminder_sent': return 'pi pi-envelope';
      case 'note_added': return 'pi pi-comment';
      case 'status_change': return 'pi pi-refresh';
      default: return 'pi pi-circle';
    }
  }

  getEventTitle(eventType: string): string {
    switch (eventType) {
      case 'checkout': return 'Checked Out';
      case 'checkin': return 'Checked In';
      case 'extend': return 'Extended';
      case 'reminder_sent': return 'Reminder Sent';
      case 'note_added': return 'Note Added';
      case 'status_change': return 'Status Changed';
      default: return 'Event';
    }
  }

  // Dialog Methods
  showCheckinDialog(): void {
    this.checkinForm = { returnCondition: '', returnNotes: '' };
    this.checkinDialogVisible = true;
  }

  showExtendDialog(): void {
    this.extendForm = { newDate: null, reason: '' };
    this.extendDialogVisible = true;
  }

  showReminderDialog(): void {
    this.reminderForm = { method: 'email', customMessage: '' };
    this.reminderDialogVisible = true;
  }

  performCheckin(): void {
    const c = this.checkout();
    if (!c || !this.checkinForm.returnCondition) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please select return condition' });
      return;
    }

    this.saving.set(true);
    this.checkoutService.checkin(c.id, this.checkinForm).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Equipment checked in' });
        this.checkinDialogVisible = false;
        this.loadCheckout(c.id);
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to check in' });
      }
    });
  }

  performExtend(): void {
    const c = this.checkout();
    if (!c || !this.extendForm.newDate || !this.extendForm.reason) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please fill all fields' });
      return;
    }

    this.saving.set(true);
    this.checkoutService.extendCheckout(c.id, this.extendForm.newDate.toISOString(), this.extendForm.reason).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Checkout extended' });
        this.extendDialogVisible = false;
        this.loadCheckout(c.id);
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to extend' });
      }
    });
  }

  sendReminder(): void {
    const c = this.checkout();
    if (!c) return;

    this.saving.set(true);
    this.checkoutService.sendReminder({
      checkoutId: c.id,
      method: this.reminderForm.method,
      customMessage: this.reminderForm.customMessage
    }).subscribe({
      next: (result) => {
        this.messageService.add({ severity: 'success', summary: 'Sent', detail: result.message });
        this.reminderDialogVisible = false;
        this.loadAuditEvents(c.id);
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to send reminder' });
      }
    });
  }

  addNote(): void {
    const c = this.checkout();
    if (!c || !this.newNote.trim()) return;

    this.addingNote.set(true);
    this.checkoutService.addNote(c.id, this.newNote.trim()).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Added', detail: 'Note added successfully' });
        this.newNote = '';
        this.loadAuditEvents(c.id);
        this.addingNote.set(false);
      },
      error: () => {
        this.addingNote.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to add note' });
      }
    });
  }
}
