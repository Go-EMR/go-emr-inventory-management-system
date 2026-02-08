import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BarcodeService, ScanEntry } from '@core/services/barcode.service';

interface ScannedItem extends ScanEntry {
  itemName?: string;
  found: boolean;
}

@Component({
  selector: 'app-scan-receive',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TableModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="scan-receive-page">
      <div class="page-header">
        <div class="header-content">
          <h1>Scan to Receive</h1>
          <p class="subtitle">Scan items to receive them into inventory</p>
        </div>
      </div>

      <div class="receive-container">
        <div class="scan-section">
          <div class="input-wrapper">
            <i class="pi pi-qrcode"></i>
            <input
              pInputText
              [(ngModel)]="barcodeInput"
              placeholder="Scan barcode..."
              (keyup.enter)="scanItem()"
              autofocus
            />
          </div>
        </div>

        @if (scannedItems().length > 0) {
          <div class="items-section">
            <h3>Scanned Items ({{ scannedItems().length }})</h3>
            <p-table [value]="scannedItems()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>Status</th>
                  <th>Barcode</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Lot #</th>
                  <th>Actions</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-item let-i="rowIndex">
                <tr [class.not-found]="!item.found">
                  <td>
                    <i [class]="item.found ? 'pi pi-check-circle text-green-500' : 'pi pi-exclamation-triangle text-yellow-500'"></i>
                  </td>
                  <td><code>{{ item.barcodeValue }}</code></td>
                  <td>{{ item.found ? item.itemName : 'Not Found' }}</td>
                  <td>
                    <p-inputNumber [(ngModel)]="item.quantity" [min]="1" [showButtons]="true" [style]="{'width': '100px'}"></p-inputNumber>
                  </td>
                  <td>
                    <input pInputText [(ngModel)]="item.lotNumber" placeholder="Optional" style="width: 120px" />
                  </td>
                  <td>
                    <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="removeItem(i)"></button>
                  </td>
                </tr>
              </ng-template>
            </p-table>

            <div class="summary-section">
              <div class="summary-stats">
                <span class="stat found">
                  <i class="pi pi-check-circle"></i>
                  {{ foundCount() }} found
                </span>
                <span class="stat not-found">
                  <i class="pi pi-exclamation-triangle"></i>
                  {{ notFoundCount() }} not found
                </span>
                <span class="stat total">
                  Total quantity: {{ totalQuantity() }}
                </span>
              </div>
              <div class="summary-actions">
                <button pButton label="Clear All" icon="pi pi-times" class="p-button-outlined p-button-secondary" (click)="clearAll()"></button>
                <button pButton label="Receive Items" icon="pi pi-check" (click)="receiveItems()" [loading]="receiving()" [disabled]="foundCount() === 0"></button>
              </div>
            </div>
          </div>
        } @else {
          <div class="empty-state">
            <i class="pi pi-inbox"></i>
            <h3>No Items Scanned</h3>
            <p>Start scanning barcodes to add items to receive</p>
          </div>
        }
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .scan-receive-page {
      padding: 1.5rem;
    }

    .page-header {
      margin-bottom: 2rem;
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

    .receive-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .scan-section {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }

    .input-wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      max-width: 500px;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;

      &:focus-within {
        border-color: var(--primary-500);
      }

      i {
        font-size: 1.25rem;
        color: var(--text-muted);
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 1rem;

        &:focus {
          box-shadow: none;
        }
      }
    }

    .items-section {
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

    :host ::ng-deep .not-found {
      background: rgba(250, 204, 21, 0.1);
    }

    .summary-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .summary-stats {
      display: flex;
      gap: 1.5rem;

      .stat {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;

        &.found {
          color: var(--primary-600);
        }

        &.not-found {
          color: var(--warning-600);
        }

        &.total {
          color: var(--text-primary);
          font-weight: 500;
        }
      }
    }

    .summary-actions {
      display: flex;
      gap: 0.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--bg-card);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-lg);

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
        margin: 0;
        color: var(--text-secondary);
      }
    }
  `]
})
export class ScanReceiveComponent {
  private readonly barcodeService = inject(BarcodeService);
  private readonly messageService = inject(MessageService);

  barcodeInput = '';
  scannedItems = signal<ScannedItem[]>([]);
  receiving = signal(false);

  foundCount = () => this.scannedItems().filter(i => i.found).length;
  notFoundCount = () => this.scannedItems().filter(i => !i.found).length;
  totalQuantity = () => this.scannedItems().reduce((sum, i) => sum + i.quantity, 0);

  scanItem(): void {
    if (!this.barcodeInput.trim()) return;

    const barcode = this.barcodeInput.trim();
    this.barcodeInput = '';

    // Check if already scanned
    const existing = this.scannedItems().find(i => i.barcodeValue === barcode);
    if (existing) {
      existing.quantity++;
      this.scannedItems.set([...this.scannedItems()]);
      return;
    }

    // Look up the barcode
    this.barcodeService.lookupBarcode(barcode).subscribe({
      next: (result) => {
        const item: ScannedItem = {
          barcodeValue: barcode,
          quantity: 1,
          found: result.found,
          itemName: result.itemName
        };
        this.scannedItems.update(items => [item, ...items]);
      },
      error: () => {
        const item: ScannedItem = {
          barcodeValue: barcode,
          quantity: 1,
          found: false
        };
        this.scannedItems.update(items => [item, ...items]);
      }
    });
  }

  removeItem(index: number): void {
    this.scannedItems.update(items => items.filter((_, i) => i !== index));
  }

  clearAll(): void {
    this.scannedItems.set([]);
  }

  receiveItems(): void {
    const foundItems = this.scannedItems().filter(i => i.found);
    if (foundItems.length === 0) return;

    this.receiving.set(true);
    this.barcodeService.scanReceive({
      purchaseOrderId: '', // Would come from PO selection
      scans: foundItems.map(i => ({
        barcodeValue: i.barcodeValue,
        quantity: i.quantity,
        lotNumber: i.lotNumber
      }))
    }).subscribe({
      next: (result) => {
        this.receiving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Items Received',
          detail: `Successfully received ${result.itemsReceived} items`
        });
        this.clearAll();
      },
      error: () => {
        this.receiving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to receive items' });
      }
    });
  }
}
