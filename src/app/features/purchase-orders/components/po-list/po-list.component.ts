import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Textarea } from 'primeng/textarea';

import { PurchaseOrderService, CreatePORequest, POFilter, ReceivePORequest } from '../../../../core/services/purchase-order.service';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderLine,
  Vendor,
  POStats
} from '../../../../shared/models';

interface StatusOption {
  label: string;
  value: PurchaseOrderStatus | null;
  severity: 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';
}

@Component({
  selector: 'app-po-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    TooltipModule,
    DialogModule,
    InputTextModule,
    Textarea,
    SelectModule,
    DatePickerModule,
    InputNumberModule,
    AutoCompleteModule,
    DividerModule,
    BadgeModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="po-list-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h2>Purchase Orders</h2>
          <p class="text-secondary">Manage purchase orders and track deliveries</p>
        </div>
        <div class="header-actions">
          <p-button
            label="Auto-PO Dashboard"
            icon="pi pi-cog"
            severity="secondary"
            routerLink="/purchase-orders/auto-po" />
          <p-button
            label="Create PO"
            icon="pi pi-plus"
            (onClick)="openCreateDialog()" />
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card" (click)="filterByStatus(null)">
          <div class="card-icon total">
            <i class="pi pi-file"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ stats()?.totalPOs || 0 }}</span>
            <span class="card-label">Total POs</span>
          </div>
        </div>

        <div class="summary-card" (click)="filterByStatus(PurchaseOrderStatus.PENDING_APPROVAL)">
          <div class="card-icon pending">
            <i class="pi pi-clock"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ stats()?.pendingApproval || 0 }}</span>
            <span class="card-label">Pending Approval</span>
          </div>
        </div>

        <div class="summary-card" (click)="filterByStatus(PurchaseOrderStatus.SENT)">
          <div class="card-icon awaiting">
            <i class="pi pi-truck"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ stats()?.awaitingDelivery || 0 }}</span>
            <span class="card-label">Awaiting Delivery</span>
          </div>
        </div>

        <div class="summary-card">
          <div class="card-icon value">
            <i class="pi pi-dollar"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ stats()?.totalValuePending | currency }}</span>
            <span class="card-label">Pending Value</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <p-card styleClass="filter-card">
        <div class="filter-bar">
          <span class="p-input-icon-left search-input">
            <i class="pi pi-search"></i>
            <input
              type="text"
              pInputText
              [(ngModel)]="searchTerm"
              placeholder="Search PO number, supplier..."
              (input)="onSearch()" />
          </span>

          <p-select
            [options]="statusOptions"
            [(ngModel)]="selectedStatus"
            optionLabel="label"
            optionValue="value"
            placeholder="All Statuses"
            [showClear]="true"
            (onChange)="applyFilters()" />

          <p-select
            [options]="supplierOptions"
            [(ngModel)]="selectedSupplier"
            optionLabel="name"
            optionValue="id"
            placeholder="All Suppliers"
            [showClear]="true"
            [filter]="true"
            (onChange)="applyFilters()" />

          <div class="filter-toggle">
            <p-button
              [label]="showAutoPOOnly ? 'Auto-PO Only' : 'All POs'"
              [icon]="showAutoPOOnly ? 'pi pi-bolt' : 'pi pi-list'"
              [severity]="showAutoPOOnly ? 'info' : 'secondary'"
              [outlined]="!showAutoPOOnly"
              (onClick)="toggleAutoPOFilter()" />
          </div>
        </div>
      </p-card>

      <!-- PO Table -->
      <p-card>
        <p-table
          [value]="purchaseOrders()"
          [paginator]="true"
          [rows]="10"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} orders"
          [rowHover]="true"
          styleClass="p-datatable-sm"
          [globalFilterFields]="['poNumber', 'supplierName']">
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="poNumber">PO # <p-sortIcon field="poNumber" /></th>
              <th pSortableColumn="supplierName">Supplier <p-sortIcon field="supplierName" /></th>
              <th pSortableColumn="status">Status <p-sortIcon field="status" /></th>
              <th>Lines</th>
              <th pSortableColumn="totalAmount">Amount <p-sortIcon field="totalAmount" /></th>
              <th pSortableColumn="orderDate">Order Date <p-sortIcon field="orderDate" /></th>
              <th>Expected Delivery</th>
              <th>Source</th>
              <th style="width: 10rem;">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-po>
            <tr [class.overdue]="isOverdue(po)">
              <td>
                <a [routerLink]="['/purchase-orders', po.id]" class="po-link">
                  {{ po.poNumber }}
                </a>
              </td>
              <td>{{ po.supplierName }}</td>
              <td>
                <p-tag [value]="getStatusLabel(po.status)" [severity]="getStatusSeverity(po.status)" />
              </td>
              <td>{{ po.lines.length }} items</td>
              <td>{{ po.totalAmount | currency }}</td>
              <td>{{ po.orderDate | date:'mediumDate' }}</td>
              <td>
                @if (po.expectedDelivery) {
                  <span [class.overdue-date]="isOverdue(po)">
                    {{ po.expectedDelivery | date:'mediumDate' }}
                    @if (isOverdue(po)) {
                      <i class="pi pi-exclamation-circle" pTooltip="Overdue"></i>
                    }
                  </span>
                } @else {
                  <span class="no-date">Not set</span>
                }
              </td>
              <td>
                @if (po.isAutoPO) {
                  <p-tag value="Auto" severity="info" icon="pi pi-bolt" />
                } @else {
                  <span class="manual-source">Manual</span>
                }
              </td>
              <td>
                <div class="action-buttons">
                  @if (po.status === PurchaseOrderStatus.PENDING_APPROVAL) {
                    <p-button
                      icon="pi pi-check"
                      [rounded]="true"
                      [text]="true"
                      severity="success"
                      pTooltip="Approve"
                      (onClick)="approvePO(po)" />
                  }
                  @if (po.status === PurchaseOrderStatus.APPROVED) {
                    <p-button
                      icon="pi pi-send"
                      [rounded]="true"
                      [text]="true"
                      severity="info"
                      pTooltip="Mark as Sent"
                      (onClick)="sendPO(po)" />
                  }
                  @if (po.status === PurchaseOrderStatus.SENT || po.status === PurchaseOrderStatus.PARTIALLY_RECEIVED) {
                    <p-button
                      icon="pi pi-box"
                      [rounded]="true"
                      [text]="true"
                      severity="success"
                      pTooltip="Receive"
                      (onClick)="openReceiveDialog(po)" />
                  }
                  <p-button
                    icon="pi pi-eye"
                    [rounded]="true"
                    [text]="true"
                    pTooltip="View Details"
                    [routerLink]="['/purchase-orders', po.id]" />
                  @if (po.status !== PurchaseOrderStatus.RECEIVED && po.status !== PurchaseOrderStatus.CANCELLED) {
                    <p-button
                      icon="pi pi-times"
                      [rounded]="true"
                      [text]="true"
                      severity="danger"
                      pTooltip="Cancel"
                      (onClick)="confirmCancel(po)" />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="9" class="text-center">
                <div class="empty-state">
                  <i class="pi pi-file" style="font-size: 3rem; color: var(--text-secondary);"></i>
                  <h3>No Purchase Orders</h3>
                  <p>Create your first purchase order to get started</p>
                  <p-button label="Create PO" icon="pi pi-plus" (onClick)="openCreateDialog()" />
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>

    <!-- Create PO Dialog -->
    <p-dialog
      header="Create Purchase Order"
      [(visible)]="createDialogVisible"
      [modal]="true"
      [style]="{ width: '90vw', maxWidth: '900px' }"
      [draggable]="false"
      [resizable]="false">
      <div class="create-po-form">
        <div class="form-section">
          <h4>Order Details</h4>
          <div class="form-grid">
            <div class="form-field">
              <label for="supplier">Supplier *</label>
              <p-select
                id="supplier"
                [options]="supplierOptions"
                [(ngModel)]="newPO.supplierId"
                optionLabel="name"
                optionValue="id"
                placeholder="Select supplier"
                [filter]="true"
                styleClass="w-full" />
            </div>
            <div class="form-field">
              <label for="expectedDelivery">Expected Delivery</label>
              <p-datepicker
                id="expectedDelivery"
                [(ngModel)]="newPO.expectedDelivery"
                [minDate]="today"
                dateFormat="mm/dd/yy"
                placeholder="Select date"
                styleClass="w-full" />
            </div>
            <div class="form-field full-width">
              <label for="notes">Notes</label>
              <textarea
                id="notes"
                pTextarea
                [(ngModel)]="newPO.notes"
                rows="2"
                placeholder="Order notes..."
                class="w-full"></textarea>
            </div>
          </div>
        </div>

        <p-divider />

        <div class="form-section">
          <div class="section-header">
            <h4>Order Lines</h4>
            <p-button
              label="Add Line"
              icon="pi pi-plus"
              severity="secondary"
              size="small"
              (onClick)="addLine()" />
          </div>

          @if (newPO.lines.length > 0) {
            <div class="lines-table">
              <table>
                <thead>
                  <tr>
                    <th style="width: 40%;">Item</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Line Total</th>
                    <th style="width: 3rem;"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of newPO.lines; track $index) {
                    <tr>
                      <td>
                        <p-autoComplete
                          [(ngModel)]="line.itemName"
                          [suggestions]="itemSuggestions"
                          (completeMethod)="searchItems($event)"
                          placeholder="Search item..."
                          styleClass="w-full" />
                      </td>
                      <td>
                        <p-inputNumber
                          [(ngModel)]="line.quantityOrdered"
                          [min]="1"
                          (onInput)="updateLineTotal(line)"
                          styleClass="w-full" />
                      </td>
                      <td>
                        <p-inputNumber
                          [(ngModel)]="line.unitCost"
                          [min]="0"
                          mode="currency"
                          currency="USD"
                          (onInput)="updateLineTotal(line)"
                          styleClass="w-full" />
                      </td>
                      <td>
                        <span class="line-total">{{ line.lineTotal | currency }}</span>
                      </td>
                      <td>
                        <p-button
                          icon="pi pi-trash"
                          [rounded]="true"
                          [text]="true"
                          severity="danger"
                          (onClick)="removeLine($index)" />
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" class="text-right"><strong>Total:</strong></td>
                    <td><strong>{{ getPOTotal() | currency }}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          } @else {
            <div class="no-lines">
              <p>No items added yet. Click "Add Line" to add items to this order.</p>
            </div>
          }
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button label="Cancel" severity="secondary" (onClick)="createDialogVisible = false" />
        <p-button
          label="Create Order"
          icon="pi pi-check"
          [disabled]="!isCreateFormValid()"
          [loading]="isSaving()"
          (onClick)="createPO()" />
      </ng-template>
    </p-dialog>

    <!-- Receive PO Dialog -->
    <p-dialog
      header="Receive Purchase Order"
      [(visible)]="receiveDialogVisible"
      [modal]="true"
      [style]="{ width: '90vw', maxWidth: '800px' }"
      [draggable]="false"
      [resizable]="false">
      @if (selectedPO) {
        <div class="receive-form">
          <div class="po-info">
            <span class="po-number">{{ selectedPO.poNumber }}</span>
            <span class="supplier">{{ selectedPO.supplierName }}</span>
          </div>

          <p-divider />

          <div class="receive-lines">
            <table>
              <thead>
                <tr>
                  <th style="width: 35%;">Item</th>
                  <th>Ordered</th>
                  <th>Received</th>
                  <th>This Receipt</th>
                  <th>Lot Number</th>
                </tr>
              </thead>
              <tbody>
                @for (line of receiveLines; track line.lineId) {
                  <tr [class.complete]="line.quantityReceived >= line.quantityOrdered">
                    <td>{{ line.itemName }}</td>
                    <td>{{ line.quantityOrdered }}</td>
                    <td>{{ line.quantityReceived }} / {{ line.quantityOrdered }}</td>
                    <td>
                      <p-inputNumber
                        [(ngModel)]="line.receiveQuantity"
                        [min]="0"
                        [max]="line.quantityOrdered - line.quantityReceived"
                        [disabled]="line.quantityReceived >= line.quantityOrdered"
                        styleClass="w-full" />
                    </td>
                    <td>
                      <input
                        type="text"
                        pInputText
                        [(ngModel)]="line.lotNumber"
                        placeholder="Lot #"
                        class="w-full" />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="form-field">
            <label for="receiveNotes">Notes</label>
            <textarea
              id="receiveNotes"
              pTextarea
              [(ngModel)]="receiveNotes"
              rows="2"
              placeholder="Receipt notes..."
              class="w-full"></textarea>
          </div>
        </div>
      }

      <ng-template pTemplate="footer">
        <p-button label="Cancel" severity="secondary" (onClick)="receiveDialogVisible = false" />
        <p-button
          label="Confirm Receipt"
          icon="pi pi-check"
          [disabled]="!hasReceiveQuantity()"
          [loading]="isSaving()"
          (onClick)="receivePO()" />
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .po-list-page {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .header-content h2 {
      margin: 0 0 0.25rem 0;
      font-size: 1.5rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      background: var(--surface-card);
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .summary-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .card-icon.total { background: var(--blue-100); color: var(--blue-600); }
    .card-icon.pending { background: var(--warning-100); color: var(--warning-700); }
    .card-icon.awaiting { background: var(--purple-100); color: var(--purple-600); }
    .card-icon.value { background: var(--green-100); color: var(--green-600); }

    .card-content {
      display: flex;
      flex-direction: column;
    }

    .card-value {
      font-size: 1.5rem;
      font-weight: 600;
      line-height: 1.2;
    }

    .card-label {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    :host ::ng-deep .filter-card .p-card-body {
      padding: 1rem;
    }

    .filter-bar {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1;
      min-width: 200px;
    }

    .search-input input {
      width: 100%;
    }

    .filter-toggle {
      margin-left: auto;
    }

    .po-link {
      color: var(--primary-500);
      text-decoration: none;
      font-weight: 500;
    }

    .po-link:hover {
      text-decoration: underline;
    }

    tr.overdue {
      background: var(--alert-50);
    }

    .overdue-date {
      color: var(--alert-600);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .no-date {
      color: var(--text-secondary);
      font-style: italic;
    }

    .manual-source {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .empty-state {
      padding: 3rem;
      text-align: center;
    }

    .empty-state h3 {
      margin: 1rem 0 0.5rem;
    }

    .empty-state p {
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    /* Create PO Dialog */
    .create-po-form {
      padding: 1rem 0;
    }

    .form-section {
      margin-bottom: 1rem;
    }

    .form-section h4 {
      margin: 0 0 1rem 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h4 {
      margin: 0;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field.full-width {
      grid-column: span 2;
    }

    .form-field label {
      font-weight: 500;
      font-size: 0.875rem;
    }

    .lines-table {
      overflow-x: auto;
    }

    .lines-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .lines-table th,
    .lines-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .lines-table th {
      background: var(--surface-ground);
      font-weight: 500;
      font-size: 0.875rem;
    }

    .line-total {
      font-weight: 500;
    }

    .lines-table tfoot td {
      border-top: 2px solid var(--border-color);
      background: var(--surface-ground);
    }

    .no-lines {
      padding: 2rem;
      text-align: center;
      background: var(--surface-ground);
      border-radius: 6px;
      color: var(--text-secondary);
    }

    /* Receive Dialog */
    .receive-form {
      padding: 1rem 0;
    }

    .po-info {
      display: flex;
      gap: 1rem;
      align-items: baseline;
    }

    .po-number {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .supplier {
      color: var(--text-secondary);
    }

    .receive-lines table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }

    .receive-lines th,
    .receive-lines td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .receive-lines th {
      background: var(--surface-ground);
      font-weight: 500;
      font-size: 0.875rem;
    }

    .receive-lines tr.complete {
      background: var(--green-50);
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
        justify-content: flex-end;
      }

      .filter-bar {
        flex-direction: column;
      }

      .search-input {
        width: 100%;
      }

      .filter-toggle {
        margin-left: 0;
        width: 100%;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-field.full-width {
        grid-column: span 1;
      }
    }
  `]
})
export class PoListComponent implements OnInit {
  private poService = inject(PurchaseOrderService);
  private route = inject(ActivatedRoute);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  // Expose enum for template
  PurchaseOrderStatus = PurchaseOrderStatus;

  // State
  purchaseOrders = signal<PurchaseOrder[]>([]);
  stats = signal<POStats | null>(null);
  isSaving = signal(false);

  // Filters
  searchTerm = '';
  selectedStatus: PurchaseOrderStatus | null = null;
  selectedSupplier: string | null = null;
  showAutoPOOnly = false;

  // Dialogs
  createDialogVisible = false;
  receiveDialogVisible = false;
  selectedPO: PurchaseOrder | null = null;

  // Create form
  newPO: {
    supplierId: string | null;
    expectedDelivery: Date | null;
    notes: string;
    lines: (PurchaseOrderLine & { itemName: string })[];
  } = {
    supplierId: null,
    expectedDelivery: null,
    notes: '',
    lines: []
  };

  // Receive form
  receiveLines: {
    lineId: string;
    itemName: string;
    quantityOrdered: number;
    quantityReceived: number;
    receiveQuantity: number;
    lotNumber: string;
  }[] = [];
  receiveNotes = '';

  // Options
  supplierOptions: Vendor[] = [];
  itemSuggestions: string[] = [];
  today = new Date();

  statusOptions: StatusOption[] = [
    { label: 'All Statuses', value: null, severity: 'secondary' },
    { label: 'Draft', value: PurchaseOrderStatus.DRAFT, severity: 'secondary' },
    { label: 'Pending Approval', value: PurchaseOrderStatus.PENDING_APPROVAL, severity: 'warn' },
    { label: 'Approved', value: PurchaseOrderStatus.APPROVED, severity: 'info' },
    { label: 'Sent', value: PurchaseOrderStatus.SENT, severity: 'info' },
    { label: 'Partially Received', value: PurchaseOrderStatus.PARTIALLY_RECEIVED, severity: 'warn' },
    { label: 'Received', value: PurchaseOrderStatus.RECEIVED, severity: 'success' },
    { label: 'Cancelled', value: PurchaseOrderStatus.CANCELLED, severity: 'danger' }
  ];

  ngOnInit(): void {
    // Check for query params
    this.route.queryParams.subscribe(params => {
      if (params['isAutoPO'] === 'true') {
        this.showAutoPOOnly = true;
      }
      if (params['status']) {
        this.selectedStatus = params['status'];
      }
      this.loadPurchaseOrders();
    });

    this.loadStats();
    this.loadSuppliers();
  }

  loadPurchaseOrders(): void {
    const filter: POFilter = {};
    if (this.selectedStatus) filter.status = this.selectedStatus;
    if (this.selectedSupplier) filter.supplierId = this.selectedSupplier;
    if (this.showAutoPOOnly) filter.isAutoPO = true;
    if (this.searchTerm) filter.search = this.searchTerm;

    this.poService.listPurchaseOrders(filter).subscribe(response => {
      this.purchaseOrders.set(response.items);
    });
  }

  loadStats(): void {
    this.poService.getPOStats().subscribe(stats => {
      this.stats.set(stats);
    });
  }

  loadSuppliers(): void {
    this.poService.getSuppliers().subscribe(suppliers => {
      this.supplierOptions = suppliers;
    });
  }

  onSearch(): void {
    this.loadPurchaseOrders();
  }

  applyFilters(): void {
    this.loadPurchaseOrders();
  }

  filterByStatus(status: PurchaseOrderStatus | null): void {
    this.selectedStatus = status;
    this.loadPurchaseOrders();
  }

  toggleAutoPOFilter(): void {
    this.showAutoPOOnly = !this.showAutoPOOnly;
    this.loadPurchaseOrders();
  }

  isOverdue(po: PurchaseOrder): boolean {
    if (!po.expectedDelivery) return false;
    if (po.status === PurchaseOrderStatus.RECEIVED || po.status === PurchaseOrderStatus.CANCELLED) return false;
    return new Date(po.expectedDelivery) < new Date();
  }

  getStatusLabel(status: PurchaseOrderStatus): string {
    const option = this.statusOptions.find(o => o.value === status);
    return option?.label || status;
  }

  getStatusSeverity(status: PurchaseOrderStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const option = this.statusOptions.find(o => o.value === status);
    return option?.severity || 'secondary';
  }

  // Create PO
  openCreateDialog(): void {
    this.newPO = {
      supplierId: null,
      expectedDelivery: null,
      notes: '',
      lines: []
    };
    this.createDialogVisible = true;
  }

  addLine(): void {
    this.newPO.lines.push({
      id: `temp-${Date.now()}`,
      itemId: '',
      itemName: '',
      quantityOrdered: 1,
      quantityReceived: 0,
      unitCost: 0,
      lineTotal: 0
    });
  }

  removeLine(index: number): void {
    this.newPO.lines.splice(index, 1);
  }

  updateLineTotal(line: PurchaseOrderLine): void {
    line.lineTotal = line.quantityOrdered * line.unitCost;
  }

  getPOTotal(): number {
    return this.newPO.lines.reduce((sum, line) => sum + line.lineTotal, 0);
  }

  searchItems(event: { query: string }): void {
    // Mock item suggestions
    const items = ['Surgical Gloves (L)', 'N95 Masks', 'Test Tubes (50ml)', 'Syringes (10ml)', 'Bandages (Large)', 'Saline Solution (1L)'];
    this.itemSuggestions = items.filter(i => i.toLowerCase().includes(event.query.toLowerCase()));
  }

  isCreateFormValid(): boolean {
    return !!this.newPO.supplierId && this.newPO.lines.length > 0 && this.newPO.lines.every(l => l.itemName && l.quantityOrdered > 0);
  }

  createPO(): void {
    if (!this.isCreateFormValid()) return;

    this.isSaving.set(true);
    const request: CreatePORequest = {
      supplierId: this.newPO.supplierId!,
      lines: this.newPO.lines.map(l => ({
        itemId: l.itemId || `item-${Date.now()}`,
        itemName: l.itemName,
        quantityOrdered: l.quantityOrdered,
        quantityReceived: 0,
        unitCost: l.unitCost,
        lineTotal: l.lineTotal
      })),
      notes: this.newPO.notes || undefined,
      expectedDelivery: this.newPO.expectedDelivery || undefined
    };

    this.poService.createPurchaseOrder(request).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.createDialogVisible = false;
        this.loadPurchaseOrders();
        this.loadStats();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Purchase order created successfully'
        });
      },
      error: () => {
        this.isSaving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create purchase order'
        });
      }
    });
  }

  // Approve PO
  approvePO(po: PurchaseOrder): void {
    this.confirmationService.confirm({
      message: `Approve purchase order ${po.poNumber}?`,
      header: 'Approve Order',
      icon: 'pi pi-check',
      accept: () => {
        this.poService.approvePurchaseOrder(po.id).subscribe({
          next: () => {
            this.loadPurchaseOrders();
            this.loadStats();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Purchase order approved'
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to approve purchase order'
            });
          }
        });
      }
    });
  }

  // Send PO
  sendPO(po: PurchaseOrder): void {
    this.poService.sendPurchaseOrder(po.id).subscribe({
      next: () => {
        this.loadPurchaseOrders();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Purchase order marked as sent'
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update purchase order'
        });
      }
    });
  }

  // Receive PO
  openReceiveDialog(po: PurchaseOrder): void {
    this.selectedPO = po;
    this.receiveLines = po.lines.map(line => ({
      lineId: line.id,
      itemName: line.itemName,
      quantityOrdered: line.quantityOrdered,
      quantityReceived: line.quantityReceived,
      receiveQuantity: line.quantityOrdered - line.quantityReceived,
      lotNumber: line.lotNumber || ''
    }));
    this.receiveNotes = '';
    this.receiveDialogVisible = true;
  }

  hasReceiveQuantity(): boolean {
    return this.receiveLines.some(l => l.receiveQuantity > 0);
  }

  receivePO(): void {
    if (!this.selectedPO || !this.hasReceiveQuantity()) return;

    this.isSaving.set(true);
    const request: ReceivePORequest = {
      lines: this.receiveLines
        .filter(l => l.receiveQuantity > 0)
        .map(l => ({
          lineId: l.lineId,
          quantityReceived: l.receiveQuantity,
          lotNumber: l.lotNumber || undefined
        })),
      notes: this.receiveNotes || undefined
    };

    this.poService.receivePurchaseOrder(this.selectedPO.id, request).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.receiveDialogVisible = false;
        this.loadPurchaseOrders();
        this.loadStats();
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Items received successfully'
        });
      },
      error: () => {
        this.isSaving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to receive items'
        });
      }
    });
  }

  // Cancel PO
  confirmCancel(po: PurchaseOrder): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to cancel purchase order ${po.poNumber}?`,
      header: 'Cancel Order',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.poService.cancelPurchaseOrder(po.id).subscribe({
          next: () => {
            this.loadPurchaseOrders();
            this.loadStats();
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Purchase order cancelled'
            });
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to cancel purchase order'
            });
          }
        });
      }
    });
  }
}
