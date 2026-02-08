import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { LotBarcodeService, GenerateLotBarcodeRequest } from '@core/services/lot-barcode.service';
import { LotBarcode, BarcodeType } from '@shared/models';

interface MockItem {
  id: string;
  name: string;
  sku: string;
}

@Component({
  selector: 'app-lot-barcode-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    CardModule,
    ToastModule,
    DividerModule,
    TooltipModule,
    TagModule
  ],
  providers: [MessageService],
  template: `
    <div class="lot-barcode-generator">
      <div class="page-header">
        <div class="header-content">
          <button pButton icon="pi pi-arrow-left" class="p-button-text" (click)="goBack()"></button>
          <div>
            <h1>Generate Lot Barcodes</h1>
            <p class="subtitle">Create QR codes with embedded lot and expiration data</p>
          </div>
        </div>
      </div>

      <div class="generator-layout">
        <div class="form-section">
          <p-card header="Item Selection">
            <div class="form-field">
              <label>Select Item <span class="required">*</span></label>
              <p-select
                [options]="mockItems"
                [(ngModel)]="selectedItem"
                optionLabel="name"
                placeholder="Search and select an item"
                [filter]="true"
                filterPlaceholder="Search items..."
                [style]="{ width: '100%' }"
                (onChange)="onItemChange()"
              >
                <ng-template pTemplate="item" let-item>
                  <div class="item-option">
                    <span class="item-name">{{ item.name }}</span>
                    <span class="item-sku">{{ item.sku }}</span>
                  </div>
                </ng-template>
              </p-select>
            </div>
          </p-card>

          <p-card header="Lot Information" class="mt-3">
            <form [formGroup]="lotForm">
              <div class="form-row">
                <div class="form-field">
                  <label>Lot Number <span class="required">*</span></label>
                  <input
                    pInputText
                    formControlName="lotNumber"
                    placeholder="e.g., LOT2024A"
                    [style]="{ width: '100%' }"
                  />
                  @if (lotForm.get('lotNumber')?.invalid && lotForm.get('lotNumber')?.touched) {
                    <small class="error-message">Lot number is required</small>
                  }
                </div>
                <div class="form-field">
                  <label>Expiration Date</label>
                  <p-datepicker
                    formControlName="expirationDate"
                    [showIcon]="true"
                    dateFormat="yy-mm-dd"
                    placeholder="Select expiration date"
                    [style]="{ width: '100%' }"
                    [minDate]="today"
                  ></p-datepicker>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label>Serial Number</label>
                  <input
                    pInputText
                    formControlName="serialNumber"
                    placeholder="Optional serial number"
                    [style]="{ width: '100%' }"
                  />
                </div>
                <div class="form-field">
                  <label>Manufacture Date</label>
                  <p-datepicker
                    formControlName="manufactureDate"
                    [showIcon]="true"
                    dateFormat="yy-mm-dd"
                    placeholder="Select manufacture date"
                    [style]="{ width: '100%' }"
                    [maxDate]="today"
                  ></p-datepicker>
                </div>
              </div>

              <p-divider></p-divider>

              <h4 class="section-title">Healthcare Identifiers (Optional)</h4>

              <div class="form-row">
                <div class="form-field">
                  <label>
                    GTIN
                    <i class="pi pi-info-circle" pTooltip="Global Trade Item Number (14 digits)" tooltipPosition="top"></i>
                  </label>
                  <input
                    pInputText
                    formControlName="gtin"
                    placeholder="14-digit GTIN"
                    [style]="{ width: '100%' }"
                    maxlength="14"
                  />
                </div>
                <div class="form-field">
                  <label>
                    NDC
                    <i class="pi pi-info-circle" pTooltip="National Drug Code (for medications)" tooltipPosition="top"></i>
                  </label>
                  <input
                    pInputText
                    formControlName="ndc"
                    placeholder="e.g., 12345-6789-01"
                    [style]="{ width: '100%' }"
                  />
                </div>
              </div>

              <div class="form-field">
                <label>Batch Number</label>
                <input
                  pInputText
                  formControlName="batchNumber"
                  placeholder="Manufacturing batch number"
                  [style]="{ width: '100%' }"
                />
              </div>
            </form>
          </p-card>

          <div class="action-buttons">
            <button pButton label="Cancel" class="p-button-outlined" (click)="goBack()"></button>
            <button
              pButton
              label="Generate Barcode"
              icon="pi pi-qrcode"
              (click)="generateBarcode()"
              [loading]="generating()"
              [disabled]="!canGenerate()"
            ></button>
          </div>
        </div>

        <div class="preview-section">
          <p-card header="QR Code Preview">
            @if (generatedBarcode()) {
              <div class="qr-preview">
                <div class="qr-code-visual">
                  <div class="qr-placeholder">
                    <i class="pi pi-qrcode"></i>
                  </div>
                </div>
                <div class="barcode-details">
                  <div class="detail-row">
                    <span class="label">Barcode Value:</span>
                    <code class="value">{{ generatedBarcode()?.barcodeValue }}</code>
                  </div>
                  <div class="detail-row">
                    <span class="label">Item:</span>
                    <span class="value">{{ generatedBarcode()?.itemName }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">SKU:</span>
                    <span class="value">{{ generatedBarcode()?.itemSku }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Lot Number:</span>
                    <span class="value">{{ generatedBarcode()?.lotNumber }}</span>
                  </div>
                  @if (generatedBarcode()?.expirationDate) {
                    <div class="detail-row">
                      <span class="label">Expiration:</span>
                      <span class="value">{{ generatedBarcode()?.expirationDate | date:'mediumDate' }}</span>
                    </div>
                  }
                  @if (generatedBarcode()?.serialNumber) {
                    <div class="detail-row">
                      <span class="label">Serial #:</span>
                      <span class="value">{{ generatedBarcode()?.serialNumber }}</span>
                    </div>
                  }
                </div>
                <div class="preview-actions">
                  <button pButton label="Copy Barcode" icon="pi pi-copy" class="p-button-outlined" (click)="copyBarcode()"></button>
                  <button pButton label="Generate Label" icon="pi pi-print" (click)="generateLabel()"></button>
                </div>
              </div>
            } @else {
              <div class="no-preview">
                <i class="pi pi-qrcode"></i>
                <p>QR code preview will appear here</p>
                <small>Fill in the form and click "Generate Barcode"</small>
              </div>
            }
          </p-card>

          <p-card header="Encoded Data Preview" class="mt-3">
            @if (selectedItem && lotForm.get('lotNumber')?.value) {
              <div class="payload-preview">
                <pre>{{ getPayloadPreview() | json }}</pre>
              </div>
            } @else {
              <div class="no-data">
                <p>Select an item and enter a lot number to preview the encoded data</p>
              </div>
            }
          </p-card>

          @if (recentBarcodes().length > 0) {
            <p-card header="Recently Generated" class="mt-3">
              <div class="recent-list">
                @for (barcode of recentBarcodes(); track barcode.id) {
                  <div class="recent-item">
                    <div class="recent-info">
                      <span class="recent-lot">{{ barcode.lotNumber }}</span>
                      <span class="recent-item-name">{{ barcode.itemName }}</span>
                    </div>
                    <p-tag [value]="barcode.isActive ? 'Active' : 'Inactive'" [severity]="barcode.isActive ? 'success' : 'secondary'"></p-tag>
                  </div>
                }
              </div>
            </p-card>
          }
        </div>
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .lot-barcode-generator {
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

    .generator-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;

      @media (max-width: 1200px) {
        grid-template-columns: 1fr;
      }
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .form-field {
      margin-bottom: 1rem;

      label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary);

        .required {
          color: #ef4444;
        }

        i {
          font-size: 0.875rem;
          color: var(--text-muted);
          cursor: help;
        }
      }

      .error-message {
        display: block;
        margin-top: 0.25rem;
        color: #ef4444;
        font-size: 0.75rem;
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .item-option {
      display: flex;
      justify-content: space-between;
      width: 100%;

      .item-name {
        font-weight: 500;
      }

      .item-sku {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-family: monospace;
      }
    }

    .section-title {
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .preview-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .qr-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;

      .qr-code-visual {
        .qr-placeholder {
          width: 150px;
          height: 150px;
          background: #f8f9fa;
          border: 2px dashed var(--border-color);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;

          i {
            font-size: 4rem;
            color: var(--primary-500);
          }
        }
      }

      .barcode-details {
        width: 100%;

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border-color);

          &:last-child {
            border-bottom: none;
          }

          .label {
            font-weight: 500;
            color: var(--text-secondary);
          }

          .value {
            color: var(--text-primary);
          }

          code {
            font-family: monospace;
            font-size: 0.75rem;
            background: var(--bg-secondary);
            padding: 0.25rem 0.5rem;
            border-radius: var(--radius-sm);
          }
        }
      }

      .preview-actions {
        display: flex;
        gap: 0.75rem;
        width: 100%;

        button {
          flex: 1;
        }
      }
    }

    .no-preview {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);

      i {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.3;
      }

      p {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
      }

      small {
        font-size: 0.875rem;
      }
    }

    .payload-preview {
      pre {
        background: var(--bg-secondary);
        padding: 1rem;
        border-radius: var(--radius-md);
        font-size: 0.75rem;
        overflow-x: auto;
        margin: 0;
      }
    }

    .no-data {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);

      p {
        margin: 0;
      }
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .recent-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);

        .recent-info {
          display: flex;
          flex-direction: column;

          .recent-lot {
            font-weight: 500;
            font-family: monospace;
          }

          .recent-item-name {
            font-size: 0.75rem;
            color: var(--text-muted);
          }
        }
      }
    }

    .mt-3 {
      margin-top: 1rem;
    }
  `]
})
export class LotBarcodeGeneratorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly lotBarcodeService = inject(LotBarcodeService);
  private readonly messageService = inject(MessageService);

  generating = signal(false);
  generatedBarcode = signal<LotBarcode | null>(null);
  recentBarcodes = signal<LotBarcode[]>([]);

  selectedItem: MockItem | null = null;
  today = new Date();

  lotForm: FormGroup = this.fb.group({
    lotNumber: ['', Validators.required],
    expirationDate: [null],
    serialNumber: [''],
    manufactureDate: [null],
    gtin: [''],
    ndc: [''],
    batchNumber: ['']
  });

  mockItems: MockItem[] = [
    { id: 'item-1', name: 'Surgical Gloves - Large', sku: 'GLV-LG-001' },
    { id: 'item-2', name: 'Scalpel #10', sku: 'SCP-10' },
    { id: 'item-3', name: 'Sutures 3-0', sku: 'SUT-3-0' },
    { id: 'item-4', name: 'IV Catheter 18G', sku: 'IVC-18' },
    { id: 'item-5', name: 'Sterile Gauze 4x4', sku: 'GAU-4X4' },
    { id: 'item-6', name: 'Alcohol Prep Pads', sku: 'ALC-PAD' },
    { id: 'item-7', name: 'Bandage Wrap', sku: 'BND-WRP' },
    { id: 'item-8', name: 'Saline Solution 1L', sku: 'SAL-1L' },
    { id: 'item-9', name: 'Morphine 10mg/mL', sku: 'MOR-10' },
    { id: 'item-10', name: 'Epinephrine 1:1000', sku: 'EPI-1K' }
  ];

  ngOnInit(): void {
    this.loadRecentBarcodes();
  }

  loadRecentBarcodes(): void {
    this.lotBarcodeService.getLotBarcodes({}, 1, 5).subscribe({
      next: (response) => {
        this.recentBarcodes.set(response.items);
      }
    });
  }

  onItemChange(): void {
    // Reset form when item changes
    this.generatedBarcode.set(null);
  }

  canGenerate(): boolean {
    return !!this.selectedItem && this.lotForm.get('lotNumber')?.valid === true;
  }

  getPayloadPreview(): object {
    if (!this.selectedItem) return {};

    const formValue = this.lotForm.value;
    return {
      v: '1.0',
      item_id: this.selectedItem.id,
      sku: this.selectedItem.sku,
      lot: formValue.lotNumber || '',
      exp: formValue.expirationDate ? this.formatDate(formValue.expirationDate) : undefined,
      sn: formValue.serialNumber || undefined,
      gtin: formValue.gtin || undefined,
      ndc: formValue.ndc || undefined,
      bc_id: 'pending'
    };
  }

  generateBarcode(): void {
    if (!this.canGenerate()) return;

    this.generating.set(true);
    const formValue = this.lotForm.value;

    const request: GenerateLotBarcodeRequest = {
      itemId: this.selectedItem!.id,
      lotNumber: formValue.lotNumber,
      expirationDate: formValue.expirationDate ? this.formatDate(formValue.expirationDate) : undefined,
      serialNumber: formValue.serialNumber || undefined,
      manufactureDate: formValue.manufactureDate ? this.formatDate(formValue.manufactureDate) : undefined,
      gtin: formValue.gtin || undefined,
      ndc: formValue.ndc || undefined,
      batchNumber: formValue.batchNumber || undefined
    };

    this.lotBarcodeService.generateLotBarcode(request).subscribe({
      next: (barcode) => {
        // Update with actual item info
        barcode.itemName = this.selectedItem!.name;
        barcode.itemSku = this.selectedItem!.sku;

        this.generatedBarcode.set(barcode);
        this.generating.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Lot barcode generated successfully'
        });
        this.loadRecentBarcodes();
      },
      error: () => {
        this.generating.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to generate lot barcode'
        });
      }
    });
  }

  copyBarcode(): void {
    const barcode = this.generatedBarcode();
    if (barcode) {
      navigator.clipboard.writeText(barcode.barcodeValue).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Copied',
          detail: 'Barcode value copied to clipboard'
        });
      });
    }
  }

  generateLabel(): void {
    const barcode = this.generatedBarcode();
    if (barcode) {
      this.router.navigate(['/lot-barcodes'], {
        queryParams: { generateLabelFor: barcode.id }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/lot-barcodes']);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
