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
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ShipmentService, MarkAsShippedRequest } from '@core/services/shipment.service';
import { Shipment, ShipmentStatus, ShipmentType, ShipmentSummary, RecipientInfo } from '@shared/models';

@Component({
  selector: 'app-shipment-list',
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
    CheckboxModule,
    ToastModule,
    TooltipModule
  ],
  providers: [MessageService],
  template: `
    <div class="shipment-list">
      <div class="page-header">
        <div class="header-content">
          <h1>Shipment Tracking</h1>
          <p class="subtitle">Track equipment shipments and returns</p>
        </div>
        <div class="header-actions">
          <button pButton label="View Overdue Returns" icon="pi pi-exclamation-triangle" class="p-button-outlined p-button-warning" (click)="showOverdueReturns()"></button>
          <button pButton label="New Shipment" icon="pi pi-plus" (click)="showCreateDialog()"></button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon pending">
            <i class="pi pi-clock"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.pendingShipments || 0 }}</span>
            <span class="card-label">Pending</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon transit">
            <i class="pi pi-truck"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.inTransitShipments || 0 }}</span>
            <span class="card-label">In Transit</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon delivered">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.deliveredThisMonth || 0 }}</span>
            <span class="card-label">Delivered (Month)</span>
          </div>
        </div>
        <div class="summary-card" [class.alert]="(summary()?.overdueReturns || 0) > 0">
          <div class="card-icon overdue">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.overdueReturns || 0 }}</span>
            <span class="card-label">Overdue Returns</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <span class="p-input-icon-left">
          <i class="pi pi-search"></i>
          <input pInputText [(ngModel)]="searchTerm" placeholder="Search shipments..." (keyup.enter)="loadShipments()" />
        </span>
        <p-select
          [options]="statusOptions"
          [(ngModel)]="selectedStatus"
          placeholder="Filter by Status"
          [showClear]="true"
          (onChange)="loadShipments()"
        ></p-select>
        <p-select
          [options]="typeOptions"
          [(ngModel)]="selectedType"
          placeholder="Filter by Type"
          [showClear]="true"
          (onChange)="loadShipments()"
        ></p-select>
      </div>

      <!-- Shipments Table -->
      <div class="shipments-table">
        <p-table [value]="shipments()" [loading]="loading()" styleClass="p-datatable-sm" [rowHover]="true">
          <ng-template pTemplate="header">
            <tr>
              <th>Shipment #</th>
              <th>Type</th>
              <th>Recipient</th>
              <th>Items</th>
              <th>Ship Date</th>
              <th>Expected Return</th>
              <th>Tracking</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-shipment>
            <tr [class.overdue]="isOverdueReturn(shipment)">
              <td>
                <a [routerLink]="[shipment.id]" class="shipment-link">{{ shipment.shipmentNumber }}</a>
              </td>
              <td>
                <p-tag [value]="getTypeLabel(shipment.shipmentType)" [severity]="getTypeSeverity(shipment.shipmentType)"></p-tag>
              </td>
              <td>
                <div class="recipient-info">
                  <strong>{{ shipment.recipient.name }}</strong>
                  <small>{{ shipment.recipient.organization }}</small>
                </div>
              </td>
              <td>
                <span class="item-count">{{ shipment.items.length }} item(s)</span>
              </td>
              <td>
                @if (shipment.shippedAt) {
                  {{ shipment.shippedAt | date:'mediumDate' }}
                } @else if (shipment.scheduledShipDate) {
                  <span class="scheduled">Scheduled: {{ shipment.scheduledShipDate | date:'mediumDate' }}</span>
                } @else {
                  <span class="not-set">Not scheduled</span>
                }
              </td>
              <td>
                @if (shipment.expectedReturnDate) {
                  <span [class.overdue-date]="isOverdueReturn(shipment)">
                    {{ shipment.expectedReturnDate | date:'mediumDate' }}
                    @if (isOverdueReturn(shipment)) {
                      <span class="overdue-badge">Overdue</span>
                    }
                  </span>
                } @else {
                  <span class="not-set">N/A</span>
                }
              </td>
              <td>
                @if (shipment.trackingNumber) {
                  <div class="tracking-info">
                    <span class="carrier">{{ shipment.carrier }}</span>
                    <code>{{ shipment.trackingNumber }}</code>
                  </div>
                } @else {
                  <span class="not-set">No tracking</span>
                }
              </td>
              <td>
                <p-tag [value]="getStatusLabel(shipment.status)" [severity]="getStatusSeverity(shipment.status)"></p-tag>
              </td>
              <td>
                <div class="actions">
                  @if (shipment.status === 'pending') {
                    <button pButton icon="pi pi-truck" class="p-button-text p-button-success p-button-sm" pTooltip="Mark as Shipped" (click)="showShipDialog(shipment)"></button>
                  }
                  @if (shipment.status === 'shipped' || shipment.status === 'in_transit' || shipment.status === 'out_for_delivery') {
                    <button pButton icon="pi pi-check" class="p-button-text p-button-success p-button-sm" pTooltip="Mark as Delivered" (click)="markDelivered(shipment)"></button>
                  }
                  @if (shipment.status !== 'delivered' && shipment.status !== 'cancelled') {
                    <button pButton icon="pi pi-times" class="p-button-text p-button-danger p-button-sm" pTooltip="Cancel" (click)="showCancelDialog(shipment)"></button>
                  }
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Details" [routerLink]="[shipment.id]"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="9" class="text-center p-4">No shipments found</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Create Shipment Dialog -->
      <p-dialog [(visible)]="createDialogVisible" header="New Shipment" [modal]="true" [style]="{ width: '700px' }">
        <div class="dialog-content">
          <div class="form-row">
            <div class="form-group">
              <label>Shipment Type *</label>
              <p-select
                [options]="typeOptions"
                [(ngModel)]="createForm.shipmentType"
                placeholder="Select type"
                [style]="{'width': '100%'}"
              ></p-select>
            </div>
            <div class="form-group">
              <label>Department</label>
              <input pInputText [(ngModel)]="createForm.department" placeholder="Department" />
            </div>
          </div>

          <h4>Recipient Information</h4>
          <div class="form-row">
            <div class="form-group">
              <label>Name *</label>
              <input pInputText [(ngModel)]="createForm.recipient.name" placeholder="Recipient name" />
            </div>
            <div class="form-group">
              <label>Organization</label>
              <input pInputText [(ngModel)]="createForm.recipient.organization" placeholder="Organization" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Email</label>
              <input pInputText [(ngModel)]="createForm.recipient.email" placeholder="Email" type="email" />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input pInputText [(ngModel)]="createForm.recipient.phone" placeholder="Phone" />
            </div>
          </div>
          <div class="form-group">
            <label>Address</label>
            <input pInputText [(ngModel)]="createForm.recipient.addressLine1" placeholder="Street address" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>City</label>
              <input pInputText [(ngModel)]="createForm.recipient.city" placeholder="City" />
            </div>
            <div class="form-group">
              <label>State</label>
              <input pInputText [(ngModel)]="createForm.recipient.state" placeholder="State" />
            </div>
            <div class="form-group">
              <label>Postal Code</label>
              <input pInputText [(ngModel)]="createForm.recipient.postalCode" placeholder="Postal code" />
            </div>
          </div>

          <h4>Shipment Details</h4>
          <div class="form-row">
            <div class="form-group">
              <label>Scheduled Ship Date</label>
              <p-datepicker [(ngModel)]="createForm.scheduledShipDate" [showIcon]="true" [style]="{'width': '100%'}"></p-datepicker>
            </div>
            <div class="form-group">
              <label>Expected Return Date</label>
              <p-datepicker [(ngModel)]="createForm.expectedReturnDate" [showIcon]="true" [style]="{'width': '100%'}"></p-datepicker>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group checkbox-group">
              <p-checkbox [(ngModel)]="createForm.signatureRequired" [binary]="true" inputId="signatureRequired"></p-checkbox>
              <label for="signatureRequired">Signature Required</label>
            </div>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea pTextarea [(ngModel)]="createForm.notes" rows="3" placeholder="Special instructions or notes"></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="createDialogVisible = false"></button>
          <button pButton label="Create Shipment" (click)="createShipment()" [loading]="saving()"></button>
        </ng-template>
      </p-dialog>

      <!-- Ship Dialog -->
      <p-dialog [(visible)]="shipDialogVisible" header="Mark as Shipped" [modal]="true" [style]="{ width: '500px' }">
        <div class="form-group">
          <label>Carrier *</label>
          <p-select
            [options]="carrierOptions"
            [(ngModel)]="shipForm.carrier"
            placeholder="Select carrier"
            [style]="{'width': '100%'}"
            [editable]="true"
          ></p-select>
        </div>
        <div class="form-group">
          <label>Tracking Number *</label>
          <input pInputText [(ngModel)]="shipForm.trackingNumber" placeholder="Enter tracking number" />
        </div>
        <div class="form-group">
          <label>Shipping Method</label>
          <input pInputText [(ngModel)]="shipForm.shippingMethod" placeholder="e.g., Ground, 2-Day, Overnight" />
        </div>
        <div class="form-group">
          <label>Estimated Delivery</label>
          <p-datepicker [(ngModel)]="shipForm.estimatedDelivery" [showIcon]="true" [style]="{'width': '100%'}"></p-datepicker>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="shipDialogVisible = false"></button>
          <button pButton label="Mark as Shipped" icon="pi pi-truck" (click)="markShipped()" [loading]="saving()"></button>
        </ng-template>
      </p-dialog>

      <!-- Cancel Dialog -->
      <p-dialog [(visible)]="cancelDialogVisible" header="Cancel Shipment" [modal]="true" [style]="{ width: '400px' }">
        <p>Are you sure you want to cancel this shipment?</p>
        <div class="form-group">
          <label>Reason *</label>
          <textarea pTextarea [(ngModel)]="cancelReason" rows="3" placeholder="Provide a reason for cancellation"></textarea>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="No, Keep It" class="p-button-text" (click)="cancelDialogVisible = false"></button>
          <button pButton label="Yes, Cancel Shipment" class="p-button-danger" (click)="cancelShipment()" [loading]="saving()"></button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .shipment-list {
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

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
    }

    .summary-card.alert {
      border-color: var(--alert-500);
      background: rgba(244, 63, 94, 0.05);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .card-icon.pending { background: rgba(251, 191, 36, 0.2); color: var(--warning-600); }
    .card-icon.transit { background: rgba(59, 130, 246, 0.2); color: var(--primary-600); }
    .card-icon.delivered { background: rgba(34, 197, 94, 0.2); color: var(--success-600); }
    .card-icon.overdue { background: rgba(244, 63, 94, 0.2); color: var(--alert-600); }

    .card-content {
      display: flex;
      flex-direction: column;
    }

    .card-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .card-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .shipments-table {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    :host ::ng-deep tr.overdue {
      background: rgba(244, 63, 94, 0.05);
    }

    .shipment-link {
      color: var(--primary-600);
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
      }
    }

    .recipient-info {
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

    .scheduled {
      color: var(--warning-600);
      font-style: italic;
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

    .tracking-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .carrier {
        font-size: 0.75rem;
        color: var(--text-muted);
      }

      code {
        font-size: 0.8rem;
        padding: 0.125rem 0.25rem;
        background: var(--bg-secondary);
        border-radius: var(--radius-sm);
      }
    }

    .actions {
      display: flex;
      gap: 0.25rem;
    }

    .dialog-content {
      h4 {
        margin: 1.5rem 0 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-primary);
      }
    }

    .form-row {
      display: flex;
      gap: 1rem;

      .form-group {
        flex: 1;
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

      input, textarea {
        width: 100%;
      }

      &.checkbox-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        label {
          margin-bottom: 0;
        }
      }
    }
  `]
})
export class ShipmentListComponent implements OnInit {
  private readonly shipmentService = inject(ShipmentService);
  private readonly messageService = inject(MessageService);

