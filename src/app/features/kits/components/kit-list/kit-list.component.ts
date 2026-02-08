import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { KitService } from '@core/services/kit.service';
import { ProcedureKit } from '@shared/models';

@Component({
  selector: 'app-kit-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    TableModule,
    TagModule,
    InputTextModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="kit-list">
      <div class="page-header">
        <div class="header-content">
          <h1>Procedure Kits</h1>
          <p class="subtitle">Pre-defined item collections for common procedures</p>
        </div>
        <button pButton label="Create Kit" icon="pi pi-plus" [routerLink]="['new']"></button>
      </div>

      <div class="search-bar">
        <span class="p-input-icon-left">
          <i class="pi pi-search"></i>
          <input pInputText [(ngModel)]="searchTerm" placeholder="Search kits..." (input)="loadKits()" />
        </span>
      </div>

      <div class="kits-grid">
        @for (kit of kits(); track kit.id) {
          <div class="kit-card">
            <div class="kit-header">
              <h3>{{ kit.name }}</h3>
              <p-tag
                [value]="kit.isActive ? 'Active' : 'Inactive'"
                [severity]="kit.isActive ? 'success' : 'secondary'"
              ></p-tag>
            </div>
            <p class="kit-description">{{ kit.description || 'No description' }}</p>

            <div class="kit-stats">
              <div class="stat">
                <span class="stat-value">{{ kit.items.length }}</span>
                <span class="stat-label">Items</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ kit.estimatedCost | currency }}</span>
                <span class="stat-label">Est. Cost</span>
              </div>
            </div>

            @if (kit.department) {
              <div class="kit-department">
                <i class="pi pi-building"></i>
                {{ kit.department }}
              </div>
            }

            <div class="kit-actions">
              <button pButton icon="pi pi-eye" class="p-button-text p-button-sm" pTooltip="View Details" [routerLink]="[kit.id]"></button>
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" pTooltip="Edit" [routerLink]="[kit.id, 'edit']"></button>
              <button pButton icon="pi pi-copy" class="p-button-text p-button-sm" pTooltip="Clone" (click)="cloneKit(kit)"></button>
              <button pButton icon="pi pi-list" class="p-button-text p-button-success p-button-sm" pTooltip="Create Pick List" (click)="createPickList(kit)"></button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <i class="pi pi-box"></i>
            <h3>No Kits Found</h3>
            <p>Create your first procedure kit to streamline inventory picking</p>
            <button pButton label="Create Kit" icon="pi pi-plus" [routerLink]="['new']"></button>
          </div>
        }
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .kit-list {
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

    .search-bar {
      margin-bottom: 1.5rem;

      input {
        width: 300px;
      }
    }

    .kits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1rem;
    }

    .kit-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
    }

    .kit-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;

      h3 {
        margin: 0;
        font-size: 1.125rem;
        color: var(--text-primary);
      }
    }

    .kit-description {
      margin: 0 0 1rem 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .kit-stats {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;

      .stat {
        display: flex;
        flex-direction: column;

        .stat-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
      }
    }

    .kit-department {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin-bottom: 1rem;
    }

    .kit-actions {
      display: flex;
      gap: 0.25rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      background: var(--bg-card);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-lg);

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
export class KitListComponent implements OnInit {
  private readonly kitService = inject(KitService);
  private readonly messageService = inject(MessageService);

  kits = signal<ProcedureKit[]>([]);
  loading = signal(false);
  searchTerm = '';

  ngOnInit(): void {
    this.loadKits();
  }

  loadKits(): void {
    this.loading.set(true);
    this.kitService.getKits({ search: this.searchTerm || undefined }).subscribe({
      next: (response) => {
        this.kits.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load kits' });
      }
    });
  }

  cloneKit(kit: ProcedureKit): void {
    const newName = `${kit.name} (Copy)`;
    this.kitService.cloneKit(kit.id, newName).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Kit cloned' });
        this.loadKits();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to clone kit' });
      }
    });
  }

  createPickList(kit: ProcedureKit): void {
    // Navigate to pick list creation with kit pre-selected
    this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Navigate to create pick list from kit' });
  }
}
