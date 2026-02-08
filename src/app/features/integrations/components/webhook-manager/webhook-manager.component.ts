import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { WebhookService } from '@core/services/webhook.service';
import { WebhookEndpoint, WebhookDeliveryStatus } from '@shared/models';

@Component({
  selector: 'app-webhook-manager',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, TableModule, TagModule, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="webhook-manager">
      <div class="page-header">
        <div class="header-content">
          <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/integrations']"></button>
          <div>
            <h1>Webhooks</h1>
            <p class="subtitle">Configure endpoints to receive event notifications</p>
          </div>
        </div>
        <button pButton label="Create Webhook" icon="pi pi-plus" [routerLink]="['new']"></button>
      </div>

      <div class="webhooks-table">
        <p-table [value]="webhooks()" [loading]="loading()" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Name</th>
              <th>URL</th>
              <th>Events</th>
              <th>Last Delivery</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-webhook>
            <tr>
              <td>
                <a [routerLink]="[webhook.id]" class="webhook-name">{{ webhook.name }}</a>
              </td>
              <td>
                <code class="webhook-url">{{ truncateUrl(webhook.url) }}</code>
              </td>
              <td>
                <span class="event-count">{{ webhook.events.length }} events</span>
              </td>
              <td>
                @if (webhook.lastDeliveryAt) {
                  <div class="last-delivery">
                    <p-tag
                      [value]="webhook.lastDeliveryStatus"
                      [severity]="getDeliveryStatusSeverity(webhook.lastDeliveryStatus)"
                      [style]="{'font-size': '0.75rem'}"
                    ></p-tag>
                    <small>{{ webhook.lastDeliveryAt | date:'short' }}</small>
                  </div>
                } @else {
                  <span class="no-deliveries">No deliveries yet</span>
                }
              </td>
              <td>
                <p-tag
                  [value]="webhook.isActive ? 'Active' : 'Disabled'"
                  [severity]="webhook.isActive ? 'success' : 'secondary'"
                ></p-tag>
              </td>
              <td>
                <div class="actions">
                  <button pButton icon="pi pi-send" class="p-button-text p-button-sm" pTooltip="Test" (click)="testWebhook(webhook)"></button>
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View" [routerLink]="[webhook.id]"></button>
                  <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" pTooltip="Delete" (click)="confirmDelete(webhook)"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center p-4">
                <div class="empty-state">
                  <i class="pi pi-bolt"></i>
                  <h3>No Webhooks Configured</h3>
                  <p>Create your first webhook to receive event notifications</p>
                  <button pButton label="Create Webhook" icon="pi pi-plus" [routerLink]="['new']"></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .webhook-manager {
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

    .webhooks-table {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .webhook-name {
      font-weight: 500;
      color: var(--primary-600);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .webhook-url {
      font-size: 0.75rem;
      background: var(--bg-secondary);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .event-count {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    .last-delivery {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      small {
        color: var(--text-muted);
      }
    }

    .no-deliveries {
      font-size: 0.875rem;
      color: var(--text-muted);
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
  `]
})
export class WebhookManagerComponent implements OnInit {
  private readonly webhookService = inject(WebhookService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  webhooks = signal<WebhookEndpoint[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadWebhooks();
  }

  loadWebhooks(): void {
    this.loading.set(true);
    this.webhookService.getWebhooks().subscribe({
      next: (response) => {
        this.webhooks.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load webhooks' });
      }
    });
  }

  truncateUrl(url: string): string {
    if (url.length <= 40) return url;
    return url.substring(0, 40) + '...';
  }

  getDeliveryStatusSeverity(status?: WebhookDeliveryStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case WebhookDeliveryStatus.SUCCESS: return 'success';
      case WebhookDeliveryStatus.FAILED: return 'danger';
      case WebhookDeliveryStatus.PENDING: return 'info';
      default: return 'secondary';
    }
  }

  testWebhook(webhook: WebhookEndpoint): void {
    this.webhookService.testWebhook(webhook.id).subscribe({
      next: (delivery) => {
        if (delivery.status === WebhookDeliveryStatus.SUCCESS) {
          this.messageService.add({ severity: 'success', summary: 'Test Successful', detail: 'Webhook endpoint responded successfully' });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Test Failed', detail: delivery.errorMessage || 'Endpoint did not respond' });
        }
        this.loadWebhooks();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to test webhook' });
      }
    });
  }

  confirmDelete(webhook: WebhookEndpoint): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the webhook "${webhook.name}"?`,
      header: 'Delete Webhook',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.webhookService.deleteWebhook(webhook.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Webhook deleted' });
            this.loadWebhooks();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete webhook' });
          }
        });
      }
    });
  }
}