  shipments = signal<Shipment[]>([]);
  summary = signal<ShipmentSummary | null>(null);
  loading = signal(false);
  saving = signal(false);

  searchTerm = '';
  selectedStatus: ShipmentStatus | null = null;
  selectedType: ShipmentType | null = null;

  createDialogVisible = false;
  shipDialogVisible = false;
  cancelDialogVisible = false;

  selectedShipment: Shipment | null = null;
  cancelReason = '';

  statusOptions = [
    { label: 'Pending', value: ShipmentStatus.PENDING },
    { label: 'Ready to Ship', value: ShipmentStatus.READY_TO_SHIP },
    { label: 'Shipped', value: ShipmentStatus.SHIPPED },
    { label: 'In Transit', value: ShipmentStatus.IN_TRANSIT },
    { label: 'Out for Delivery', value: ShipmentStatus.OUT_FOR_DELIVERY },
    { label: 'Delivered', value: ShipmentStatus.DELIVERED },
    { label: 'Cancelled', value: ShipmentStatus.CANCELLED }
  ];

  typeOptions = [
    { label: 'Outbound', value: ShipmentType.OUTBOUND },
    { label: 'Return', value: ShipmentType.RETURN },
    { label: 'Transfer', value: ShipmentType.TRANSFER }
  ];

