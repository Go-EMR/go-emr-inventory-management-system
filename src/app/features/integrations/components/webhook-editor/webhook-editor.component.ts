import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { WebhookService, CreateWebhookRequest } from '@core/services/webhook.service';
import { WebhookEventType } from '@shared/models';

@Component({
  selector: 'app-webhook-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    ToggleSwitchModule,
    MultiSelectModule,
    InputNumberModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="webhook-editor">
      <div class="page-header">
        <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/integrations/webhooks']"></button>
        <h1>Create Webhook</h1>
      </div>

      <div class="editor-form">
        <div class="form-section">
          <h3>Basic Information</h3>
          <div class="form-group">
            <label>Name *</label>
            <input pInputText [(ngModel)]="form.name" placeholder="e.g., ERP Integration" />
          </div>
          <div class="form-group">
            <label>URL *</label>
            <input pInputText [(ngModel)]="form.url" placeholder="https://your-endpoint.com/webhook" />
          </div>
          <div class="form-group">
            <label>Secret (optional)</label>
            <input pInputText [(ngModel)]="form.secret" placeholder="Signing secret for verification" type="password" />
            <small>Used to sign webhook payloads for verification</small>
          </div>
        </div>

        <div class="form-section">
          <h3>Events to Subscribe</h3>
          <p-multiSelect
            [options]="eventOptions"
            [(ngModel)]="form.events"
            optionLabel="label"
            optionValue="value"
            placeholder="Select events"
            [style]="{'width': '100%'}"
            [showHeader]="true"
            [filter]="true"
          >
            <ng-template pTemplate="item" let-event>
              <div class="event-option">
                <span class="event-name">{{ event.label }}</span>
                <span class="event-desc">{{ event.description }}</span>
              </div>
            </ng-template>
          </p-multiSelect>
        </div>

        <div class="form-section">
          <h3>Retry Settings</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Max Retries</label>
              <p-inputNumber [(ngModel)]="form.maxRetries" [min]="0" [max]="10"></p-inputNumber>
            </div>
            <div class="form-group">
              <label>Initial Delay (ms)</label>
              <p-inputNumber [(ngModel)]="form.initialDelayMs" [min]="100" [max]="60000"></p-inputNumber>
            </div>
          </div>
        </div>

        <div class="form-section">
          <div class="switch-group">
            <p-toggleswitch [(ngModel)]="form.isActive"></p-toggleswitch>
            <label>
              <strong>Enable Webhook</strong>
              <span>Webhook will start receiving events immediately</span>
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button pButton label="Cancel" class="p-button-outlined" [routerLink]="['/integrations/webhooks']"></button>
          <button pButton label="Create Webhook" (click)="create()" [loading]="saving()"></button>
        </div>
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .webhook-editor {
      padding: 1.5rem;
      max-width: 700px;
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

    .editor-form {
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

    .form-group {
      margin-bottom: 1rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      input, :host ::ng-deep .p-inputnumber {
        width: 100%;
      }

      small {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .event-option {
      display: flex;
      flex-direction: column;

      .event-name {
        font-weight: 500;
      }

      .event-desc {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .switch-group {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;

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

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }
  `]
})
export class WebhookEditorComponent {
  private readonly router = inject(Router);
  private readonly webhookService = inject(WebhookService);
  private readonly messageService = inject(MessageService);

  saving = signal(false);

  form = {
    name: '',
    url: '',
    secret: '',
    events: [] as WebhookEventType[],
    maxRetries: 3,
    initialDelayMs: 1000,
    isActive: true
  };

  eventOptions = [
    { label: 'Item Created', value: WebhookEventType.ITEM_CREATED, description: 'When a new item is created' },
    { label: 'Item Updated', value: WebhookEventType.ITEM_UPDATED, description: 'When an item is modified' },
    { label: 'Item Deleted', value: WebhookEventType.ITEM_DELETED, description: 'When an item is deleted' },
    { label: 'Stock Adjusted', value: WebhookEventType.STOCK_ADJUSTED, description: 'When stock levels change' },
    { label: 'Stock Low', value: WebhookEventType.STOCK_LOW, description: 'When stock falls below minimum' },
    { label: 'Stock Out', value: WebhookEventType.STOCK_OUT, description: 'When stock reaches zero' },
    { label: 'Checkout Created', value: WebhookEventType.CHECKOUT_CREATED, description: 'When equipment is checked out' },
    { label: 'Checkout Returned', value: WebhookEventType.CHECKOUT_RETURNED, description: 'When equipment is returned' },
    { label: 'Checkout Overdue', value: WebhookEventType.CHECKOUT_OVERDUE, description: 'When a checkout becomes overdue' },
    { label: 'Date Alert', value: WebhookEventType.DATE_ALERT, description: 'For maintenance/calibration alerts' },
    { label: 'Import Completed', value: WebhookEventType.IMPORT_COMPLETED, description: 'When bulk import finishes' },
    { label: 'Export Completed', value: WebhookEventType.EXPORT_COMPLETED, description: 'When bulk export finishes' }
  ];

  create(): void {
    if (!this.form.name.trim() || !this.form.url.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Name and URL are required' });
      return;
    }

    if (this.form.events.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Select at least one event' });
      return;
    }

    this.saving.set(true);

    const request: CreateWebhookRequest = {
      name: this.form.name,
      url: this.form.url,
      secret: this.form.secret || undefined,
      events: this.form.events,
      isActive: this.form.isActive,
      retryPolicy: {
        maxRetries: this.form.maxRetries,
        initialDelayMs: this.form.initialDelayMs,
        maxDelayMs: 60000,
        backoffMultiplier: 2
      }
    };

    this.webhookService.createWebhook(request).subscribe({
      next: (webhook) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Webhook created' });
        this.router.navigate(['/integrations/webhooks', webhook.id]);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create webhook' });
      }
    });
  }
}
