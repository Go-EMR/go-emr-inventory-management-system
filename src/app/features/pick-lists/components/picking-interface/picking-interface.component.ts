import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PickListService } from '@core/services/pick-list.service';
import { PickList, PickListItem, PickingProgress } from '@shared/models';

@Component({
  selector: 'app-picking-interface',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputNumberModule,
    InputTextModule,
    TagModule,
    ProgressBarModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="picking-interface">
      <div class="page-header">
        <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/pick-lists', pickListId]"></button>
        <div class="header-info">
          <h1>Picking: {{ pickList()?.pickListNumber }}</h1>
          <span class="destination">{{ pickList()?.destination }}</span>
        </div>
      </div>

      @if (progress()) {
        <div class="progress-bar">
          <div class="progress-info">
            <span>{{ progress()?.pickedItems }} of {{ progress()?.totalItems }} items picked</span>
            <span>{{ progress()?.completionPercentage | number:'1.0-0' }}%</span>
          </div>
          <p-progressBar [value]="progress()?.completionPercentage || 0" [showValue]="false"></p-progressBar>
        </div>
      }

      <div class="items-container">
        @for (item of pickList()?.items || []; track item.id) {
          <div class="pick-item" [class.picked]="item.status === 'picked'" [class.active]="activeItem()?.id === item.id">
            <div class="item-header" (click)="selectItem(item)">
              <div class="item-info">
                <span class="item-name">{{ item.itemName }}</span>
                <span class="item-sku">{{ item.itemSku }}</span>
              </div>
              <div class="item-status">
                @if (item.status === 'picked') {
                  <i class="pi pi-check-circle text-green-500"></i>
                } @else if (item.status === 'partially_picked') {
                  <i class="pi pi-minus-circle text-yellow-500"></i>
                } @else {
                  <i class="pi pi-circle text-gray-400"></i>
                }
              </div>
            </div>

            @if (activeItem()?.id === item.id) {
              <div class="item-form">
                <div class="quantity-section">
                  <label>Quantity to Pick</label>
                  <div class="quantity-input">
                    <p-inputNumber
                      [(ngModel)]="pickQuantity"
                      [min]="0"
                      [max]="item.quantityRequested"
                      [showButtons]="true"
                    ></p-inputNumber>
                    <span class="quantity-hint">of {{ item.quantityRequested }} requested</span>
                  </div>
                </div>

                <div class="lot-section">
                  <label>Lot Number (optional)</label>
                  <input pInputText [(ngModel)]="pickLotNumber" placeholder="Enter lot number" />
                </div>

                <div class="notes-section">
                  <label>Notes (optional)</label>
                  <input pInputText [(ngModel)]="pickNotes" placeholder="Any notes" />
                </div>

                <div class="form-actions">
                  <button pButton label="Mark Out of Stock" class="p-button-outlined p-button-danger" (click)="markOutOfStock(item)"></button>
                  <button pButton label="Confirm Pick" icon="pi pi-check" (click)="confirmPick(item)" [loading]="picking()"></button>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <div class="complete-section">
        <button
          pButton
          label="Complete Pick List"
          icon="pi pi-flag-fill"
          class="p-button-lg"
          (click)="confirmComplete()"
          [disabled]="!canComplete()"
        ></button>
      </div>

      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .picking-interface {
      padding: 1.5rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .header-info {
      h1 {
        margin: 0;
        font-size: 1.25rem;
        color: var(--text-primary);
      }

      .destination {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    .progress-bar {
      margin-bottom: 1.5rem;

      .progress-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }

    .items-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .pick-item {
      background: var(--bg-card);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: all var(--transition-fast);

      &.picked {
        opacity: 0.6;
        border-color: var(--primary-300);
      }

      &.active {
        border-color: var(--primary-500);
      }
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      cursor: pointer;

      &:hover {
        background: var(--bg-hover);
      }
    }

    .item-info {
      display: flex;
      flex-direction: column;

      .item-name {
        font-weight: 600;
        color: var(--text-primary);
      }

      .item-sku {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .item-status i {
      font-size: 1.5rem;
    }

    .item-form {
      padding: 1rem;
      border-top: 1px solid var(--border-color);
      background: var(--bg-secondary);
      display: flex;
      flex-direction: column;
      gap: 1rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      input {
        width: 100%;
      }
    }

    .quantity-input {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .quantity-hint {
        font-size: 0.875rem;
        color: var(--text-muted);
      }
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      padding-top: 0.5rem;
    }

    .complete-section {
      margin-top: 2rem;
      text-align: center;
    }
  `]
})
export class PickingInterfaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pickListService = inject(PickListService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  pickListId = '';
  pickList = signal<PickList | null>(null);
  progress = signal<PickingProgress | null>(null);
  activeItem = signal<PickListItem | null>(null);
  picking = signal(false);

  pickQuantity = 0;
  pickLotNumber = '';
  pickNotes = '';

  ngOnInit(): void {
    this.pickListId = this.route.snapshot.paramMap.get('id') || '';
    if (this.pickListId) {
      this.loadPickList();
    }
  }

  loadPickList(): void {
    this.pickListService.getPickList(this.pickListId).subscribe({
      next: (pickList) => {
        this.pickList.set(pickList);
        this.loadProgress();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load pick list' });
      }
    });
  }

  loadProgress(): void {
    this.pickListService.getPickingProgress(this.pickListId).subscribe({
      next: (progress) => this.progress.set(progress)
    });
  }

  selectItem(item: PickListItem): void {
    if (item.status === 'picked') return;

    this.activeItem.set(item);
    this.pickQuantity = item.quantityRequested;
    this.pickLotNumber = '';
    this.pickNotes = '';
  }

  confirmPick(item: PickListItem): void {
    if (this.pickQuantity <= 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please enter a quantity' });
      return;
    }

    this.picking.set(true);
    this.pickListService.pickItem(this.pickListId, item.itemId, {
      quantityPicked: this.pickQuantity,
      lotNumber: this.pickLotNumber || undefined,
      notes: this.pickNotes || undefined
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Item picked' });
        this.activeItem.set(null);
        this.loadPickList();
        this.picking.set(false);
      },
      error: () => {
        this.picking.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to pick item' });
      }
    });
  }

  markOutOfStock(item: PickListItem): void {
    this.picking.set(true);
    this.pickListService.pickItem(this.pickListId, item.itemId, {
      quantityPicked: 0,
      notes: 'Out of stock'
    }).subscribe({
      next: () => {
        this.messageService.add({ severity: 'info', summary: 'Marked', detail: 'Item marked as out of stock' });
        this.activeItem.set(null);
        this.loadPickList();
        this.picking.set(false);
      },
      error: () => {
        this.picking.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update item' });
      }
    });
  }

  canComplete(): boolean {
    const items = this.pickList()?.items || [];
    return items.every(i => i.status !== 'pending');
  }

  confirmComplete(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to complete this pick list?',
      header: 'Complete Pick List',
      icon: 'pi pi-check',
      accept: () => {
        this.pickListService.completePickList(this.pickListId).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Pick list completed' });
            this.router.navigate(['/pick-lists', this.pickListId]);
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to complete pick list' });
          }
        });
      }
    });
  }
}
