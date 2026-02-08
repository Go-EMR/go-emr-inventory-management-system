import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { APIKeyService, CreateAPIKeyRequest } from '@core/services/api-key.service';
import { APIKey } from '@shared/models';

@Component({
  selector: 'app-api-key-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    TableModule,
    TagModule,
    DialogModule,
    InputTextModule,
    MultiSelectModule,
    DatePickerModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="api-key-manager">
      <div class="page-header">
        <div class="header-content">
          <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/integrations']"></button>
          <div>
            <h1>API Keys</h1>
            <p class="subtitle">Manage access credentials for programmatic access</p>
          </div>
        </div>
        <button pButton label="Create API Key" icon="pi pi-plus" (click)="showCreateDialog()"></button>
      </div>

      <div class="keys-table">
        <p-table [value]="apiKeys()" [loading]="loading()" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th>Key Prefix</th>
              <th>Scopes</th>
              <th>Last Used</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-key>
            <tr>
              <td>
                <div class="key-info">
                  <strong>{{ key.name }}</strong>
                  @if (key.description) {
                    <small>{{ key.description }}</small>
                  }
                </div>
              </td>
              <td><code>{{ key.keyPrefix }}***</code></td>
              <td>
                <span class="scope-count">{{ key.scopes.length }} scopes</span>
              </td>
              <td>
                @if (key.lastUsedAt) {
                  {{ key.lastUsedAt | date:'short' }}
                } @else {
                  <span class="never-used">Never used</span>
                }
              </td>
              <td>
                @if (key.expiresAt) {
                  <span [class.expired]="isExpired(key.expiresAt)">
                    {{ key.expiresAt | date:'mediumDate' }}
                  </span>
                } @else {
                  <span class="no-expiry">No expiry</span>
                }
              </td>
              <td>
                <p-tag
                  [value]="key.isActive ? 'Active' : 'Revoked'"
                  [severity]="key.isActive ? 'success' : 'danger'"
                ></p-tag>
              </td>
              <td>
                <div class="actions">
                  @if (key.isActive) {
                    <button pButton icon="pi pi-ban" class="p-button-text p-button-warning p-button-sm" pTooltip="Revoke" (click)="confirmRevoke(key)"></button>
                  }
                  <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" pTooltip="Delete" (click)="confirmDelete(key)"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="text-center p-4">
                <div class="empty-state">
                  <i class="pi pi-key"></i>
                  <h3>No API Keys</h3>
                  <p>Create an API key to enable programmatic access</p>
                  <button pButton label="Create API Key" icon="pi pi-plus" (click)="showCreateDialog()"></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Create Dialog -->
      <p-dialog [(visible)]="createDialogVisible" header="Create API Key" [modal]="true" [style]="{ width: '500px' }">
        <div class="form-group">
          <label>Name *</label>
          <input pInputText [(ngModel)]="createForm.name" placeholder="e.g., Production Integration" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <input pInputText [(ngModel)]="createForm.description" placeholder="What is this key for?" />
        </div>
        <div class="form-group">
          <label>Scopes *</label>
          <p-multiSelect
            [options]="scopeOptions"
            [(ngModel)]="createForm.scopes"
            optionLabel="name"
            optionValue="scope"
            optionGroupLabel="category"
            optionGroupChildren="items"
            placeholder="Select permissions"
            [style]="{'width': '100%'}"
            [group]="true"
          ></p-multiSelect>
        </div>
        <div class="form-group">
          <label>Expiration (optional)</label>
          <p-datepicker [(ngModel)]="createForm.expiresAt" [showIcon]="true" [minDate]="minDate" [style]="{'width': '100%'}"></p-datepicker>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="createDialogVisible = false"></button>
          <button pButton label="Create" (click)="createKey()" [loading]="creating()"></button>
        </ng-template>
      </p-dialog>

      <!-- Secret Display Dialog -->
      <p-dialog [(visible)]="secretDialogVisible" header="API Key Created" [modal]="true" [closable]="false" [style]="{ width: '500px' }">
        <div class="secret-display">
          <div class="warning-banner">
            <i class="pi pi-exclamation-triangle"></i>
            <p>Make sure to copy your API key now. You won't be able to see it again!</p>
          </div>
          <div class="secret-value">
            <code>{{ newSecret }}</code>
            <button pButton icon="pi pi-copy" class="p-button-text" (click)="copySecret()"></button>
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="I've copied the key" (click)="secretDialogVisible = false"></button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .api-key-manager {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .header-content {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;

      h1 {
        margin: 0 0 0.25rem 0;
        font-size: 1.5rem;
        color: var(--text-primary);
      }

      .subtitle {
        margin: 0;
        color: var(--text-secondary);
      }
    }

    .keys-table {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .key-info {
      display: flex;
      flex-direction: column;

      strong {
        color: var(--text-primary);
      }

      small {
        color: var(--text-muted);
      }
    }

    code {
      font-size: 0.75rem;
      background: var(--bg-secondary);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .scope-count {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .never-used, .no-expiry {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .expired {
      color: var(--alert-600);
    }

    .actions {
      display: flex;
      gap: 0.25rem;
    }

    .empty-state {
      padding: 3rem;
      text-align: center;

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
        margin: 0 0 1.5rem 0;
        color: var(--text-secondary);
      }
    }

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      input {
        width: 100%;
      }
    }

    .secret-display {
      .warning-banner {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem;
        background: rgba(250, 204, 21, 0.1);
        border: 1px solid rgba(250, 204, 21, 0.3);
        border-radius: var(--radius-md);
        margin-bottom: 1rem;

        i {
          color: #eab308;
          font-size: 1.25rem;
        }

        p {
          margin: 0;
          color: var(--text-primary);
        }
      }

      .secret-value {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);

        code {
          flex: 1;
          word-break: break-all;
          background: transparent;
          padding: 0;
        }
      }
    }
  `]
})
export class ApiKeyManagerComponent implements OnInit {
  private readonly apiKeyService = inject(APIKeyService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  apiKeys = signal<APIKey[]>([]);
  loading = signal(false);
  creating = signal(false);

  createDialogVisible = false;
  secretDialogVisible = false;
  newSecret = '';
  minDate = new Date();

  createForm: CreateAPIKeyRequest = {
    name: '',
    description: '',
    scopes: []
  };

  scopeOptions = [
    {
      category: 'Items',
      items: [
        { scope: 'items:read', name: 'Read Items' },
        { scope: 'items:write', name: 'Write Items' }
      ]
    },
    {
      category: 'Stock',
      items: [
        { scope: 'stock:read', name: 'Read Stock' },
        { scope: 'stock:write', name: 'Write Stock' }
      ]
    },
    {
      category: 'Checkouts',
      items: [
        { scope: 'checkouts:read', name: 'Read Checkouts' },
        { scope: 'checkouts:write', name: 'Write Checkouts' }
      ]
    },
    {
      category: 'Reports',
      items: [
        { scope: 'reports:read', name: 'Read Reports' }
      ]
    }
  ];

  ngOnInit(): void {
    this.loadApiKeys();
  }

  loadApiKeys(): void {
    this.loading.set(true);
    this.apiKeyService.getAPIKeys().subscribe({
      next: (response) => {
        this.apiKeys.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load API keys' });
      }
    });
  }

  showCreateDialog(): void {
    this.createForm = { name: '', description: '', scopes: [] };
    this.createDialogVisible = true;
  }

  createKey(): void {
    if (!this.createForm.name.trim() || this.createForm.scopes.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Name and at least one scope required' });
      return;
    }

    this.creating.set(true);
    this.apiKeyService.createAPIKey(this.createForm).subscribe({
      next: (result) => {
        this.creating.set(false);
        this.createDialogVisible = false;
        this.newSecret = result.secretKey;
        this.secretDialogVisible = true;
        this.loadApiKeys();
      },
      error: () => {
        this.creating.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create API key' });
      }
    });
  }

  copySecret(): void {
    navigator.clipboard.writeText(this.newSecret);
    this.messageService.add({ severity: 'success', summary: 'Copied', detail: 'API key copied to clipboard' });
  }

  isExpired(date: Date): boolean {
    return new Date(date) < new Date();
  }

  confirmRevoke(key: APIKey): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to revoke "${key.name}"? This action cannot be undone.`,
      header: 'Revoke API Key',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiKeyService.revokeAPIKey(key.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Revoked', detail: 'API key revoked' });
            this.loadApiKeys();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to revoke API key' });
          }
        });
      }
    });
  }

  confirmDelete(key: APIKey): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete "${key.name}"?`,
      header: 'Delete API Key',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apiKeyService.deleteAPIKey(key.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'API key deleted' });
            this.loadApiKeys();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete API key' });
          }
        });
      }
    });
  }
}
