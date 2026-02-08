import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-api-docs',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, TabsModule, CardModule],
  template: `
    <div class="api-docs">
      <div class="page-header">
        <button pButton icon="pi pi-arrow-left" class="p-button-text" [routerLink]="['/integrations']"></button>
        <h1>API Documentation</h1>
      </div>

      <div class="docs-content">
        <div class="intro-section">
          <h2>Getting Started</h2>
          <p>The Inventory API provides programmatic access to your inventory data. Use it to integrate with external systems, build custom applications, or automate workflows.</p>

          <div class="base-url">
            <strong>Base URL:</strong>
            <code>https://api.example.com/inventory/v1</code>
          </div>
        </div>

        <p-tabs value="0">
          <p-tablist>
            <p-tab value="0">Authentication</p-tab>
            <p-tab value="1">Items</p-tab>
            <p-tab value="2">Stock</p-tab>
            <p-tab value="3">Webhooks</p-tab>
          </p-tablist>
          <p-tabpanels>
            <p-tabpanel value="0">
              <div class="doc-section">
                <h3>API Key Authentication</h3>
                <p>All API requests must include your API key in the Authorization header:</p>
                <pre><code>Authorization: Bearer your_api_key_here</code></pre>

                <h4>Creating an API Key</h4>
                <ol>
                  <li>Navigate to Integrations > API Keys</li>
                  <li>Click "Create API Key"</li>
                  <li>Select the appropriate scopes for your use case</li>
                  <li>Copy and securely store your API key</li>
                </ol>

                <div class="warning-box">
                  <i class="pi pi-exclamation-triangle"></i>
                  <p>Keep your API keys secure. Never share them in public repositories or client-side code.</p>
                </div>
              </div>
            </p-tabpanel>

            <p-tabpanel value="1">
              <div class="doc-section">
                <h3>Items API</h3>

                <div class="endpoint">
                  <span class="method get">GET</span>
                  <code>/items</code>
                  <span class="scope">items:read</span>
                </div>
                <p>List all inventory items with optional filtering and pagination.</p>
                <h4>Query Parameters</h4>
                <table class="params-table">
                  <tr><th>Parameter</th><th>Type</th><th>Description</th></tr>
                  <tr><td>page</td><td>integer</td><td>Page number (default: 1)</td></tr>
                  <tr><td>page_size</td><td>integer</td><td>Items per page (default: 25, max: 100)</td></tr>
                  <tr><td>category_id</td><td>string</td><td>Filter by category</td></tr>
                  <tr><td>search</td><td>string</td><td>Search by name or SKU</td></tr>
                </table>

                <div class="endpoint">
                  <span class="method get">GET</span>
                  <code>/items/:id</code>
                  <span class="scope">items:read</span>
                </div>
                <p>Get details for a specific item.</p>

                <div class="endpoint">
                  <span class="method post">POST</span>
                  <code>/items</code>
                  <span class="scope">items:write</span>
                </div>
                <p>Create a new inventory item.</p>

                <div class="endpoint">
                  <span class="method patch">PATCH</span>
                  <code>/items/:id</code>
                  <span class="scope">items:write</span>
                </div>
                <p>Update an existing item.</p>

                <div class="endpoint">
                  <span class="method delete">DELETE</span>
                  <code>/items/:id</code>
                  <span class="scope">items:write</span>
                </div>
                <p>Delete an item (soft delete).</p>
              </div>
            </p-tabpanel>

            <p-tabpanel value="2">
              <div class="doc-section">
                <h3>Stock API</h3>

                <div class="endpoint">
                  <span class="method get">GET</span>
                  <code>/items/:id/stock</code>
                  <span class="scope">stock:read</span>
                </div>
                <p>Get stock levels for an item across all warehouses.</p>

                <div class="endpoint">
                  <span class="method post">POST</span>
                  <code>/items/:id/stock/adjust</code>
                  <span class="scope">stock:write</span>
                </div>
                <p>Adjust stock level for an item.</p>
                <h4>Request Body</h4>
                <pre><code>{{stockAdjustExample | json}}</code></pre>
              </div>
            </p-tabpanel>

            <p-tabpanel value="3">
              <div class="doc-section">
                <h3>Webhook Events</h3>
                <p>Configure webhooks to receive real-time notifications when events occur in your inventory system.</p>

                <h4>Available Events</h4>
                <table class="params-table">
                  <tr><th>Event</th><th>Description</th></tr>
                  <tr><td>item.created</td><td>A new item was created</td></tr>
                  <tr><td>item.updated</td><td>An item was modified</td></tr>
                  <tr><td>item.deleted</td><td>An item was deleted</td></tr>
                  <tr><td>stock.adjusted</td><td>Stock levels changed</td></tr>
                  <tr><td>stock.low</td><td>Stock fell below minimum</td></tr>
                  <tr><td>checkout.created</td><td>Equipment was checked out</td></tr>
                  <tr><td>checkout.returned</td><td>Equipment was returned</td></tr>
                </table>

                <h4>Webhook Payload</h4>
                <pre><code>{{webhookPayloadExample | json}}</code></pre>

                <h4>Verifying Webhook Signatures</h4>
                <p>If you configured a secret for your webhook, each request includes a signature header:</p>
                <pre><code>X-Webhook-Signature: sha256=...</code></pre>
                <p>Verify this signature using HMAC-SHA256 with your secret and the raw request body.</p>
              </div>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>
      </div>
    </div>
  `,
  styles: [`
    .api-docs {
      padding: 1.5rem;
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

    .docs-content {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }

    .intro-section {
      margin-bottom: 2rem;

      h2 {
        margin: 0 0 0.75rem 0;
        font-size: 1.25rem;
        color: var(--text-primary);
      }

      p {
        margin: 0 0 1rem 0;
        color: var(--text-secondary);
      }
    }

    .base-url {
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);

      strong {
        margin-right: 0.5rem;
      }

      code {
        font-size: 0.875rem;
      }
    }

    .doc-section {
      h3 {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        color: var(--text-primary);
      }

      h4 {
        margin: 1.5rem 0 0.75rem 0;
        font-size: 0.875rem;
        color: var(--text-primary);
      }

      p {
        margin: 0 0 1rem 0;
        color: var(--text-secondary);
      }

      ol, ul {
        color: var(--text-secondary);
        padding-left: 1.5rem;
      }
    }

    .endpoint {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      margin-bottom: 0.5rem;

      code {
        flex: 1;
        font-size: 0.875rem;
      }

      .scope {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        background: var(--primary-100);
        color: var(--primary-700);
        border-radius: var(--radius-sm);
      }
    }

    .method {
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;

      &.get {
        background: rgba(59, 130, 246, 0.2);
        color: #3b82f6;
      }

      &.post {
        background: rgba(16, 185, 129, 0.2);
        color: var(--primary-600);
      }

      &.patch {
        background: rgba(250, 204, 21, 0.2);
        color: #eab308;
      }

      &.delete {
        background: rgba(244, 63, 94, 0.2);
        color: var(--alert-600);
      }
    }

    pre {
      background: var(--bg-secondary);
      padding: 1rem;
      border-radius: var(--radius-md);
      overflow-x: auto;
      font-size: 0.875rem;

      code {
        background: transparent;
      }
    }

    .params-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;

      th, td {
        padding: 0.5rem 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }

      th {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
      }

      td {
        font-size: 0.875rem;
        color: var(--text-primary);
      }
    }

    .warning-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(250, 204, 21, 0.1);
      border: 1px solid rgba(250, 204, 21, 0.3);
      border-radius: var(--radius-md);
      margin-top: 1rem;

      i {
        color: #eab308;
        font-size: 1.25rem;
      }

      p {
        margin: 0;
        color: var(--text-primary);
      }
    }
  `]
})
export class ApiDocsComponent {
  stockAdjustExample = {
    warehouse_id: 'wh-123',
    adjustment_type: 'usage',
    quantity: -5,
    reason: 'Used for procedure',
    reference_id: 'proc-456'
  };

  webhookPayloadExample = {
    id: 'evt_abc123',
    type: 'stock.adjusted',
    created_at: '2024-01-15T10:30:00Z',
    data: {
      item_id: 'item-123',
      item_name: 'Surgical Gloves',
      warehouse_id: 'wh-1',
      old_quantity: 100,
      new_quantity: 95,
      adjustment_type: 'usage'
    }
  };
}
