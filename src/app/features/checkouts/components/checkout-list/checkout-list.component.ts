import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { Textarea } from 'primeng/textarea';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CheckoutService, AvailableUser, AvailableItem, CheckoutStats } from '@core/services/checkout.service';
import { Checkout, CheckoutStatus } from '@shared/models';

@Component({
  selector: 'app-checkout-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    TableModule,
    TagModule,
    SelectModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    ToastModule,
    AutoCompleteModule,
    Textarea,
    ProgressBarModule,
    TooltipModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="checkout-list">
      <div class="page-header">
        <div class="header-content">
          <h1>Equipment Checkouts</h1>
          <p class="subtitle">Track equipment checked out to staff members</p>
        </div>
        <div class="header-actions">
          <button pButton label="Analytics" icon="pi pi-chart-bar" class="p-button-outlined" [routerLink]="['../reports']"></button>
          <button pButton label="View Overdue" icon="pi pi-exclamation-triangle" class="p-button-outlined p-button-warning" [routerLink]="['overdue']">
            @if (stats()?.totalOverdue) {
              <span class="overdue-count">{{ stats()?.totalOverdue }}</span>
            }
          </button>
          <button pButton label="New Checkout" icon="pi pi-plus" (click)="showCheckoutDialog()"></button>
        </div>
      </div>

      <!-- Summary Cards -->
      @if (stats()) {
        <div class="summary-cards">
          <div class="summary-card active">
            <div class="card-icon">
              <i class="pi pi-sign-out"></i>
            </div>
            <div class="card-content">
              <span class="card-value">{{ stats()!.totalActive }}</span>
              <span class="card-label">Active Checkouts</span>
            </div>
          </div>
          <div class="summary-card overdue">
            <div class="card-icon">
              <i class="pi pi-exclamation-triangle"></i>
            </div>
            <div class="card-content">
              <span class="card-value">{{ stats()!.totalOverdue }}</span>
              <span class="card-label">Overdue</span>
            </div>
          </div>
          <div class="summary-card returned">
            <div class="card-icon">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="card-content">
              <span class="card-value">{{ stats()!.totalReturnedToday }}</span>
              <span class="card-label">Returned Today</span>
            </div>
          </div>
          <div class="summary-card average">
            <div class="card-icon">
              <i class="pi pi-clock"></i>
            </div>
            <div class="card-content">
              <span class="card-value">{{ stats()!.avgCheckoutDuration | number:'1.1-1' }}</span>
              <span class="card-label">Avg Days Out</span>
            </div>
          </div>
        </div>
      }

      <!-- Filters Bar -->
      <div class="filters-bar">
        <div class="search-box">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <input
              pInputText
              [(ngModel)]="searchQuery"
              placeholder="Search items, users..."
              (input)="onSearch()"
            />
          </span>
        </div>
        <div class="filter-controls">
          <p-select
            [options]="statusOptions"
            [(ngModel)]="selectedStatus"
            placeholder="Status"
            [showClear]="true"
            (onChange)="loadCheckouts()"
          ></p-select>
          <p-select
            [options]="departmentOptions"
            [(ngModel)]="selectedDepartment"
            placeholder="Department"
            [showClear]="true"
            (onChange)="loadCheckouts()"
          ></p-select>
          <button pButton icon="pi pi-filter-slash" class="p-button-outlined p-button-secondary" pTooltip="Clear Filters" (click)="clearFilters()"></button>
        </div>
      </div>

      <!-- Checkouts Table -->
      <div class="checkouts-table">
        <p-table
          [value]="checkouts()"
          [loading]="loading()"
          styleClass="p-datatable-sm"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} checkouts"
          [(selection)]="selectedCheckouts"
          dataKey="id"
        >
          <ng-template pTemplate="caption">
            <div class="table-caption">
              <span>{{ checkouts().length }} checkout(s)</span>
              @if (selectedCheckouts.length > 0) {
                <div class="bulk-actions">
                  <span class="selection-info">{{ selectedCheckouts.length }} selected</span>
                  <button pButton label="Send Reminders" icon="pi pi-envelope" class="p-button-sm p-button-outlined" (click)="sendBulkReminders()"></button>
                </div>
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
              <th pSortableColumn="checkoutDate">Checkout Date <p-sortIcon field="checkoutDate"></p-sortIcon></th>
              <th pSortableColumn="expectedReturnDate">Expected Return <p-sortIcon field="expectedReturnDate"></p-sortIcon></th>
              <th>Status</th>
              <th style="width: 140px">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-checkout>
            <tr [class.overdue-row]="checkout.isOverdue">
              <td>
                <p-tableCheckbox [value]="checkout"></p-tableCheckbox>
              </td>
              <td>
                <div class="item-info">
                  <div class="item-details">
                    <strong>{{ checkout.itemName }}</strong>
                    <small>{{ checkout.itemSku }}</small>
                  </div>
                  @if (checkout.quantity > 1) {
                    <span class="quantity-badge">x{{ checkout.quantity }}</span>
                  }
                </div>
              </td>
              <td>
                <div class="user-info">
                  <span class="user-name">{{ checkout.checkedOutByName }}</span>
                  @if (checkout.checkedOutByEmail) {
                    <small class="user-email">{{ checkout.checkedOutByEmail }}</small>
                  }
                </div>
              </td>
              <td>
                <span class="department-badge">{{ checkout.department || 'N/A' }}</span>
              </td>
              <td>{{ checkout.checkoutDate | date:'mediumDate' }}</td>
              <td>
                <div class="return-date">
                  <span>{{ checkout.expectedReturnDate | date:'mediumDate' }}</span>
                  @if (checkout.isOverdue) {
                    <span class="overdue-badge">{{ checkout.daysOverdue }}d overdue</span>
                  } @else if (getDaysRemaining(checkout) <= 2 && getDaysRemaining(checkout) >= 0) {
                    <span class="due-soon-badge">{{ getDaysRemaining(checkout) }}d left</span>
                  }
                </div>
              </td>
              <td>
                <p-tag
                  [value]="getStatusLabel(checkout.status)"
                  [severity]="getStatusSeverity(checkout.status)"
                ></p-tag>
              </td>
              <td>
                <div class="actions">
                  @if (checkout.status === 'active' || checkout.status === 'overdue') {
                    <button pButton icon="pi pi-sign-in" class="p-button-text p-button-success p-button-sm" pTooltip="Check In" (click)="showCheckinDialog(checkout)"></button>
                    <button pButton icon="pi pi-clock" class="p-button-text p-button-sm" pTooltip="Extend" (click)="showExtendDialog(checkout)"></button>
                    <button pButton icon="pi pi-envelope" class="p-button-text p-button-sm" pTooltip="Send Reminder" (click)="sendReminder(checkout)"></button>
                  }
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Details" [routerLink]="[checkout.id]"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="text-center p-4">
                <div class="empty-state">
                  <i class="pi pi-inbox"></i>
                  <h3>No Checkouts Found</h3>
                  <p>No checkouts match your current filters</p>
                  <button pButton label="Create New Checkout" icon="pi pi-plus" (click)="showCheckoutDialog()"></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- New Checkout Dialog -->
      <p-dialog
        [(visible)]="checkoutDialogVisible"
        header="New Equipment Checkout"
        [modal]="true"
        [style]="{ width: '600px' }"
        [closable]="true"
      >
        <div class="checkout-form">
          <!-- Item Selection -->
          <div class="form-section">
            <h4>Equipment Selection</h4>
            <div class="form-group">
              <label>Select Item *</label>
              <p-autoComplete
                [(ngModel)]="selectedItem"
                [suggestions]="filteredItems"
                (completeMethod)="filterItems($event)"
                field="name"
                [dropdown]="true"
                placeholder="Search or scan item..."
                [style]="{'width': '100%'}"
              >
                <ng-template let-item pTemplate="item">
                  <div class="item-option">
                    <div class="item-option-details">
                      <span class="item-option-name">{{ item.name }}</span>
                      <span class="item-option-sku">{{ item.sku }}</span>
                    </div>
                    <span class="item-option-qty">{{ item.availableQuantity }} available</span>
                  </div>
                </ng-template>
              </p-autoComplete>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Quantity *</label>
                <p-inputNumber
                  [(ngModel)]="checkoutForm.quantity"
                  [min]="1"
                  [max]="selectedItem?.availableQuantity || 99"
                  [showButtons]="true"
                ></p-inputNumber>
              </div>
              <div class="form-group">
                <label>Barcode (optional)</label>
                <input pInputText [(ngModel)]="checkoutForm.barcode" placeholder="Scan barcode" />
              </div>
            </div>
          </div>

          <!-- User Selection -->
          <div class="form-section">
            <h4>Checkout To</h4>
            <div class="form-group">
              <label>Staff Member *</label>
              <p-autoComplete
                [(ngModel)]="selectedUser"
                [suggestions]="filteredUsers"
                (completeMethod)="filterUsers($event)"
                field="name"
                [dropdown]="true"
                placeholder="Search staff member..."
                [style]="{'width': '100%'}"
              >
                <ng-template let-user pTemplate="item">
                  <div class="user-option">
                    <div class="user-option-details">
                      <span class="user-option-name">{{ user.name }}</span>
                      <span class="user-option-dept">{{ user.department }} - {{ user.role }}</span>
                    </div>
                  </div>
                </ng-template>
              </p-autoComplete>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Department</label>
                <p-select
                  [options]="departmentOptions"
                  [(ngModel)]="checkoutForm.department"
                  placeholder="Select department"
                  [style]="{'width': '100%'}"
                ></p-select>
              </div>
              <div class="form-group">
                <label>Expected Return Date *</label>
                <p-datepicker
                  [(ngModel)]="checkoutForm.expectedReturnDate"
                  [minDate]="minDate"
                  [showIcon]="true"
                  [style]="{'width': '100%'}"
                ></p-datepicker>
              </div>
            </div>
          </div>

          <!-- Additional Info -->
          <div class="form-section">
            <h4>Additional Information</h4>
            <div class="form-group">
              <label>Purpose</label>
              <input pInputText [(ngModel)]="checkoutForm.purpose" placeholder="e.g., Patient care, Training" />
            </div>
            <div class="form-group">
              <label>Notes</label>
              <textarea pTextarea [(ngModel)]="checkoutForm.notes" rows="2" placeholder="Any additional notes..."></textarea>
            </div>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <button pButton label="Cancel" class="p-button-text" (click)="checkoutDialogVisible = false"></button>
            <button pButton label="Check Out Equipment" icon="pi pi-sign-out" (click)="createCheckout()" [loading]="saving()"></button>
          </div>
        </ng-template>
      </p-dialog>

      <!-- Checkin Dialog -->
      <p-dialog
        [(visible)]="checkinDialogVisible"
        header="Check In Equipment"
        [modal]="true"
        [style]="{ width: '500px' }"
      >
        @if (selectedCheckout) {
          <div class="checkin-summary">
            <div class="item-summary">
              <strong>{{ selectedCheckout.itemName }}</strong>
              <span>{{ selectedCheckout.itemSku }}</span>
            </div>
            <div class="checkout-info">
              <span>Checked out by: {{ selectedCheckout.checkedOutByName }}</span>
              <span>Duration: {{ getCheckoutDuration(selectedCheckout) }} days</span>
            </div>
          </div>
        }

        <div class="form-group">
          <label>Return Condition *</label>
          <p-select
            [options]="conditionOptions"
            [(ngModel)]="checkinForm.returnCondition"
            placeholder="Select condition"
            [style]="{'width': '100%'}"
          >
            <ng-template let-option pTemplate="item">
              <div class="condition-option">
                <i [class]="getConditionIcon(option.value)" [style.color]="getConditionColor(option.value)"></i>
                <span>{{ option.label }}</span>
              </div>
            </ng-template>
          </p-select>
        </div>
        <div class="form-group">
          <label>Return Notes</label>
          <textarea pTextarea [(ngModel)]="checkinForm.returnNotes" rows="3" placeholder="Any notes about the return condition..."></textarea>
        </div>
        @if (checkinForm.returnCondition === 'damaged' || checkinForm.returnCondition === 'poor') {
          <div class="damage-notice">
            <i class="pi pi-exclamation-triangle"></i>
            <span>A maintenance ticket will be created for inspection.</span>
          </div>
        }

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
        @if (selectedCheckout) {
          <div class="extend-info">
            <p>Current return date: <strong>{{ selectedCheckout.expectedReturnDate | date:'mediumDate' }}</strong></p>
            @if (selectedCheckout.extensionCount) {
              <p class="extension-count">This checkout has been extended {{ selectedCheckout.extensionCount }} time(s)</p>
            }
          </div>
        }

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
          <p-select
            [options]="extensionReasonOptions"
            [(ngModel)]="extendForm.reasonType"
            placeholder="Select reason"
            [style]="{'width': '100%'}"
          ></p-select>
        </div>
        <div class="form-group">
          <label>Additional Notes</label>
          <textarea pTextarea [(ngModel)]="extendForm.reason" rows="2" placeholder="Additional details..."></textarea>
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
        @if (selectedCheckout) {
          <div class="reminder-info">
            <p>Send a reminder to <strong>{{ selectedCheckout.checkedOutByName }}</strong> to return:</p>
            <p class="item-name">{{ selectedCheckout.itemName }}</p>
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
          <label>Custom Message (optional)</label>
          <textarea pTextarea [(ngModel)]="reminderForm.customMessage" rows="3" placeholder="Add a custom message to the reminder..."></textarea>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="reminderDialogVisible = false"></button>
          <button pButton label="Send Reminder" icon="pi pi-send" (click)="confirmSendReminder()" [loading]="saving()"></button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .checkout-list {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
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

    .header-actions {
      display: flex;
      gap: 0.5rem;

      .overdue-count {
        margin-left: 0.5rem;
        padding: 0.125rem 0.5rem;
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        border-radius: var(--radius-full);
        font-size: 0.75rem;
        font-weight: 600;
      }
    }

    /* Summary Cards */
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
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);

      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;

        i { font-size: 1.5rem; }
      }

      &.active .card-icon {
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
      }

      &.overdue .card-icon {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }

      &.returned .card-icon {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }

      &.average .card-icon {
        background: rgba(139, 92, 246, 0.15);
        color: #8b5cf6;
      }

      .card-content {
        display: flex;
        flex-direction: column;

        .card-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }

        .card-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }
      }
    }

    /* Filters */
    .filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
      }

      .search-box {
        flex: 1;
        max-width: 400px;

        input {
          width: 100%;
        }
      }

      .filter-controls {
        display: flex;
        gap: 0.5rem;
      }
    }

    /* Table */
    .checkouts-table {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .table-caption {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;

      .bulk-actions {
        display: flex;
        align-items: center;
        gap: 1rem;

        .selection-info {
          font-weight: 500;
          color: var(--primary-600);
        }
      }
    }

    :host ::ng-deep tr.overdue-row {
      background: rgba(239, 68, 68, 0.05);
    }

    .item-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .item-details {
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

      .quantity-badge {
        padding: 0.125rem 0.375rem;
        background: var(--primary-100);
        color: var(--primary-700);
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 600;
      }
    }

    .user-info {
      display: flex;
      flex-direction: column;

      .user-name {
        color: var(--text-primary);
        font-weight: 500;
      }

      .user-email {
        color: var(--text-muted);
        font-size: 0.75rem;
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

    .return-date {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .overdue-badge {
        display: inline-block;
        padding: 0.125rem 0.375rem;
        font-size: 0.7rem;
        font-weight: 600;
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
        border-radius: var(--radius-sm);
        width: fit-content;
      }

      .due-soon-badge {
        display: inline-block;
        padding: 0.125rem 0.375rem;
        font-size: 0.7rem;
        font-weight: 600;
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border-radius: var(--radius-sm);
        width: fit-content;
      }
    }

    .actions {
      display: flex;
      gap: 0.125rem;
    }

    .empty-state {
      padding: 3rem;
      text-align: center;

      i {
        font-size: 3rem;
        color: var(--text-muted);
        margin-bottom: 1rem;
      }

      h3 {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
      }

      p {
        margin: 0 0 1rem 0;
        color: var(--text-secondary);
      }
    }

    /* Form Styles */
    .checkout-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-section {
      h4 {
        margin: 0 0 1rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--border-color);
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 500px) {
        grid-template-columns: 1fr;
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

      input, textarea {
        width: 100%;
      }
    }

    .item-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0;

      .item-option-details {
        display: flex;
        flex-direction: column;

        .item-option-name {
          font-weight: 500;
          color: var(--text-primary);
        }

        .item-option-sku {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: monospace;
        }
      }

      .item-option-qty {
        font-size: 0.75rem;
        color: var(--primary-600);
        font-weight: 500;
      }
    }

    .user-option {
      .user-option-details {
        display: flex;
        flex-direction: column;

        .user-option-name {
          font-weight: 500;
          color: var(--text-primary);
        }

        .user-option-dept {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    /* Checkin Dialog */
    .checkin-summary {
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;

      .item-summary {
        display: flex;
        flex-direction: column;
        margin-bottom: 0.5rem;

        strong {
          color: var(--text-primary);
        }

        span {
          font-size: 0.875rem;
          color: var(--text-muted);
          font-family: monospace;
        }
      }

      .checkout-info {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    .condition-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .damage-notice {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: rgba(245, 158, 11, 0.1);
      border-radius: var(--radius-md);
      color: #b45309;
      font-size: 0.875rem;

      i {
        color: #f59e0b;
      }
    }

    /* Extend Dialog */
    .extend-info {
      padding: 1rem;
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

      .extension-count {
        margin-top: 0.5rem;
        color: var(--warning-600);
      }
    }

    /* Reminder Dialog */
    .reminder-info {
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      margin-bottom: 1rem;

      p {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .item-name {
        font-weight: 500;
        color: var(--text-primary);
      }
    }
  `]
})
export class CheckoutListComponent implements OnInit {
  private readonly checkoutService = inject(CheckoutService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  checkouts = signal<Checkout[]>([]);
  stats = signal<CheckoutStats | null>(null);
  loading = signal(false);
  saving = signal(false);

  selectedCheckouts: Checkout[] = [];
  searchQuery = '';
  selectedStatus: CheckoutStatus | null = null;
  selectedDepartment: string | null = null;

  checkoutDialogVisible = false;
  checkinDialogVisible = false;
  extendDialogVisible = false;
  reminderDialogVisible = false;

  selectedCheckout: Checkout | null = null;
  selectedItem: AvailableItem | null = null;
  selectedUser: AvailableUser | null = null;
  filteredItems: AvailableItem[] = [];
  filteredUsers: AvailableUser[] = [];

  minDate = new Date();
  departmentOptions: { label: string; value: string }[] = [];

  statusOptions = [
    { label: 'Active', value: CheckoutStatus.ACTIVE },
    { label: 'Overdue', value: CheckoutStatus.OVERDUE },
    { label: 'Returned', value: CheckoutStatus.RETURNED }
  ];

  conditionOptions = [
    { label: 'Excellent - Like new', value: 'excellent' },
    { label: 'Good - Normal wear', value: 'good' },
    { label: 'Fair - Minor issues', value: 'fair' },
    { label: 'Poor - Needs attention', value: 'poor' },
    { label: 'Damaged - Requires repair', value: 'damaged' }
  ];

  extensionReasonOptions = [
    { label: 'Ongoing patient care', value: 'patient_care' },
    { label: 'Training in progress', value: 'training' },
    { label: 'Equipment shortage', value: 'shortage' },
    { label: 'Research project', value: 'research' },
    { label: 'Other', value: 'other' }
  ];

  reminderMethodOptions = [
    { label: 'Email', value: 'email' },
    { label: 'SMS', value: 'sms' },
    { label: 'Both Email & SMS', value: 'both' }
  ];

  checkoutForm = {
    quantity: 1,
    barcode: '',
    department: '',
    purpose: '',
    expectedReturnDate: null as Date | null,
    notes: ''
  };

  checkinForm = {
    returnCondition: '',
    returnNotes: ''
  };

  extendForm = {
    newDate: null as Date | null,
    reasonType: '',
    reason: ''
  };

  reminderForm = {
    method: 'email' as 'email' | 'sms' | 'both',
    customMessage: ''
  };

  private searchTimeout: any;

  ngOnInit(): void {
    this.loadCheckouts();
    this.loadStats();
    this.loadDepartments();
  }

  loadCheckouts(): void {
    this.loading.set(true);
    this.checkoutService.getCheckouts({
      status: this.selectedStatus || undefined,
      department: this.selectedDepartment || undefined,
      search: this.searchQuery || undefined
    }).subscribe({
      next: (response) => {
        this.checkouts.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load checkouts' });
      }
    });
  }

  loadStats(): void {
    this.checkoutService.getCheckoutStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => console.error('Failed to load stats')
    });
  }

  loadDepartments(): void {
    this.checkoutService.getDepartments().subscribe({
      next: (depts) => {
        this.departmentOptions = depts.map(d => ({ label: d, value: d }));
      }
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadCheckouts();
    }, 300);
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = null;
    this.selectedDepartment = null;
    this.loadCheckouts();
  }

  getStatusLabel(status: CheckoutStatus): string {
    switch (status) {
      case CheckoutStatus.ACTIVE: return 'Active';
      case CheckoutStatus.OVERDUE: return 'Overdue';
      case CheckoutStatus.RETURNED: return 'Returned';
      default: return status;
    }
  }

  getStatusSeverity(status: CheckoutStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case CheckoutStatus.ACTIVE: return 'success';
      case CheckoutStatus.OVERDUE: return 'danger';
      case CheckoutStatus.RETURNED: return 'secondary';
      default: return 'info';
    }
  }

  getDaysRemaining(checkout: Checkout): number {
    const now = new Date();
    const returnDate = new Date(checkout.expectedReturnDate);
    const diff = returnDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getCheckoutDuration(checkout: Checkout): number {
    const start = new Date(checkout.checkoutDate);
    const end = checkout.actualReturnDate ? new Date(checkout.actualReturnDate) : new Date();
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getConditionIcon(condition: string): string {
    switch (condition) {
      case 'excellent': return 'pi pi-star-fill';
      case 'good': return 'pi pi-check-circle';
      case 'fair': return 'pi pi-info-circle';
      case 'poor': return 'pi pi-exclamation-circle';
      case 'damaged': return 'pi pi-times-circle';
      default: return 'pi pi-circle';
    }
  }

  getConditionColor(condition: string): string {
    switch (condition) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'fair': return '#f59e0b';
      case 'poor': return '#f97316';
      case 'damaged': return '#ef4444';
      default: return '#6b7280';
    }
  }

  filterItems(event: any): void {
    this.checkoutService.getAvailableItems(event.query).subscribe({
      next: (items) => this.filteredItems = items
    });
  }

  filterUsers(event: any): void {
    this.checkoutService.getAvailableUsers(event.query).subscribe({
      next: (users) => this.filteredUsers = users
    });
  }

  showCheckoutDialog(): void {
    this.selectedItem = null;
    this.selectedUser = null;
    this.checkoutForm = {
      quantity: 1,
      barcode: '',
      department: '',
      purpose: '',
      expectedReturnDate: null,
      notes: ''
    };
    this.checkoutDialogVisible = true;
  }

  showCheckinDialog(checkout: Checkout): void {
    this.selectedCheckout = checkout;
    this.checkinForm = { returnCondition: '', returnNotes: '' };
    this.checkinDialogVisible = true;
  }

  showExtendDialog(checkout: Checkout): void {
    this.selectedCheckout = checkout;
    this.extendForm = { newDate: null, reasonType: '', reason: '' };
    this.extendDialogVisible = true;
  }

  getExtendMinDate(): Date {
    if (this.selectedCheckout) {
      const current = new Date(this.selectedCheckout.expectedReturnDate);
      current.setDate(current.getDate() + 1);
      return current;
    }
    return new Date();
  }

  createCheckout(): void {
    if (!this.selectedItem || !this.selectedUser || !this.checkoutForm.expectedReturnDate) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please fill all required fields' });
      return;
    }

    this.saving.set(true);
    this.checkoutService.checkout({
      itemId: this.selectedItem.id,
      quantity: this.checkoutForm.quantity,
      checkedOutBy: this.selectedUser.id,
      department: this.checkoutForm.department || this.selectedUser.department,
      purpose: this.checkoutForm.purpose,
      expectedReturnDate: this.checkoutForm.expectedReturnDate.toISOString(),
      notes: this.checkoutForm.notes
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Equipment checked out successfully' });
        this.checkoutDialogVisible = false;
        this.loadCheckouts();
        this.loadStats();
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to checkout equipment' });
      }
    });
  }

  performCheckin(): void {
    if (!this.selectedCheckout || !this.checkinForm.returnCondition) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please select return condition' });
      return;
    }

    this.saving.set(true);
    this.checkoutService.checkin(this.selectedCheckout.id, this.checkinForm).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Equipment checked in successfully' });
        this.checkinDialogVisible = false;
        this.loadCheckouts();
        this.loadStats();
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to check in equipment' });
      }
    });
  }

  performExtend(): void {
    if (!this.selectedCheckout || !this.extendForm.newDate || !this.extendForm.reasonType) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please fill all required fields' });
      return;
    }

    const reason = this.extendForm.reason
      ? `${this.extendForm.reasonType}: ${this.extendForm.reason}`
      : this.extendForm.reasonType;

    this.saving.set(true);
    this.checkoutService.extendCheckout(
      this.selectedCheckout.id,
      this.extendForm.newDate.toISOString(),
      reason
    ).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Checkout extended successfully' });
        this.extendDialogVisible = false;
        this.loadCheckouts();
        this.loadStats();
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to extend checkout' });
      }
    });
  }

  sendReminder(checkout: Checkout): void {
    this.selectedCheckout = checkout;
    this.reminderForm = { method: 'email', customMessage: '' };
    this.reminderDialogVisible = true;
  }

  confirmSendReminder(): void {
    if (!this.selectedCheckout) return;

    this.saving.set(true);
    this.checkoutService.sendReminder({
      checkoutId: this.selectedCheckout.id,
      method: this.reminderForm.method,
      customMessage: this.reminderForm.customMessage
    }).subscribe({
      next: (result) => {
        this.messageService.add({ severity: 'success', summary: 'Reminder Sent', detail: result.message });
        this.reminderDialogVisible = false;
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to send reminder' });
      }
    });
  }

  sendBulkReminders(): void {
    this.confirmationService.confirm({
      message: `Send reminders to ${this.selectedCheckouts.length} checkout(s)?`,
      header: 'Confirm Bulk Reminders',
      icon: 'pi pi-envelope',
      accept: () => {
        const ids = this.selectedCheckouts.map(c => c.id);
        this.checkoutService.sendBulkReminders(ids, 'email').subscribe({
          next: (result) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Reminders Sent',
              detail: `${result.sent} reminder(s) sent successfully`
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
}
