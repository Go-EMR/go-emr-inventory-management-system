import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HelpdeskService, CreateTicketRequest } from '@core/services/helpdesk.service';
import { MockDataService } from '@core/services/mock-data.service';
import { TicketPriority, TicketCategory } from '@shared/models';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    AutoCompleteModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <div class="ticket-create-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button pButton
            icon="pi pi-arrow-left"
            class="p-button-text p-button-secondary"
            [routerLink]="['/helpdesk']"
          ></button>
          <h1>Create New Ticket</h1>
        </div>
      </div>

      <!-- Form -->
      <p-card styleClass="form-card">
        <form (ngSubmit)="onSubmit()" #ticketForm="ngForm">
          <div class="form-grid">
            <!-- Subject -->
            <div class="form-field full-width">
              <label for="subject">Subject <span class="required">*</span></label>
              <input
                pInputText
                id="subject"
                name="subject"
                [(ngModel)]="formData.subject"
                placeholder="Brief description of the issue"
                required
                class="w-full"
              />
            </div>

            <!-- Category -->
            <div class="form-field">
              <label for="category">Category <span class="required">*</span></label>
              <p-select
                id="category"
                name="category"
                [options]="categoryOptions"
                [(ngModel)]="formData.category"
                placeholder="Select category"
                required
                styleClass="w-full"
              />
            </div>

            <!-- Priority -->
            <div class="form-field">
              <label for="priority">Priority <span class="required">*</span></label>
              <p-select
                id="priority"
                name="priority"
                [options]="priorityOptions"
                [(ngModel)]="formData.priority"
                placeholder="Select priority"
                required
                styleClass="w-full"
              />
            </div>

            <!-- Related Equipment -->
            <div class="form-field">
              <label for="equipment">Related Equipment</label>
              <p-select
                id="equipment"
                name="relatedEquipmentId"
                [options]="equipmentOptions"
                [(ngModel)]="formData.relatedEquipmentId"
                placeholder="Select equipment (optional)"
                [showClear]="true"
                [filter]="true"
                filterPlaceholder="Search equipment..."
                styleClass="w-full"
              />
            </div>

            <!-- Related Inventory -->
            <div class="form-field">
              <label for="inventory">Related Inventory Item</label>
              <p-select
                id="inventory"
                name="relatedInventoryItemId"
                [options]="inventoryOptions"
                [(ngModel)]="formData.relatedInventoryItemId"
                placeholder="Select inventory item (optional)"
                [showClear]="true"
                [filter]="true"
                filterPlaceholder="Search inventory..."
                styleClass="w-full"
              />
            </div>

            <!-- Description -->
            <div class="form-field full-width">
              <label for="description">Description <span class="required">*</span></label>
              <textarea
                pTextarea
                id="description"
                name="description"
                [(ngModel)]="formData.description"
                placeholder="Provide detailed information about your request..."
                required
                [rows]="6"
                class="w-full"
              ></textarea>
              <small class="hint">Include any relevant details such as error messages, steps to reproduce, or specific requirements.</small>
            </div>

            <!-- Tags -->
            <div class="form-field full-width">
              <label for="tags">Tags</label>
              <p-autoComplete
                id="tags"
                name="tags"
                [(ngModel)]="formData.tags"
                [multiple]="true"
                placeholder="Add tags (press Enter)"
              />
              <small class="hint">Add tags to help categorize and find this ticket later.</small>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button pButton
              type="button"
              label="Cancel"
              icon="pi pi-times"
              class="p-button-outlined p-button-secondary"
              [routerLink]="['/helpdesk']"
            ></button>
            <button pButton
              type="submit"
              label="Create Ticket"
              icon="pi pi-check"
              [loading]="isSubmitting"
              [disabled]="ticketForm.invalid"
            ></button>
          </div>
        </form>
      </p-card>

      <!-- Help Section -->
      <div class="help-section">
        <h3><i class="pi pi-info-circle"></i> Tips for submitting a ticket</h3>
        <ul>
          <li><strong>Be specific:</strong> Include all relevant details about your issue or request.</li>
          <li><strong>Choose the right category:</strong> This helps route your ticket to the appropriate team.</li>
          <li><strong>Set priority appropriately:</strong> Use "Urgent" only for critical issues affecting patient care or safety.</li>
          <li><strong>Link related items:</strong> If your issue relates to specific equipment or inventory, link them for faster resolution.</li>
        </ul>
      </div>
    </div>

    <p-toast />
  `,
  styles: [`
    .ticket-create-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .header-left h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    :host ::ng-deep .form-card {
      .p-card-body {
        padding: 1.5rem;
      }
      .p-card-content {
        padding: 0;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .form-field label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .required {
      color: var(--alert-500);
    }

    .hint {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .help-section {
      background: var(--bg-card);
      padding: 1.25rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
    }

    .help-section h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 1rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .help-section h3 i {
      color: var(--primary-600);
    }

    .help-section ul {
      margin: 0;
      padding-left: 1.25rem;
    }

    .help-section li {
      margin-bottom: 0.5rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .help-section li:last-child {
      margin-bottom: 0;
    }

    .help-section strong {
      color: var(--text-primary);
    }
  `]
})
export class TicketCreateComponent {
  private router = inject(Router);
  private messageService = inject(MessageService);
  helpdeskService = inject(HelpdeskService);
  mockDataService = inject(MockDataService);

  formData: CreateTicketRequest = {
    subject: '',
    description: '',
    category: TicketCategory.GENERAL_INQUIRY,
    priority: TicketPriority.MEDIUM,
    tags: []
  };

  isSubmitting = false;

  categoryOptions = Object.values(TicketCategory).map(c => ({ label: c, value: c }));
  priorityOptions = Object.values(TicketPriority).map(p => ({ label: p, value: p }));

  equipmentOptions = this.mockDataService.equipment().map(e => ({
    label: `${e.name} (${e.inventoryNumber})`,
    value: e.id
  }));

  inventoryOptions = this.mockDataService.inventory().map((i: any) => ({
    label: `${i.name} (${i.sku})`,
    value: i.id
  }));

  onSubmit(): void {
    if (!this.formData.subject || !this.formData.description) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields'
      });
      return;
    }

    this.isSubmitting = true;

    this.helpdeskService.createTicket(this.formData).subscribe({
      next: (ticket) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Ticket Created',
          detail: `Ticket ${ticket.ticketNumber} has been created successfully`
        });
        setTimeout(() => {
          this.router.navigate(['/helpdesk', ticket.id]);
        }, 1000);
      },
      error: () => {
        this.isSubmitting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to create ticket. Please try again.'
        });
      }
    });
  }
}
