import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ShipmentService } from '@core/services/shipment.service';
import { ReturnRequest, ReturnRequestStatus, ReturnReason } from '@shared/models';

@Component({
  selector: 'app-return-list',
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
    Textarea,
    DatePickerModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  template: `
    <div class="return-list">
      <div class="page-header">
        <div class="header-content">
          <h1>Return Requests</h1>
          <p class="subtitle">Manage equipment return requests</p>
        </div>
        <div class="header-actions">
          <button pButton label="View Overdue" icon="pi pi-exclamation-triangle" class="p-button-outlined p-button-warning" (click)="showOverdue()"></button>
          <button pButton label="New Return Request" icon="pi pi-plus" (click)="showCreateDialog()"></button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <p-select
          [options]="statusOptions"
          [(ngModel)]="selectedStatus"
          placeholder="Filter by Status"
          [showClear]="true"
          (onChange)="loadReturns()"
        ></p-select>
      </div>

      <!-- Returns Table -->
      <div class="returns-table">
        <p-table [value]="returns()" [loading]="loading()" styleClass="p-datatable-sm" [rowHover]="true">
          <ng-template pTemplate="header">
            <tr>
              <th>Return #</th>
              <th>Requestor</th>
              <th>Reason</th>
              <th>Items</th>
              <th>Requested</th>
              <th>Expected Return</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-returnReq>
            <tr [class.overdue]="isOverdue(returnReq)">
              <td>
                <span class="return-link">{{ returnReq.returnNumber }}</span>
              </td>
              <td>
                <div class="requestor-info">
                  <strong>{{ returnReq.requestorName }}</strong>
                  @if (returnReq.requestorEmail) {
                    <small>{{ returnReq.requestorEmail }}</small>
                  }
                </div>
              </td>
              <td>
                <p-tag [value]="getReasonLabel(returnReq.reason)" [severity]="getReasonSeverity(returnReq.reason)"></p-tag>
              </td>
              <td>
                <span class="item-count">{{ returnReq.items.length }} item(s)</span>
              </td>
              <td>{{ returnReq.requestedAt | date:'mediumDate' }}</td>
              <td>
                @if (returnReq.expectedReturnDate) {
                  <span [class.overdue-date]="isOverdue(returnReq)">
                    {{ returnReq.expectedReturnDate | date:'mediumDate' }}
                    @if (isOverdue(returnReq)) {
                      <span class="overdue-badge">Overdue</span>
                    }
                  </span>
                } @else {
                  <span class="not-set">Not set</span>
                }
              </td>
              <td>
                <p-tag [value]="getStatusLabel(returnReq.status)" [severity]="getStatusSeverity(returnReq.status)"></p-tag>
              </td>
              <td>
                <div class="actions">
                  @if (returnReq.status === 'pending') {
                    <button pButton icon="pi pi-check" class="p-button-text p-button-success p-button-sm" pTooltip="Approve" (click)="approveReturn(returnReq)"></button>
                  }
                  @if (returnReq.status === 'approved' || returnReq.status === 'return_label_sent' || returnReq.status === 'in_transit') {
                    <button pButton icon="pi pi-inbox" class="p-button-text p-button-success p-button-sm" pTooltip="Receive" (click)="showReceiveDialog(returnReq)"></button>
                  }
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Details"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="text-center p-4">No return requests found</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Create Return Dialog -->
      <p-dialog [(visible)]="createDialogVisible" header="New Return Request" [modal]="true" [style]="{ width: '500px' }">
        <div class="form-group">
          <label>Requestor Name *</label>
          <input pInputText [(ngModel)]="createForm.requestorName" placeholder="Enter name" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input pInputText [(ngModel)]="createForm.requestorEmail" placeholder="Enter email" type="email" />
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input pInputText [(ngModel)]="createForm.requestorPhone" placeholder="Enter phone" />
        </div>
        <div class="form-group">
          <label>Return Reason *</label>
          <p-select
            [options]="reasonOptions"
            [(ngModel)]="createForm.reason"
            placeholder="Select reason"
            [style]="{'width': '100%'}"
          ></p-select>
        </div>
        <div class="form-group">
          <label>Reason Details</label>
          <textarea pTextarea [(ngModel)]="createForm.reasonDetails" rows="3" placeholder="Provide additional details"></textarea>
        </div>
        <div class="form-group">
          <label>Expected Return Date</label>
          <p-datepicker [(ngModel)]="createForm.expectedReturnDate" [showIcon]="true" [style]="{'width': '100%'}"></p-datepicker>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="createDialogVisible = false"></button>
          <button pButton label="Submit Request" (click)="createReturn()" [loading]="saving()"></button>
        </ng-template>
      </p-dialog>

      <!-- Receive Return Dialog -->
      <p-dialog [(visible)]="receiveDialogVisible" header="Receive Return" [modal]="true" [style]="{ width: '500px' }">
        <div class="form-group">
          <label>Inspection Notes</label>
          <textarea pTextarea [(ngModel)]="receiveForm.inspectionNotes" rows="3" placeholder="Enter inspection notes"></textarea>
        </div>
        <div class="form-group">
          <label>Inspection Result *</label>
          <p-select
            [options]="inspectionOptions"
            [(ngModel)]="receiveForm.inspectionPassed"
            placeholder="Select result"
            [style]="{'width': '100%'}"
          ></p-select>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="receiveDialogVisible = false"></button>
          <button pButton label="Complete Receive" (click)="receiveReturn()" [loading]="saving()"></button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .return-list {
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
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .returns-table {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    :host ::ng-deep tr.overdue {
      background: rgba(244, 63, 94, 0.05);
    }

    .return-link {
      color: var(--primary-600);
      font-weight: 500;
    }

    .requestor-info {
      display: flex;
      flex-direction: column;

      strong {
        color: var(--text-primary);
      }

      small {
        color: var(--text-muted);
      }
    }

    .item-count {
      color: var(--text-secondary);
    }

    .not-set {
      color: var(--text-muted);
      font-style: italic;
    }

    .overdue-date {
      color: var(--alert-600);
    }

    .overdue-badge {
      display: inline-block;
      margin-left: 0.5rem;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      background: rgba(244, 63, 94, 0.2);
      color: var(--alert-600);
      border-radius: var(--radius-sm);
    }

    .actions {
      display: flex;
      gap: 0.25rem;
    }

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      input, textarea {
        width: 100%;
      }
    }
  `]
})
export class ReturnListComponent implements OnInit {
  private readonly shipmentService = inject(ShipmentService);
  private readonly messageService = inject(MessageService);

