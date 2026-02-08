import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PickListService } from '@core/services/pick-list.service';
import { PickList, PickListStatus, PickListPriority, PickingProgress } from '@shared/models';

@Component({
  selector: 'app-pick-list-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TagModule,
    TableModule,
    ProgressBarModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="pick-list-detail">
      <div class="page-header">
        <div class="header-left">
          <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/pick-lists']"></button>
          <div class="header-info">
            <h1>{{ pickList()?.pickListNumber }}</h1>
            @if (pickList()?.kitName) {
              <span class="kit-badge">{{ pickList()?.kitName }}</span>
            }
          </div>
        </div>
        <div class="header-actions">
          @if (pickList()?.status === 'pending') {
            <button pButton label="Start Picking" icon="pi pi-play" (click)="startPicking()"></button>
          }
          @if (pickList()?.status === 'in_progress') {
            <button pButton label="Continue Picking" icon="pi pi-list-check" [routerLink]="['pick']"></button>
          }
        </div>
      </div>

      @if (pickList()) {
        <div class="detail-grid">
          <div class="info-cards">
            <div class="info-card">
              <span class="label">Status</span>
              <p-tag
                [value]="pickList()?.status || ''"
                [severity]="getStatusSeverity(pickList()?.status)"
              ></p-tag>
            </div>
            <div class="info-card">
              <span class="label">Priority</span>
              <p-tag
                [value]="pickList()?.priority || ''"
                [severity]="getPrioritySeverity(pickList()?.priority)"
              ></p-tag>
            </div>
            <div class="info-card">
              <span class="label">Requester</span>
              <span class="value">{{ pickList()?.requesterName }}</span>
            </div>
            <div class="info-card">
              <span class="label">Department</span>
              <span class="value">{{ pickList()?.department || '-' }}</span>
            </div>
            <div class="info-card">
              <span class="label">Destination</span>
              <span class="value">{{ pickList()?.destination || '-' }}</span>
            </div>
            <div class="info-card">
              <span class="label">Needed By</span>
              <span class="value">{{ pickList()?.neededBy ? (pickList()?.neededBy | date:'short') : '-' }}</span>
            </div>
          </div>

          @if (progress()) {
            <div class="progress-section">
              <h3>Picking Progress</h3>
              <div class="progress-stats">
                <div class="stat">
                  <span class="stat-value">{{ progress()?.pickedItems }}</span>
                  <span class="stat-label">Picked</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ progress()?.pendingItems }}</span>
                  <span class="stat-label">Pending</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ progress()?.outOfStockItems }}</span>
                  <span class="stat-label">Out of Stock</span>
                </div>
              </div>
              <p-progressBar [value]="progress()?.completionPercentage || 0" [showValue]="true"></p-progressBar>
            </div>
          }

          <div class="items-section">
            <h3>Items ({{ pickList()?.items?.length }})</h3>
            <p-table [value]="pickList()?.items || []" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>Item</th>
                  <th>Requested</th>
                  <th>Picked</th>
                  <th>Status</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-item>
                <tr>
                  <td>
                    <div class="item-info">
                      <strong>{{ item.itemName }}</strong>
                      <small>{{ item.itemSku }}</small>
                    </div>
                  </td>
                  <td>{{ item.quantityRequested }}</td>
                  <td>{{ item.quantityPicked }}</td>
                  <td>
                    <p-tag
                      [value]="item.status"
                      [severity]="getItemStatusSeverity(item.status)"
                    ></p-tag>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          @if (pickList()?.notes) {
            <div class="notes-section">
              <h3>Notes</h3>
              <p>{{ pickList()?.notes }}</p>
            </div>
          }
        </div>
      }

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .pick-list-detail {
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
      h1 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text-primary);
      }
    }

    .kit-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      background: var(--primary-100);
      color: var(--primary-700);
      border-radius: var(--radius-sm);
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .detail-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .info-cards {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 1rem;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(3, 1fr);
      }

      @media (max-width: 640px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .info-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .label {
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
      }

      .value {
        font-weight: 500;
        color: var(--text-primary);
      }
    }

    .progress-section, .items-section, .notes-section {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;

      h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        color: var(--text-primary);
      }
    }

    .progress-stats {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;

      .stat {
        display: flex;
        flex-direction: column;

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
      }
    }

    .item-info {
      display: flex;
      flex-direction: column;

      strong {
        color: var(--text-primary);
      }

      small {
        color: var(--text-muted);
      }
    }

    .notes-section p {
      margin: 0;
      color: var(--text-secondary);
    }
  `]
})
export class PickListDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly pickListService = inject(PickListService);
  private readonly messageService = inject(MessageService);

  pickList = signal<PickList | null>(null);
  progress = signal<PickingProgress | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPickList(id);
    }
  }

  loadPickList(id: string): void {
    this.loading.set(true);
    this.pickListService.getPickList(id).subscribe({
      next: (pickList) => {
        this.pickList.set(pickList);
        this.loadProgress(id);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load pick list' });
      }
    });
  }

  loadProgress(id: string): void {
    this.pickListService.getPickingProgress(id).subscribe({
      next: (progress) => this.progress.set(progress)
    });
  }

  startPicking(): void {
    const id = this.pickList()?.id;
    if (!id) return;

    this.pickListService.startPicking(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Picking started' });
        this.loadPickList(id);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to start picking' });
      }
    });
  }

  getStatusSeverity(status?: PickListStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case PickListStatus.PENDING: return 'info';
      case PickListStatus.IN_PROGRESS: return 'warn';
      case PickListStatus.COMPLETED: return 'success';
      case PickListStatus.CANCELLED: return 'danger';
      default: return 'secondary';
    }
  }

  getPrioritySeverity(priority?: PickListPriority): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (priority) {
      case PickListPriority.LOW: return 'secondary';
      case PickListPriority.NORMAL: return 'info';
      case PickListPriority.HIGH: return 'warn';
      case PickListPriority.URGENT: return 'danger';
      default: return 'secondary';
    }
  }

  getItemStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case 'picked': return 'success';
      case 'partially_picked': return 'warn';
      case 'out_of_stock': return 'danger';
      default: return 'secondary';
    }
  }
}
