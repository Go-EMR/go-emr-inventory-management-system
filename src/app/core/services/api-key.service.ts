import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { APIKey, APIKeyUsage, PaginatedResponse } from '../../shared/models';

export interface CreateAPIKeyRequest {
  name: string;
  description?: string;
  scopes: string[];
  expiresAt?: string;
  rateLimitPerMinute?: number;
  allowedIps?: string[];
}

export interface UpdateAPIKeyRequest {
  name?: string;
  description?: string;
  scopes?: string[];
  isActive?: boolean;
  rateLimitPerMinute?: number;
  allowedIps?: string[];
}

export interface APIKeySearchParams {
  isActive?: boolean;
  scope?: string;
  page?: number;
  pageSize?: number;
}

export interface APIKeyScope {
  scope: string;
  name: string;
  description: string;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class APIKeyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory/api-keys`;
  private readonly USE_MOCK = true;

  // Mock data
  private mockApiKeys: APIKey[] = [
    {
      id: 'key-1',
      name: 'Production Integration',
      description: 'API key for ERP system integration',
      keyPrefix: 'inv_prod_',
      scopes: ['items:read', 'items:write', 'stock:read', 'stock:write'],
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      lastUsedAt: new Date(Date.now() - 5 * 60 * 1000),
      rateLimitPerMinute: 1000,
      allowedIps: ['10.0.0.0/8', '192.168.1.0/24'],
      createdBy: 'user-1',
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      id: 'key-2',
      name: 'Mobile App',
      description: 'API key for mobile application',
      keyPrefix: 'inv_mob_',
      scopes: ['items:read', 'stock:read', 'checkouts:read', 'checkouts:write'],
      isActive: true,
      lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      rateLimitPerMinute: 100,
      createdBy: 'user-1',
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      id: 'key-3',
      name: 'Reporting Dashboard',
      description: 'Read-only key for reporting tools',
      keyPrefix: 'inv_rpt_',
      scopes: ['items:read', 'stock:read', 'reports:read'],
      isActive: true,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      lastUsedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      rateLimitPerMinute: 500,
      createdBy: 'user-2',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      id: 'key-4',
      name: 'Legacy System (Deprecated)',
      description: 'Old integration key - to be removed',
      keyPrefix: 'inv_leg_',
      scopes: ['items:read'],
      isActive: false,
      expiresAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lastUsedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      rateLimitPerMinute: 50,
      createdBy: 'user-1',
      createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    }
  ];

  private mockUsage: APIKeyUsage[] = [
    { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), requestCount: 15234, errorCount: 12 },
    { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), requestCount: 18567, errorCount: 23 },
    { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), requestCount: 12890, errorCount: 8 },
    { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), requestCount: 21345, errorCount: 45 },
    { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), requestCount: 19876, errorCount: 31 },
    { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), requestCount: 16543, errorCount: 19 },
    { date: new Date(), requestCount: 8765, errorCount: 7 }
  ];

  createAPIKey(request: CreateAPIKeyRequest): Observable<{ apiKey: APIKey; secretKey: string }> {
    if (this.USE_MOCK) {
      const secretKey = `inv_${Math.random().toString(36).substring(2, 10)}_${Math.random().toString(36).substring(2, 30)}`;
      const apiKey: APIKey = {
        id: `key-${Date.now()}`,
        name: request.name,
        description: request.description,
        keyPrefix: secretKey.substring(0, 12),
        scopes: request.scopes,
        isActive: true,
        expiresAt: request.expiresAt ? new Date(request.expiresAt) : undefined,
        rateLimitPerMinute: request.rateLimitPerMinute || 100,
        allowedIps: request.allowedIps,
        createdBy: 'current-user',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.mockApiKeys.push(apiKey);
      return of({ apiKey, secretKey }).pipe(delay(300));
    }
    return this.http.post<{ apiKey: APIKey; secretKey: string }>(this.apiUrl, request);
  }

  getAPIKey(id: string): Observable<APIKey> {
    if (this.USE_MOCK) {
      const key = this.mockApiKeys.find(k => k.id === id);
      return of(key!).pipe(delay(200));
    }
    return this.http.get<APIKey>(`${this.apiUrl}/${id}`);
  }

  getAPIKeys(params?: APIKeySearchParams): Observable<PaginatedResponse<APIKey>> {
    if (this.USE_MOCK) {
      let filtered = [...this.mockApiKeys];
      if (params?.isActive !== undefined) {
        filtered = filtered.filter(k => k.isActive === params.isActive);
      }
      if (params?.scope) {
        filtered = filtered.filter(k => k.scopes.includes(params.scope!));
      }
      return of({
        items: filtered,
        total: filtered.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 25,
        totalPages: 1
      }).pipe(delay(200));
    }
    return this.http.get<PaginatedResponse<APIKey>>(this.apiUrl, { params: params as any });
  }

  updateAPIKey(id: string, request: UpdateAPIKeyRequest): Observable<APIKey> {
    if (this.USE_MOCK) {
      const key = this.mockApiKeys.find(k => k.id === id);
      if (key) {
        if (request.name) key.name = request.name;
        if (request.description !== undefined) key.description = request.description;
        if (request.scopes) key.scopes = request.scopes;
        if (request.isActive !== undefined) key.isActive = request.isActive;
        if (request.rateLimitPerMinute !== undefined) key.rateLimitPerMinute = request.rateLimitPerMinute;
        if (request.allowedIps !== undefined) key.allowedIps = request.allowedIps;
        key.updatedAt = new Date();
      }
      return of(key!).pipe(delay(300));
    }
    return this.http.patch<APIKey>(`${this.apiUrl}/${id}`, request);
  }

  revokeAPIKey(id: string): Observable<void> {
    if (this.USE_MOCK) {
      const key = this.mockApiKeys.find(k => k.id === id);
      if (key) {
        key.isActive = false;
        key.updatedAt = new Date();
      }
      return of(void 0).pipe(delay(300));
    }
    return this.http.post<void>(`${this.apiUrl}/${id}/revoke`, {});
  }

  deleteAPIKey(id: string): Observable<void> {
    if (this.USE_MOCK) {
      const index = this.mockApiKeys.findIndex(k => k.id === id);
      if (index >= 0) {
        this.mockApiKeys.splice(index, 1);
      }
      return of(void 0).pipe(delay(300));
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAPIKeyUsage(id: string, startDate?: string, endDate?: string): Observable<APIKeyUsage[]> {
    if (this.USE_MOCK) {
      return of(this.mockUsage).pipe(delay(200));
    }
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return this.http.get<APIKeyUsage[]>(`${this.apiUrl}/${id}/usage`, { params });
  }

  getAvailableScopes(): Observable<APIKeyScope[]> {
    return of([
      // Items
      { scope: 'items:read', name: 'Read Items', description: 'View item details and list items', category: 'Items' },
      { scope: 'items:write', name: 'Write Items', description: 'Create, update, and delete items', category: 'Items' },

      // Stock
      { scope: 'stock:read', name: 'Read Stock', description: 'View stock levels and history', category: 'Stock' },
      { scope: 'stock:write', name: 'Write Stock', description: 'Adjust stock levels', category: 'Stock' },

      // Categories
      { scope: 'categories:read', name: 'Read Categories', description: 'View categories', category: 'Categories' },
      { scope: 'categories:write', name: 'Write Categories', description: 'Manage categories', category: 'Categories' },

      // Warehouses
      { scope: 'warehouses:read', name: 'Read Warehouses', description: 'View warehouses and locations', category: 'Warehouses' },
      { scope: 'warehouses:write', name: 'Write Warehouses', description: 'Manage warehouses', category: 'Warehouses' },

      // Checkouts
      { scope: 'checkouts:read', name: 'Read Checkouts', description: 'View checkout records', category: 'Checkouts' },
      { scope: 'checkouts:write', name: 'Write Checkouts', description: 'Create and manage checkouts', category: 'Checkouts' },

      // Pick Lists
      { scope: 'picklists:read', name: 'Read Pick Lists', description: 'View pick lists and kits', category: 'Pick Lists' },
      { scope: 'picklists:write', name: 'Write Pick Lists', description: 'Create and manage pick lists', category: 'Pick Lists' },

      // Reports
      { scope: 'reports:read', name: 'Read Reports', description: 'Generate and view reports', category: 'Reports' },

      // Import/Export
      { scope: 'import:write', name: 'Import Data', description: 'Import data via bulk upload', category: 'Import/Export' },
      { scope: 'export:read', name: 'Export Data', description: 'Export inventory data', category: 'Import/Export' },

      // Admin
      { scope: 'webhooks:read', name: 'Read Webhooks', description: 'View webhook configurations', category: 'Admin' },
      { scope: 'webhooks:write', name: 'Write Webhooks', description: 'Manage webhook endpoints', category: 'Admin' },
      { scope: 'apikeys:read', name: 'Read API Keys', description: 'View API keys (excludes secrets)', category: 'Admin' },
      { scope: 'apikeys:write', name: 'Write API Keys', description: 'Create and manage API keys', category: 'Admin' }
    ]).pipe(delay(100));
  }

  validateAPIKey(keyPrefix: string): Observable<{ valid: boolean; keyId?: string; scopes?: string[] }> {
    if (this.USE_MOCK) {
      const key = this.mockApiKeys.find(k => k.keyPrefix === keyPrefix && k.isActive);
      if (key) {
        return of({ valid: true, keyId: key.id, scopes: key.scopes }).pipe(delay(200));
      }
      return of({ valid: false }).pipe(delay(200));
    }
    return this.http.post<any>(`${this.apiUrl}/validate`, { key_prefix: keyPrefix });
  }
}
