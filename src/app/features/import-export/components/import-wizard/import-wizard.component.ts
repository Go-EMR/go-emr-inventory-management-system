import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

import { FileUploadModule } from 'primeng/fileupload';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ImportExportService, ImportOptions } from '@core/services/import-export.service';
import { ImportJob, ImportJobStatus } from '@shared/models';

@Component({
  selector: 'app-import-wizard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    FileUploadModule,
    CheckboxModule,
    SelectModule,
    TableModule,
    ProgressBarModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="import-wizard">
      <div class="page-header">
        <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/import-export']"></button>
        <h1>Import Data</h1>
      </div>

      <div class="step-indicators">
        @for (step of steps; track step.label; let i = $index) {
          <div class="step-indicator" [class.active]="i === activeStep()" [class.completed]="i < activeStep()">
            <div class="step-number">{{ i + 1 }}</div>
            <span class="step-label">{{ step.label }}</span>
          </div>
        }
      </div>

      <div class="wizard-content">
        @switch (activeStep()) {
          @case (0) {
            <!-- Step 1: Upload File -->
            <div class="step-content">
              <h2>Upload File</h2>
              <p class="step-description">Upload a CSV or Excel file containing your inventory data</p>

              <div class="upload-area">
                <p-fileUpload
                  mode="advanced"
                  [auto]="true"
                  accept=".csv,.xlsx,.xls"
                  [maxFileSize]="10000000"
                  (onSelect)="onFileSelect($event)"
                  [customUpload]="true"
                  (uploadHandler)="uploadFile($event)"
                >
                  <ng-template pTemplate="content">
                    <div class="upload-content">
                      <i class="pi pi-cloud-upload"></i>
                      <p>Drag and drop your file here or click to browse</p>
                      <small>Supported formats: CSV, XLSX, XLS (max 10MB)</small>
                    </div>
                  </ng-template>
                </p-fileUpload>
              </div>

              <div class="templates-section">
                <h4>Download Templates</h4>
                <div class="template-links">
                  <a href="#" (click)="downloadTemplate('csv'); $event.preventDefault()">
                    <i class="pi pi-file"></i> CSV Template
                  </a>
                  <a href="#" (click)="downloadTemplate('xlsx'); $event.preventDefault()">
                    <i class="pi pi-file-excel"></i> Excel Template
                  </a>
                </div>
              </div>
            </div>
          }
          @case (1) {
            <!-- Step 2: Configure Options -->
            <div class="step-content">
              <h2>Import Options</h2>
              <p class="step-description">Configure how the import should handle your data</p>

              <div class="options-form">
                <div class="option-group">
                  <p-checkbox [(ngModel)]="options.updateExisting" [binary]="true" inputId="updateExisting"></p-checkbox>
                  <label for="updateExisting">
                    <strong>Update existing items</strong>
                    <span>Match items by SKU and update their information</span>
                  </label>
                </div>

                <div class="option-group">
                  <p-checkbox [(ngModel)]="options.skipErrors" [binary]="true" inputId="skipErrors"></p-checkbox>
                  <label for="skipErrors">
                    <strong>Skip errors and continue</strong>
                    <span>Continue importing even if some rows have errors</span>
                  </label>
                </div>

                <div class="option-group">
                  <p-checkbox [(ngModel)]="options.validateOnly" [binary]="true" inputId="validateOnly"></p-checkbox>
                  <label for="validateOnly">
                    <strong>Validate only (dry run)</strong>
                    <span>Check for errors without making changes</span>
                  </label>
                </div>

                <div class="form-group">
                  <label>Default Warehouse</label>
                  <p-select
                    [options]="warehouses"
                    [(ngModel)]="options.defaultWarehouseId"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select default warehouse"
                    [showClear]="true"
                  ></p-select>
                </div>
              </div>

              <div class="preview-section">
                <h4>Data Preview</h4>
                <p-table [value]="previewData" styleClass="p-datatable-sm" [scrollable]="true" scrollHeight="200px">
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                    </tr>
                  </ng-template>
                  <ng-template pTemplate="body" let-row>
                    <tr>
                      <td>{{ row.name }}</td>
                      <td>{{ row.sku }}</td>
                      <td>{{ row.quantity }}</td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </div>
          }
          @case (2) {
            <!-- Step 3: Processing -->
            <div class="step-content">
              <h2>Processing Import</h2>

              @if (importJob()) {
                <div class="processing-status">
                  <div class="status-header">
                    <span class="status-label">{{ importJob()?.status }}</span>
                    @if (importJob()?.status === 'processing') {
                      <span class="progress-text">
                        {{ importJob()?.processedRows }} / {{ importJob()?.totalRows }} rows
                      </span>
                    }
                  </div>

                  @if (importJob()?.status === 'processing') {
                    <p-progressBar
                      [value]="(importJob()?.processedRows || 0) / (importJob()?.totalRows || 1) * 100"
                      [showValue]="true"
                    ></p-progressBar>
                  }

                  @if (importJob()?.status === 'completed') {
                    <div class="completion-summary">
                      <div class="summary-stat success">
                        <i class="pi pi-check-circle"></i>
                        <span>{{ importJob()?.successfulRows }} successful</span>
                      </div>
                      <div class="summary-stat error">
                        <i class="pi pi-times-circle"></i>
                        <span>{{ importJob()?.failedRows }} failed</span>
                      </div>
                    </div>

                    @if ((importJob()?.errors?.length || 0) > 0) {
                      <div class="errors-section">
                        <h4>Errors</h4>
                        <div class="error-list">
                          @for (error of importJob()?.errors; track $index) {
                            <div class="error-item">
                              <span class="error-location">Row {{ error.row }}, Column "{{ error.column }}":</span>
                              <span class="error-message">{{ error.message }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  }
                </div>
              }
            </div>
          }
        }

        <div class="wizard-actions">
          @if (activeStep() > 0 && activeStep() < 2) {
            <button pButton label="Back" class="p-button-outlined" (click)="prevStep()"></button>
          }
          @if (activeStep() < 2) {
            <button
              pButton
              [label]="activeStep() === 1 ? 'Start Import' : 'Next'"
              (click)="nextStep()"
              [disabled]="!canProceed()"
              [loading]="processing()"
            ></button>
          }
          @if (activeStep() === 2 && importJob()?.status === 'completed') {
            <button pButton label="Done" [routerLink]="['/import-export']"></button>
          }
        </div>
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .import-wizard {
      padding: 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;

      h1 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text-primary);
      }
    }

    .step-indicators { display: flex; justify-content: center; gap: 2rem; margin-bottom: 2rem; }
    .step-indicator { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; opacity: 0.5; }
    .step-indicator.active, .step-indicator.completed { opacity: 1; }
    .step-number { width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem; background: var(--surface-200); }
    .step-indicator.active .step-number { background: var(--primary-color); color: white; }
    .step-indicator.completed .step-number { background: var(--green-500); color: white; }
    .step-label { font-size: 0.75rem; color: var(--text-color-secondary); }

    .wizard-content {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }

    .step-content {
      h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
        color: var(--text-primary);
      }

      .step-description {
        margin: 0 0 1.5rem 0;
        color: var(--text-secondary);
      }
    }

    .upload-area {
      margin-bottom: 1.5rem;
    }

    .upload-content {
      text-align: center;
      padding: 2rem;

      i {
        font-size: 3rem;
        color: var(--primary-500);
        margin-bottom: 1rem;
      }

      p {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
      }

      small {
        color: var(--text-muted);
      }
    }

    .templates-section {
      h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
        color: var(--text-primary);
      }

      .template-links {
        display: flex;
        gap: 1rem;

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

    .options-form {
      margin-bottom: 1.5rem;
    }

    .option-group {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);

      label {
        display: flex;
        flex-direction: column;
        cursor: pointer;

        strong {
          color: var(--text-primary);
        }

        span {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
      }
    }

    .form-group {
      margin-top: 1rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      :host ::ng-deep .p-select {
        width: 100%;
      }
    }

    .preview-section {
      h4 {
        margin: 0 0 0.75rem 0;
        font-size: 0.875rem;
        color: var(--text-primary);
      }
    }

    .processing-status {
      text-align: center;
      padding: 2rem;
    }

    .status-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;

      .status-label {
        text-transform: capitalize;
        font-weight: 500;
        color: var(--text-primary);
      }

      .progress-text {
        color: var(--text-secondary);
      }
    }

    .completion-summary {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin: 1.5rem 0;

      .summary-stat {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        i {
          font-size: 1.5rem;
        }

        &.success {
          color: var(--primary-600);
        }

        &.error {
          color: var(--alert-600);
        }
      }
    }

    .errors-section {
      text-align: left;
      margin-top: 1.5rem;

      h4 {
        margin: 0 0 0.75rem 0;
        color: var(--text-primary);
      }
    }

    .error-list {
      max-height: 200px;
      overflow-y: auto;
    }

    .error-item {
      padding: 0.5rem;
      margin-bottom: 0.25rem;
      background: rgba(244, 63, 94, 0.1);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;

      .error-location {
        font-weight: 500;
        color: var(--alert-600);
      }

      .error-message {
        color: var(--text-secondary);
      }
    }

    .wizard-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }
  `]
})
export class ImportWizardComponent {
  private readonly router = inject(Router);
  private readonly importExportService = inject(ImportExportService);
  private readonly messageService = inject(MessageService);

  activeStep = signal(0);
  processing = signal(false);
  importJob = signal<ImportJob | null>(null);

  uploadedFile: File | null = null;
  storageKey = '';

  options: ImportOptions = {
    updateExisting: true,
    skipErrors: true,
    validateOnly: false
  };

  previewData = [
    { name: 'Sample Item 1', sku: 'SAM-001', quantity: 100 },
    { name: 'Sample Item 2', sku: 'SAM-002', quantity: 50 },
    { name: 'Sample Item 3', sku: 'SAM-003', quantity: 75 }
  ];

  warehouses = [
    { id: 'wh-1', name: 'Main Warehouse' },
    { id: 'wh-2', name: 'Secondary Storage' }
  ];

  steps = [
    { label: 'Upload' },
    { label: 'Configure' },
    { label: 'Process' }
  ];

  onFileSelect(event: any): void {
    this.uploadedFile = event.files[0];
  }

  uploadFile(event: any): void {
    const file = event.files[0];
    this.processing.set(true);

    this.importExportService.getImportUploadUrl(file.name, file.type).subscribe({
      next: (response) => {
        this.storageKey = response.storageKey;
        // In real implementation, upload to presigned URL
        this.processing.set(false);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'File uploaded' });
      },
      error: () => {
        this.processing.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload file' });
      }
    });
  }

  downloadTemplate(format: 'csv' | 'xlsx'): void {
    this.importExportService.downloadTemplate(format).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_template.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  }

  canProceed(): boolean {
    if (this.activeStep() === 0) {
      return !!this.uploadedFile || !!this.storageKey;
    }
    return true;
  }

  nextStep(): void {
    if (this.activeStep() === 1) {
      this.startImport();
    } else {
      this.activeStep.update(s => s + 1);
    }
  }

  prevStep(): void {
    this.activeStep.update(s => s - 1);
  }

  startImport(): void {
    this.processing.set(true);
    this.activeStep.set(2);

    this.importExportService.startImport({
      fileStorageKey: this.storageKey || 'mock-storage-key',
      fileName: this.uploadedFile?.name || 'import.csv',
      options: this.options
    }).subscribe({
      next: (job) => {
        this.importJob.set(job);
        this.processing.set(false);
        this.pollJobStatus(job.id);
      },
      error: () => {
        this.processing.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to start import' });
      }
    });
  }

  private pollJobStatus(jobId: string): void {
    const check = () => {
      this.importExportService.getImportJob(jobId).subscribe({
        next: (job) => {
          this.importJob.set(job);
          if (job.status === ImportJobStatus.PENDING || job.status === ImportJobStatus.PROCESSING) {
            setTimeout(check, 1000);
          }
        }
      });
    };
    setTimeout(check, 1000);
  }
}
