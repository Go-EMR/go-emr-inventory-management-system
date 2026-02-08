import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ImportExportService } from '@core/services/import-export.service';
import { ImportJob, ExportJob, ImportJobStatus, ExportJobStatus } from '@shared/models';

@Component({
  selector: 'app-job-history',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, TabsModule, TableModule, TagModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="job-history">
      <div class="page-header">
        <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/import-export']"></button>
        <h1>Job History</h1>
      </div>

      <p-tabs value="0">
        <p-tablist>
          <p-tab value="0">Import Jobs</p-tab>
          <p-tab value="1">Export Jobs</p-tab>
        </p-tablist>
        <p-tabpanels>
          <p-tabpanel value="0">
            <p-table [value]="importJobs()" [loading]="loadingImports()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>File Name</th>
                  <th>Status</th>
                  <th>Rows</th>
                  <th>Success / Failed</th>
                  <th>Started</th>
                  <th>Completed</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-job>
                <tr>
                  <td>{{ job.fileName }}</td>
                  <td>
                    <p-tag [value]="job.status" [severity]="getImportStatusSeverity(job.status)"></p-tag>
                  </td>
                  <td>{{ job.totalRows }}</td>
                  <td>
                    <span class="text-green-600">{{ job.successfulRows }}</span>
                    /
                    <span class="text-red-600">{{ job.failedRows }}</span>
                  </td>
                  <td>{{ job.startedAt | date:'short' }}</td>
                  <td>{{ job.completedAt | date:'short' }}</td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6" class="text-center p-4">No import jobs found</td>
                </tr>
              </ng-template>
            </p-table>
          </p-tabpanel>

          <p-tabpanel value="1">
            <p-table [value]="exportJobs()" [loading]="loadingExports()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>Format</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Started</th>
                  <th>Completed</th>
                  <th>Download</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-job>
                <tr>
                  <td>{{ job.outputFormat | uppercase }}</td>
                  <td>
                    <p-tag [value]="job.status" [severity]="getExportStatusSeverity(job.status)"></p-tag>
                  </td>
                  <td>{{ job.totalItems || '-' }}</td>
                  <td>{{ job.startedAt | date:'short' }}</td>
                  <td>{{ job.completedAt | date:'short' }}</td>
                  <td>
                    @if (job.status === 'completed' && job.outputUrl) {
                      @if (isExpired(job.expiresAt)) {
                        <span class="expired">Expired</span>
                      } @else {
                        <a [href]="job.outputUrl" target="_blank" class="download-link">
                          <i class="pi pi-download"></i> Download
                        </a>
                      }
                    } @else {
                      -
                    }
                  </td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="6" class="text-center p-4">No export jobs found</td>
                </tr>
              </ng-template>
            </p-table>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .job-history {
      padding: 1.5rem;
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

    .download-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--primary-600);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .expired {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
  `]
})
export class JobHistoryComponent implements OnInit {
  private readonly importExportService = inject(ImportExportService);
  private readonly messageService = inject(MessageService);

  importJobs = signal<ImportJob[]>([]);
  exportJobs = signal<ExportJob[]>([]);
  loadingImports = signal(false);
  loadingExports = signal(false);

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.loadingImports.set(true);
    this.loadingExports.set(true);

    this.importExportService.getImportJobs().subscribe({
      next: (response) => {
        this.importJobs.set(response.items);
        this.loadingImports.set(false);
      },
      error: () => this.loadingImports.set(false)
    });

    this.importExportService.getExportJobs().subscribe({
      next: (response) => {
        this.exportJobs.set(response.items);
        this.loadingExports.set(false);
      },
      error: () => this.loadingExports.set(false)
    });
  }

  getImportStatusSeverity(status: ImportJobStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case ImportJobStatus.COMPLETED: return 'success';
      case ImportJobStatus.PROCESSING: return 'info';
      case ImportJobStatus.FAILED: return 'danger';
      case ImportJobStatus.CANCELLED: return 'warn';
      default: return 'secondary';
    }
  }

  getExportStatusSeverity(status: ExportJobStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case ExportJobStatus.COMPLETED: return 'success';
      case ExportJobStatus.PROCESSING: return 'info';
      case ExportJobStatus.FAILED: return 'danger';
      default: return 'secondary';
    }
  }

  isExpired(expiresAt?: Date): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }
}
