import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { LotBarcodeService, RecordScanRequest } from '@core/services/lot-barcode.service';
import { LotScanResult, BarcodeType, ScanPurpose } from '@shared/models';

interface ScanHistoryEntry {
  timestamp: Date;
  barcodeValue: string;
  result: LotScanResult;
  purpose: ScanPurpose;
}

@Component({
  selector: 'app-lot-scanner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    CardModule,
    ToastModule,
    TagModule,
    DividerModule
  ],
  providers: [MessageService],
  template: `
    <div class="lot-scanner">
      <div class="page-header">
        <div class="header-content">
          <button pButton icon="pi pi-arrow-left" class="p-button-text" (click)="goBack()"></button>
          <div>
            <h1>Scan Lot Barcode</h1>
            <p class="subtitle">Scan QR codes to look up lot information and verify items</p>
          </div>
        </div>
      </div>

      <div class="scanner-layout">
        <div class="scanner-section">
          <p-card header="Barcode Input">
            <div class="scan-input-area">
              <div class="input-group">
                <i class="pi pi-qrcode"></i>
                <input
                  #scanInput
                  type="text"
                  pInputText
                  [(ngModel)]="barcodeValue"
                  placeholder="Scan or enter barcode value..."
                  (keydown.enter)="performLookup()"
                  autofocus
                />
                <button pButton icon="pi pi-search" (click)="performLookup()" [loading]="scanning()"></button>
              </div>
              <small class="hint">Position cursor here and scan with barcode scanner, or type manually</small>
            </div>

            <p-divider></p-divider>

            <div class="scan-options">
              <div class="option-field">
                <label>Scan Purpose</label>
                <p-select
                  [options]="purposeOptions"
                  [(ngModel)]="scanPurpose"
                  [style]="{ width: '100%' }"
                ></p-select>
              </div>
              <div class="option-field">
                <label>Location (optional)</label>
                <input
                  pInputText
                  [(ngModel)]="scanLocation"
                  placeholder="e.g., Warehouse A, Room 101"
                  [style]="{ width: '100%' }"
                />
              </div>
            </div>
          </p-card>

          <!-- Scan Result -->
          @if (lastResult()) {
            <p-card [header]="lastResult()!.found ? 'Scan Result' : 'Not Found'" class="mt-3">
              @if (lastResult()!.found) {
                <div class="scan-result">
                  <!-- Status Banner -->
                  <div class="result-banner" [class]="getResultBannerClass()">
                    <i [class]="getResultIcon()"></i>
                    <span>{{ getResultMessage() }}</span>
                  </div>

                  <!-- Item Info -->
                  <div class="result-section">
                    <h4>Item Information</h4>
                    <div class="info-grid">
                      <div class="info-row">
                        <span class="info-label">Item Name</span>
                        <span class="info-value">{{ lastResult()!.itemName }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">SKU</span>
                        <span class="info-value monospace">{{ lastResult()!.itemSku }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Barcode Type</span>
                        <span class="info-value">
                          @if (lastResult()!.isLotBarcode) {
                            <p-tag value="Lot Barcode" severity="info" icon="pi pi-qrcode"></p-tag>
                          } @else {
                            <p-tag value="Item Barcode" severity="secondary" icon="pi pi-barcode"></p-tag>
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Lot Info (if lot barcode) -->
                  @if (lastResult()!.isLotBarcode) {
                    <p-divider></p-divider>
                    <div class="result-section">
                      <h4>Lot Information</h4>
                      <div class="info-grid">
                        <div class="info-row">
                          <span class="info-label">Lot Number</span>
                          <span class="info-value monospace">{{ lastResult()!.lotNumber }}</span>
                        </div>
                        @if (lastResult()!.expirationDate) {
                          <div class="info-row">
                            <span class="info-label">Expiration Date</span>
                            <span class="info-value" [class]="getExpirationClass()">
                              {{ lastResult()!.expirationDate | date:'mediumDate' }}
                              @if (lastResult()!.isExpired) {
                                <p-tag value="EXPIRED" severity="danger"></p-tag>
                              } @else if (lastResult()!.daysUntilExpiry <= 30) {
                                <p-tag value="Expiring Soon" severity="warn"></p-tag>
                              }
                            </span>
                          </div>
                          <div class="info-row">
                            <span class="info-label">Days Until Expiry</span>
                            <span class="info-value" [class]="getExpirationClass()">
                              {{ lastResult()!.daysUntilExpiry > 0 ? lastResult()!.daysUntilExpiry + ' days' : 'Expired' }}
                            </span>
                          </div>
                        }
                        @if (lastResult()!.serialNumber) {
                          <div class="info-row">
                            <span class="info-label">Serial Number</span>
                            <span class="info-value monospace">{{ lastResult()!.serialNumber }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }

                  <!-- Actions -->
                  <div class="result-actions">
                    <button pButton label="View Item Details" icon="pi pi-external-link" class="p-button-outlined" (click)="viewItemDetails()"></button>
                    @if (lastResult()!.isLotBarcode) {
                      <button pButton label="View Lot Details" icon="pi pi-info-circle" (click)="viewLotDetails()"></button>
                    }
                  </div>
                </div>
              } @else {
                <div class="not-found">
                  <i class="pi pi-times-circle"></i>
                  <h4>Barcode Not Found</h4>
                  <p>The scanned barcode "{{ lastResult()!.barcodeValue }}" was not found in the system.</p>
                  <p class="suggestion">This may be a new item or an external barcode. Would you like to:</p>
                  <div class="not-found-actions">
                    <button pButton label="Create New Lot Barcode" icon="pi pi-plus" (click)="createNewBarcode()"></button>
                    <button pButton label="Search Items" icon="pi pi-search" class="p-button-outlined" (click)="searchItems()"></button>
                  </div>
                </div>
              }
            </p-card>
          }
        </div>

        <!-- Scan History -->
        <div class="history-section">
          <p-card header="Scan History">
            @if (scanHistory().length > 0) {
              <div class="history-list">
                @for (entry of scanHistory(); track entry.timestamp) {
                  <div class="history-entry" [class.found]="entry.result.found" [class.not-found]="!entry.result.found">
                    <div class="entry-header">
                      <span class="entry-time">{{ entry.timestamp | date:'shortTime' }}</span>
                      <p-tag
                        [value]="entry.result.found ? (entry.result.isLotBarcode ? 'Lot' : 'Item') : 'Not Found'"
                        [severity]="entry.result.found ? (entry.result.isLotBarcode ? 'info' : 'secondary') : 'danger'"
                      ></p-tag>
                    </div>
                    <div class="entry-body">
                      @if (entry.result.found) {
                        <span class="entry-name">{{ entry.result.itemName }}</span>
                        @if (entry.result.isLotBarcode) {
                          <span class="entry-lot">Lot: {{ entry.result.lotNumber }}</span>
                        }
                      } @else {
                        <span class="entry-barcode">{{ truncateBarcode(entry.barcodeValue) }}</span>
                      }
                    </div>
                    <div class="entry-purpose">
                      <i class="pi pi-tag"></i>
                      {{ getPurposeLabel(entry.purpose) }}
                    </div>
                  </div>
                }
              </div>
              <div class="history-footer">
                <button pButton label="Clear History" icon="pi pi-trash" class="p-button-text p-button-sm" (click)="clearHistory()"></button>
              </div>
            } @else {
              <div class="no-history">
                <i class="pi pi-history"></i>
                <p>No scans yet</p>
                <small>Scan history will appear here</small>
              </div>
            }
          </p-card>

          <p-card header="Quick Stats" class="mt-3">
            <div class="quick-stats">
              <div class="stat">
                <span class="stat-value">{{ getTotalScans() }}</span>
                <span class="stat-label">Total Scans</span>
              </div>
              <div class="stat">
                <span class="stat-value success">{{ getFoundScans() }}</span>
                <span class="stat-label">Found</span>
              </div>
              <div class="stat">
                <span class="stat-value danger">{{ getNotFoundScans() }}</span>
                <span class="stat-label">Not Found</span>
              </div>
            </div>
          </p-card>
        </div>
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .lot-scanner {
      padding: 1.5rem;
    }

    .page-header {
      margin-bottom: 1.5rem;

      .header-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        h1 {
          margin: 0;
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .subtitle {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
      }
    }

    .scanner-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;

      @media (max-width: 1200px) {
        grid-template-columns: 1fr;
      }
    }

    .scanner-section {
      display: flex;
      flex-direction: column;
    }

    .scan-input-area {
      .input-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--bg-secondary);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 0.5rem;
        transition: border-color var(--transition-fast);

        &:focus-within {
          border-color: var(--primary-500);
        }

        i {
          font-size: 1.5rem;
          color: var(--primary-500);
          margin-left: 0.5rem;
        }

        input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 1.125rem;
          padding: 0.75rem;

          &:focus {
            box-shadow: none;
          }
        }
      }

      .hint {
        display: block;
        margin-top: 0.5rem;
        color: var(--text-muted);
        text-align: center;
      }
    }

    .scan-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }

      .option-field {
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }
      }
    }

    .scan-result {
      .result-banner {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: var(--radius-md);
        margin-bottom: 1.5rem;

        i {
          font-size: 1.5rem;
        }

        span {
          font-weight: 500;
        }

        &.success {
          background: rgba(16, 185, 129, 0.15);
          color: var(--primary-600);
        }

        &.warning {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
        }

        &.danger {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
      }

      .result-section {
        h4 {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;

          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .info-label {
              color: var(--text-muted);
            }

            .info-value {
              font-weight: 500;
              color: var(--text-primary);
              display: flex;
              align-items: center;
              gap: 0.5rem;

              &.monospace {
                font-family: monospace;
              }

              &.expired {
                color: #ef4444;
              }

              &.warning {
                color: #f59e0b;
              }
            }
          }
        }
      }

      .result-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.5rem;
      }
    }

    .not-found {
      text-align: center;
      padding: 2rem;

      i {
        font-size: 4rem;
        color: #ef4444;
        margin-bottom: 1rem;
      }

      h4 {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
      }

      p {
        color: var(--text-secondary);
        margin: 0 0 0.5rem 0;
      }

      .suggestion {
        font-weight: 500;
        margin-top: 1.5rem;
      }

      .not-found-actions {
        display: flex;
        justify-content: center;
        gap: 0.75rem;
        margin-top: 1rem;
      }
    }

    .history-section {
      display: flex;
      flex-direction: column;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 400px;
      overflow-y: auto;

      .history-entry {
        padding: 0.75rem;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        border-left: 3px solid;

        &.found {
          border-left-color: var(--primary-500);
        }

        &.not-found {
          border-left-color: #ef4444;
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;

          .entry-time {
            font-size: 0.75rem;
            color: var(--text-muted);
          }
        }

        .entry-body {
          display: flex;
          flex-direction: column;

          .entry-name {
            font-weight: 500;
            color: var(--text-primary);
          }

          .entry-lot {
            font-size: 0.75rem;
            color: var(--text-muted);
            font-family: monospace;
          }

          .entry-barcode {
            font-family: monospace;
            font-size: 0.75rem;
            color: var(--text-secondary);
          }
        }

        .entry-purpose {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.5rem;

          i {
            font-size: 0.75rem;
          }
        }
      }
    }

    .history-footer {
      display: flex;
      justify-content: center;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .no-history {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);

      i {
        font-size: 2.5rem;
        margin-bottom: 0.75rem;
        opacity: 0.3;
      }

      p {
        margin: 0;
      }

      small {
        font-size: 0.75rem;
      }
    }

    .quick-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;

      .stat {
        text-align: center;

        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);

          &.success {
            color: var(--primary-500);
          }

          &.danger {
            color: #ef4444;
          }
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      }
    }

    .mt-3 {
      margin-top: 1rem;
    }
  `]
})
export class LotScannerComponent {
  private readonly router = inject(Router);
  private readonly lotBarcodeService = inject(LotBarcodeService);
  private readonly messageService = inject(MessageService);

