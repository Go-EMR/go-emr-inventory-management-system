import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { Textarea } from 'primeng/textarea';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PickListService, PickListItemInput } from '@core/services/pick-list.service';
import { PickListPriority } from '@shared/models';

@Component({
  selector: 'app-pick-list-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    Textarea,
    TableModule,
    InputNumberModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="pick-list-create">
      <div class="page-header">
        <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/pick-lists']"></button>
        <h1>Create Pick List</h1>
      </div>

      <div class="create-form">
        <div class="form-section">
          <h3>Request Details</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Department</label>
              <input pInputText [(ngModel)]="form.department" placeholder="Enter department" />
            </div>
            <div class="form-group">
              <label>Destination</label>
              <input pInputText [(ngModel)]="form.destination" placeholder="e.g., OR Room 3" />
            </div>
            <div class="form-group">
              <label>Needed By</label>
              <p-datepicker [(ngModel)]="form.neededBy" [showTime]="true" [showIcon]="true"></p-datepicker>
            </div>
            <div class="form-group">
              <label>Priority *</label>
              <p-select
                [options]="priorityOptions"
                [(ngModel)]="form.priority"
                placeholder="Select priority"
              ></p-select>
            </div>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea pTextarea [(ngModel)]="form.notes" rows="3" placeholder="Additional notes"></textarea>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <h3>Items</h3>
            <button pButton label="Add Item" icon="pi pi-plus" class="p-button-outlined p-button-sm" (click)="addItem()"></button>
          </div>

          @if (items().length > 0) {
            <p-table [value]="items()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Notes</th>
                  <th style="width: 60px"></th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-item let-i="rowIndex">
                <tr>
                  <td>
                    <p-select
                      [options]="availableItems"
                      [(ngModel)]="item.itemId"
                      optionLabel="name"
                      optionValue="id"
                      placeholder="Select item"
                      [style]="{'width': '100%'}"
                      [filter]="true"
                    ></p-select>
                  </td>
                  <td>
                    <p-inputNumber [(ngModel)]="item.quantity" [min]="1" [showButtons]="true" [style]="{'width': '100px'}"></p-inputNumber>
                  </td>
                  <td>
                    <input pInputText [(ngModel)]="item.notes" placeholder="Optional notes" />
                  </td>
                  <td>
                    <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="removeItem(i)"></button>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          } @else {
            <div class="empty-items">
              <p>No items added. Click "Add Item" to start.</p>
            </div>
          }
        </div>

        <div class="form-actions">
          <button pButton label="Cancel" class="p-button-outlined" [routerLink]="['/pick-lists']"></button>
          <button pButton label="Create Pick List" (click)="createPickList()" [loading]="saving()" [disabled]="items().length === 0"></button>
        </div>
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .pick-list-create {
      padding: 1.5rem;
      max-width: 900px;
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

    .create-form {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }

    .form-section {
      margin-bottom: 2rem;

      h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        color: var(--text-primary);
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h3 {
        margin: 0;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
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

      input, textarea, :host ::ng-deep .p-select, :host ::ng-deep .p-datepicker {
        width: 100%;
      }
    }

    .empty-items {
      text-align: center;
      padding: 2rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      color: var(--text-muted);
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
export class PickListCreateComponent {
  private readonly router = inject(Router);
  private readonly pickListService = inject(PickListService);
  private readonly messageService = inject(MessageService);

  saving = signal(false);
  items = signal<PickListItemInput[]>([]);

  form = {
    department: '',
    destination: '',
    neededBy: null as Date | null,
    priority: PickListPriority.NORMAL,
    notes: ''
  };

  priorityOptions = [
    { label: 'Low', value: PickListPriority.LOW },
    { label: 'Normal', value: PickListPriority.NORMAL },
    { label: 'High', value: PickListPriority.HIGH },
    { label: 'Urgent', value: PickListPriority.URGENT }
  ];

  availableItems = [
    { id: 'item-1', name: 'Scalpel #10' },
    { id: 'item-2', name: 'Surgical Gloves - Large' },
    { id: 'item-3', name: 'Sutures 3-0' },
    { id: 'item-4', name: 'Sterile Drape' },
    { id: 'item-5', name: 'IV Catheter 18G' },
    { id: 'item-6', name: 'Alcohol Prep Pads' },
    { id: 'item-7', name: 'Gauze 4x4' },
    { id: 'item-8', name: 'Saline Flush' }
  ];

  addItem(): void {
    this.items.update(items => [...items, { itemId: '', quantity: 1 }]);
  }

  removeItem(index: number): void {
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  createPickList(): void {
    const validItems = this.items().filter(i => i.itemId && i.quantity > 0);
    if (validItems.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please add at least one item' });
      return;
    }

    this.saving.set(true);
    this.pickListService.createPickList({
      requesterId: 'current-user',
      department: this.form.department,
      destination: this.form.destination,
      neededBy: this.form.neededBy?.toISOString(),
      priority: this.form.priority,
      items: validItems,
      notes: this.form.notes
    }).subscribe({
      next: (pickList) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Pick list created' });
        this.router.navigate(['/pick-lists', pickList.id]);
      },
      error: () => {
        this.saving.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create pick list' });
      }
    });
  }
}
