import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';
import { BarcodeService } from '@core/services/barcode.service';
import { LabelTemplate, LabelPrintJob } from '@shared/models';

@Component({
  selector: 'app-label-generator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    SelectModule,
    MultiSelectModule,
    CardModule,
    ToastModule,
    ProgressBarModule
  ],
  providers: [MessageService],
  template: `
    <div class="label-generator">
      <div class="page-header">
        <h1>Label Generator</h1>
        <p class="subtitle">Generate barcode labels for your inventory items</p>
      </div>

      <div class="generator-content">
        <div class="generator-form">
          <div class="form-section">
            <h3>1. Select Template</h3>
            <p-select
              [options]="templates()"
              [(ngModel)]="selectedTemplate"
              optionLabel="name"
              placeholder="Choose a label template"
              [style]="{'width': '100%'}"
            >
              <ng-template pTemplate="item" let-template>
                <div class="template-option">
                  <span class="template-name">{{ template.name }}</span>
                  <span class="template-size">{{ template.sizeName }}</span>
                </div>
              </ng-template>
            </p-select>
          </div>

          <div class="form-section">
            <h3>2. Select Items</h3>
            <p-multiSelect
              [options]="mockItems"
              [(ngModel)]="selectedItems"
              optionLabel="name"
              optionValue="id"
              placeholder="Select items to print labels for"
              [style]="{'width': '100%'}"
              [filter]="true"
              filterPlaceHolder="Search items..."
            ></p-multiSelect>
            <p class="item-count">{{ selectedItems.length }} items selected</p>
          </div>

          <div class="form-section">
            <h3>3. Output Format</h3>
            <div class="format-options">
              <div
                class="format-option"
                [class.selected]="outputFormat === 'pdf'"
                (click)="outputFormat = 'pdf'"
              >
                <i class="pi pi-file-pdf"></i>
                <span>PDF</span>
                <small>Standard printable format</small>
              </div>
              <div
                class="format-option"
                [class.selected]="outputFormat === 'zpl'"
                (click)="outputFormat = 'zpl'"
              >
                <i class="pi pi-print"></i>
                <span>ZPL</span>
                <small>Zebra label printers</small>
              </div>
            </div>
          </div>

          <button
            pButton
            label="Generate Labels"
            icon="pi pi-cog"
            (click)="generateLabels()"
            [loading]="generating()"
            [disabled]="!selectedTemplate || selectedItems.length === 0"
          ></button>
        </div>

        <div class="preview-section">
          <h3>Preview</h3>
          @if (selectedTemplate) {
            <div class="label-preview">
              <div class="preview-label" [style.width.mm]="selectedTemplate.widthMm" [style.height.mm]="selectedTemplate.heightMm">
                <div class="preview-name">Item Name</div>
                <div class="preview-sku">SKU-12345</div>
                <div class="preview-barcode">
                  <div class="barcode-lines"></div>
                </div>
              </div>
              <div class="preview-info">
                <p><strong>{{ selectedTemplate.name }}</strong></p>
                <p>Size: {{ selectedTemplate.sizeName }}</p>
                <p>Barcode: {{ selectedTemplate.barcodeType }}</p>
              </div>
            </div>
          } @else {
            <div class="no-preview">
              <i class="pi pi-image"></i>
              <p>Select a template to see preview</p>
            </div>
          }

          @if (currentJob()) {
            <div class="job-status">
              <h4>Generation Status</h4>
              <div class="job-info">
                <span class="job-id">Job ID: {{ currentJob()?.id }}</span>
                <span class="job-status-badge" [class]="currentJob()?.status">
                  {{ currentJob()?.status }}
                </span>
              </div>
              @if (currentJob()?.status === 'processing') {
                <p-progressBar mode="indeterminate" [style]="{'height': '6px'}"></p-progressBar>
              }
              @if (currentJob()?.status === 'completed' && currentJob()?.outputUrl) {
                <a [href]="currentJob()?.outputUrl" target="_blank" class="download-link">
                  <i class="pi pi-download"></i>
                  Download Labels ({{ currentJob()?.labelCount }} labels)
                </a>
              }
            </div>
          }
        </div>
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .label-generator {
      padding: 1.5rem;
    }

    .page-header {
      margin-bottom: 2rem;

      h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        color: var(--text-primary);
      }

      .subtitle {
        margin: 0;
        color: var(--text-secondary);
      }
    }

    .generator-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .generator-form {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }

    .form-section {
      margin-bottom: 1.5rem;

      h3 {
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .template-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;

      .template-name {
        font-weight: 500;
      }

      .template-size {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .item-count {
      margin: 0.5rem 0 0 0;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .format-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .format-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      background: var(--bg-secondary);
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
        color: var(--primary-600);
      }

      span {
        font-weight: 500;
        color: var(--text-primary);
      }

      small {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-align: center;
      }
    }

    .preview-section {
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

    .label-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .preview-label {
      min-width: 150px;
      min-height: 75px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .preview-name {
      font-size: 10px;
      font-weight: bold;
      color: #333;
    }

    .preview-sku {
      font-size: 8px;
      color: #666;
    }

    .preview-barcode {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .barcode-lines {
      width: 80%;
      height: 20px;
      background: repeating-linear-gradient(
        90deg,
        #000 0px,
        #000 2px,
        #fff 2px,
        #fff 4px
      );
    }

    .preview-info {
      text-align: center;

      p {
        margin: 0.25rem 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    .no-preview {
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

    .job-status {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);

      h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
        color: var(--text-primary);
      }
    }

    .job-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;

      .job-id {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-family: monospace;
      }

      .job-status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-sm);
        font-size: 0.75rem;
        font-weight: 500;

        &.pending {
          background: rgba(250, 204, 21, 0.2);
          color: var(--warning-600);
        }

        &.processing {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
        }

        &.completed {
          background: rgba(16, 185, 129, 0.2);
          color: var(--primary-600);
        }
      }
    }

    .download-link {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem;
      background: var(--primary-500);
      color: white;
      text-decoration: none;
      border-radius: var(--radius-md);
      font-weight: 500;

      &:hover {
        background: var(--primary-600);
      }
    }
  `]
})
export class LabelGeneratorComponent implements OnInit {
  private readonly barcodeService = inject(BarcodeService);
  private readonly messageService = inject(MessageService);

