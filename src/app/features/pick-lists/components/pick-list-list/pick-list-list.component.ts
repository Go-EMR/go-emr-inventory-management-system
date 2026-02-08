import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PickListService } from '@core/services/pick-list.service';
import { PickList, PickListStatus, PickListPriority } from '@shared/models';

@Component({
  selector: 'app-pick-list-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    TableModule,
    TagModule,
    SelectModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="pick-list-page">
      <div class="page-header">
        <div class="header-content">
          <h1>Pick Lists</h1>
          <p class="subtitle">Manage inventory picking requests</p>
        </div>
        <button pButton label="Create Pick List" icon="pi pi-plus" [routerLink]="['new']"></button>
      </div>

      <div class="filters-bar">
        <p-select
          [options]="statusOptions"
          [(ngModel)]="selectedStatus"
          placeholder="Filter by Status"
          [showClear]="true"
          (onChange)="loadPickLists()"
        ></p-select>
        <p-select
          [options]="priorityOptions"
          [(ngModel)]="selectedPriority"
          placeholder="Filter by Priority"
          [showClear]="true"
          (onChange)="loadPickLists()"
        ></p-select>
      </div>

      <div class="pick-lists-table">
        <p-table [value]="pickLists()" [loading]="loading()" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th>Pick List #</th>
              <th>Requested By</th>
              <th>Department</th>
              <th>Destination</th>
              <th>Items</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Needed By</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-pickList>
            <tr>
              <td>
                <a [routerLink]="[pickList.id]" class="list-number">{{ pickList.pickListNumber }}</a>
                @if (pickList.kitName) {
                  <small class="kit-name">{{ pickList.kitName }}</small>
                }
              </td>
              <td>{{ pickList.requesterName }}</td>
              <td>{{ pickList.department }}</td>
              <td>{{ pickList.destination }}</td>
              <td>{{ pickList.items.length }} items</td>
              <td>
                <p-tag
                  [value]="pickList.priority"
                  [severity]="getPrioritySeverity(pickList.priority)"
                ></p-tag>
              </td>
              <td>
                <p-tag
                  [value]="pickList.status"
                  [severity]="getStatusSeverity(pickList.status)"
                ></p-tag>
              </td>
              <td>
                @if (pickList.neededBy) {
                  {{ pickList.neededBy | date:'short' }}
                } @else {
                  -
                }
              </td>
              <td>
                <div class="actions">
                  @if (pickList.status === 'pending') {
                    <button pButton icon="pi pi-play" class="p-button-text p-button-success p-button-sm" pTooltip="Start Picking" (click)="startPicking(pickList)"></button>
                  }
                  @if (pickList.status === 'in_progress') {
                    <button pButton icon="pi pi-list-check" class="p-button-text p-button-sm" pTooltip="Continue Picking" [routerLink]="[pickList.id, 'pick']"></button>
                  }
                  <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Details" [routerLink]="[pickList.id]"></button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="9" class="text-center p-4">No pick lists found</td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .pick-list-page {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
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

    .filters-bar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .pick-lists-table {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .list-number {
      font-weight: 600;
      color: var(--primary-600);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .kit-name {
      display: block;
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .actions {
      display: flex;
      gap: 0.25rem;
    }
  `]
})
export class PickListListComponent implements OnInit {
  private readonly pickListService = inject(PickListService);
  private readonly messageService = inject(MessageService);

  pickLists = signal<PickList[]>([]);
  loading = signal(false);

  selectedStatus: PickListStatus | null = null;
  selectedPriority: PickListPriority | null = null;

  statusOptions = [
    { label: 'Pending', value: PickListStatus.PENDING },
    { label: 'In Progress', value: PickListStatus.IN_PROGRESS },
    { label: 'Completed', value: PickListStatus.COMPLETED },
    { label: 'Cancelled', value: PickListStatus.CANCELLED }
  ];

  priorityOptions = [
    { label: 'Low', value: PickListPriority.LOW },
    { label: 'Normal', value: PickListPriority.NORMAL },
    { label: 'High', value: PickListPriority.HIGH },
    { label: 'Urgent', value: PickListPriority.URGENT }
  ];

  ngOnInit(): void {
    this.loadPickLists();
  }

  loadPickLists(): void {
    this.loading.set(true);
    this.pickListService.getPickLists({
      status: this.selectedStatus || undefined,
      priority: this.selectedPriority || undefined
    }).subscribe({
      next: (response) => {
        this.pickLists.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load pick lists' });
      }
    });
  }

  getStatusSeverity(status: PickListStatus): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case PickListStatus.PENDING: return 'info';
      case PickListStatus.IN_PROGRESS: return 'warn';
      case PickListStatus.COMPLETED: return 'success';
      case PickListStatus.CANCELLED: return 'danger';
      default: return 'secondary';
    }
  }

  getPrioritySeverity(priority: PickListPriority): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (priority) {
      case PickListPriority.LOW: return 'secondary';
      case PickListPriority.NORMAL: return 'info';
      case PickListPriority.HIGH: return 'warn';
      case PickListPriority.URGENT: return 'danger';
      default: return 'secondary';
    }
  }

  startPicking(pickList: PickList): void {
    this.pickListService.startPicking(pickList.id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Picking started' });
        this.loadPickLists();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to start picking' });
      }
    });
  }
}