  returns = signal<ReturnRequest[]>([]);
  loading = signal(false);
  saving = signal(false);

  selectedStatus: ReturnRequestStatus | null = null;
  createDialogVisible = false;
  receiveDialogVisible = false;

  selectedReturn: ReturnRequest | null = null;

  statusOptions = [
    { label: 'Pending', value: ReturnRequestStatus.PENDING },
    { label: 'Approved', value: ReturnRequestStatus.APPROVED },
    { label: 'Label Sent', value: ReturnRequestStatus.LABEL_SENT },
    { label: 'In Transit', value: ReturnRequestStatus.IN_TRANSIT },
    { label: 'Received', value: ReturnRequestStatus.RECEIVED },
    { label: 'Completed', value: ReturnRequestStatus.COMPLETED }
  ];

  reasonOptions = [
    { label: 'End of Use', value: ReturnReason.END_OF_USE },
    { label: 'Defective', value: ReturnReason.DEFECTIVE },
    { label: 'Exchange', value: ReturnReason.EXCHANGE },
    { label: 'Recall', value: ReturnReason.RECALL },
    { label: 'Other', value: ReturnReason.OTHER }
  ];

  inspectionOptions = [
    { label: 'Passed - Item in good condition', value: true },
    { label: 'Failed - Item damaged or defective', value: false }
  ];

  createForm = {
    requestorName: '',
    requestorEmail: '',
    requestorPhone: '',
    reason: ReturnReason.END_OF_USE,
    reasonDetails: '',
    expectedReturnDate: null as Date | null
  };

  receiveForm = {
    inspectionNotes: '',
    inspectionPassed: null as boolean | null
  };

  ngOnInit(): void {
    this.loadReturns();
  }

  loadReturns(): void {
    this.loading.set(true);
    this.shipmentService.getReturnRequests({
      status: this.selectedStatus || undefined
    }).subscribe({
      next: (response) => {
        this.returns.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load returns' });
      }
    });
  }

  isOverdue(returnReq: ReturnRequest): boolean {
    if (!returnReq.expectedReturnDate) return false;
    if ([ReturnRequestStatus.RECEIVED, ReturnRequestStatus.COMPLETED, ReturnRequestStatus.CANCELLED].includes(returnReq.status)) {
      return false;
    }
    return new Date() > new Date(returnReq.expectedReturnDate);
  }