  carrierOptions = [
    { label: 'FedEx', value: 'FedEx' },
    { label: 'UPS', value: 'UPS' },
    { label: 'USPS', value: 'USPS' },
    { label: 'DHL', value: 'DHL' },
    { label: 'Local Courier', value: 'Local Courier' }
  ];

  createForm = {
    shipmentType: ShipmentType.OUTBOUND,
    department: '',
    recipient: {
      name: '',
      email: '',
      phone: '',
      organization: '',
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'USA'
    } as RecipientInfo,
    scheduledShipDate: null as Date | null,
    expectedReturnDate: null as Date | null,
    signatureRequired: false,
    notes: ''
  };

  shipForm = {
    carrier: '',
    trackingNumber: '',
    shippingMethod: '',
    estimatedDelivery: null as Date | null
  };

  ngOnInit(): void {
    this.loadShipments();
    this.loadSummary();
  }

  loadShipments(): void {
    this.loading.set(true);
    this.shipmentService.getShipments({
      status: this.selectedStatus || undefined,
      shipmentType: this.selectedType || undefined,
      search: this.searchTerm || undefined
    }).subscribe({
      next: (response) => {
        this.shipments.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load shipments' });
      }
    });
  }

  loadSummary(): void {
    this.shipmentService.getShipmentSummary().subscribe({
      next: (summary) => this.summary.set(summary)
    });
  }

