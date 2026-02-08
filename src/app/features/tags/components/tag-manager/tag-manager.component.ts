import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { TagService } from '@core/services/tag.service';
import { Tag } from '@shared/models';

@Component({
  selector: 'app-tag-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    DialogModule,
    ColorPickerModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="tag-manager">
      <div class="page-header">
        <div class="header-content">
          <h1>Tag Manager</h1>
          <p class="subtitle">Create and manage tags to organize your inventory items</p>
        </div>
        <button pButton label="Create Tag" icon="pi pi-plus" (click)="showCreateDialog()"></button>
      </div>

      <div class="tags-grid">
        @for (tag of tags(); track tag.id) {
          <div class="tag-card">
            <div class="tag-preview" [style.background-color]="tag.color">
              <i class="pi pi-tag"></i>
            </div>
            <div class="tag-info">
              <h3>{{ tag.name }}</h3>
              <p>{{ tag.description || 'No description' }}</p>
              <span class="item-count">{{ tag.itemCount || 0 }} items</span>
            </div>
            <div class="tag-actions">
              <button pButton icon="pi pi-pencil" class="p-button-text p-button-sm" (click)="editTag(tag)"></button>
              <button pButton icon="pi pi-trash" class="p-button-text p-button-danger p-button-sm" (click)="confirmDelete(tag)"></button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <i class="pi pi-tags"></i>
            <h3>No Tags Yet</h3>
            <p>Create your first tag to start organizing inventory items</p>
            <button pButton label="Create Tag" icon="pi pi-plus" (click)="showCreateDialog()"></button>
          </div>
        }
      </div>

      <p-dialog
        [(visible)]="dialogVisible"
        [header]="editingTag ? 'Edit Tag' : 'Create Tag'"
        [modal]="true"
        [style]="{ width: '400px' }"
      >
        <div class="form-group">
          <label for="name">Tag Name *</label>
          <input pInputText id="name" [(ngModel)]="tagForm.name" placeholder="Enter tag name" />
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <input pInputText id="description" [(ngModel)]="tagForm.description" placeholder="Enter description" />
        </div>
        <div class="form-group">
          <label for="color">Color</label>
          <p-colorPicker [(ngModel)]="tagForm.color" [inline]="false"></p-colorPicker>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="dialogVisible = false"></button>
          <button pButton [label]="editingTag ? 'Update' : 'Create'" (click)="saveTag()" [loading]="saving()"></button>
        </ng-template>
      </p-dialog>

      <p-toast></p-toast>
      <p-confirmDialog></p-confirmDialog>
    </div>
  `,
  styles: [`
    .tag-manager {
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
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

    .tags-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }

    .tag-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
    }

    .tag-preview {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.25rem;
    }

    .tag-info {
      flex: 1;
      min-width: 0;
    }

    .tag-info h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1rem;
      color: var(--text-primary);
    }

    .tag-info p {
      margin: 0 0 0.25rem 0;
      font-size: 0.875rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-count {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .tag-actions {
      display: flex;
      gap: 0.25rem;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      background: var(--bg-card);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-lg);
    }

    .empty-state i {
      font-size: 3rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: var(--text-primary);
    }

    .empty-state p {
      margin: 0 0 1.5rem 0;
      color: var(--text-secondary);
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .form-group input {
      width: 100%;
    }
  `]
})
export class TagManagerComponent implements OnInit {
  private readonly tagService = inject(TagService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  tags = signal<Tag[]>([]);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = false;
  editingTag: Tag | null = null;

  tagForm = {
    name: '',
    description: '',
    color: '#10B981'
  };

  ngOnInit(): void {
    this.loadTags();
  }

  loadTags(): void {
    this.loading.set(true);
    this.tagService.getTags().subscribe({
      next: (response) => {
        this.tags.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load tags' });
      }
    });
  }

  showCreateDialog(): void {
    this.editingTag = null;
    this.tagForm = { name: '', description: '', color: '#10B981' };
    this.dialogVisible = true;
  }

  editTag(tag: Tag): void {
    this.editingTag = tag;
    this.tagForm = {
      name: tag.name,
      description: tag.description || '',
      color: tag.color || '#10B981'
    };
    this.dialogVisible = true;
  }

  saveTag(): void {
    if (!this.tagForm.name.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Tag name is required' });
      return;
    }

    this.saving.set(true);

    if (this.editingTag) {
      this.tagService.updateTag(this.editingTag.id, this.tagForm).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Tag updated' });
          this.dialogVisible = false;
          this.loadTags();
          this.saving.set(false);
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update tag' });
        }
      });
    } else {
      this.tagService.createTag(this.tagForm).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Tag created' });
          this.dialogVisible = false;
          this.loadTags();
          this.saving.set(false);
        },
        error: () => {
          this.saving.set(false);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create tag' });
        }
      });
    }
  }

  confirmDelete(tag: Tag): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the tag "${tag.name}"?`,
      header: 'Delete Tag',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.tagService.deleteTag(tag.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Tag deleted' });
            this.loadTags();
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete tag' });
          }
        });
      }
    });
  }
}
