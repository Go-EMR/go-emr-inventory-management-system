import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { KitService } from '@core/services/kit.service';
import { ProcedureKit } from '@shared/models';

@Component({
  selector: 'app-kit-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, TagModule, TableModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="kit-detail">
      <div class="page-header">
        <div class="header-left">
          <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/kits']"></button>
          <div class="header-info">
            <h1>{{ kit()?.name }}</h1>
            <p-tag
              [value]="kit()?.isActive ? 'Active' : 'Inactive'"
              [severity]="kit()?.isActive ? 'success' : 'secondary'"
            ></p-tag>
          </div>
        </div>
        <div class="header-actions">
          <button pButton label="Edit" icon="pi pi-pencil" class="p-button-outlined" [routerLink]="['edit']"></button>
          <button pButton label="Create Pick List" icon="pi pi-list"></button>
        </div>
      </div>

      @if (kit()) {
        <div class="detail-grid">
          <div class="info-section">
            <div class="info-card">
              <h3>Kit Information</h3>
              <div class="info-row">
                <span class="label">Description</span>
                <span class="value">{{ kit()?.description || 'No description' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Department</span>
                <span class="value">{{ kit()?.department || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="label">Estimated Cost</span>
                <span class="value">{{ kit()?.estimatedCost | currency }}</span>
              </div>
              <div class="info-row">
                <span class="label">Total Items</span>
                <span class="value">{{ kit()?.items?.length }}</span>
              </div>
            </div>

            @if (availability()) {
              <div class="availability-card" [class.available]="availability()?.available" [class.unavailable]="!availability()?.available">
                <h3>Availability</h3>
                @if (availability()?.available) {
                  <div class="status available">
                    <i class="pi pi-check-circle"></i>
                    <span>All items in stock</span>
                  </div>
                } @else {
                  <div class="status unavailable">
                    <i class="pi pi-exclamation-triangle"></i>
                    <span>Some items unavailable</span>
                  </div>
                  <div class="shortages">
                    @for (shortage of availability()?.shortages; track shortage.itemId) {
                      <div class="shortage-item">
                        <span>{{ shortage.itemName }}</span>
                        <span class="shortage-qty">{{ shortage.available }}/{{ shortage.required }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <div class="items-section">
            <h3>Kit Contents ({{ kit()?.items?.length }} items)</h3>
            <p-table [value]="kit()?.items || []" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Required</th>
                  <th>In Stock</th>
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
                  <td>{{ item.quantity }}</td>
                  <td>
                    @if (item.isRequired) {
                      <i class="pi pi-check text-green-500"></i>
                    } @else {
                      <i class="pi pi-minus text-gray-400"></i>
                    }
                  </td>
                  <td>
                    <span [class.text-red-500]="item.currentStock < item.quantity">{{ item.currentStock }}</span>
                  </td>
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
    .kit-detail {
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

    .info-card, .availability-card {
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
      }
    }

    .availability-card {
      &.available {
        border-color: var(--primary-300);
        background: rgba(16, 185, 129, 0.05);
      }

      &.unavailable {
        border-color: var(--alert-300);
        background: rgba(244, 63, 94, 0.05);
      }
    }

    .status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;

      &.available {
        color: var(--primary-600);
      }

      &.unavailable {
        color: var(--alert-600);
      }

      i {
        font-size: 1.25rem;
      }
    }

    .shortages {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .shortage-item {
      display: flex;
      justify-content: space-between;
      padding: 0.25rem 0;
      font-size: 0.875rem;

      .shortage-qty {
        color: var(--alert-600);
        font-weight: 500;
      }
    }

    .items-section {
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
  `]
})
export class KitDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly kitService = inject(KitService);
  private readonly messageService = inject(MessageService);

  kit = signal<ProcedureKit | null>(null);
  availability = signal<{ available: boolean; shortages: any[] } | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadKit(id);
    }
  }

  loadKit(id: string): void {
    this.kitService.getKit(id).subscribe({
      next: (kit) => {
        this.kit.set(kit);
        this.checkAvailability(id);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load kit' });
      }
    });
  }

  checkAvailability(id: string): void {
    this.kitService.checkKitAvailability(id).subscribe({
      next: (result) => this.availability.set(result)
    });
  }
}
