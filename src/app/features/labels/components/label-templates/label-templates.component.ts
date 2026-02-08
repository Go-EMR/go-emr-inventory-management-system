import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { BarcodeService } from '@core/services/barcode.service';
import { LabelTemplate } from '@shared/models';

@Component({
  selector: 'app-label-templates',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="label-templates">
      <div class="page-header">
        <div class="header-content">
          <h1>Label Templates</h1>
          <p class="subtitle">Manage your label templates for barcode printing</p>
        </div>
        <button pButton label="Create Template" icon="pi pi-plus"></button>
      </div>

      <div class="templates-table">
        <p-table [value]="templates()" [loading]="loading()" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th>Size</th>
              <th>Barcode Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-template>
            <tr>
              <td>
                <div class="template-name">
                  <strong>{{ template.name }}</strong>
                  @if (template.isDefault) {
                    <p-tag value="Default" severity="success" [rounded]="true"></p-tag>
                  }
                </div>
                <small>{{ template.description }}</small>
              </td>
              <td>{{ template.sizeName }}</td>
              <td>{{ template.barcodeType }}</td>
              <td>
                <p-tag
                  [value]="template.isActive ? 'Active' : 'Inactive'"
                  [severity]="template.isActive ? 'success' : 'secondary'"
                ></p-tag>
              </td>
              <td>
                <div class="actions">
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="Preview"></button>
                  <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" pTooltip="Edit"></button>
                  <button pButton icon="pi pi-copy" class="p-button-text p-button-sm" pTooltip="Duplicate"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="5" class="text-center p-4">No templates found</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .label-templates {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
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

    .templates-table {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .template-name {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      strong {
        color: var(--text-primary);
      }
    }

    .actions {
      display: flex;
      gap: 0.25rem;
    }
  `]
})
export class LabelTemplatesComponent implements OnInit {
  private readonly barcodeService = inject(BarcodeService);
  private readonly messageService = inject(MessageService);

  templates = signal<LabelTemplate[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading.set(true);
    this.barcodeService.getLabelTemplates().subscribe({
      next: (response) => {
        this.templates.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load templates' });
      }
    });
  }
}
