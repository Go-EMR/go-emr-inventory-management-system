import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ImportExportService, ExportRequest } from '@core/services/import-export.service';
import { ExportJob, ExportJobStatus } from '@shared/models';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    CheckboxModule,
    MultiSelectModule,
    ProgressBarModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="export-dialog">
      <div class="page-header">
        <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/import-export']"></button>
        <h1>Export Data</h1>
      </div>

      <div class="export-form">
        @if (!exportJob()) {
          <div class="form-section">
            <h3>Output Format</h3>
            <div class="format-options">
              <div
                class="format-option"
                [class.selected]="format === 'csv'"
                (click)="format = 'csv'"
              >
                <i class="pi pi-file"></i>
                <span>CSV</span>
                <small>Comma-separated values</small>
              </div>
              <div
                class="format-option"
                [class.selected]="format === 'xlsx'"
                (click)="format = 'xlsx'"
              >
                <i class="pi pi-file-excel"></i>
                <span>Excel</span>
                <small>XLSX format</small>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>Filters (Optional)</h3>
            <div class="filters-grid">
              <div class="form-group">
                <label>Categories</label>
                <p-multiSelect
                  [options]="categories"
                  [(ngModel)]="selectedCategories"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="All Categories"
                ></p-multiSelect>
              </div>
              <div class="form-group">
                <label>Warehouses</label>
                <p-multiSelect
                  [options]="warehouses"
                  [(ngModel)]="selectedWarehouses"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="All Warehouses"
                ></p-multiSelect>
              </div>
            </div>
            <div class="checkbox-group">
              <p-checkbox [(ngModel)]="lowStockOnly" [binary]="true" inputId="lowStock"></p-checkbox>
              <label for="lowStock">Export low stock items only</label>
            </div>
          </div>

          <div class="form-section">
            <h3>Include Data</h3>
            <div class="checkbox-group">
              <p-checkbox [(ngModel)]="includeStockLevels" [binary]="true" inputId="stockLevels"></p-checkbox>
              <label for="stockLevels">Stock levels by warehouse</label>
            </div>
            <div class="checkbox-group">
              <p-checkbox [(ngModel)]="includeCustomFields" [binary]="true" inputId="customFields"></p-checkbox>
              <label for="customFields">Custom fields</label>
            </div>
            <div class="checkbox-group">
              <p-checkbox [(ngModel)]="includePhotos" [binary]="true" inputId="photos"></p-checkbox>
              <label for="photos">Photo URLs</label>
            </div>
          </div>

          <div class="form-actions">
            <button pButton label="Cancel" class="p-button-outlined" [routerLink]="['/import-export']"></button>
            <button pButton label="Start Export" icon="pi pi-download" (click)="startExport()" [loading]="processing()"></button>
          </div>
        } @else {
          <div class="export-status">
            <div class="status-icon" [class]="exportJob()?.status">
              @if (exportJob()?.status === 'processing') {
                <i class="pi pi-spin pi-spinner"></i>
              } @else if (exportJob()?.status === 'completed') {
                <i class="pi pi-check-circle"></i>
              } @else {
                <i class="pi pi-times-circle"></i>
              }
            </div>

            <h2>
              @switch (exportJob()?.status) {
                @case ('pending') { Preparing Export... }
                @case ('processing') { Generating Export... }
                @case ('completed') { Export Ready }
                @case ('failed') { Export Failed }
              }
            </h2>

            @if (exportJob()?.status === 'processing') {
              <p-progressBar mode="indeterminate" [style]="{'height': '6px'}"></p-progressBar>
            }

            @if (exportJob()?.status === 'completed') {
              <p class="item-count">{{ exportJob()?.totalItems }} items exported</p>

              <a [href]="exportJob()?.outputUrl" target="_blank" class="download-btn">
                <i class="pi pi-download"></i>
                Download {{ format.toUpperCase() }} File
              </a>

              <p class="expires-note">
                <i class="pi pi-info-circle"></i>
                Download link expires {{ exportJob()?.expiresAt | date:'medium' }}
              </p>
            }

            <button pButton label="Back to Import/Export" class="p-button-text" [routerLink]="['/import-export']"></button>
          </div>
        }
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .export-dialog {
      padding: 1.5rem;
      max-width: 600px;
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

    .export-form {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }

    .form-section {
      margin-bottom: 1.5rem;

      h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        color: var(--text-primary);
      }
    }

    .format-options {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .format-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.25rem;
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
        font-size: 2rem;
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
      }
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      :host ::ng-deep .p-multiselect {
        width: 100%;
      }
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;

      label {
        cursor: pointer;
        color: var(--text-primary);
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .export-status {
      text-align: center;
      padding: 2rem;
    }

    .status-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 2.5rem;
      }

      &.processing {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }

      &.completed {
        background: rgba(16, 185, 129, 0.1);
        color: var(--primary-600);
      }

      &.failed {
        background: rgba(244, 63, 94, 0.1);
        color: var(--alert-600);
      }
    }

    .export-status h2 {
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
      color: var(--text-primary);
    }

    .item-count {
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
    }

    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--primary-500);
      color: white;
      text-decoration: none;
      border-radius: var(--radius-md);
      font-weight: 500;
      margin-bottom: 1rem;

      &:hover {
        background: var(--primary-600);
      }
    }

    .expires-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }
  `]
})
export class ExportDialogComponent {
  private readonly router = inject(Router);
  private readonly importExportService = inject(ImportExportService);
  private readonly messageService = inject(MessageService);

  processing = signal(false);
  exportJob = signal<ExportJob | null>(null);

  format: 'csv' | 'xlsx' = 'xlsx';
  selectedCategories: string[] = [];
  selectedWarehouses: string[] = [];
  lowStockOnly = false;
  includeStockLevels = true;
  includeCustomFields = true;
  includePhotos = false;

  categories = [
    { id: 'cat-1', name: 'Medical Equipment' },
    { id: 'cat-2', name: 'Consumables' },
    { id: 'cat-3', name: 'Pharmaceuticals' }
  ];

  warehouses = [
    { id: 'wh-1', name: 'Main Warehouse' },
    { id: 'wh-2', name: 'Secondary Storage' }
  ];

  startExport(): void {
    this.processing.set(true);

    const request: ExportRequest = {
      outputFormat: this.format,
      includePhotos: this.includePhotos,
      includeStockLevels: this.includeStockLevels,
      includeCustomFields: this.includeCustomFields,
      filters: {
        categoryIds: this.selectedCategories.length > 0 ? this.selectedCategories : undefined,
        warehouseIds: this.selectedWarehouses.length > 0 ? this.selectedWarehouses : undefined,
        lowStockOnly: this.lowStockOnly || undefined
      }
    };

    this.importExportService.startExport(request).subscribe({
      next: (job) => {
        this.exportJob.set(job);
        this.processing.set(false);
        this.pollJobStatus(job.id);
      },
      error: () => {
        this.processing.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to start export' });
      }
    });
  }

  private pollJobStatus(jobId: string): void {
    const check = () => {
      this.importExportService.getExportJob(jobId).subscribe({
        next: (job) => {
          this.exportJob.set(job);
          if (job.status === ExportJobStatus.PENDING || job.status === ExportJobStatus.PROCESSING) {
            setTimeout(check, 1000);
          }
        }
      });
    };
    setTimeout(check, 1000);
  }
}
