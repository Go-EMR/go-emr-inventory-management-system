import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ImportJob, ExportJob, ImportJobStatus, ExportJobStatus, PresignedUrl, PaginatedResponse } from '../../shared/models';

export interface StartImportRequest {
  fileStorageKey: string;
  fileName: string;
  options: ImportOptions;
}

export interface ImportOptions {
  updateExisting: boolean;
  skipErrors: boolean;
  defaultWarehouseId?: string;
  defaultCategoryId?: string;
  validateOnly: boolean;
  columnMappings?: Record<string, string>;
}

export interface ExportRequest {
  outputFormat: 'csv' | 'xlsx';
  filters?: ExportFilters;
  includePhotos: boolean;
  includeStockLevels: boolean;
  includeCustomFields: boolean;
}

export interface ExportFilters {
  categoryIds?: string[];
  warehouseIds?: string[];
  tagIds?: string[];
  lowStockOnly?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

export interface ImportUploadResponse {
  uploadUrl: PresignedUrl;
  storageKey: string;
}

export interface ImportTemplate {
  name: string;
  description: string;
  downloadUrl: string;
  format: 'csv' | 'xlsx';
}

@Injectable({ providedIn: 'root' })
export class ImportExportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory`;
  private readonly USE_MOCK = true;

  // Mock data
  private mockImportJobs: ImportJob[] = [
    {
      id: 'import-1',
      fileName: 'inventory_update_jan.csv',
      fileStorageKey: 'imports/import-1/inventory_update_jan.csv',
      status: ImportJobStatus.COMPLETED,
      totalRows: 150,
      processedRows: 150,
      successfulRows: 148,
      failedRows: 2,
      errors: [
        { row: 45, column: 'sku', message: 'Duplicate SKU: MED-001' },
        { row: 89, column: 'category', message: 'Category not found: Invalid Category' }
      ],
      options: {
        updateExisting: true,
        skipErrors: true,
        validateOnly: false
      },
      startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 45000),
      createdBy: 'user-1',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      id: 'import-2',
      fileName: 'new_supplies.xlsx',
      fileStorageKey: 'imports/import-2/new_supplies.xlsx',
      status: ImportJobStatus.PROCESSING,
      totalRows: 500,
      processedRows: 250,
      successfulRows: 250,
      failedRows: 0,
      errors: [],
      options: {
        updateExisting: false,
        skipErrors: false,
        validateOnly: false
      },
      startedAt: new Date(Date.now() - 5 * 60 * 1000),
      createdBy: 'user-2',
      createdAt: new Date(Date.now() - 10 * 60 * 1000),
      updatedAt: new Date()
    }
  ];

  private mockExportJobs: ExportJob[] = [
    {
      id: 'export-1',
      status: ExportJobStatus.COMPLETED,
      outputFormat: 'xlsx',
      filters: { lowStockOnly: true },
      includePhotos: false,
      includeStockLevels: true,
      includeCustomFields: true,
      totalItems: 75,
      outputStorageKey: 'exports/export-1/low_stock_report.xlsx',
      outputUrl: 'https://storage.example.com/exports/export-1/low_stock_report.xlsx',
      startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000 + 30000),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdBy: 'user-1',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      updatedAt: new Date()
    }
  ];

  getImportUploadUrl(fileName: string, contentType: string): Observable<ImportUploadResponse> {
    if (this.USE_MOCK) {
      const storageKey = `imports/${Date.now()}/${fileName}`;
      return of({
        uploadUrl: {
          url: `https://storage.example.com/upload/${storageKey}`,
          expiresAt: new Date(Date.now() + 3600000),
          headers: { 'Content-Type': contentType }
        },
        storageKey
      }).pipe(delay(300));
    }
    return this.http.post<ImportUploadResponse>(`${this.apiUrl}/import/upload-url`, {
      file_name: fileName,
      content_type: contentType
    });
  }

  startImport(request: StartImportRequest): Observable<ImportJob> {
    if (this.USE_MOCK) {
      const job: ImportJob = {
        id: `import-${Date.now()}`,
        fileName: request.fileName,
        fileStorageKey: request.fileStorageKey,
        status: ImportJobStatus.PENDING,
        totalRows: 0,
        processedRows: 0,
        successfulRows: 0,
        failedRows: 0,
        errors: [],
        options: request.options,
        createdBy: 'current-user',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.mockImportJobs.push(job);

      // Simulate processing
      setTimeout(() => {
        job.status = ImportJobStatus.PROCESSING;
        job.startedAt = new Date();
        job.totalRows = 100;
      }, 1000);

      setTimeout(() => {
        job.status = ImportJobStatus.COMPLETED;
        job.completedAt = new Date();
        job.processedRows = 100;
        job.successfulRows = 98;
        job.failedRows = 2;
        job.errors = [
          { row: 23, column: 'quantity', message: 'Invalid number format' },
          { row: 67, column: 'sku', message: 'SKU already exists' }
        ];
      }, 5000);

      return of(job).pipe(delay(300));
    }
    return this.http.post<ImportJob>(`${this.apiUrl}/import/start`, request);
  }

  getImportJob(id: string): Observable<ImportJob> {
    if (this.USE_MOCK) {
      const job = this.mockImportJobs.find(j => j.id === id);
      return of(job!).pipe(delay(200));
    }
    return this.http.get<ImportJob>(`${this.apiUrl}/import/jobs/${id}`);
  }

  getImportJobs(page: number = 1, pageSize: number = 25): Observable<PaginatedResponse<ImportJob>> {
    if (this.USE_MOCK) {
      return of({
        items: this.mockImportJobs,
        total: this.mockImportJobs.length,
        page,
        pageSize,
        totalPages: 1
      }).pipe(delay(200));
    }
    return this.http.get<PaginatedResponse<ImportJob>>(`${this.apiUrl}/import/jobs`, {
      params: { page, page_size: pageSize }
    });
  }

  cancelImport(id: string): Observable<ImportJob> {
    if (this.USE_MOCK) {
      const job = this.mockImportJobs.find(j => j.id === id);
      if (job && job.status === ImportJobStatus.PROCESSING) {
        job.status = ImportJobStatus.CANCELLED;
        job.updatedAt = new Date();
      }
      return of(job!).pipe(delay(300));
    }
    return this.http.post<ImportJob>(`${this.apiUrl}/import/jobs/${id}/cancel`, {});
  }

  startExport(request: ExportRequest): Observable<ExportJob> {
    if (this.USE_MOCK) {
      const job: ExportJob = {
        id: `export-${Date.now()}`,
        status: ExportJobStatus.PENDING,
        outputFormat: request.outputFormat,
        filters: request.filters,
        includePhotos: request.includePhotos,
        includeStockLevels: request.includeStockLevels,
        includeCustomFields: request.includeCustomFields,
        totalItems: 0,
        createdBy: 'current-user',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.mockExportJobs.push(job);

      // Simulate processing
      setTimeout(() => {
        job.status = ExportJobStatus.PROCESSING;
        job.startedAt = new Date();
      }, 500);

      setTimeout(() => {
        job.status = ExportJobStatus.COMPLETED;
        job.completedAt = new Date();
        job.totalItems = 250;
        job.outputStorageKey = `exports/${job.id}/inventory_export.${request.outputFormat}`;
        job.outputUrl = `https://storage.example.com/exports/${job.id}/inventory_export.${request.outputFormat}`;
        job.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }, 3000);

      return of(job).pipe(delay(300));
    }
    return this.http.post<ExportJob>(`${this.apiUrl}/export/start`, request);
  }

  getExportJob(id: string): Observable<ExportJob> {
    if (this.USE_MOCK) {
      const job = this.mockExportJobs.find(j => j.id === id);
      return of(job!).pipe(delay(200));
    }
    return this.http.get<ExportJob>(`${this.apiUrl}/export/jobs/${id}`);
  }

  getExportJobs(page: number = 1, pageSize: number = 25): Observable<PaginatedResponse<ExportJob>> {
    if (this.USE_MOCK) {
      return of({
        items: this.mockExportJobs,
        total: this.mockExportJobs.length,
        page,
        pageSize,
        totalPages: 1
      }).pipe(delay(200));
    }
    return this.http.get<PaginatedResponse<ExportJob>>(`${this.apiUrl}/export/jobs`, {
      params: { page, page_size: pageSize }
    });
  }

  getImportTemplates(): Observable<ImportTemplate[]> {
    if (this.USE_MOCK) {
      return of([
        {
          name: 'Basic Items Template',
          description: 'Simple template with essential fields: name, SKU, description, category, quantity',
          downloadUrl: 'https://storage.example.com/templates/basic_items_template.csv',
          format: 'csv' as const
        },
        {
          name: 'Full Items Template',
          description: 'Complete template with all fields including custom fields and stock levels',
          downloadUrl: 'https://storage.example.com/templates/full_items_template.xlsx',
          format: 'xlsx' as const
        },
        {
          name: 'Stock Update Template',
          description: 'Template for updating stock levels only (SKU and quantity)',
          downloadUrl: 'https://storage.example.com/templates/stock_update_template.csv',
          format: 'csv' as const
        }
      ]).pipe(delay(200));
    }
    return this.http.get<ImportTemplate[]>(`${this.apiUrl}/import/templates`);
  }

  downloadTemplate(format: 'csv' | 'xlsx'): Observable<Blob> {
    if (this.USE_MOCK) {
      // Return a mock CSV blob
      const csvContent = 'name,sku,description,category,quantity,min_quantity,unit_cost\nExample Item,EX-001,Description here,Category Name,100,10,9.99';
      const blob = new Blob([csvContent], { type: 'text/csv' });
      return of(blob).pipe(delay(200));
    }
    return this.http.get(`${this.apiUrl}/import/templates/download`, {
      params: { format },
      responseType: 'blob'
    });
  }

  validateImportFile(storageKey: string): Observable<{ valid: boolean; errors: string[]; preview: any[] }> {
    if (this.USE_MOCK) {
      return of({
        valid: true,
        errors: [],
        preview: [
          { name: 'Sample Item 1', sku: 'SAM-001', quantity: 100 },
          { name: 'Sample Item 2', sku: 'SAM-002', quantity: 50 },
          { name: 'Sample Item 3', sku: 'SAM-003', quantity: 75 }
        ]
      }).pipe(delay(500));
    }
    return this.http.post<any>(`${this.apiUrl}/import/validate`, { storage_key: storageKey });
  }
}
