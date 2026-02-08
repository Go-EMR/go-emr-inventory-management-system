import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-integrations-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule],
  template: `
    <div class="integrations-dashboard">
      <div class="page-header">
        <h1>Integrations</h1>
        <p class="subtitle">Connect your inventory system with external applications</p>
      </div>

      <div class="integration-cards">
        <div class="integration-card" [routerLink]="['webhooks']">
          <div class="card-icon">
            <i class="pi pi-bolt"></i>
          </div>
          <div class="card-content">
            <h3>Webhooks</h3>
            <p>Receive real-time notifications when inventory events occur</p>
            <span class="card-stats">3 endpoints configured</span>
          </div>
          <i class="pi pi-chevron-right"></i>
        </div>

        <div class="integration-card" [routerLink]="['api-keys']">
          <div class="card-icon">
            <i class="pi pi-key"></i>
          </div>
          <div class="card-content">
            <h3>API Keys</h3>
            <p>Manage access credentials for programmatic access</p>
            <span class="card-stats">4 active keys</span>
          </div>
          <i class="pi pi-chevron-right"></i>
        </div>

        <div class="integration-card" [routerLink]="['docs']">
          <div class="card-icon">
            <i class="pi pi-book"></i>
          </div>
          <div class="card-content">
            <h3>API Documentation</h3>
            <p>Explore the API reference and integration guides</p>
            <span class="card-stats">REST & gRPC available</span>
          </div>
          <i class="pi pi-chevron-right"></i>
        </div>
      </div>

      <div class="quick-start">
        <h3>Quick Start</h3>
        <div class="quick-start-steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Create an API Key</h4>
              <p>Generate credentials with the appropriate scopes for your integration</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Configure Webhooks</h4>
              <p>Set up endpoints to receive real-time event notifications</p>
            </div>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>Integrate</h4>
              <p>Use our API to build powerful integrations with your systems</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .integrations-dashboard {
      padding: 1.5rem;
    }

    .page-header {
      margin-bottom: 2rem;

      h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        color: var(--text-primary);
      }

      .subtitle {
        margin: 0;
        color: var(--text-secondary);
      }
    }

    .integration-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;

      @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .integration-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--primary-300);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
    }

    .card-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-lg);
      background: rgba(16, 185, 129, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      i {
        font-size: 1.5rem;
        color: var(--primary-600);
      }
    }

    .card-content {
      flex: 1;
      min-width: 0;

      h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.125rem;
        color: var(--text-primary);
      }

      p {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .card-stats {
        font-size: 0.75rem;
        color: var(--text-muted);
      }
    }

    .quick-start {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;

      h3 {
        margin: 0 0 1.5rem 0;
        font-size: 1rem;
        color: var(--text-primary);
      }
    }

    .quick-start-steps {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .step {
      display: flex;
      gap: 1rem;
    }

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-500);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      flex-shrink: 0;
    }

    .step-content {
      h4 {
        margin: 0 0 0.25rem 0;
        font-size: 0.875rem;
        color: var(--text-primary);
      }

      p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
    }
  `]
})
export class IntegrationsDashboardComponent {}
