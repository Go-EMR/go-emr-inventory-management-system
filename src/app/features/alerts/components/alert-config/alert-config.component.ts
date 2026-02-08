import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DateAlertService } from '@core/services/date-alert.service';
import { DateAlertConfig, TrackedDateType } from '@shared/models';

@Component({
  selector: 'app-alert-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    ToggleSwitchModule,
    AutoCompleteModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="alert-config">
      <div class="page-header">
        <div class="header-content">
          <h1>Alert Configuration</h1>
          <p class="subtitle">Configure how and when you receive date-based alerts</p>
        </div>
      </div>

      <div class="config-section">
        <p-table [value]="configs()" [loading]="loading()" dataKey="id">
          <ng-template pTemplate="header">
            <tr>
              <th>Alert Type</th>
              <th>Days Before Alert</th>
              <th>Email</th>
              <th>Dashboard</th>
              <th>Webhook</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-config>
            <tr>
              <td>
                <strong>{{ formatDateType(config.dateType) }}</strong>
              </td>
              <td>
                <p-autoComplete [(ngModel)]="config.alertDaysBefore" [multiple]="true"></p-autoComplete>
              </td>
              <td>
                <p-toggleswitch [(ngModel)]="config.emailEnabled"></p-toggleswitch>
              </td>
              <td>
                <p-toggleswitch [(ngModel)]="config.dashboardEnabled"></p-toggleswitch>
              </td>
              <td>
                <p-toggleswitch [(ngModel)]="config.webhookEnabled"></p-toggleswitch>
              </td>
              <td>
                <p-toggleswitch [(ngModel)]="config.isActive"></p-toggleswitch>
              </td>
              <td>
                <button pButton icon="pi pi-save" class="p-button-text p-button-sm" pTooltip="Save" (click)="saveConfig(config)"></button>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <div class="help-section">
        <h3>About Date Alerts</h3>
        <ul>
          <li><strong>Days Before Alert:</strong> Enter the number of days before the due date when you want to receive alerts (e.g., 30, 14, 7, 1).</li>
          <li><strong>Email:</strong> Receive email notifications for this alert type.</li>
          <li><strong>Dashboard:</strong> Show alerts on the dashboard.</li>
          <li><strong>Webhook:</strong> Send webhook notifications to external systems.</li>
          <li><strong>Status:</strong> Enable or disable this alert type entirely.</li>
        </ul>
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .alert-config {
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

    .config-section {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    :host ::ng-deep .p-autocomplete-token {
      background: var(--primary-100);
      color: var(--primary-700);
    }

    .help-section {
      margin-top: 2rem;
      padding: 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);

      h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        color: var(--text-primary);
      }

      ul {
        margin: 0;
        padding-left: 1.5rem;
        color: var(--text-secondary);

        li {
          margin-bottom: 0.5rem;
        }
      }
    }
  `]
})
export class AlertConfigComponent implements OnInit {
  private readonly alertService = inject(DateAlertService);
  private readonly messageService = inject(MessageService);

  configs = signal<DateAlertConfig[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadConfigs();
  }

  loadConfigs(): void {
    this.loading.set(true);
    this.alertService.getAlertConfigs().subscribe({
      next: (configs) => {
        this.configs.set(configs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load configurations' });
      }
    });
  }

  formatDateType(type: TrackedDateType): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  saveConfig(config: DateAlertConfig): void {
    this.alertService.updateAlertConfig(config).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Configuration saved' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save configuration' });
      }
    });
  }
}
