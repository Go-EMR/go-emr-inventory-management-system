import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TimelineModule } from 'primeng/timeline';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ShipmentService } from '@core/services/shipment.service';
import { Shipment, ShipmentStatus, ShipmentType, ShipmentStatusHistory } from '@shared/models';

@Component({
  selector: 'app-shipment-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TagModule,
    CardModule,
    TableModule,
    TimelineModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="shipment-detail">
      @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
          <p>Loading shipment details...</p>
        </div>
      } @else if (shipment()) {
        <div class="page-header">
          <div class="header-content">
            <div class="breadcrumb">
              <a routerLink="/shipments">Shipments</a>
              <i class="pi pi-angle-right"></i>
              <span>{{ shipment()!.shipmentNumber }}</span>
            </div>
            <h1>Shipment {{ shipment()!.shipmentNumber }}</h1>
            <p-tag [value]="getStatusLabel(shipment()!.status)" [severity]="getStatusSeverity(shipment()!.status)"></p-tag>
          </div>
          <div class="header-actions">
            @if (shipment()!.trackingNumber) {
              <button pButton label="Track Package" icon="pi pi-external-link" class="p-button-outlined"></button>
            }
            <button pButton label="Print Label" icon="pi pi-print" class="p-button-outlined"></button>
          </div>
        </div>

        <div class="detail-grid">
          <!-- Shipment Info Card -->
          <p-card header="Shipment Information">
            <div class="info-grid">
              <div class="info-item">
                <label>Type</label>
                <p-tag [value]="getTypeLabel(shipment()!.shipmentType)" [severity]="getTypeSeverity(shipment()!.shipmentType)"></p-tag>
              </div>
              <div class="info-item">
                <label>Department</label>
                <span>{{ shipment()!.department || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <label>Created</label>
                <span>{{ shipment()!.createdAt | date:'medium' }}</span>
              </div>
              <div class="info-item">
                <label>Created By</label>
                <span>{{ shipment()!.createdByName || 'Unknown' }}</span>
              </div>
            </div>
          </p-card>

          <!-- Recipient Card -->
          <p-card header="Recipient">
            <div class="recipient-details">
              <h3>{{ shipment()!.recipient.name }}</h3>
              @if (shipment()!.recipient.organization) {
                <p class="organization">{{ shipment()!.recipient.organization }}</p>
              }
              @if (shipment()!.recipient.addressLine1) {
                <p class="address">
                  {{ shipment()!.recipient.addressLine1 }}<br>
                  @if (shipment()!.recipient.city) {
                    {{ shipment()!.recipient.city }}, {{ shipment()!.recipient.state }} {{ shipment()!.recipient.postalCode }}
                  }
                </p>
              }
              <div class="contact-info">
                @if (shipment()!.recipient.email) {
                  <a href="mailto:{{ shipment()!.recipient.email }}">
                    <i class="pi pi-envelope"></i> {{ shipment()!.recipient.email }}
                  </a>
                }
                @if (shipment()!.recipient.phone) {
                  <a href="tel:{{ shipment()!.recipient.phone }}">
                    <i class="pi pi-phone"></i> {{ shipment()!.recipient.phone }}
                  </a>
                }
              </div>
            </div>
          </p-card>

          <!-- Shipping Info Card -->
          <p-card header="Shipping Details">
            <div class="info-grid">
              <div class="info-item">
                <label>Carrier</label>
                <span>{{ shipment()!.carrier || 'Not specified' }}</span>
              </div>
              <div class="info-item">
                <label>Tracking Number</label>
                @if (shipment()!.trackingNumber) {
                  <code>{{ shipment()!.trackingNumber }}</code>
                } @else {
                  <span class="not-set">Not available</span>
                }
              </div>
              <div class="info-item">
                <label>Shipped Date</label>
                <span>{{ shipment()!.shippedAt ? (shipment()!.shippedAt | date:'medium') : 'Not shipped' }}</span>
              </div>
              <div class="info-item">
                <label>Estimated Delivery</label>
                <span>{{ shipment()!.estimatedDelivery ? (shipment()!.estimatedDelivery | date:'mediumDate') : 'N/A' }}</span>
              </div>
              <div class="info-item">
                <label>Actual Delivery</label>
                <span>{{ shipment()!.actualDelivery ? (shipment()!.actualDelivery | date:'medium') : 'Not delivered' }}</span>
              </div>
              <div class="info-item">
                <label>Signature Required</label>
                <span>{{ shipment()!.signatureRequired ? 'Yes' : 'No' }}</span>
              </div>
            </div>
          </p-card>

          <!-- Return Info Card -->
          <p-card header="Return Information">
            <div class="info-grid">
              <div class="info-item">
                <label>Expected Return Date</label>
                @if (shipment()!.expectedReturnDate) {
                  <span [class.overdue]="isOverdue()">
                    {{ shipment()!.expectedReturnDate | date:'mediumDate' }}
                    @if (isOverdue()) {
                      <span class="overdue-badge">Overdue</span>
                    }
                  </span>
                } @else {
                  <span class="not-set">Not specified</span>
                }
              </div>
              <div class="info-item full-width">
                <label>Notes</label>
                <span>{{ shipment()!.notes || 'No notes' }}</span>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Items Table -->
        <p-card header="Shipment Items" styleClass="items-card">
          <p-table [value]="shipment()!.items" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Serial Number</th>
                <th>Lot Number</th>
                <th>Condition</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-item>
              <tr>
                <td><strong>{{ item.itemName }}</strong></td>
                <td><code>{{ item.itemSku }}</code></td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.serialNumber || 'N/A' }}</td>
                <td>{{ item.lotNumber || 'N/A' }}</td>
                <td>
                  <p-tag [value]="item.conditionOnShip" [severity]="getConditionSeverity(item.conditionOnShip)"></p-tag>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6" class="text-center p-4">No items in this shipment</td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>

        <!-- Status History Timeline -->
        <p-card header="Status History" styleClass="history-card">
          @if (history().length > 0) {
            <p-timeline [value]="history()" align="left">
              <ng-template pTemplate="content" let-event>
                <div class="timeline-event">
                  <div class="event-header">
                    <p-tag [value]="getStatusLabel(event.status)" [severity]="getStatusSeverity(event.status)" [style]="{'font-size': '0.75rem'}"></p-tag>
                    <span class="event-time">{{ event.performedAt | date:'medium' }}</span>
                  </div>
                  @if (event.notes) {
                    <p class="event-notes">{{ event.notes }}</p>
                  }
                  @if (event.location) {
                    <p class="event-location"><i class="pi pi-map-marker"></i> {{ event.location }}</p>
                  }
                  @if (event.performedByName) {
                    <p class="event-user">by {{ event.performedByName }}</p>
                  }
                </div>
              </ng-template>
            </p-timeline>
          } @else {
            <p class="no-history">No status history available</p>
          }
        </p-card>
      } @else {
        <div class="not-found">
          <i class="pi pi-exclamation-triangle" style="font-size: 3rem; color: var(--warning-500)"></i>
          <h2>Shipment Not Found</h2>
          <p>The shipment you're looking for doesn't exist or has been removed.</p>
          <button pButton label="Back to Shipments" icon="pi pi-arrow-left" routerLink="/shipments"></button>
        </div>
      }

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .shipment-detail {
      padding: 1.5rem;
    }

    .loading-state, .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      gap: 1rem;
      text-align: center;
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

      a {
        color: var(--primary-600);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }

      i {
        color: var(--text-muted);
      }

      span {
        color: var(--text-secondary);
      }
    }

    .header-content {
      h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        color: var(--text-primary);
      }
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .info-item {
      label {
        display: block;
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        margin-bottom: 0.25rem;
      }

      span, code {
        color: var(--text-primary);
      }

      code {
        background: var(--bg-secondary);
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-sm);
        font-size: 0.875rem;
      }

      &.full-width {
        grid-column: span 2;
      }
    }

    .not-set {
      color: var(--text-muted);
      font-style: italic;
    }

    .overdue {
      color: var(--alert-600);
    }

    .overdue-badge {
      margin-left: 0.5rem;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      background: rgba(244, 63, 94, 0.2);
      color: var(--alert-600);
      border-radius: var(--radius-sm);
    }

    .recipient-details {
      h3 {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
      }

      .organization {
        margin: 0 0 0.5rem 0;
        color: var(--text-secondary);
      }

      .address {
        margin: 0 0 1rem 0;
        color: var(--text-primary);
        line-height: 1.5;
      }

      .contact-info {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        a {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--primary-600);
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    :host ::ng-deep .items-card,
    :host ::ng-deep .history-card {
      margin-bottom: 1rem;
    }

    .timeline-event {
      padding: 0.5rem 0;

      .event-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
      }

      .event-time {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .event-notes {
        margin: 0;
        color: var(--text-primary);
      }

      .event-location {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: var(--text-secondary);

        i {
          margin-right: 0.25rem;
        }
      }

      .event-user {
        margin: 0.25rem 0 0;
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .no-history {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
    }

    @media (max-width: 768px) {
      .detail-grid {
        grid-template-columns: 1fr;
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
export class ShipmentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly shipmentService = inject(ShipmentService);
  private readonly messageService = inject(MessageService);

  shipment = signal<Shipment | null>(null);
  history = signal<ShipmentStatusHistory[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadShipment(id);
    } else {
      this.loading.set(false);
    }
  }

  loadShipment(id: string): void {
    this.loading.set(true);
    this.shipmentService.getShipment(id).subscribe({
      next: (shipment) => {
        this.shipment.set(shipment);
        this.loadHistory(id);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load shipment' });
      }
    });
  }

  loadHistory(shipmentId: string): void {
    this.shipmentService.getShipmentHistory(shipmentId).subscribe({
      next: (history) => this.history.set(history)
    });
  }

  isOverdue(): boolean {
    const ship = this.shipment();
    if (!ship || ship.status !== ShipmentStatus.DELIVERED || !ship.expectedReturnDate) {
      return false;
    }
    return new Date() > new Date(ship.expectedReturnDate);
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

  getConditionSeverity(condition: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (condition?.toLowerCase()) {
      case 'excellent':
      case 'good': return 'success';
      case 'fair': return 'warn';
      case 'poor': return 'danger';
      default: return 'secondary';
    }
  }
}
