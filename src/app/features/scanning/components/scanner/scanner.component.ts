import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BarcodeService } from '@core/services/barcode.service';
import { ScanResult } from '@shared/models';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CardModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="scanner-page">
      <div class="page-header">
        <h1>Barcode Scanner</h1>
        <p class="subtitle">Scan or enter barcodes to look up inventory items</p>
      </div>

      <div class="scanner-container">
        <div class="scanner-input-section">
          <div class="input-wrapper">
            <i class="pi pi-qrcode"></i>
            <input
              pInputText
              [(ngModel)]="barcodeInput"
              placeholder="Scan or enter barcode..."
              (keyup.enter)="lookupBarcode()"
              #barcodeInputEl
              autofocus
            />
            <button pButton label="Look Up" (click)="lookupBarcode()" [loading]="loading()"></button>
          </div>
          <p class="hint">Position the barcode in front of your scanner or type the barcode manually</p>
        </div>

        @if (lastResult()) {
          <div class="result-section" [class.found]="lastResult()?.found" [class.not-found]="!lastResult()?.found">
            @if (lastResult()?.found) {
              <div class="result-icon success">
                <i class="pi pi-check-circle"></i>
              </div>
              <div class="result-content">
                <h3>{{ lastResult()?.itemName }}</h3>
                <p class="sku">SKU: {{ lastResult()?.itemSku }}</p>
                <p class="barcode">Barcode: {{ lastResult()?.barcodeValue }}</p>
                <div class="result-actions">
                  <button pButton label="View Item" icon="pi pi-external-link" class="p-button-outlined"></button>
                  <button pButton label="Adjust Stock" icon="pi pi-plus-circle" class="p-button-outlined"></button>
                  <button pButton label="Check Out" icon="pi pi-sign-out" class="p-button-outlined"></button>
                </div>
              </div>
            } @else {
              <div class="result-icon error">
                <i class="pi pi-times-circle"></i>
              </div>
              <div class="result-content">
                <h3>Item Not Found</h3>
                <p class="barcode">Barcode: {{ lastResult()?.barcodeValue }}</p>
                <p class="message">This barcode is not registered in the system</p>
                <div class="result-actions">
                  <button pButton label="Register New Item" icon="pi pi-plus" class="p-button-outlined"></button>
                </div>
              </div>
            }
          </div>
        }

        <div class="recent-scans">
          <h3>Recent Scans</h3>
          @if (recentScans().length > 0) {
            <div class="scans-list">
              @for (scan of recentScans(); track scan.barcodeValue) {
                <div class="scan-item" [class.found]="scan.found">
                  <div class="scan-icon">
                    <i [class]="scan.found ? 'pi pi-check' : 'pi pi-times'"></i>
                  </div>
                  <div class="scan-info">
                    <span class="scan-name">{{ scan.found ? scan.itemName : 'Not Found' }}</span>
                    <span class="scan-barcode">{{ scan.barcodeValue }}</span>
                  </div>
                  <button pButton icon="pi pi-search" class="p-button-text p-button-sm" (click)="lookupScan(scan)"></button>
                </div>
              }
            </div>
          } @else {
            <p class="no-scans">No recent scans</p>
          }
        </div>
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .scanner-page {
      padding: 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
      text-align: center;
    }

    .page-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      color: var(--text-primary);
    }

    .subtitle {
      margin: 0;
      color: var(--text-secondary);
    }

    .scanner-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .scanner-input-section {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 2rem;
      text-align: center;
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      max-width: 500px;
      margin: 0 auto;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.5rem 0.5rem 0.5rem 1rem;

      &:focus-within {
        border-color: var(--primary-500);
      }

      i {
        font-size: 1.5rem;
        color: var(--text-muted);
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 1.125rem;

        &:focus {
          box-shadow: none;
        }
      }
    }

    .hint {
      margin: 1rem 0 0 0;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .result-section {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      padding: 1.5rem;
      border-radius: var(--radius-lg);

      &.found {
        background: rgba(16, 185, 129, 0.1);
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      &.not-found {
        background: rgba(244, 63, 94, 0.1);
        border: 1px solid rgba(244, 63, 94, 0.3);
      }
    }

    .result-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 2rem;
      }

      &.success {
        background: rgba(16, 185, 129, 0.2);
        color: var(--primary-600);
      }

      &.error {
        background: rgba(244, 63, 94, 0.2);
        color: var(--alert-600);
      }
    }

    .result-content {
      flex: 1;

      h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        color: var(--text-primary);
      }

      p {
        margin: 0 0 0.25rem 0;
        color: var(--text-secondary);
      }

      .message {
        margin-top: 0.5rem;
      }
    }

    .result-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }

    .recent-scans {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;

      h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        color: var(--text-primary);
      }
    }

    .scans-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .scan-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);

      &.found .scan-icon {
        color: var(--primary-600);
      }

      &:not(.found) .scan-icon {
        color: var(--alert-600);
      }
    }

    .scan-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .scan-info {
      flex: 1;
      display: flex;
      flex-direction: column;

      .scan-name {
        font-weight: 500;
        color: var(--text-primary);
      }

      .scan-barcode {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-family: monospace;
      }
    }

    .no-scans {
      text-align: center;
      color: var(--text-muted);
      margin: 0;
    }
  `]
})
export class ScannerComponent implements OnInit {
  private readonly barcodeService = inject(BarcodeService);
  private readonly messageService = inject(MessageService);

  barcodeInput = '';
  loading = signal(false);
  lastResult = signal<ScanResult | null>(null);
  recentScans = signal<ScanResult[]>([]);

  ngOnInit(): void {
    // Load recent scans from localStorage if available
    const stored = localStorage.getItem('recentScans');
    if (stored) {
      this.recentScans.set(JSON.parse(stored));
    }
  }

  lookupBarcode(): void {
    if (!this.barcodeInput.trim()) return;

    this.loading.set(true);
    this.barcodeService.lookupBarcode(this.barcodeInput.trim()).subscribe({
      next: (result) => {
        this.lastResult.set(result);
        this.addToRecentScans(result);
        this.barcodeInput = '';
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to look up barcode' });
      }
    });
  }

  lookupScan(scan: ScanResult): void {
    this.barcodeInput = scan.barcodeValue;
    this.lookupBarcode();
  }

  private addToRecentScans(result: ScanResult): void {
    const recent = this.recentScans();
    const filtered = recent.filter(s => s.barcodeValue !== result.barcodeValue);
    const updated = [result, ...filtered].slice(0, 10);
    this.recentScans.set(updated);
    localStorage.setItem('recentScans', JSON.stringify(updated));
  }
}
