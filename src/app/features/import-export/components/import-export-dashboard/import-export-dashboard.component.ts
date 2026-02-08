import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ImportExportService } from '@core/services/import-export.service';
import { ImportJob, ExportJob, ImportJobStatus, ExportJobStatus } from '@shared/models';

@Component({
  selector: 'app-import-export-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, CardModule, TableModule, TagModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="import-export-dashboard">
      <div class="page-header">
        <div class="header-content">
          <h1>Import / Export</h1>
          <p class="subtitle">Bulk data operations for inventory management</p>
        </div>
      </div>

      <div class="action-cards">
        <div class="action-card" [routerLink]="['import']">
          <div class="card-icon import">
            <i class="pi pi-upload"></i>
          </div>
          <div class="card-content">
            <h3>Import Data</h3>
            <p>Upload CSV or Excel files to add or update inventory items</p>
          </div>
          <i class="pi pi-chevron-right"></i>
        </div>

        <div class="action-card" [routerLink]="['export']">
          <div class="card-icon export">
            <i class="pi pi-download"></i>
          </div>
          <div class="card-content">
            <h3>Export Data</h3>
            <p>Download inventory data in CSV or Excel format</p>
          </div>
          <i class="pi pi-chevron-right"></i>
        </div>
      </div>

      <div class="recent-section">
        <div class="section-header">
          <h3>Recent Import Jobs</h3>
          <a [routerLink]="['jobs']" class="view-all">View All</a>
        </div>
        <p-table [value]="recentImports()" [loading]="loadingImports()" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>File Name</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Date</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-job>
            <tr>
              <td>{{ job.fileName }}</td>
              <td>
                <p-tag [value]="job.status" [severity]="getImportStatusSeverity(job.status)"></p-tag>
              </td>
              <td>
                @if (job.totalRows > 0) {
                  {{ job.successfulRows }}/{{ job.totalRows }} rows
                } @else {
                  -
                }
              </td>
              <td>{{ job.createdAt | date:'short' }}</td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4" class="text-center p-4">No recent imports</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <div class="recent-section">
        <div class="section-header">
          <h3>Recent Export Jobs</h3>
          <a [routerLink]="['jobs']" class="view-all">View All</a>
        </div>
        <p-table [value]="recentExports()" [loading]="loadingExports()" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Format</th>
              <th>Status</th>
              <th>Items</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-job>
            <tr>
              <td>{{ job.outputFormat | uppercase }}</td>
              <td>
                <p-tag [value]="job.status" [severity]="getExportStatusSeverity(job.status)"></p-tag>
              </td>
              <td>{{ job.totalItems || '-' }}</td>
              <td>{{ job.createdAt | date:'short' }}</td>
              <td>
                @if (job.status === 'completed' && job.outputUrl) {
                  <a [href]="job.outputUrl" target="_blank" class="download-link">
                    <i class="pi pi-download"></i> Download
                  </a>
                }
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" class="text-center p-4">No recent exports</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .import-export-dashboard {
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

    .action-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--primary-300);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
    }

    .card-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.5rem;
      }

      &.import {
        background: rgba(16, 185, 129, 0.1);
        color: var(--primary-600);
      }

      &.export {
        background: rgba(59, 130, 246, 0.1);
        color: #3b82f6;
      }
    }

    .card-content {
      flex: 1;

      h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.125rem;
        color: var(--text-primary);
      }

      p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    .recent-section {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      margin-bottom: 1.5rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);

      h3 {
        margin: 0;
        font-size: 1rem;
        color: var(--text-primary);
      }

      .view-all {
        font-size: 0.875rem;
        color: var(--primary-600);
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .download-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--primary-600);
      text-decoration: none;
      font-size: 0.875rem;

      &:hover {
        text-decoration: underline;
      }
    }
  `]
})
export class ImportExportDashboardComponent implements OnInit {
  private readonly importExportService = inject(ImportExportService);
  private readonly messageService = inject(MessageService);

  recentImports = signal<ImportJob[]>([]);
  recentExports = signal<ExportJob[]>([]);
  loadingImports = signal(false);
  loadingExports = signal(false);

  ngOnInit(): void {
    this.loadRecentJobs();
  }

  loadRecentJobs(): void {
    this.loadingImports.set(true);
    this.loadingExports.set(true);

    this.importExportService.getImportJobs(1, 5).subscribe({
      next: (response) => {
        this.recentImports.set(response.items);
        this.loadingImports.set(false);
      },
      error: () => this.loadingImports.set(false)
    });

    this.importExportService.getExportJobs(1, 5).subscribe({
      next: (response) => {
        this.recentExports.set(response.items);
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
}