  getStatusLabel(status: ReturnRequestStatus): string {
    const labels: Record<ReturnRequestStatus, string> = {
      [ReturnRequestStatus.PENDING]: 'Pending',
      [ReturnRequestStatus.APPROVED]: 'Approved',
      [ReturnRequestStatus.LABEL_SENT]: 'Label Sent',
      [ReturnRequestStatus.IN_TRANSIT]: 'In Transit',
      [ReturnRequestStatus.RECEIVED]: 'Received',
      [ReturnRequestStatus.INSPECTED]: 'Inspected',
      [ReturnRequestStatus.COMPLETED]: 'Completed',
      [ReturnRequestStatus.CANCELLED]: 'Cancelled'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: ReturnRequestStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case ReturnRequestStatus.PENDING: return 'warn';
      case ReturnRequestStatus.APPROVED:
      case ReturnRequestStatus.LABEL_SENT:
      case ReturnRequestStatus.IN_TRANSIT: return 'info';
      case ReturnRequestStatus.RECEIVED:
      case ReturnRequestStatus.INSPECTED:
      case ReturnRequestStatus.COMPLETED: return 'success';
      case ReturnRequestStatus.CANCELLED: return 'danger';
      default: return 'secondary';
    }
  }

  getReasonLabel(reason: ReturnReason): string {
    const labels: Record<ReturnReason, string> = {
      [ReturnReason.END_OF_USE]: 'End of Use',
      [ReturnReason.DEFECTIVE]: 'Defective',
      [ReturnReason.EXCHANGE]: 'Exchange',
      [ReturnReason.RECALL]: 'Recall',
      [ReturnReason.OTHER]: 'Other'
    };
    return labels[reason] || reason;
  }

  getReasonSeverity(reason: ReturnReason): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (reason) {
      case ReturnReason.END_OF_USE: return 'info';
      case ReturnReason.DEFECTIVE: return 'danger';
      case ReturnReason.EXCHANGE: return 'warn';
      case ReturnReason.RECALL: return 'danger';
      default: return 'secondary';
    }
  }

  showOverdue(): void {
    this.shipmentService.getReturnRequests({ overdueOnly: true }).subscribe({
      next: (response) => {
        this.returns.set(response.items);
        this.messageService.add({ severity: 'info', summary: 'Filter Applied', detail: 'Showing overdue returns' });
      }
    });
  }

  showCreateDialog(): void {
    this.createForm = {
      requestorName: '',
      requestorEmail: '',
      requestorPhone: '',
      reason: ReturnReason.END_OF_USE,
      reasonDetails: '',
      expectedReturnDate: null
    };
    this.createDialogVisible = true;
  }

  showReceiveDialog(returnReq: ReturnRequest): void {
    this.selectedReturn = returnReq;
    this.receiveForm = {
      inspectionNotes: '',
      inspectionPassed: null
    };
    this.receiveDialogVisible = true;
  }

  createReturn(): void {
    if (!this.createForm.requestorName || !this.createForm.reason) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please fill required fields' });
      return;
    }

    this.saving.set(true);
    this.shipmentService.createReturnRequest({
      requestorName: this.createForm.requestorName,
      requestorEmail: this.createForm.requestorEmail,
      requestorPhone: this.createForm.requestorPhone,
      reason: this.createForm.reason,
      reasonDetails: this.createForm.reasonDetails,
      expectedReturnDate: this.createForm.expectedReturnDate?.toISOString(),
      items: [] // In real implementation, this would include item selection
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Return request created' });
        this.createDialogVisible = false;
        this.loadReturns();
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create return request' });
      }
    });
  }

  approveReturn(returnReq: ReturnRequest): void {
    this.shipmentService.approveReturnRequest(returnReq.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Return request approved' });
        this.loadReturns();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to approve return' });
      }
    });
  }

  receiveReturn(): void {
    if (!this.selectedReturn || this.receiveForm.inspectionPassed === null) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please select inspection result' });
      return;
    }

    this.saving.set(true);
    this.shipmentService.receiveReturn(
      this.selectedReturn.id,
      this.receiveForm.inspectionNotes,
      this.receiveForm.inspectionPassed
    ).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Return received' });
        this.receiveDialogVisible = false;
        this.loadReturns();
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to receive return' });
      }
    });
  }
}
