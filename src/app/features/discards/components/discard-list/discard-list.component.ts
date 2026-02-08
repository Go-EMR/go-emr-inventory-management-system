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
import { MessageService, ConfirmationService } from 'primeng/api';
import { DiscardService, DiscardFilter } from '@core/services/discard.service';
import { DiscardRecord, DiscardStatus, DiscardSummary, DisposalMethod } from '@shared/models';

@Component({
  selector: 'app-discard-list',
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
    Textarea
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="discard-list">
      <div class="page-header">
        <div class="header-content">
          <h1>Discard Management</h1>
          <p class="subtitle">Track and manage disposed inventory items</p>
        </div>
        <div class="header-actions">
          <button pButton label="Expiration Alerts" icon="pi pi-exclamation-triangle" class="p-button-outlined" (click)="navigateToAlerts()"></button>
          <button pButton label="Waste Report" icon="pi pi-chart-bar" class="p-button-outlined" (click)="navigateToReport()"></button>
          <button pButton label="New Discard" icon="pi pi-plus" (click)="navigateToNew()"></button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon pending">
            <i class="pi pi-clock"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.pendingDiscards || 0 }}</span>
            <span class="card-label">Pending Discards</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon approval">
            <i class="pi pi-user-edit"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.pendingApprovals || 0 }}</span>
            <span class="card-label">Awaiting Approval</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon completed">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.completedThisMonth || 0 }}</span>
            <span class="card-label">Completed This Month</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon cost">
            <i class="pi pi-dollar"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ summary()?.totalWasteCostThisMonth | currency }}</span>
            <span class="card-label">Waste Cost This Month</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="search-box">
          <i class="pi pi-search"></i>
          <input
            type="text"
            pInputText
            [(ngModel)]="searchQuery"
            placeholder="Search by item name, SKU, or discard number..."
            (input)="onSearch()"
          />
        </div>
        <div class="filter-controls">
          <p-select
            [options]="statusOptions"
            [(ngModel)]="statusFilter"
            placeholder="Status"
            [showClear]="true"
            (onChange)="applyFilters()"
          ></p-select>
          <p-select
            [options]="reasonOptions"
            [(ngModel)]="reasonFilter"
            placeholder="Reason"
            [showClear]="true"
            (onChange)="applyFilters()"
          ></p-select>
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-container">
        <p-table
          [value]="discards()"
          [loading]="loading()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [rowHover]="true"
          dataKey="id"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
        >
          <ng-template pTemplate="header">
            <tr>
              <th pSortableColumn="discardNumber">Discard # <p-sortIcon field="discardNumber"></p-sortIcon></th>
              <th pSortableColumn="itemName">Item <p-sortIcon field="itemName"></p-sortIcon></th>
              <th>Lot / Qty</th>
              <th pSortableColumn="reasonCode">Reason <p-sortIcon field="reasonCode"></p-sortIcon></th>
              <th pSortableColumn="totalCost">Cost <p-sortIcon field="totalCost"></p-sortIcon></th>
              <th pSortableColumn="status">Status <p-sortIcon field="status"></p-sortIcon></th>
              <th pSortableColumn="createdAt">Date <p-sortIcon field="createdAt"></p-sortIcon></th>
              <th style="width: 10rem">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-discard>
            <tr>
              <td>
                <span class="discard-number">{{ discard.discardNumber }}</span>
              </td>
              <td>
                <div class="item-info">
                  <span class="item-name">{{ discard.itemName }}</span>
                  <span class="item-sku">{{ discard.itemSku }}</span>
                </div>
              </td>
              <td>
                <div class="lot-info">
                  @if (discard.lotNumber) {
                    <span class="lot-number">Lot: {{ discard.lotNumber }}</span>
                  }
                  <span class="quantity">Qty: {{ discard.quantity }}</span>
                </div>
              </td>
              <td>
                <p-tag [value]="discard.reasonName" [severity]="getReasonSeverity(discard.reasonCode)"></p-tag>
              </td>
              <td>
                <span class="cost-value">{{ discard.totalCost | currency }}</span>
              </td>
              <td>
                <p-tag [value]="getStatusLabel(discard.status)" [severity]="getStatusSeverity(discard.status)"></p-tag>
                @if (discard.requiresApproval && !discard.approvedBy) {
                  <span class="needs-approval">Needs Approval</span>
                }
                @if (discard.requiresWitness && !discard.witnessedBy) {
                  <span class="needs-witness">Needs Witness</span>
                }
              </td>
              <td>
                <span class="date-value">{{ discard.createdAt | date:'shortDate' }}</span>
              </td>
              <td>
                <div class="action-buttons">
                  @if (discard.status === 'pending' && discard.requiresApproval && !discard.approvedBy) {
                    <button
                      pButton
                      icon="pi pi-check"
                      class="p-button-rounded p-button-success p-button-text p-button-sm"
                      pTooltip="Approve"
                      (click)="openApproveDialog(discard)"
                    ></button>
                  }
                  @if (discard.status === 'pending' && discard.requiresWitness && !discard.witnessedBy) {
                    <button
                      pButton
                      icon="pi pi-eye"
                      class="p-button-rounded p-button-info p-button-text p-button-sm"
                      pTooltip="Witness"
                      (click)="openWitnessDialog(discard)"
                    ></button>
                  }
                  @if (discard.status === 'approved') {
                    <button
                      pButton
                      icon="pi pi-check-circle"
                      class="p-button-rounded p-button-success p-button-text p-button-sm"
                      pTooltip="Complete"
                      (click)="completeDiscard(discard)"
                    ></button>
                  }
                  @if (discard.status === 'pending' || discard.status === 'approved') {
                    <button
                      pButton
                      icon="pi pi-times"
                      class="p-button-rounded p-button-danger p-button-text p-button-sm"
                      pTooltip="Cancel"
                      (click)="confirmCancel(discard)"
                    ></button>
                  }
                  <button
                    pButton
                    icon="pi pi-info-circle"
                    class="p-button-rounded p-button-text p-button-sm"
                    pTooltip="View Details"
                    (click)="viewDetails(discard)"
                  ></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="empty-message">
                <i class="pi pi-inbox"></i>
                <p>No discard records found</p>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Approve Dialog -->
      <p-dialog
        header="Approve Discard"
        [(visible)]="showApproveDialog"
        [style]="{ width: '450px' }"
        [modal]="true"
      >
        <div class="dialog-content">
          <p>Approve discard of <strong>{{ selectedDiscard?.quantity }} {{ selectedDiscard?.itemName }}</strong>?</p>
          <div class="form-field">
            <label>Approval Notes (optional)</label>
            <textarea pTextarea [(ngModel)]="approvalNotes" rows="3" [style]="{ width: '100%' }"></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showApproveDialog = false"></button>
          <button pButton label="Approve" icon="pi pi-check" (click)="approveDiscard()"></button>
        </ng-template>
      </p-dialog>

      <!-- Witness Dialog -->
      <p-dialog
        header="Witness Disposal"
        [(visible)]="showWitnessDialog"
        [style]="{ width: '450px' }"
        [modal]="true"
      >
        <div class="dialog-content">
          <div class="witness-warning">
            <i class="pi pi-exclamation-triangle"></i>
            <span>This is a controlled substance disposal requiring witness verification.</span>
          </div>
          <p>Witness disposal of <strong>{{ selectedDiscard?.quantity }} {{ selectedDiscard?.itemName }}</strong>?</p>
          <div class="form-field">
            <label>Witness Notes (optional)</label>
            <textarea pTextarea [(ngModel)]="witnessNotes" rows="3" [style]="{ width: '100%' }"></textarea>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showWitnessDialog = false"></button>
          <button pButton label="Confirm Witness" icon="pi pi-eye" (click)="witnessDiscard()"></button>
        </ng-template>
      </p-dialog>

      <!-- Detail Dialog -->
      <p-dialog
        header="Discard Details"
        [(visible)]="showDetailDialog"
        [style]="{ width: '600px' }"
        [modal]="true"
      >
        @if (selectedDiscard) {
          <div class="detail-content">
            <div class="detail-section">
              <h4>General Information</h4>
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="label">Discard #:</span>
                  <span class="value">{{ selectedDiscard.discardNumber }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <p-tag [value]="getStatusLabel(selectedDiscard.status)" [severity]="getStatusSeverity(selectedDiscard.status)"></p-tag>
                </div>
                <div class="detail-row">
                  <span class="label">Created:</span>
                  <span class="value">{{ selectedDiscard.createdAt | date:'medium' }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Created By:</span>
                  <span class="value">{{ selectedDiscard.createdByName }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>Item Information</h4>
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="label">Item:</span>
                  <span class="value">{{ selectedDiscard.itemName }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">SKU:</span>
                  <span class="value monospace">{{ selectedDiscard.itemSku }}</span>
                </div>
                @if (selectedDiscard.lotNumber) {
                  <div class="detail-row">
                    <span class="label">Lot #:</span>
                    <span class="value monospace">{{ selectedDiscard.lotNumber }}</span>
                  </div>
                }
                @if (selectedDiscard.expirationDate) {
                  <div class="detail-row">
                    <span class="label">Expiration:</span>
                    <span class="value">{{ selectedDiscard.expirationDate | date:'mediumDate' }}</span>
                  </div>
                }
                <div class="detail-row">
                  <span class="label">Quantity:</span>
                  <span class="value">{{ selectedDiscard.quantity }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Total Cost:</span>
                  <span class="value">{{ selectedDiscard.totalCost | currency }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h4>Reason & Disposal</h4>
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="label">Reason:</span>
                  <p-tag [value]="selectedDiscard.reasonName" [severity]="getReasonSeverity(selectedDiscard.reasonCode)"></p-tag>
                </div>
                @if (selectedDiscard.reasonNotes) {
                  <div class="detail-row full-width">
                    <span class="label">Notes:</span>
                    <span class="value">{{ selectedDiscard.reasonNotes }}</span>
                  </div>
                }
                @if (selectedDiscard.disposalMethod) {
                  <div class="detail-row">
                    <span class="label">Disposal Method:</span>
                    <span class="value">{{ selectedDiscard.disposalMethod }}</span>
                  </div>
                }
                @if (selectedDiscard.disposalLocation) {
                  <div class="detail-row">
                    <span class="label">Disposal Location:</span>
                    <span class="value">{{ selectedDiscard.disposalLocation }}</span>
                  </div>
                }
              </div>
            </div>

            @if (selectedDiscard.approvedBy || selectedDiscard.witnessedBy) {
              <div class="detail-section">
                <h4>Approval & Witness</h4>
                <div class="detail-grid">
                  @if (selectedDiscard.approvedBy) {
                    <div class="detail-row">
                      <span class="label">Approved By:</span>
                      <span class="value">{{ selectedDiscard.approvedByName }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Approved At:</span>
                      <span class="value">{{ selectedDiscard.approvedAt | date:'medium' }}</span>
                    </div>
                  }
                  @if (selectedDiscard.witnessedBy) {
                    <div class="detail-row">
                      <span class="label">Witnessed By:</span>
                      <span class="value">{{ selectedDiscard.witnessedByName }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Witnessed At:</span>
                      <span class="value">{{ selectedDiscard.witnessedAt | date:'medium' }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
        <ng-template pTemplate="footer">
          <button pButton label="Close" (click)="showDetailDialog = false"></button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .discard-list {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;

      .header-content {
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

      @media (max-width: 1200px) {
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
      padding: 1rem;
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

        &.pending {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }

        &.approval {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        &.completed {
          background: rgba(16, 185, 129, 0.15);
          color: var(--primary-500);
        }

        &.cost {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
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

    .filters-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;

      @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
      }

      .search-box {
        position: relative;
        flex: 1;
        max-width: 400px;

        i {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        input {
          width: 100%;
          padding-left: 2.25rem;
        }
      }

      .filter-controls {
        display: flex;
        gap: 0.5rem;
      }
    }

    .table-container {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .discard-number {
      font-family: monospace;
      font-weight: 500;
      color: var(--primary-600);
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

    .cost-value {
      font-weight: 500;
      color: var(--text-primary);
    }

    .date-value {
      color: var(--text-secondary);
    }

    .needs-approval, .needs-witness {
      display: block;
      font-size: 0.625rem;
      color: #f59e0b;
      margin-top: 0.25rem;
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
      }

      p {
        margin: 0;
      }
    }

    .dialog-content {
      .form-field {
        margin-top: 1rem;

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--text-primary);
        }
      }

      .witness-warning {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem;
        background: rgba(245, 158, 11, 0.15);
        border-radius: var(--radius-md);
        margin-bottom: 1rem;

        i {
          color: #f59e0b;
          font-size: 1.25rem;
        }

        span {
          color: #f59e0b;
          font-size: 0.875rem;
        }
      }
    }

    .detail-content {
      .detail-section {
        margin-bottom: 1.5rem;

        h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-color);
        }
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;

        .detail-row {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;

          &.full-width {
            grid-column: span 2;
          }

          .label {
            font-size: 0.75rem;
            color: var(--text-muted);
          }

          .value {
            font-weight: 500;
            color: var(--text-primary);

            &.monospace {
              font-family: monospace;
            }
          }
        }
      }
    }
  `]
})
export class DiscardListComponent implements OnInit {
  private readonly discardService = inject(DiscardService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

  discards = signal<DiscardRecord[]>([]);
  summary = signal<DiscardSummary | null>(null);
  loading = signal(false);

  searchQuery = '';
  statusFilter: DiscardStatus | null = null;
  reasonFilter: string | null = null;

  showApproveDialog = false;
  showWitnessDialog = false;
  showDetailDialog = false;
  selectedDiscard: DiscardRecord | null = null;
  approvalNotes = '';
  witnessNotes = '';

  statusOptions = [
    { label: 'Pending', value: DiscardStatus.PENDING },
    { label: 'Approved', value: DiscardStatus.APPROVED },
    { label: 'Completed', value: DiscardStatus.COMPLETED },
    { label: 'Cancelled', value: DiscardStatus.CANCELLED }
  ];

  reasonOptions = [
    { label: 'Expired', value: 'EXPIRED' },
    { label: 'Damaged', value: 'DAMAGED' },
    { label: 'Contaminated', value: 'CONTAMINATED' },
    { label: 'Recalled', value: 'RECALLED' },
    { label: 'Quality Issue', value: 'QUALITY_ISSUE' },
    { label: 'Opened/Unused', value: 'OPENED_UNUSED' },
    { label: 'Controlled Waste', value: 'CONTROLLED_WASTE' }
  ];

  ngOnInit(): void {
    this.loadDiscards();
    this.loadSummary();
  }

  loadDiscards(): void {
    this.loading.set(true);
    const filter: DiscardFilter = {};

    if (this.statusFilter) {
      filter.status = this.statusFilter;
    }
    if (this.reasonFilter) {
      filter.reasonCode = this.reasonFilter;
    }

    this.discardService.listDiscards(filter).subscribe({
      next: (response) => {
        let items = response.items;
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          items = items.filter(d =>
            d.itemName.toLowerCase().includes(query) ||
            d.itemSku.toLowerCase().includes(query) ||
            d.discardNumber.toLowerCase().includes(query)
          );
        }
        this.discards.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load discards' });
        this.loading.set(false);
      }
    });
  }

  loadSummary(): void {
    this.discardService.getDiscardSummary().subscribe({
      next: (summary) => this.summary.set(summary)
    });
  }

  onSearch(): void {
    this.loadDiscards();
  }

  applyFilters(): void {
    this.loadDiscards();
  }

  getStatusLabel(status: DiscardStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getStatusSeverity(status: DiscardStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case DiscardStatus.COMPLETED: return 'success';
      case DiscardStatus.APPROVED: return 'info';
      case DiscardStatus.PENDING: return 'warn';
      case DiscardStatus.CANCELLED: return 'secondary';
      default: return 'info';
    }
  }

  getReasonSeverity(reasonCode: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (reasonCode) {
      case 'EXPIRED': return 'danger';
      case 'DAMAGED': return 'warn';
      case 'CONTAMINATED': return 'danger';
      case 'RECALLED': return 'contrast';
      case 'CONTROLLED_WASTE': return 'danger';
      default: return 'secondary';
    }
  }

  openApproveDialog(discard: DiscardRecord): void {
    this.selectedDiscard = discard;
    this.approvalNotes = '';
    this.showApproveDialog = true;
  }

  approveDiscard(): void {
    if (!this.selectedDiscard) return;

    this.discardService.approveDiscard(this.selectedDiscard.id, this.approvalNotes).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Discard approved' });
        this.showApproveDialog = false;
        this.loadDiscards();
        this.loadSummary();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to approve discard' });
      }
    });
  }

  openWitnessDialog(discard: DiscardRecord): void {
    this.selectedDiscard = discard;
    this.witnessNotes = '';
    this.showWitnessDialog = true;
  }

  witnessDiscard(): void {
    if (!this.selectedDiscard) return;

    this.discardService.witnessDiscard(this.selectedDiscard.id, this.witnessNotes).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Discard witnessed' });
        this.showWitnessDialog = false;
        this.loadDiscards();
        this.loadSummary();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to record witness' });
      }
    });
  }

  completeDiscard(discard: DiscardRecord): void {
    this.confirmationService.confirm({
      message: `Complete the discard of ${discard.quantity} ${discard.itemName}?`,
      header: 'Complete Discard',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.discardService.completeDiscard(discard.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Discard completed' });
            this.loadDiscards();
            this.loadSummary();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to complete discard' });
          }
        });
      }
    });
  }

  confirmCancel(discard: DiscardRecord): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to cancel this discard?`,
      header: 'Cancel Discard',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.discardService.cancelDiscard(discard.id, 'Cancelled by user').subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Discard cancelled' });
            this.loadDiscards();
            this.loadSummary();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to cancel discard' });
          }
        });
      }
    });
  }

  viewDetails(discard: DiscardRecord): void {
    this.selectedDiscard = discard;
    this.showDetailDialog = true;
  }

  navigateToAlerts(): void {
    this.router.navigate(['/discards/alerts']);
  }

  navigateToReport(): void {
    this.router.navigate(['/discards/report']);
  }

  navigateToNew(): void {
    this.router.navigate(['/discards/new']);
  }
}
