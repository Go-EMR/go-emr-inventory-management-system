import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WebhookEndpoint, WebhookDelivery, WebhookEventType, WebhookDeliveryStatus, PaginatedResponse } from '../../shared/models';

export interface CreateWebhookRequest {
  name: string;
  url: string;
  secret?: string;
  events: WebhookEventType[];
  isActive: boolean;
  retryPolicy?: RetryPolicy;
  headers?: Record<string, string>;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  secret?: string;
  events?: WebhookEventType[];
  isActive?: boolean;
  retryPolicy?: RetryPolicy;
  headers?: Record<string, string>;
}

export interface WebhookSearchParams {
  isActive?: boolean;
  eventType?: WebhookEventType;
  page?: number;
  pageSize?: number;
}

export interface DeliverySearchParams {
  endpointId?: string;
  status?: WebhookDeliveryStatus;
  eventType?: WebhookEventType;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class WebhookService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory/webhooks`;
  private readonly USE_MOCK = true;

  // Mock data
  private mockEndpoints: WebhookEndpoint[] = [
    {
      id: 'wh-1',
      name: 'ERP Integration',
      url: 'https://erp.example.com/webhooks/inventory',
      secret: 'whsec_abc123...',
      events: [WebhookEventType.ITEM_CREATED, WebhookEventType.ITEM_UPDATED, WebhookEventType.STOCK_ADJUSTED],
      isActive: true,
      retryPolicy: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 60000,
        backoffMultiplier: 2
      },
      headers: { 'X-Source': 'inventory-system' },
      lastDeliveryAt: new Date(Date.now() - 30 * 60 * 1000),
      lastDeliveryStatus: WebhookDeliveryStatus.SUCCESS,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      id: 'wh-2',
      name: 'Slack Notifications',
      url: 'https://hooks.slack.com/services/xxx/yyy/zzz',
      events: [WebhookEventType.STOCK_LOW, WebhookEventType.CHECKOUT_OVERDUE],
      isActive: true,
      retryPolicy: {
        maxRetries: 2,
        initialDelayMs: 500,
        maxDelayMs: 5000,
        backoffMultiplier: 2
      },
      lastDeliveryAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastDeliveryStatus: WebhookDeliveryStatus.SUCCESS,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      id: 'wh-3',
      name: 'Analytics Service',
      url: 'https://analytics.example.com/events',
      secret: 'whsec_xyz789...',
      events: [WebhookEventType.ITEM_CREATED, WebhookEventType.ITEM_DELETED, WebhookEventType.CHECKOUT_CREATED, WebhookEventType.CHECKOUT_RETURNED],
      isActive: false,
      retryPolicy: {
        maxRetries: 5,
        initialDelayMs: 2000,
        maxDelayMs: 120000,
        backoffMultiplier: 2
      },
      lastDeliveryAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastDeliveryStatus: WebhookDeliveryStatus.FAILED,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    }
  ];

  private mockDeliveries: WebhookDelivery[] = [
    {
      id: 'del-1',
      endpointId: 'wh-1',
      endpointName: 'ERP Integration',
      eventType: WebhookEventType.STOCK_ADJUSTED,
      eventId: 'evt-123',
      payload: { item_id: 'item-1', old_quantity: 100, new_quantity: 95, adjustment_type: 'usage' },
      status: WebhookDeliveryStatus.SUCCESS,
      attempts: 1,
      httpStatusCode: 200,
      responseBody: '{"received": true}',
      deliveredAt: new Date(Date.now() - 30 * 60 * 1000),
      createdAt: new Date(Date.now() - 30 * 60 * 1000)
    },
    {
      id: 'del-2',
      endpointId: 'wh-2',
      endpointName: 'Slack Notifications',
      eventType: WebhookEventType.STOCK_LOW,
      eventId: 'evt-124',
      payload: { item_id: 'item-2', item_name: 'Surgical Gloves', current_quantity: 5, min_quantity: 20 },
      status: WebhookDeliveryStatus.SUCCESS,
      attempts: 1,
      httpStatusCode: 200,
      deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 'del-3',
      endpointId: 'wh-3',
      endpointName: 'Analytics Service',
      eventType: WebhookEventType.ITEM_CREATED,
      eventId: 'evt-125',
      payload: { item_id: 'item-3', item_name: 'New Equipment' },
      status: WebhookDeliveryStatus.FAILED,
      attempts: 5,
      httpStatusCode: 503,
      responseBody: 'Service Unavailable',
      errorMessage: 'Max retries exceeded',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
  ];

  createWebhook(request: CreateWebhookRequest): Observable<WebhookEndpoint> {
    if (this.USE_MOCK) {
      const endpoint: WebhookEndpoint = {
        id: `wh-${Date.now()}`,
        name: request.name,
        url: request.url,
        secret: request.secret,
        events: request.events,
        isActive: request.isActive,
        retryPolicy: request.retryPolicy || {
          maxRetries: 3,
          initialDelayMs: 1000,
          maxDelayMs: 60000,
          backoffMultiplier: 2
        },
        headers: request.headers,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.mockEndpoints.push(endpoint);
      return of(endpoint).pipe(delay(300));
    }
    return this.http.post<WebhookEndpoint>(this.apiUrl, request);
  }

  getWebhook(id: string): Observable<WebhookEndpoint> {
    if (this.USE_MOCK) {
      const endpoint = this.mockEndpoints.find(e => e.id === id);
      return of(endpoint!).pipe(delay(200));
    }
    return this.http.get<WebhookEndpoint>(`${this.apiUrl}/${id}`);
  }

  getWebhooks(params?: WebhookSearchParams): Observable<PaginatedResponse<WebhookEndpoint>> {
    if (this.USE_MOCK) {
      let filtered = [...this.mockEndpoints];
      if (params?.isActive !== undefined) {
        filtered = filtered.filter(e => e.isActive === params.isActive);
      }
      if (params?.eventType) {
        filtered = filtered.filter(e => e.events.includes(params.eventType!));
      }
      return of({
        items: filtered,
        total: filtered.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 25,
        totalPages: 1
      }).pipe(delay(200));
    }
    return this.http.get<PaginatedResponse<WebhookEndpoint>>(this.apiUrl, { params: params as any });
  }

  updateWebhook(id: string, request: UpdateWebhookRequest): Observable<WebhookEndpoint> {
    if (this.USE_MOCK) {
      const endpoint = this.mockEndpoints.find(e => e.id === id);
      if (endpoint) {
        if (request.name) endpoint.name = request.name;
        if (request.url) endpoint.url = request.url;
        if (request.secret !== undefined) endpoint.secret = request.secret;
        if (request.events) endpoint.events = request.events;
        if (request.isActive !== undefined) endpoint.isActive = request.isActive;
        if (request.retryPolicy) endpoint.retryPolicy = request.retryPolicy;
        if (request.headers) endpoint.headers = request.headers;
        endpoint.updatedAt = new Date();
      }
      return of(endpoint!).pipe(delay(300));
    }
    return this.http.patch<WebhookEndpoint>(`${this.apiUrl}/${id}`, request);
  }

  deleteWebhook(id: string): Observable<void> {
    if (this.USE_MOCK) {
      const index = this.mockEndpoints.findIndex(e => e.id === id);
      if (index >= 0) {
        this.mockEndpoints.splice(index, 1);
      }
      return of(void 0).pipe(delay(300));
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  testWebhook(id: string): Observable<WebhookDelivery> {
    if (this.USE_MOCK) {
      const endpoint = this.mockEndpoints.find(e => e.id === id);
      const delivery: WebhookDelivery = {
        id: `del-test-${Date.now()}`,
        endpointId: id,
        endpointName: endpoint?.name || 'Unknown',
        eventType: WebhookEventType.ITEM_UPDATED,
        eventId: `test-${Date.now()}`,
        payload: { test: true, timestamp: new Date().toISOString() },
        status: WebhookDeliveryStatus.SUCCESS,
        attempts: 1,
        httpStatusCode: 200,
        responseBody: '{"ok": true}',
        deliveredAt: new Date(),
        createdAt: new Date()
      };
      this.mockDeliveries.unshift(delivery);
      return of(delivery).pipe(delay(1000));
    }
    return this.http.post<WebhookDelivery>(`${this.apiUrl}/${id}/test`, {});
  }

  regenerateSecret(id: string): Observable<{ secret: string }> {
    if (this.USE_MOCK) {
      const endpoint = this.mockEndpoints.find(e => e.id === id);
      const newSecret = `whsec_${Math.random().toString(36).substring(2, 15)}`;
      if (endpoint) {
        endpoint.secret = newSecret;
        endpoint.updatedAt = new Date();
      }
      return of({ secret: newSecret }).pipe(delay(300));
    }
    return this.http.post<{ secret: string }>(`${this.apiUrl}/${id}/regenerate-secret`, {});
  }

  getDeliveries(params?: DeliverySearchParams): Observable<PaginatedResponse<WebhookDelivery>> {
    if (this.USE_MOCK) {
      let filtered = [...this.mockDeliveries];
      if (params?.endpointId) {
        filtered = filtered.filter(d => d.endpointId === params.endpointId);
      }
      if (params?.status) {
        filtered = filtered.filter(d => d.status === params.status);
      }
      if (params?.eventType) {
        filtered = filtered.filter(d => d.eventType === params.eventType);
      }
      return of({
        items: filtered,
        total: filtered.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 25,
        totalPages: 1
      }).pipe(delay(200));
    }
    return this.http.get<PaginatedResponse<WebhookDelivery>>(`${this.apiUrl}/deliveries`, { params: params as any });
  }

  getDelivery(id: string): Observable<WebhookDelivery> {
    if (this.USE_MOCK) {
      const delivery = this.mockDeliveries.find(d => d.id === id);
      return of(delivery!).pipe(delay(200));
    }
    return this.http.get<WebhookDelivery>(`${this.apiUrl}/deliveries/${id}`);
  }

  retryDelivery(id: string): Observable<WebhookDelivery> {
    if (this.USE_MOCK) {
      const delivery = this.mockDeliveries.find(d => d.id === id);
      if (delivery) {
        delivery.status = WebhookDeliveryStatus.PENDING;
        delivery.attempts = (delivery.attempts || 0) + 1;
      }
      // Simulate retry result
      setTimeout(() => {
        if (delivery) {
          delivery.status = WebhookDeliveryStatus.SUCCESS;
          delivery.httpStatusCode = 200;
          delivery.deliveredAt = new Date();
        }
      }, 1000);
      return of(delivery!).pipe(delay(300));
    }
    return this.http.post<WebhookDelivery>(`${this.apiUrl}/deliveries/${id}/retry`, {});
  }

  getAvailableEvents(): Observable<{ eventType: WebhookEventType; description: string }[]> {
    return of([
      { eventType: WebhookEventType.ITEM_CREATED, description: 'Triggered when a new item is created' },
      { eventType: WebhookEventType.ITEM_UPDATED, description: 'Triggered when an item is updated' },
      { eventType: WebhookEventType.ITEM_DELETED, description: 'Triggered when an item is deleted' },
      { eventType: WebhookEventType.STOCK_ADJUSTED, description: 'Triggered when stock levels are adjusted' },
      { eventType: WebhookEventType.STOCK_LOW, description: 'Triggered when stock falls below minimum' },
      { eventType: WebhookEventType.STOCK_OUT, description: 'Triggered when stock reaches zero' },
      { eventType: WebhookEventType.CHECKOUT_CREATED, description: 'Triggered when an item is checked out' },
      { eventType: WebhookEventType.CHECKOUT_RETURNED, description: 'Triggered when an item is returned' },
      { eventType: WebhookEventType.CHECKOUT_OVERDUE, description: 'Triggered when a checkout becomes overdue' },
      { eventType: WebhookEventType.DATE_ALERT, description: 'Triggered for date-based alerts (maintenance, calibration, etc.)' },
      { eventType: WebhookEventType.IMPORT_COMPLETED, description: 'Triggered when a bulk import completes' },
      { eventType: WebhookEventType.EXPORT_COMPLETED, description: 'Triggered when a bulk export completes' }
    ]).pipe(delay(100));
  }
}