  barcodeValue = '';
  scanPurpose: ScanPurpose = ScanPurpose.VERIFY;
  scanLocation = '';

  scanning = signal(false);
  lastResult = signal<LotScanResult | null>(null);
  scanHistory = signal<ScanHistoryEntry[]>([]);

  purposeOptions = [
    { label: 'Verify', value: ScanPurpose.VERIFY },
    { label: 'Receive', value: ScanPurpose.RECEIVE },
    { label: 'Checkout', value: ScanPurpose.CHECKOUT },
    { label: 'Check-in', value: ScanPurpose.CHECKIN },
    { label: 'Inventory Count', value: ScanPurpose.INVENTORY },
    { label: 'Ship', value: ScanPurpose.SHIP }
  ];

  performLookup(): void {
    if (!this.barcodeValue.trim()) return;

    this.scanning.set(true);
    const trimmedValue = this.barcodeValue.trim();

    this.lotBarcodeService.lookupLotBarcode(trimmedValue).subscribe({
      next: (result) => {
        this.lastResult.set(result);
        this.scanning.set(false);

        // Add to history
        const history = [...this.scanHistory()];
        history.unshift({
          timestamp: new Date(),
          barcodeValue: trimmedValue,
          result,
          purpose: this.scanPurpose
        });
        this.scanHistory.set(history.slice(0, 50)); // Keep last 50 entries

        // Record scan for audit
        this.recordScan(trimmedValue, result);

        // Clear input for next scan
        this.barcodeValue = '';

        // Show appropriate message
        if (result.found) {
          if (result.isExpired) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Expired Item',
              detail: `This lot has expired!`
            });
          } else {
            this.messageService.add({
              severity: 'success',
              summary: 'Found',
              detail: result.isLotBarcode ? `Lot ${result.lotNumber} found` : 'Item found'
            });
          }
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Not Found',
            detail: 'Barcode not found in system'
          });
        }
      },
      error: () => {
        this.scanning.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to lookup barcode'
        });
      }
    });
  }

  private recordScan(barcodeValue: string, result: LotScanResult): void {
    const request: RecordScanRequest = {
      barcodeValue,
      barcodeType: result.barcodeType,
      scanPurpose: this.scanPurpose,
      scanLocation: this.scanLocation || undefined
    };

    this.lotBarcodeService.recordScan(request).subscribe();
  }

  getResultBannerClass(): string {
    const result = this.lastResult();
    if (!result || !result.found) return '';

    if (result.isExpired) return 'danger';
    if (result.isLotBarcode && result.daysUntilExpiry <= 30) return 'warning';
    return 'success';
  }

  getResultIcon(): string {
    const result = this.lastResult();
    if (!result || !result.found) return 'pi pi-times-circle';

    if (result.isExpired) return 'pi pi-exclamation-circle';
    if (result.isLotBarcode && result.daysUntilExpiry <= 30) return 'pi pi-exclamation-triangle';
    return 'pi pi-check-circle';
  }

  getResultMessage(): string {
    const result = this.lastResult();
    if (!result || !result.found) return 'Not found';

    if (result.isExpired) return 'Warning: This lot has expired!';
    if (result.isLotBarcode && result.daysUntilExpiry <= 30) {
      return `Caution: Expires in ${result.daysUntilExpiry} days`;
    }
    return result.isLotBarcode ? 'Lot barcode verified successfully' : 'Item barcode verified';
  }

  getExpirationClass(): string {
    const result = this.lastResult();
    if (!result || !result.expirationDate) return '';

    if (result.isExpired) return 'expired';
    if (result.daysUntilExpiry <= 30) return 'warning';
    return '';
  }

  getPurposeLabel(purpose: ScanPurpose): string {
    const option = this.purposeOptions.find(o => o.value === purpose);
    return option?.label || purpose;
  }

  truncateBarcode(value: string): string {
    if (value.length <= 30) return value;
    return value.substring(0, 15) + '...' + value.substring(value.length - 10);
  }

  getTotalScans(): number {
    return this.scanHistory().length;
  }

  getFoundScans(): number {
    return this.scanHistory().filter(e => e.result.found).length;
  }

  getNotFoundScans(): number {
    return this.scanHistory().filter(e => !e.result.found).length;
  }

  viewItemDetails(): void {
    const result = this.lastResult();
    if (result?.itemId) {
      this.router.navigate(['/inventory', result.itemId]);
    }
  }

  viewLotDetails(): void {
    const result = this.lastResult();
    if (result?.lotBarcodeId) {
      this.router.navigate(['/lot-barcodes'], {
        queryParams: { highlight: result.lotBarcodeId }
      });
    }
  }

  createNewBarcode(): void {
    this.router.navigate(['/lot-barcodes/generate']);
  }

  searchItems(): void {
    this.router.navigate(['/inventory']);
  }

  clearHistory(): void {
    this.scanHistory.set([]);
  }

  goBack(): void {
    this.router.navigate(['/lot-barcodes']);
  }
}