  isOverdueReturn(shipment: Shipment): boolean {
    if (shipment.status !== ShipmentStatus.DELIVERED || !shipment.expectedReturnDate) {
      return false;
    }
    return new Date() > new Date(shipment.expectedReturnDate);
  }

  getStatusLabel(status: ShipmentStatus): string {
    const labels: Record<ShipmentStatus, string> = {
      [ShipmentStatus.PENDING]: 'Pending',
      [ShipmentStatus.READY_TO_SHIP]: 'Ready to Ship',
      [ShipmentStatus.SHIPPED]: 'Shipped',
      [ShipmentStatus.IN_TRANSIT]: 'In Transit',
      [ShipmentStatus.OUT_FOR_DELIVERY]: 'Out for Delivery',
      [ShipmentStatus.DELIVERED]: 'Delivered',
      [ShipmentStatus.FAILED]: 'Failed',
      [ShipmentStatus.CANCELLED]: 'Cancelled'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: ShipmentStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case ShipmentStatus.PENDING: return 'warn';
      case ShipmentStatus.READY_TO_SHIP: return 'info';
      case ShipmentStatus.SHIPPED:
      case ShipmentStatus.IN_TRANSIT:
      case ShipmentStatus.OUT_FOR_DELIVERY: return 'info';
      case ShipmentStatus.DELIVERED: return 'success';
      case ShipmentStatus.FAILED:
      case ShipmentStatus.CANCELLED: return 'danger';
      default: return 'secondary';
    }
  }

