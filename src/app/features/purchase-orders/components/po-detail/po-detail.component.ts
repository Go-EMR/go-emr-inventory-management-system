import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { TimelineModule } from 'primeng/timeline';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { ConfirmationService, MessageService } from 'primeng/api';

import { PurchaseOrderService, ReceivePORequest } from '../../../../core/services/purchase-order.service';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderLine
} from '../../../../shared/models';

interface POEvent {
  date: Date;
  action: string;
  user: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-po-detail',
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
    DividerModule,
    TimelineModule,
    ProgressBarModule,
    ConfirmDialogModule,
    ToastModule,
    InputNumberModule,
    InputTextModule,
    Textarea
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="po-detail-page">
      @if (loading()) {
        <div class="loading">
          <p-progressBar mode="indeterminate" [style]="{ height: '6px' }" />
          <p>Loading purchase order...</p>
        </div>
      } @else if (purchaseOrder()) {
        <!-- Header -->
        <div class="page-header">
          <div class="header-content">
            <div class="breadcrumb">
              <a routerLink="/purchase-orders">Purchase Orders</a>
              <i class="pi pi-chevron-right"></i>
              <span>{{ purchaseOrder()!.poNumber }}</span>
            </div>
            <div class="title-row">
              <h2>{{ purchaseOrder()!.poNumber }}</h2>
              <p-tag [value]="getStatusLabel(purchaseOrder()!.status)" [severity]="getStatusSeverity(purchaseOrder()!.status)" />
              @if (purchaseOrder()!.isAutoPO) {
                <p-tag value="Auto-Generated" severity="info" icon="pi pi-bolt" />
              }
            </div>
            <p class="supplier-name">{{ purchaseOrder()!.supplierName }}</p>
          </div>
          <div class="header-actions">
            @if (purchaseOrder()!.status === PurchaseOrderStatus.PENDING_APPROVAL) {
              <p-button
                label="Approve"
                icon="pi pi-check"
                severity="success"
                (onClick)="approvePO()" />
            }
            @if (purchaseOrder()!.status === PurchaseOrderStatus.APPROVED) {
              <p-button
                label="Mark as Sent"
                icon="pi pi-send"
                (onClick)="sendPO()" />
            }
            @if (purchaseOrder()!.status === PurchaseOrderStatus.SENT || purchaseOrder()!.status === PurchaseOrderStatus.PARTIALLY_RECEIVED) {
              <p-button
                label="Receive Items"
                icon="pi pi-box"
                (onClick)="openReceiveDialog()" />
            }
            @if (purchaseOrder()!.status !== PurchaseOrderStatus.RECEIVED && purchaseOrder()!.status !== PurchaseOrderStatus.CANCELLED) {
              <p-button
                label="Cancel Order"
                icon="pi pi-times"
                severity="danger"
                [outlined]="true"
                (onClick)="confirmCancel()" />
            }
            <p-button
              icon="pi pi-print"
              [rounded]="true"
              severity="secondary"
              pTooltip="Print"
              (onClick)="printPO()" />
          </div>
        </div>

        <div class="content-grid">
          <!-- Order Info -->
          <p-card header="Order Information" styleClass="info-card">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">PO Number</span>
                <span class="value">{{ purchaseOrder()!.poNumber }}</span>
              </div>
              <div class="info-item">
                <span class="label">Supplier</span>
                <span class="value">{{ purchaseOrder()!.supplierName }}</span>
              </div>
              <div class="info-item">
                <span class="label">Order Date</span>
                <span class="value">{{ purchaseOrder()!.orderDate | date:'mediumDate' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Expected Delivery</span>
                <span class="value" [class.overdue]="isOverdue()">
                  {{ purchaseOrder()!.expectedDelivery | date:'mediumDate' }}
                  @if (isOverdue()) {
                    <i class="pi pi-exclamation-circle"></i>
                  }
                </span>
              </div>
              @if (purchaseOrder()!.receivedDate) {
                <div class="info-item">
                  <span class="label">Received Date</span>
                  <span class="value">{{ purchaseOrder()!.receivedDate | date:'mediumDate' }}</span>
                </div>
              }
              <div class="info-item">
                <span class="label">Created By</span>
                <span class="value">{{ purchaseOrder()!.createdByName }}</span>
              </div>
              @if (purchaseOrder()!.approvedByName) {
                <div class="info-item">
                  <span class="label">Approved By</span>
                  <span class="value">{{ purchaseOrder()!.approvedByName }}</span>
                </div>
              }
              <div class="info-item full-width">
                <span class="label">Total Amount</span>
                <span class="value total">{{ purchaseOrder()!.totalAmount | currency }}</span>
              </div>
            </div>

            @if (purchaseOrder()!.notes) {
              <p-divider />
              <div class="notes-section">
                <span class="label">Notes</span>
                <p>{{ purchaseOrder()!.notes }}</p>
              </div>
            }

            @if (purchaseOrder()!.isAutoPO && purchaseOrder()!.autoPORuleName) {
              <p-divider />
              <div class="auto-po-info">
                <i class="pi pi-bolt"></i>
                <span>Generated by auto-PO rule: <strong>{{ purchaseOrder()!.autoPORuleName }}</strong></span>
              </div>
            }
          </p-card>

          <!-- Order Lines -->
          <p-card header="Order Lines" styleClass="lines-card">
            <p-table [value]="purchaseOrder()!.lines" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>Item</th>
                  <th>SKU</th>
                  <th>Ordered</th>
                  <th>Received</th>
                  <th>Unit Cost</th>
                  <th>Line Total</th>
                  <th>Status</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-line>
                <tr>
                  <td>{{ line.itemName }}</td>
                  <td>{{ line.sku || '-' }}</td>
                  <td>{{ line.quantityOrdered }}</td>
                  <td>
                    <span [class.incomplete]="line.quantityReceived < line.quantityOrdered">
                      {{ line.quantityReceived }}
                    </span>
                  </td>
                  <td>{{ line.unitCost | currency }}</td>
                  <td>{{ line.lineTotal | currency }}</td>
                  <td>
                    @if (line.quantityReceived >= line.quantityOrdered) {
                      <p-tag value="Complete" severity="success" />
                    } @else if (line.quantityReceived > 0) {
                      <p-tag value="Partial" severity="warn" />
                    } @else {
                      <p-tag value="Pending" severity="secondary" />
                    }
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="footer">
                <tr>
                  <td colspan="5" class="text-right"><strong>Total:</strong></td>
                  <td><strong>{{ purchaseOrder()!.totalAmount | currency }}</strong></td>
                  <td></td>
                </tr>
              </ng-template>
            </p-table>

            <!-- Receipt Progress -->
            @if (purchaseOrder()!.status !== PurchaseOrderStatus.DRAFT && purchaseOrder()!.status !== PurchaseOrderStatus.PENDING_APPROVAL) {
              <div class="receipt-progress">
                <span class="progress-label">Receipt Progress</span>
                <p-progressBar [value]="getReceiptProgress()" [showValue]="true" />
              </div>
            }
          </p-card>

          <!-- Activity Timeline -->
          <p-card header="Activity" styleClass="timeline-card">
            <p-timeline [value]="events()" align="left">
              <ng-template pTemplate="marker" let-event>
                <span class="event-marker" [style.background-color]="event.color">
                  <i [class]="event.icon"></i>
                </span>
              </ng-template>
              <ng-template pTemplate="content" let-event>
                <div class="event-content">
                  <span class="event-action">{{ event.action }}</span>
                  <span class="event-user">by {{ event.user }}</span>
                  <span class="event-date">{{ event.date | date:'medium' }}</span>
                </div>
              </ng-template>
            </p-timeline>
          </p-card>
        </div>
      } @else {
        <div class="not-found">
          <i class="pi pi-file" style="font-size: 4rem; color: var(--text-secondary);"></i>
          <h2>Purchase Order Not Found</h2>
          <p>The requested purchase order could not be found.</p>
          <p-button label="Back to List" icon="pi pi-arrow-left" routerLink="/purchase-orders" />
        </div>
      }
    </div>

    <!-- Receive Dialog -->
    <p-dialog
      header="Receive Items"
      [(visible)]="receiveDialogVisible"
      [modal]="true"
      [style]="{ width: '90vw', maxWidth: '800px' }"
      [draggable]="false"
      [resizable]="false">
      @if (purchaseOrder()) {
        <div class="receive-form">
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
    .po-detail-page {
      padding: 1.5rem;
    }

    .loading,
    .not-found {
      text-align: center;
      padding: 3rem;
    }

    .not-found h2 {
      margin: 1rem 0 0.5rem;
    }

    .not-found p {
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .breadcrumb a {
      color: var(--primary-500);
      text-decoration: none;
    }

    .breadcrumb a:hover {
      text-decoration: underline;
    }

    .breadcrumb i {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .title-row h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .supplier-name {
      color: var(--text-secondary);
      margin: 0.25rem 0 0;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 1.5rem;
    }

    :host ::ng-deep .info-card {
      grid-row: span 2;
    }

    :host ::ng-deep .lines-card {
      grid-column: 2;
    }

    :host ::ng-deep .timeline-card {
      grid-column: 2;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-item.full-width {
      grid-column: span 2;
    }

    .info-item .label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    .info-item .value {
      font-weight: 500;
    }

    .info-item .value.total {
      font-size: 1.25rem;
      color: var(--primary-500);
    }

    .info-item .value.overdue {
      color: var(--alert-600);
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .notes-section .label {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
    }

    .notes-section p {
      margin: 0.5rem 0 0;
    }

    .auto-po-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: var(--blue-50);
      border-radius: 6px;
      color: var(--blue-700);
    }

    .incomplete {
      color: var(--warning-600);
    }

    .receipt-progress {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .progress-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    /* Timeline */
    .event-marker {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .event-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .event-action {
      font-weight: 500;
    }

    .event-user {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .event-date {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    /* Receive Dialog */
    .receive-form {
      padding: 1rem 0;
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

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field label {
      font-weight: 500;
      font-size: 0.875rem;
    }

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      :host ::ng-deep .info-card,
      :host ::ng-deep .lines-card,
      :host ::ng-deep .timeline-card {
        grid-column: 1;
        grid-row: auto;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
        flex-wrap: wrap;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .info-item.full-width {
        grid-column: span 1;
      }
    }
  `]
})
export class PoDetailComponent implements OnInit {
  private poService = inject(PurchaseOrderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  PurchaseOrderStatus = PurchaseOrderStatus;

  purchaseOrder = signal<PurchaseOrder | null>(null);
  loading = signal(true);
  isSaving = signal(false);
  events = signal<POEvent[]>([]);

  receiveDialogVisible = false;
  receiveLines: {
    lineId: string;
    itemName: string;
    quantityOrdered: number;
    quantityReceived: number;
    receiveQuantity: number;
    lotNumber: string;
  }[] = [];
  receiveNotes = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPurchaseOrder(id);
    } else {
      this.loading.set(false);
    }
  }

  loadPurchaseOrder(id: string): void {
    this.loading.set(true);
    this.poService.getPurchaseOrder(id).subscribe({
      next: (po) => {
        this.purchaseOrder.set(po || null);
        if (po) {
          this.generateEvents(po);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load purchase order'
        });
      }
    });
  }

  generateEvents(po: PurchaseOrder): void {
    const events: POEvent[] = [
      {
        date: po.createdAt,
        action: 'Order Created',
        user: po.createdByName || 'System',
        icon: 'pi pi-plus',
        color: 'var(--blue-500)'
      }
    ];

    if (po.approvedByName) {
      events.push({
        date: po.updatedAt,
        action: 'Order Approved',
        user: po.approvedByName,
        icon: 'pi pi-check',
        color: 'var(--green-500)'
      });
    }

    if (po.status === PurchaseOrderStatus.SENT || po.status === PurchaseOrderStatus.PARTIALLY_RECEIVED || po.status === PurchaseOrderStatus.RECEIVED) {
      events.push({
        date: po.updatedAt,
        action: 'Order Sent to Supplier',
        user: 'System',
        icon: 'pi pi-send',
        color: 'var(--purple-500)'
      });
    }

    if (po.status === PurchaseOrderStatus.PARTIALLY_RECEIVED) {
      events.push({
        date: po.updatedAt,
        action: 'Partial Shipment Received',
        user: 'Warehouse',
        icon: 'pi pi-box',
        color: 'var(--warning-500)'
      });
    }

    if (po.status === PurchaseOrderStatus.RECEIVED && po.receivedDate) {
      events.push({
        date: po.receivedDate,
        action: 'Order Fully Received',
        user: 'Warehouse',
        icon: 'pi pi-check-circle',
        color: 'var(--green-600)'
      });
    }

    if (po.status === PurchaseOrderStatus.CANCELLED) {
      events.push({
        date: po.updatedAt,
        action: 'Order Cancelled',
        user: 'Admin',
        icon: 'pi pi-times',
        color: 'var(--alert-500)'
      });
    }

    this.events.set(events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }

  isOverdue(): boolean {
    const po = this.purchaseOrder();
    if (!po?.expectedDelivery) return false;
    if (po.status === PurchaseOrderStatus.RECEIVED || po.status === PurchaseOrderStatus.CANCELLED) return false;
    return new Date(po.expectedDelivery) < new Date();
  }

  getReceiptProgress(): number {
    const po = this.purchaseOrder();
    if (!po) return 0;
    const totalOrdered = po.lines.reduce((sum, l) => sum + l.quantityOrdered, 0);
    const totalReceived = po.lines.reduce((sum, l) => sum + l.quantityReceived, 0);
    return totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;
  }

  getStatusLabel(status: PurchaseOrderStatus): string {
    const labels: Record<PurchaseOrderStatus, string> = {
      [PurchaseOrderStatus.DRAFT]: 'Draft',
      [PurchaseOrderStatus.PENDING_APPROVAL]: 'Pending Approval',
      [PurchaseOrderStatus.APPROVED]: 'Approved',
      [PurchaseOrderStatus.SENT]: 'Sent',
      [PurchaseOrderStatus.PARTIALLY_RECEIVED]: 'Partially Received',
      [PurchaseOrderStatus.RECEIVED]: 'Received',
      [PurchaseOrderStatus.CANCELLED]: 'Cancelled'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: PurchaseOrderStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<PurchaseOrderStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      [PurchaseOrderStatus.DRAFT]: 'secondary',
      [PurchaseOrderStatus.PENDING_APPROVAL]: 'warn',
      [PurchaseOrderStatus.APPROVED]: 'info',
      [PurchaseOrderStatus.SENT]: 'info',
      [PurchaseOrderStatus.PARTIALLY_RECEIVED]: 'warn',
      [PurchaseOrderStatus.RECEIVED]: 'success',
      [PurchaseOrderStatus.CANCELLED]: 'danger'
    };
    return severities[status] || 'secondary';
  }

  approvePO(): void {
    const po = this.purchaseOrder();
    if (!po) return;

    this.confirmationService.confirm({
      message: `Approve purchase order ${po.poNumber}?`,
      header: 'Approve Order',
      icon: 'pi pi-check',
      accept: () => {
        this.poService.approvePurchaseOrder(po.id).subscribe({
          next: () => {
            this.loadPurchaseOrder(po.id);
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

  sendPO(): void {
    const po = this.purchaseOrder();
    if (!po) return;

    this.poService.sendPurchaseOrder(po.id).subscribe({
      next: () => {
        this.loadPurchaseOrder(po.id);
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

  openReceiveDialog(): void {
    const po = this.purchaseOrder();
    if (!po) return;

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
    const po = this.purchaseOrder();
    if (!po || !this.hasReceiveQuantity()) return;

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

    this.poService.receivePurchaseOrder(po.id, request).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.receiveDialogVisible = false;
        this.loadPurchaseOrder(po.id);
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

  confirmCancel(): void {
    const po = this.purchaseOrder();
    if (!po) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to cancel purchase order ${po.poNumber}?`,
      header: 'Cancel Order',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.poService.cancelPurchaseOrder(po.id).subscribe({
          next: () => {
            this.loadPurchaseOrder(po.id);
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

  printPO(): void {
    window.print();
  }
}
