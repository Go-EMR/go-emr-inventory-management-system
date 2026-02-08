import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ChipModule } from 'primeng/chip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { TenantService } from '@core/services/tenant.service';
import { TenantUser, TenantRole, UserTenantMembership } from '@shared/models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DialogModule,
    TagModule,
    AvatarModule,
    MenuModule,
    ToastModule,
    ConfirmDialogModule,
    ChipModule,
    IconFieldModule,
    InputIconModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <div class="user-management-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-info">
            <div class="header-icon">
              <i class="pi pi-users"></i>
            </div>
            <div class="header-text">
              <h1>User Management</h1>
              <p>Manage team members and their access permissions</p>
            </div>
          </div>
          <div class="header-actions">
            <p-button
              label="Invite User"
              icon="pi pi-user-plus"
              (onClick)="showInviteDialog = true"
            ></p-button>
          </div>
        </div>
      </div>

      <div class="page-content">
        <!-- Stats Overview -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon total">
              <i class="pi pi-users"></i>
            </div>
            <div class="stat-details">
              <span class="stat-value">{{ totalUsers() }}</span>
              <span class="stat-label">Total Users</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon active">
              <i class="pi pi-check-circle"></i>
            </div>
            <div class="stat-details">
              <span class="stat-value">{{ activeUsers() }}</span>
              <span class="stat-label">Active</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon pending">
              <i class="pi pi-clock"></i>
            </div>
            <div class="stat-details">
              <span class="stat-value">{{ pendingInvites() }}</span>
              <span class="stat-label">Pending Invites</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon admin">
              <i class="pi pi-shield"></i>
            </div>
            <div class="stat-details">
              <span class="stat-value">{{ adminCount() }}</span>
              <span class="stat-label">Administrators</span>
            </div>
          </div>
        </div>

        <!-- Users Section -->
        <div class="users-section">
          <div class="section-header">
            <h2>Team Members</h2>
            <div class="section-controls">
              <p-iconField iconPosition="left" class="search-field">
                <p-inputIcon styleClass="pi pi-search"></p-inputIcon>
                <input
                  pInputText
                  [(ngModel)]="searchQuery"
                  placeholder="Search by name or email..."
                />
              </p-iconField>

              <p-select
                [(ngModel)]="roleFilter"
                [options]="roleOptions"
                placeholder="All Roles"
                [showClear]="true"
                styleClass="role-filter"
              ></p-select>
            </div>
          </div>

          <!-- Users List -->
          <div class="users-list">
            @for (user of filteredUsers(); track user.id) {
              <div class="user-card" [class.inactive]="user.status !== 'active'">
                <div class="user-main">
                  <div class="user-avatar">
                    <p-avatar
                      [label]="getUserInitials(user)"
                      [style]="{ 'background-color': getAvatarColor(user), 'color': '#ffffff' }"
                      shape="circle"
                      size="large"
                    ></p-avatar>
                    @if (user.status === 'active') {
                      <span class="status-dot online"></span>
                    }
                  </div>
                  <div class="user-info">
                    <div class="user-name">{{ user.displayName }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </div>

                <div class="user-meta">
                  <div class="meta-item role">
                    <span class="role-badge" [class]="'role-' + user.role.toLowerCase().replace('_', '-')">
                      {{ getRoleLabel(user.role) }}
                    </span>
                  </div>
                  <div class="meta-item status">
                    <span class="status-badge" [class]="'status-' + user.status">
                      {{ user.status | titlecase }}
                    </span>
                  </div>
                  <div class="meta-item activity">
                    <i class="pi pi-clock"></i>
                    <span>{{ user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never logged in' }}</span>
                  </div>
                </div>

                <div class="user-actions">
                  <p-button
                    icon="pi pi-ellipsis-h"
                    [rounded]="true"
                    [text]="true"
                    severity="secondary"
                    (onClick)="userMenu.toggle($event); selectedUser = user"
                  ></p-button>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <div class="empty-icon">
                  <i class="pi pi-users"></i>
                </div>
                <h3>No users found</h3>
                <p>{{ searchQuery || roleFilter ? 'Try adjusting your filters' : 'Invite team members to get started' }}</p>
                @if (!searchQuery && !roleFilter) {
                  <p-button
                    label="Invite First User"
                    icon="pi pi-user-plus"
                    (onClick)="showInviteDialog = true"
                  ></p-button>
                }
              </div>
            }
          </div>

          <!-- Pagination Info -->
          @if (filteredUsers().length > 0) {
            <div class="list-footer">
              <span class="user-count">Showing {{ filteredUsers().length }} of {{ totalUsers() }} users</span>
            </div>
          }
        </div>
      </div>

      <!-- User Action Menu -->
      <p-menu #userMenu [model]="userMenuItems" [popup]="true" [appendTo]="'body'" styleClass="user-actions-menu"></p-menu>

      <!-- Invite User Dialog -->
      <p-dialog
        [(visible)]="showInviteDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
        [draggable]="false"
        [resizable]="false"
        styleClass="invite-dialog"
      >
        <ng-template pTemplate="header">
          <div class="dialog-header">
            <div class="dialog-icon">
              <i class="pi pi-user-plus"></i>
            </div>
            <div class="dialog-title">
              <h3>Invite Team Member</h3>
              <p>Send an invitation to join your organization</p>
            </div>
          </div>
        </ng-template>

        <div class="dialog-content">
          <div class="form-field">
            <label for="inviteEmail">Email Address</label>
            <input
              pInputText
              id="inviteEmail"
              [(ngModel)]="inviteForm.email"
              type="email"
              class="w-full"
              placeholder="colleague@company.com"
            />
          </div>

          <div class="form-field">
            <label for="inviteName">Full Name</label>
            <input
              pInputText
              id="inviteName"
              [(ngModel)]="inviteForm.name"
              class="w-full"
              placeholder="John Doe"
            />
          </div>

          <div class="form-field">
            <label for="inviteRole">Role</label>
            <p-select
              id="inviteRole"
              [(ngModel)]="inviteForm.role"
              [options]="assignableRoles"
              placeholder="Select a role"
              styleClass="w-full"
            ></p-select>
          </div>

          @if (inviteForm.role) {
            <div class="permissions-box">
              <div class="permissions-header">
                <i class="pi pi-shield"></i>
                <span>Role Permissions</span>
              </div>
              <ul class="permissions-list">
                @if (inviteForm.role === TenantRole.TENANT_ADMIN) {
                  <li><i class="pi pi-check"></i> Full access to all features</li>
                  <li><i class="pi pi-check"></i> Manage users and roles</li>
                  <li><i class="pi pi-check"></i> Configure organization settings</li>
                  <li><i class="pi pi-check"></i> View all reports and analytics</li>
                } @else if (inviteForm.role === TenantRole.MANAGER) {
                  <li><i class="pi pi-check"></i> Manage equipment and inventory</li>
                  <li><i class="pi pi-check"></i> Create and assign work orders</li>
                  <li><i class="pi pi-check"></i> View department reports</li>
                  <li><i class="pi pi-check"></i> Approve requests and checkouts</li>
                } @else if (inviteForm.role === TenantRole.STAFF) {
                  <li><i class="pi pi-check"></i> View equipment and inventory</li>
                  <li><i class="pi pi-check"></i> Submit requests and checkouts</li>
                  <li><i class="pi pi-check"></i> Update assigned work orders</li>
                  <li><i class="pi pi-check"></i> View personal activity</li>
                } @else if (inviteForm.role === TenantRole.VIEWER) {
                  <li><i class="pi pi-eye"></i> View-only access to equipment</li>
                  <li><i class="pi pi-eye"></i> View-only access to inventory</li>
                  <li><i class="pi pi-times"></i> No edit or create permissions</li>
                }
              </ul>
            </div>
          }
        </div>

        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              (onClick)="showInviteDialog = false"
            ></p-button>
            <p-button
              label="Send Invitation"
              icon="pi pi-send"
              (onClick)="sendInvitation()"
              [loading]="inviting()"
              [disabled]="!inviteForm.email || !inviteForm.role"
            ></p-button>
          </div>
        </ng-template>
      </p-dialog>

      <!-- Change Role Dialog -->
      <p-dialog
        [(visible)]="showRoleDialog"
        [modal]="true"
        [style]="{ width: '450px' }"
        [draggable]="false"
        [resizable]="false"
        styleClass="role-dialog"
      >
        <ng-template pTemplate="header">
          <div class="dialog-header">
            <div class="dialog-icon edit">
              <i class="pi pi-user-edit"></i>
            </div>
            <div class="dialog-title">
              <h3>Change Role</h3>
              <p>Update user permissions</p>
            </div>
          </div>
        </ng-template>

        @if (selectedUser) {
          <div class="dialog-content">
            <div class="user-preview">
              <p-avatar
                [label]="getUserInitials(selectedUser)"
                [style]="{ 'background-color': getAvatarColor(selectedUser), 'color': '#ffffff' }"
                shape="circle"
                size="large"
              ></p-avatar>
              <div class="user-preview-info">
                <span class="name">{{ selectedUser.displayName }}</span>
                <span class="email">{{ selectedUser.email }}</span>
              </div>
            </div>

            <div class="form-field">
              <label for="newRole">New Role</label>
              <p-select
                id="newRole"
                [(ngModel)]="newRole"
                [options]="assignableRoles"
                placeholder="Select a role"
                styleClass="w-full"
              ></p-select>
            </div>
          </div>
        }

        <ng-template pTemplate="footer">
          <div class="dialog-footer">
            <p-button
              label="Cancel"
              severity="secondary"
              [outlined]="true"
              (onClick)="showRoleDialog = false"
            ></p-button>
            <p-button
              label="Update Role"
              icon="pi pi-check"
              (onClick)="updateUserRole()"
              [loading]="updating()"
            ></p-button>
          </div>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .user-management-page {
      min-height: 100%;
      background: var(--surface-ground);
    }

    /* Page Header */
    .page-header {
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
      padding: 1.5rem 2rem;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      border-radius: 1rem;
      background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-50) 100%);
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.5rem;
        color: var(--primary-600);
      }
    }

    .header-text {
      h1 {
        margin: 0 0 0.25rem 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-color);
      }

      p {
        margin: 0;
        color: var(--text-color-secondary);
        font-size: 0.9375rem;
      }
    }

    /* Page Content */
    .page-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1.5rem 2rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 0.75rem;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        transform: translateY(-2px);
      }
    }

    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        font-size: 1.25rem;
      }

      &.total {
        background: var(--primary-50);
        i { color: var(--primary-600); }
      }

      &.active {
        background: var(--green-50);
        i { color: var(--green-600); }
      }

      &.pending {
        background: var(--yellow-50);
        i { color: var(--yellow-600); }
      }

      &.admin {
        background: var(--blue-50);
        i { color: var(--blue-600); }
      }
    }

    .stat-details {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color);
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
      margin-top: 0.125rem;
    }

    /* Users Section */
    .users-section {
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: 0.75rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--surface-border);

      h2 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-color);
      }
    }

    .section-controls {
      display: flex;
      gap: 0.75rem;
    }

    .search-field {
      :host ::ng-deep input {
        width: 280px;
      }
    }

    :host ::ng-deep .role-filter {
      width: 150px;
    }

    /* Users List */
    .users-list {
      padding: 0.5rem;
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-radius: 0.5rem;
      transition: background 0.15s;

      &:hover {
        background: var(--surface-hover);
      }

      &.inactive {
        opacity: 0.7;
      }
    }

    .user-main {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      flex: 1;
      min-width: 0;
    }

    .user-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .status-dot {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid var(--surface-card);

      &.online {
        background: var(--green-500);
      }
    }

    .user-info {
      min-width: 0;
    }

    .user-name {
      font-weight: 600;
      color: var(--text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-meta {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &.activity {
        font-size: 0.8125rem;
        color: var(--text-color-secondary);
        min-width: 140px;

        i {
          font-size: 0.75rem;
        }
      }
    }

    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;

      &.role-super-admin {
        background: var(--red-100);
        color: var(--red-700);
      }

      &.role-tenant-admin {
        background: var(--purple-100);
        color: var(--purple-700);
      }

      &.role-manager {
        background: var(--blue-100);
        color: var(--blue-700);
      }

      &.role-staff {
        background: var(--green-100);
        color: var(--green-700);
      }

      &.role-viewer {
        background: var(--gray-100);
        color: var(--gray-700);
      }
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;

      &.status-active {
        background: var(--green-100);
        color: var(--green-700);
      }

      &.status-inactive {
        background: var(--yellow-100);
        color: var(--yellow-700);
      }

      &.status-suspended {
        background: var(--red-100);
        color: var(--red-700);
      }
    }

    .user-actions {
      flex-shrink: 0;
    }

    /* Empty State */
    .empty-state {
      padding: 4rem 2rem;
      text-align: center;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--surface-ground);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;

      i {
        font-size: 2rem;
        color: var(--text-color-secondary);
      }
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-color);
    }

    .empty-state p {
      margin: 0 0 1.5rem 0;
      color: var(--text-color-secondary);
    }

    .list-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--surface-border);
    }

    .user-count {
      font-size: 0.8125rem;
      color: var(--text-color-secondary);
    }

    /* User Actions Menu */
    :host ::ng-deep .user-actions-menu {
      min-width: 180px;

      .p-menuitem-link {
        padding: 0.75rem 1rem;
      }
    }

    /* Dialog Styles */
    :host ::ng-deep .invite-dialog,
    :host ::ng-deep .role-dialog {
      .p-dialog-header {
        padding: 0;
        border-bottom: none;
      }

      .p-dialog-content {
        padding: 0;
      }

      .p-dialog-footer {
        padding: 0;
        border-top: none;
      }
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .dialog-icon {
      width: 48px;
      height: 48px;
      border-radius: 0.75rem;
      background: var(--primary-50);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        font-size: 1.25rem;
        color: var(--primary-600);
      }

      &.edit {
        background: var(--blue-50);
        i { color: var(--blue-600); }
      }
    }

    .dialog-title {
      h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-color);
      }

      p {
        margin: 0;
        font-size: 0.8125rem;
        color: var(--text-color-secondary);
      }
    }

    .dialog-content {
      padding: 1.5rem;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: var(--surface-ground);
      border-top: 1px solid var(--surface-border);
    }

    .form-field {
      margin-bottom: 1.25rem;

      &:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-color);
      }
    }

    .permissions-box {
      background: var(--surface-ground);
      border: 1px solid var(--surface-border);
      border-radius: 0.5rem;
      overflow: hidden;
      margin-top: 1rem;
    }

    .permissions-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--surface-50);
      border-bottom: 1px solid var(--surface-border);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-color);

      i {
        color: var(--primary-600);
      }
    }

    .permissions-list {
      list-style: none;
      padding: 0.75rem 1rem;
      margin: 0;

      li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0;
        font-size: 0.8125rem;
        color: var(--text-color-secondary);

        i {
          font-size: 0.75rem;

          &.pi-check {
            color: var(--green-600);
          }

          &.pi-eye {
            color: var(--blue-600);
          }

          &.pi-times {
            color: var(--red-500);
          }
        }
      }
    }

    .user-preview {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-ground);
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .user-preview-info {
      display: flex;
      flex-direction: column;

      .name {
        font-weight: 600;
        color: var(--text-color);
      }

      .email {
        font-size: 0.8125rem;
        color: var(--text-color-secondary);
      }
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .user-meta {
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      .meta-item.activity {
        min-width: auto;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;

        :host ::ng-deep .p-button {
          width: 100%;
        }
      }

      .page-content {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }

      .stat-card {
        padding: 1rem;
      }

      .stat-icon {
        width: 44px;
        height: 44px;
      }

      .stat-value {
        font-size: 1.25rem;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .section-controls {
        width: 100%;
        flex-direction: column;
      }

      .search-field {
        :host ::ng-deep input {
          width: 100%;
        }
      }

      :host ::ng-deep .role-filter {
        width: 100%;
      }

      .user-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem;
      }

      .user-main {
        width: 100%;
      }

      .user-meta {
        width: 100%;
        justify-content: flex-start;
      }

      .user-actions {
        position: absolute;
        top: 1rem;
        right: 1rem;
      }

      .user-card {
        position: relative;
      }
    }
  `]
})
export class UserManagementComponent implements OnInit {
  private tenantService = inject(TenantService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  users = this.tenantService.tenantUsers;
  searchQuery = '';
  roleFilter: TenantRole | null = null;

  // Expose TenantRole enum for template use
  readonly TenantRole = TenantRole;

  showInviteDialog = false;
  showRoleDialog = false;
  selectedUser: TenantUser | null = null;
  newRole: TenantRole | null = null;

  inviting = signal(false);
  updating = signal(false);

  inviteForm = {
    email: '',
    name: '',
    role: null as TenantRole | null
  };

  roleOptions = [
    { label: 'Administrator', value: TenantRole.TENANT_ADMIN },
    { label: 'Manager', value: TenantRole.MANAGER },
    { label: 'Staff', value: TenantRole.STAFF },
    { label: 'Viewer', value: TenantRole.VIEWER }
  ];

  assignableRoles = [
    { label: 'Administrator', value: TenantRole.TENANT_ADMIN },
    { label: 'Manager', value: TenantRole.MANAGER },
    { label: 'Staff', value: TenantRole.STAFF },
    { label: 'Viewer', value: TenantRole.VIEWER }
  ];

  userMenuItems: MenuItem[] = [
    {
      label: 'Change Role',
      icon: 'pi pi-user-edit',
      command: () => this.openRoleDialog()
    },
    {
      label: 'Resend Invitation',
      icon: 'pi pi-envelope',
      command: () => this.resendInvitation()
    },
    { separator: true },
    {
      label: 'Remove User',
      icon: 'pi pi-trash',
      styleClass: 'text-red-500',
      command: () => this.confirmRemoveUser()
    }
  ];

  totalUsers = computed(() => this.users().length);
  activeUsers = computed(() => this.users().filter(u => u.status === 'active').length);
  pendingInvites = computed(() => this.users().filter(u => u.status === 'inactive').length);
  adminCount = computed(() =>
    this.users().filter(u => u.role === TenantRole.TENANT_ADMIN || u.role === TenantRole.SUPER_ADMIN).length
  );

  filteredUsers = computed(() => {
    let result = this.users();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(u =>
        u.displayName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    if (this.roleFilter) {
      result = result.filter(u => u.role === this.roleFilter);
    }

    return result;
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    const tenantId = this.tenantService.currentTenantId();
    if (tenantId) {
      this.tenantService.listTenantUsers(tenantId).subscribe();
    }
  }

  getUserInitials(user: TenantUser): string {
    return user.displayName.split(' ')
      .map((word: string) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getAvatarColor(user: TenantUser): string {
    const colors = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];
    const index = user.displayName.charCodeAt(0) % colors.length;
    return colors[index];
  }

  getRoleLabel(role: TenantRole): string {
    const labels: Record<TenantRole, string> = {
      [TenantRole.SUPER_ADMIN]: 'Super Admin',
      [TenantRole.TENANT_ADMIN]: 'Admin',
      [TenantRole.MANAGER]: 'Manager',
      [TenantRole.STAFF]: 'Staff',
      [TenantRole.VIEWER]: 'Viewer'
    };
    return labels[role] || role;
  }

  getRoleSeverity(role: TenantRole): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<TenantRole, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      [TenantRole.SUPER_ADMIN]: 'danger',
      [TenantRole.TENANT_ADMIN]: 'warn',
      [TenantRole.MANAGER]: 'info',
      [TenantRole.STAFF]: 'success',
      [TenantRole.VIEWER]: 'secondary'
    };
    return severities[role] || 'secondary';
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      'active': 'success',
      'pending': 'warn',
      'suspended': 'danger'
    };
    return severities[status] || 'secondary';
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;

    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  sendInvitation(): void {
    if (!this.inviteForm.email || !this.inviteForm.role) return;

    this.inviting.set(true);

    const tenantId = this.tenantService.currentTenantId();
    if (!tenantId) return;

    this.tenantService.inviteUser(this.inviteForm.email, this.inviteForm.role!).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Invitation Sent',
          detail: `Invitation sent to ${this.inviteForm.email}`
        });
        this.showInviteDialog = false;
        this.inviteForm = { email: '', name: '', role: null };
        this.inviting.set(false);
        this.loadUsers();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to send invitation'
        });
        this.inviting.set(false);
      }
    });
  }

  openRoleDialog(): void {
    if (this.selectedUser) {
      this.newRole = this.selectedUser.role;
      this.showRoleDialog = true;
    }
  }

  updateUserRole(): void {
    if (!this.selectedUser || !this.newRole) return;

    this.updating.set(true);

    const tenantId = this.tenantService.currentTenantId();
    if (!tenantId) return;

    this.tenantService.updateUserRole(this.selectedUser.userId, this.newRole).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Role Updated',
          detail: `${this.selectedUser!.displayName}'s role has been updated`
        });
        this.showRoleDialog = false;
        this.updating.set(false);
        this.loadUsers();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update role'
        });
        this.updating.set(false);
      }
    });
  }

  resendInvitation(): void {
    if (!this.selectedUser) return;

    this.messageService.add({
      severity: 'success',
      summary: 'Invitation Resent',
      detail: `Invitation resent to ${this.selectedUser.email}`
    });
  }

  confirmRemoveUser(): void {
    if (!this.selectedUser) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to remove ${this.selectedUser.displayName} from this organization?`,
      header: 'Remove User',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.removeUser();
      }
    });
  }

  private removeUser(): void {
    if (!this.selectedUser) return;

    const tenantId = this.tenantService.currentTenantId();
    if (!tenantId) return;

    this.tenantService.removeUser(this.selectedUser.userId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'User Removed',
          detail: `${this.selectedUser!.displayName} has been removed from the organization`
        });
        this.loadUsers();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove user'
        });
      }
    });
  }
}