  getTypeLabel(type: ShipmentType): string {
    const labels: Record<ShipmentType, string> = {
      [ShipmentType.OUTBOUND]: 'Outbound',
      [ShipmentType.RETURN]: 'Return',
      [ShipmentType.TRANSFER]: 'Transfer'
    };
    return labels[type] || type;
  }

  getTypeSeverity(type: ShipmentType): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (type) {
      case ShipmentType.OUTBOUND: return 'info';
      case ShipmentType.RETURN: return 'warn';
      case ShipmentType.TRANSFER: return 'secondary';
      default: return 'secondary';
    }
  }

  showCreateDialog(): void {
    this.createForm = {
      shipmentType: ShipmentType.OUTBOUND,
      department: '',
      recipient: {
        name: '',
        email: '',
        phone: '',
        organization: '',
        addressLine1: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'USA'
      },
      scheduledShipDate: null,
      expectedReturnDate: null,
      signatureRequired: false,
      notes: ''
    };
    this.createDialogVisible = true;
  }

  showShipDialog(shipment: Shipment): void {
    this.selectedShipment = shipment;
    this.shipForm = {
      carrier: '',
      trackingNumber: '',
      shippingMethod: '',
      estimatedDelivery: null
    };
    this.shipDialogVisible = true;
  }

  showCancelDialog(shipment: Shipment): void {
    this.selectedShipment = shipment;
    this.cancelReason = '';
    this.cancelDialogVisible = true;
  }

  showOverdueReturns(): void {
    this.selectedStatus = ShipmentStatus.DELIVERED;
    this.loadShipments();
    this.messageService.add({ severity: 'info', summary: 'Filter Applied', detail: 'Showing delivered shipments - check expected return dates' });
  }

  createShipment(): void {
    if (!this.createForm.recipient.name) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Recipient name is required' });
      return;
    }

    this.saving.set(true);
    this.shipmentService.createShipment({
      shipmentType: this.createForm.shipmentType,
      recipient: this.createForm.recipient,
      department: this.createForm.department,
      scheduledShipDate: this.createForm.scheduledShipDate?.toISOString(),
      expectedReturnDate: this.createForm.expectedReturnDate?.toISOString(),
      signatureRequired: this.createForm.signatureRequired,
      notes: this.createForm.notes,
      items: [] // In real implementation, this would include item selection
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Shipment created' });
        this.createDialogVisible = false;
        this.loadShipments();
        this.loadSummary();
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create shipment' });
      }
    });
  }

  markShipped(): void {
    if (!this.selectedShipment || !this.shipForm.carrier || !this.shipForm.trackingNumber) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Carrier and tracking number are required' });
      return;
    }

    this.saving.set(true);
    const request: MarkAsShippedRequest = {
      carrier: this.shipForm.carrier,
      trackingNumber: this.shipForm.trackingNumber,
      shippingMethod: this.shipForm.shippingMethod,
      estimatedDelivery: this.shipForm.estimatedDelivery?.toISOString()
    };

    this.shipmentService.markAsShipped(this.selectedShipment.id, request).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Shipment marked as shipped' });
        this.shipDialogVisible = false;
        this.loadShipments();
        this.loadSummary();
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update shipment' });
      }
    });
  }

  markDelivered(shipment: Shipment): void {
    this.shipmentService.markAsDelivered(shipment.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Shipment marked as delivered' });
        this.loadShipments();
        this.loadSummary();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update shipment' });
      }
    });
  }

  cancelShipment(): void {
    if (!this.selectedShipment || !this.cancelReason) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Cancellation reason is required' });
      return;
    }

    this.saving.set(true);
    this.shipmentService.cancelShipment(this.selectedShipment.id, this.cancelReason).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Shipment cancelled' });
        this.cancelDialogVisible = false;
        this.loadShipments();
        this.loadSummary();
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to cancel shipment' });
      }
    });
  }
}
