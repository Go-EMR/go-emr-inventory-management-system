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
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { LotBarcodeService, LotBarcodeFilter } from '@core/services/lot-barcode.service';
import { LotBarcode, LotLabelTemplate, BarcodeType } from '@shared/models';

@Component({
  selector: 'app-lot-barcode-list',
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
    ProgressBarModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="lot-barcode-list">
      <div class="page-header">
        <div class="header-content">
          <h1>Lot Barcodes</h1>
          <p class="subtitle">Manage lot-level QR codes for precise inventory tracking</p>
        </div>
        <div class="header-actions">
          <button pButton label="Scan" icon="pi pi-qrcode" class="p-button-outlined" (click)="openScanner()"></button>
          <button pButton label="Generate Labels" icon="pi pi-print" class="p-button-outlined" (click)="openLabelDialog()" [disabled]="selectedBarcodes.length === 0"></button>
          <button pButton label="New Lot Barcode" icon="pi pi-plus" (click)="navigateToGenerator()"></button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon total">
            <i class="pi pi-qrcode"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ totalBarcodes() }}</span>
            <span class="card-label">Total Lot Barcodes</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon active">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ activeBarcodes() }}</span>
            <span class="card-label">Active</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon warning">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ expiringBarcodes() }}</span>
            <span class="card-label">Expiring Soon</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon labels">
            <i class="pi pi-tag"></i>
          </div>
          <div class="card-content">
            <span class="card-value">{{ labelsGenerated() }}</span>
            <span class="card-label">Labels Generated</span>
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
            placeholder="Search by lot number, SKU, or barcode..."
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
            [options]="expirationOptions"
            [(ngModel)]="expirationFilter"
            placeholder="Expiration"
            [showClear]="true"
            (onChange)="applyFilters()"
          ></p-select>
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-container">
        <p-table
          [value]="lotBarcodes()"
          [loading]="loading()"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          [(selection)]="selectedBarcodes"
          [rowHover]="true"
          dataKey="id"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Showing {first} to {last} of {totalRecords} lot barcodes"
        >
          <ng-template pTemplate="header">
            <tr>
              <th style="width: 3rem">
                <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
              </th>
              <th pSortableColumn="itemName">Item <p-sortIcon field="itemName"></p-sortIcon></th>
              <th pSortableColumn="lotNumber">Lot # <p-sortIcon field="lotNumber"></p-sortIcon></th>
              <th pSortableColumn="expirationDate">Expiration <p-sortIcon field="expirationDate"></p-sortIcon></th>
              <th>Barcode</th>
              <th>Status</th>
              <th>Label</th>
              <th style="width: 8rem">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-barcode>
            <tr>
              <td>
                <p-tableCheckbox [value]="barcode"></p-tableCheckbox>
              </td>
              <td>
                <div class="item-info">
                  <span class="item-name">{{ barcode.itemName }}</span>
                  <span class="item-sku">{{ barcode.itemSku }}</span>
                </div>
              </td>
              <td>
                <span class="lot-number">{{ barcode.lotNumber }}</span>
                @if (barcode.serialNumber) {
                  <span class="serial-number">SN: {{ barcode.serialNumber }}</span>
                }
              </td>
              <td>
                @if (barcode.expirationDate) {
                  <div class="expiration-info" [class]="getExpirationClass(barcode.expirationDate)">
                    <span class="exp-date">{{ barcode.expirationDate | date:'mediumDate' }}</span>
                    <span class="exp-days">{{ getDaysUntilExpiry(barcode.expirationDate) }}</span>
                  </div>
                } @else {
                  <span class="no-expiration">No expiration</span>
                }
              </td>
              <td>
                <div class="barcode-value" [pTooltip]="barcode.barcodeValue" tooltipPosition="top">
                  <i class="pi pi-qrcode"></i>
                  <span>{{ truncateBarcode(barcode.barcodeValue) }}</span>
                </div>
              </td>
              <td>
                <p-tag
                  [value]="barcode.isActive ? 'Active' : 'Inactive'"
                  [severity]="barcode.isActive ? 'success' : 'secondary'"
                ></p-tag>
              </td>
              <td>
                @if (barcode.labelGenerated) {
                  <p-tag value="Generated" severity="info" icon="pi pi-check"></p-tag>
                } @else {
                  <p-tag value="Pending" severity="warn" icon="pi pi-clock"></p-tag>
                }
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    pButton
                    icon="pi pi-print"
                    class="p-button-rounded p-button-text p-button-sm"
                    pTooltip="Generate Label"
                    (click)="generateSingleLabel(barcode)"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-copy"
                    class="p-button-rounded p-button-text p-button-sm"
                    pTooltip="Copy Barcode"
                    (click)="copyBarcode(barcode)"
                  ></button>
                  <button
                    pButton
                    icon="pi pi-times"
                    class="p-button-rounded p-button-text p-button-danger p-button-sm"
                    pTooltip="Deactivate"
                    [disabled]="!barcode.isActive"
                    (click)="confirmDeactivate(barcode)"
                  ></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="empty-message">
                <i class="pi pi-inbox"></i>
                <p>No lot barcodes found</p>
                <button pButton label="Generate New" icon="pi pi-plus" (click)="navigateToGenerator()"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Label Generation Dialog -->
      <p-dialog
        header="Generate Lot Labels"
        [(visible)]="showLabelDialog"
        [style]="{ width: '500px' }"
        [modal]="true"
      >
        <div class="label-dialog-content">
          <div class="form-field">
            <label>Label Template</label>
            <p-select
              [options]="labelTemplates()"
              [(ngModel)]="selectedTemplate"
              optionLabel="name"
              placeholder="Select template"
              [style]="{ width: '100%' }"
            >
              <ng-template pTemplate="item" let-template>
                <div class="template-option">
                  <span class="template-name">{{ template.name }}</span>
                  <span class="template-size">{{ template.sizeName }}</span>
                </div>
              </ng-template>
            </p-select>
          </div>

          <div class="form-field">
            <label>Output Format</label>
            <div class="format-options">
              <div
                class="format-option"
                [class.selected]="labelFormat === 'pdf'"
                (click)="labelFormat = 'pdf'"
              >
                <i class="pi pi-file-pdf"></i>
                <span>PDF</span>
              </div>
              <div
                class="format-option"
                [class.selected]="labelFormat === 'zpl'"
                (click)="labelFormat = 'zpl'"
              >
                <i class="pi pi-print"></i>
                <span>ZPL</span>
              </div>
            </div>
          </div>

          <div class="selected-count">
            <i class="pi pi-info-circle"></i>
            {{ selectedBarcodes.length }} lot barcode(s) selected for label generation
          </div>
        </div>

        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="showLabelDialog = false"></button>
          <button
            pButton
            label="Generate"
            icon="pi pi-print"
            (click)="generateLabels()"
            [loading]="generatingLabels()"
            [disabled]="!selectedTemplate"
          ></button>
        </ng-template>
      </p-dialog>

      <!-- Label Ready Dialog -->
      <p-dialog
        header="Labels Ready"
        [(visible)]="showLabelReadyDialog"
        [style]="{ width: '400px' }"
        [modal]="true"
      >
        <div class="label-ready-content">
          <i class="pi pi-check-circle success-icon"></i>
          <p>{{ currentPrintJob?.labelCount }} labels generated successfully!</p>
          @if (currentPrintJob?.outputUrl) {
            <a [href]="currentPrintJob?.outputUrl" target="_blank" class="download-link">
              <i class="pi pi-download"></i>
              Download Labels
            </a>
          }
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Close" (click)="showLabelReadyDialog = false"></button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .lot-barcode-list {
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

        i {
          font-size: 1.5rem;
        }

        &.total {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        &.active {
          background: rgba(16, 185, 129, 0.15);
          color: var(--primary-500);
        }

        &.warning {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }

        &.labels {
          background: rgba(139, 92, 246, 0.15);
          color: #8b5cf6;
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

    .lot-number {
      font-weight: 500;
      color: var(--text-primary);
      font-family: monospace;
    }

    .serial-number {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .expiration-info {
      display: flex;
      flex-direction: column;

      .exp-date {
        font-weight: 500;
      }

      .exp-days {
        font-size: 0.75rem;
      }

      &.expired {
        color: #ef4444;
      }

      &.warning {
        color: #f59e0b;
      }

      &.ok {
        color: var(--text-primary);
      }
    }

    .no-expiration {
      color: var(--text-muted);
      font-style: italic;
    }

    .barcode-value {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: monospace;
      font-size: 0.75rem;
      color: var(--text-secondary);
      cursor: default;

      i {
        color: var(--primary-500);
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
      }

      p {
        margin: 0 0 1rem 0;
      }
    }

    .label-dialog-content {
      .form-field {
        margin-bottom: 1.5rem;

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--text-primary);
        }
      }

      .template-option {
        display: flex;
        justify-content: space-between;
        width: 100%;

        .template-name {
          font-weight: 500;
        }

        .template-size {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      }

      .format-options {
        display: flex;
        gap: 0.75rem;
      }

      .format-option {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md);
        cursor: pointer;
        transition: all var(--transition-fast);

        &:hover {
          border-color: var(--primary-300);
        }

        &.selected {
          border-color: var(--primary-500);
          background: rgba(16, 185, 129, 0.1);
        }

        i {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: var(--primary-500);
        }

        span {
          font-weight: 500;
        }
      }

      .selected-count {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: rgba(59, 130, 246, 0.1);
        border-radius: var(--radius-md);
        color: #3b82f6;
        font-size: 0.875rem;
      }
    }

    .label-ready-content {
      text-align: center;
      padding: 1rem;

      .success-icon {
        font-size: 4rem;
        color: var(--primary-500);
        margin-bottom: 1rem;
      }

      p {
        font-size: 1rem;
        color: var(--text-primary);
        margin-bottom: 1.5rem;
      }

      .download-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: var(--primary-500);
        color: white;
        text-decoration: none;
        border-radius: var(--radius-md);
        font-weight: 500;

        &:hover {
          background: var(--primary-600);
        }
      }
    }
  `]
})
export class LotBarcodeListComponent implements OnInit {
  private readonly lotBarcodeService = inject(LotBarcodeService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly router = inject(Router);

  lotBarcodes = signal<LotBarcode[]>([]);
  labelTemplates = signal<LotLabelTemplate[]>([]);
  loading = signal(false);
  generatingLabels = signal(false);

  selectedBarcodes: LotBarcode[] = [];
  searchQuery = '';
  statusFilter: string | null = null;
  expirationFilter: string | null = null;

  showLabelDialog = false;
  showLabelReadyDialog = false;
  selectedTemplate: LotLabelTemplate | null = null;
  labelFormat: 'pdf' | 'zpl' = 'pdf';
  currentPrintJob: { labelCount: number; outputUrl?: string } | null = null;

  statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ];

  expirationOptions = [
    { label: 'Expiring in 30 days', value: '30' },
    { label: 'Expiring in 60 days', value: '60' },
    { label: 'Expiring in 90 days', value: '90' },
    { label: 'No Expiration', value: 'none' }
  ];

  totalBarcodes = signal(0);
  activeBarcodes = signal(0);
  expiringBarcodes = signal(0);
  labelsGenerated = signal(0);

  ngOnInit(): void {
    this.loadLotBarcodes();
    this.loadLabelTemplates();
  }

  loadLotBarcodes(): void {
    this.loading.set(true);
    const filter: LotBarcodeFilter = {};

    if (this.statusFilter === 'active') {
      filter.isActive = true;
    } else if (this.statusFilter === 'inactive') {
      filter.isActive = false;
    }

    if (this.expirationFilter && this.expirationFilter !== 'none') {
      filter.expiringWithinDays = parseInt(this.expirationFilter);
    } else if (this.expirationFilter === 'none') {
      filter.hasExpiration = false;
    }

    this.lotBarcodeService.getLotBarcodes(filter).subscribe({
      next: (response) => {
        let items = response.items;

        // Client-side search filter
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          items = items.filter(b =>
            b.lotNumber.toLowerCase().includes(query) ||
            b.itemSku.toLowerCase().includes(query) ||
            b.itemName.toLowerCase().includes(query) ||
            b.barcodeValue.toLowerCase().includes(query)
          );
        }

        this.lotBarcodes.set(items);
        this.updateStats(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load lot barcodes'
        });
        this.loading.set(false);
      }
    });
  }

  loadLabelTemplates(): void {
    this.lotBarcodeService.getLotLabelTemplates().subscribe({
      next: (response) => {
        this.labelTemplates.set(response.items);
        this.selectedTemplate = response.items.find(t => t.isDefault) || response.items[0] || null;
      }
    });
  }

  updateStats(barcodes: LotBarcode[]): void {
    this.totalBarcodes.set(barcodes.length);
    this.activeBarcodes.set(barcodes.filter(b => b.isActive).length);
    this.labelsGenerated.set(barcodes.filter(b => b.labelGenerated).length);

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    this.expiringBarcodes.set(
      barcodes.filter(b =>
        b.isActive &&
        b.expirationDate &&
        b.expirationDate <= thirtyDaysFromNow &&
        b.expirationDate >= now
      ).length
    );
  }

  onSearch(): void {
    this.loadLotBarcodes();
  }

  applyFilters(): void {
    this.loadLotBarcodes();
  }

  getExpirationClass(expirationDate: Date): string {
    const now = new Date();
    const daysUntil = Math.ceil((new Date(expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'expired';
    if (daysUntil <= 30) return 'warning';
    return 'ok';
  }

  getDaysUntilExpiry(expirationDate: Date): string {
    const now = new Date();
    const daysUntil = Math.ceil((new Date(expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return `${Math.abs(daysUntil)} days expired`;
    if (daysUntil === 0) return 'Expires today';
    if (daysUntil === 1) return 'Expires tomorrow';
    return `${daysUntil} days remaining`;
  }

  truncateBarcode(value: string): string {
    if (value.length <= 25) return value;
    return value.substring(0, 12) + '...' + value.substring(value.length - 10);
  }

  navigateToGenerator(): void {
    this.router.navigate(['/lot-barcodes/generate']);
  }

  openScanner(): void {
    this.router.navigate(['/lot-barcodes/scan']);
  }

  openLabelDialog(): void {
    this.showLabelDialog = true;
  }

  generateSingleLabel(barcode: LotBarcode): void {
    this.selectedBarcodes = [barcode];
    this.openLabelDialog();
  }

  generateLabels(): void {
    if (!this.selectedTemplate || this.selectedBarcodes.length === 0) return;

    this.generatingLabels.set(true);
    this.lotBarcodeService.generateLotLabels({
      templateId: this.selectedTemplate.id,
      lotBarcodeIds: this.selectedBarcodes.map(b => b.id),
      outputFormat: this.labelFormat
    }).subscribe({
      next: (job) => {
        this.showLabelDialog = false;
        this.pollJobStatus(job.id);
      },
      error: () => {
        this.generatingLabels.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to generate labels'
        });
      }
    });
  }

  private pollJobStatus(jobId: string): void {
    const checkStatus = () => {
      this.lotBarcodeService.getLotLabelPrintJob(jobId).subscribe({
        next: (job) => {
          if (job.status === 'pending' || job.status === 'processing') {
            setTimeout(checkStatus, 1000);
          } else if (job.status === 'completed') {
            this.generatingLabels.set(false);
            this.currentPrintJob = {
              labelCount: job.labelCount,
              outputUrl: job.outputUrl
            };
            this.showLabelReadyDialog = true;
            this.loadLotBarcodes(); // Refresh to show updated label status
          } else if (job.status === 'failed') {
            this.generatingLabels.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: job.errorMessage || 'Label generation failed'
            });
          }
        }
      });
    };
    setTimeout(checkStatus, 1000);
  }

  copyBarcode(barcode: LotBarcode): void {
    navigator.clipboard.writeText(barcode.barcodeValue).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'Barcode value copied to clipboard'
      });
    });
  }

  confirmDeactivate(barcode: LotBarcode): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to deactivate the lot barcode for ${barcode.itemName} (Lot: ${barcode.lotNumber})?`,
      header: 'Confirm Deactivation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deactivateBarcode(barcode)
    });
  }

  deactivateBarcode(barcode: LotBarcode): void {
    this.lotBarcodeService.deactivateLotBarcode(barcode.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Lot barcode deactivated'
        });
        this.loadLotBarcodes();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to deactivate lot barcode'
        });
      }
    });
  }
}
