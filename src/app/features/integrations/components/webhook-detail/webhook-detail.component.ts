import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { WebhookService } from '@core/services/webhook.service';
import { WebhookEndpoint, WebhookDelivery, WebhookDeliveryStatus } from '@shared/models';

@Component({
  selector: 'app-webhook-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, TagModule, TableModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="webhook-detail">
      <div class="page-header">
        <div class="header-left">
          <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/integrations/webhooks']"></button>
          <div class="header-info">
            <h1>{{ webhook()?.name }}</h1>
            <p-tag
              [value]="webhook()?.isActive ? 'Active' : 'Disabled'"
              [severity]="webhook()?.isActive ? 'success' : 'secondary'"
            ></p-tag>
          </div>
        </div>
        <div class="header-actions">
          <button pButton label="Test" icon="pi pi-send" class="p-button-outlined" (click)="testWebhook()" [loading]="testing()"></button>
          <button pButton label="Edit" icon="pi pi-pencil" class="p-button-outlined"></button>
        </div>
      </div>

      @if (webhook()) {
        <div class="detail-grid">
          <div class="info-section">
            <div class="info-card">
              <h3>Endpoint Details</h3>
              <div class="info-row">
                <span class="label">URL</span>
                <code class="value url">{{ webhook()?.url }}</code>
              </div>
              <div class="info-row">
                <span class="label">Secret</span>
                <span class="value">{{ webhook()?.secret ? '••••••••' : 'Not set' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Created</span>
                <span class="value">{{ webhook()?.createdAt | date:'medium' }}</span>
              </div>
            </div>

            <div class="info-card">
              <h3>Subscribed Events ({{ webhook()?.events?.length }})</h3>
              <div class="events-list">
                @for (event of webhook()?.events; track event) {
                  <p-tag [value]="formatEvent(event)" styleClass="event-tag"></p-tag>
                }
              </div>
            </div>

            <div class="info-card">
              <h3>Retry Policy</h3>
              <div class="info-row">
                <span class="label">Max Retries</span>
                <span class="value">{{ webhook()?.retryPolicy?.maxRetries }}</span>
              </div>
              <div class="info-row">
                <span class="label">Initial Delay</span>
                <span class="value">{{ webhook()?.retryPolicy?.initialDelayMs }}ms</span>
              </div>
              <div class="info-row">
                <span class="label">Max Delay</span>
                <span class="value">{{ webhook()?.retryPolicy?.maxDelayMs }}ms</span>
              </div>
            </div>
          </div>

          <div class="deliveries-section">
            <h3>Recent Deliveries</h3>
            <p-table [value]="deliveries()" [loading]="loadingDeliveries()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>Status</th>
                  <th>Event</th>
                  <th>HTTP Status</th>
                  <th>Attempts</th>
                  <th>Time</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-delivery>
                <tr>
                  <td>
                    <p-tag
                      [value]="delivery.status"
                      [severity]="getStatusSeverity(delivery.status)"
                    ></p-tag>
                  </td>
                  <td>{{ formatEvent(delivery.eventType) }}</td>
                  <td>{{ delivery.httpStatusCode || '-' }}</td>
                  <td>{{ delivery.attempts }}</td>
                  <td>{{ delivery.createdAt | date:'short' }}</td>
                </tr>
              </ng-template>
              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="5" class="text-center p-4">No deliveries yet</td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        </div>
      }

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .webhook-detail {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      h1 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text-primary);
      }
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 1.5rem;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;

      h3 {
        margin: 0 0 1rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
      }
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-color);

      &:last-child {
        border-bottom: none;
      }

      .label {
        color: var(--text-secondary);
      }

      .value {
        font-weight: 500;
        color: var(--text-primary);

        &.url {
          font-size: 0.75rem;
          word-break: break-all;
        }
      }
    }

    .events-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    :host ::ng-deep .event-tag {
      font-size: 0.75rem;
    }

    .deliveries-section {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;

      h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        color: var(--text-primary);
      }
    }
  `]
})
export class WebhookDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly webhookService = inject(WebhookService);
  private readonly messageService = inject(MessageService);

  webhook = signal<WebhookEndpoint | null>(null);
  deliveries = signal<WebhookDelivery[]>([]);
  loading = signal(false);
  loadingDeliveries = signal(false);
  testing = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadWebhook(id);
      this.loadDeliveries(id);
    }
  }

  loadWebhook(id: string): void {
    this.loading.set(true);
    this.webhookService.getWebhook(id).subscribe({
      next: (webhook) => {
        this.webhook.set(webhook);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load webhook' });
      }
    });
  }

  loadDeliveries(endpointId: string): void {
    this.loadingDeliveries.set(true);
    this.webhookService.getDeliveries({ endpointId }).subscribe({
      next: (response) => {
        this.deliveries.set(response.items);
        this.loadingDeliveries.set(false);
      },
      error: () => this.loadingDeliveries.set(false)
    });
  }

  testWebhook(): void {
    const id = this.webhook()?.id;
    if (!id) return;

    this.testing.set(true);
    this.webhookService.testWebhook(id).subscribe({
      next: (delivery) => {
        this.testing.set(false);
        if (delivery.status === WebhookDeliveryStatus.SUCCESS) {
          this.messageService.add({ severity: 'success', summary: 'Test Successful', detail: 'Endpoint responded successfully' });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Test Failed', detail: delivery.errorMessage || 'Endpoint did not respond' });
        }
        this.loadDeliveries(id);
      },
      error: () => {
        this.testing.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to test webhook' });
      }
    });
  }

  formatEvent(event: string): string {
    return event.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getStatusSeverity(status: WebhookDeliveryStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case WebhookDeliveryStatus.SUCCESS: return 'success';
      case WebhookDeliveryStatus.FAILED: return 'danger';
      case WebhookDeliveryStatus.PENDING: return 'info';
      default: return 'secondary';
    }
  }
}
