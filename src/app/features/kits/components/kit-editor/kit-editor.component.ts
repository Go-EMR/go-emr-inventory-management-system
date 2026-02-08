import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { KitService, KitItemInput } from '@core/services/kit.service';
import { ProcedureKit } from '@shared/models';

@Component({
  selector: 'app-kit-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    InputTextModule,
    Textarea,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    TableModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="kit-editor">
      <div class="page-header">
        <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/kits']"></button>
        <h1>{{ isEdit ? 'Edit Kit' : 'Create Kit' }}</h1>
      </div>

      <div class="editor-form">
        <div class="form-section">
          <h3>Basic Information</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Kit Name *</label>
              <input pInputText [(ngModel)]="form.name" placeholder="Enter kit name" />
            </div>
            <div class="form-group">
              <label>Department</label>
              <input pInputText [(ngModel)]="form.department" placeholder="Enter department" />
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea pTextarea [(ngModel)]="form.description" rows="3" placeholder="Kit description"></textarea>
          </div>
          <div class="form-group">
            <label>Estimated Cost</label>
            <p-inputNumber [(ngModel)]="form.estimatedCost" mode="currency" currency="INR" locale="en-IN"></p-inputNumber>
          </div>
        </div>

        <div class="form-section">
          <div class="section-header">
            <h3>Kit Items</h3>
            <button pButton label="Add Item" icon="pi pi-plus" class="p-button-outlined p-button-sm" (click)="addItem()"></button>
          </div>

          @if (items().length > 0) {
            <p-table [value]="items()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>Item</th>
                  <th style="width: 120px">Quantity</th>
                  <th style="width: 100px">Required</th>
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
                    <p-inputNumber [(ngModel)]="item.quantity" [min]="1" [showButtons]="true" [style]="{'width': '100%'}"></p-inputNumber>
                  </td>
                  <td class="text-center">
                    <p-checkbox [(ngModel)]="item.isRequired" [binary]="true"></p-checkbox>
                  </td>
                  <td>
                    <input pInputText [(ngModel)]="item.notes" placeholder="Optional" style="width: 100%" />
                  </td>
                  <td>
                    <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="removeItem(i)"></button>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          } @else {
            <div class="empty-items">
              <p>No items added yet. Click "Add Item" to start building your kit.</p>
            </div>
          }
        </div>

        <div class="form-actions">
          <button pButton label="Cancel" class="p-button-outlined" [routerLink]="['/kits']"></button>
          <button pButton [label]="isEdit ? 'Save Changes' : 'Create Kit'" (click)="save()" [loading]="saving()"></button>
        </div>
      </div>

      <p-toast></p-toast>
    </div>
  `,
  styles: [`
    .kit-editor {
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

    .editor-form {
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

      input, textarea, :host ::ng-deep .p-select, :host ::ng-deep .p-inputnumber {
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
export class KitEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly kitService = inject(KitService);
  private readonly messageService = inject(MessageService);

  isEdit = false;
  kitId = '';
  saving = signal(false);
  items = signal<KitItemInput[]>([]);

  form = {
    name: '',
    description: '',
    department: '',
    estimatedCost: 0
  };

  availableItems = [
    { id: 'item-1', name: 'Scalpel #10' },
    { id: 'item-2', name: 'Surgical Gloves - Large' },
    { id: 'item-3', name: 'Sutures 3-0' },
    { id: 'item-4', name: 'Sterile Drape' },
    { id: 'item-5', name: 'IV Catheter 18G' },
    { id: 'item-6', name: 'Alcohol Prep Pads' },
    { id: 'item-7', name: 'Gauze 4x4' },
    { id: 'item-8', name: 'Saline Flush' },
    { id: 'item-9', name: 'Syringe 10ml' },
    { id: 'item-10', name: 'Needle 22G' }
  ];

  ngOnInit(): void {
    this.kitId = this.route.snapshot.paramMap.get('id') || '';
    this.isEdit = !!this.kitId;

    if (this.isEdit) {
      this.loadKit();
    }
  }

  loadKit(): void {
    this.kitService.getKit(this.kitId).subscribe({
      next: (kit) => {
        this.form = {
          name: kit.name,
          description: kit.description || '',
          department: kit.department || '',
          estimatedCost: kit.estimatedCost || 0
        };
        this.items.set(kit.items.map(i => ({
          itemId: i.itemId,
          quantity: i.quantity,
          isRequired: i.isRequired,
          notes: i.notes
        })));
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load kit' });
      }
    });
  }

  addItem(): void {
    this.items.update(items => [...items, { itemId: '', quantity: 1, isRequired: true }]);
  }

  removeItem(index: number): void {
    this.items.update(items => items.filter((_, i) => i !== index));
  }

  save(): void {
    if (!this.form.name.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Kit name is required' });
      return;
    }

    const validItems = this.items().filter(i => i.itemId && i.quantity > 0);
    if (validItems.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Add at least one item' });
      return;
    }

    this.saving.set(true);

    if (this.isEdit) {
      this.kitService.updateKit(this.kitId, this.form).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Kit updated' });
          this.router.navigate(['/kits', this.kitId]);
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update kit' });
        }
      });
    } else {
      this.kitService.createKit({ ...this.form, items: validItems }).subscribe({
        next: (kit) => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Kit created' });
          this.router.navigate(['/kits', kit.id]);
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create kit' });
        }
      });
    }
  }
}