  templates = signal<LabelTemplate[]>([]);
  selectedTemplate: LabelTemplate | null = null;
  selectedItems: string[] = [];
  outputFormat: 'pdf' | 'zpl' = 'pdf';
  generating = signal(false);
  currentJob = signal<LabelPrintJob | null>(null);

  // Mock items for selection
  mockItems = [
    { id: 'item-1', name: 'Surgical Gloves - Large', sku: 'GLV-LG-001' },
    { id: 'item-2', name: 'Scalpel #10', sku: 'SCP-10' },
    { id: 'item-3', name: 'Sutures 3-0', sku: 'SUT-3-0' },
    { id: 'item-4', name: 'IV Catheter 18G', sku: 'IVC-18' },
    { id: 'item-5', name: 'Sterile Gauze 4x4', sku: 'GAU-4X4' },
    { id: 'item-6', name: 'Alcohol Prep Pads', sku: 'ALC-PAD' },
    { id: 'item-7', name: 'Bandage Wrap', sku: 'BND-WRP' },
    { id: 'item-8', name: 'Saline Solution 1L', sku: 'SAL-1L' }
  ];

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.barcodeService.getLabelTemplates().subscribe({
      next: (response) => {
        this.templates.set(response.items);
        if (response.items.length > 0) {
          this.selectedTemplate = response.items.find(t => t.isDefault) || response.items[0];
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load templates' });
      }
    });
  }

  generateLabels(): void {
    if (!this.selectedTemplate || this.selectedItems.length === 0) return;

    this.generating.set(true);
    this.barcodeService.generateLabels({
      templateId: this.selectedTemplate.id,
      itemIds: this.selectedItems,
      outputFormat: this.outputFormat
    }).subscribe({
      next: (job) => {
        this.currentJob.set(job);
        this.generating.set(false);
        this.pollJobStatus(job.id);
      },
      error: () => {
        this.generating.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to generate labels' });
      }
    });
  }

  private pollJobStatus(jobId: string): void {
    const checkStatus = () => {
      this.barcodeService.getLabelPrintJob(jobId).subscribe({
        next: (job) => {
          this.currentJob.set(job);
          if (job.status === 'pending' || job.status === 'processing') {
            setTimeout(checkStatus, 1000);
          } else if (job.status === 'completed') {
            this.messageService.add({
              severity: 'success',
              summary: 'Labels Ready',
              detail: `${job.labelCount} labels generated successfully`
            });
          }
        }
      });
    };
    setTimeout(checkStatus, 1000);
  }
}
