const webhooks = [
  {
    id: 'wh-001',
    tenantId: 'tenant-1',
    name: 'Inventory Alert Webhook',
    url: 'https://hooks.example.com/goemr/inventory-alerts',
    events: ['inventory.low_stock', 'inventory.out_of_stock', 'inventory.expired'],
    isActive: true,
    status: 'active',
    secret: 'whsec_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    headers: {
      'X-Custom-Header': 'GoEMR-Inventory'
    },
    retryPolicy: {
      maxRetries: 3,
      retryIntervalSeconds: 60
    },
    stats: {
      totalDeliveries: 142,
      successfulDeliveries: 138,
      failedDeliveries: 4,
      successRate: 97.18
    },
    createdAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2026-02-06T12:00:00.000Z'
  },
  {
    id: 'wh-002',
    tenantId: 'tenant-1',
    name: 'Maintenance Event Webhook',
    url: 'https://hooks.example.com/goemr/maintenance-events',
    events: ['maintenance.scheduled', 'maintenance.completed', 'maintenance.overdue', 'work_order.created'],
    isActive: true,
    status: 'active',
    secret: 'whsec_q1w2e3r4t5y6u7i8o9p0a1s2d3f4g5h6',
    headers: {},
    retryPolicy: {
      maxRetries: 5,
      retryIntervalSeconds: 120
    },
    stats: {
      totalDeliveries: 87,
      successfulDeliveries: 85,
      failedDeliveries: 2,
      successRate: 97.70
    },
    createdAt: '2025-04-15T00:00:00.000Z',
    updatedAt: '2026-02-05T18:30:00.000Z'
  },
  {
    id: 'wh-003',
    tenantId: 'tenant-2',
    name: 'Compliance Notification Webhook',
    url: 'https://compliance.sunrisemedical.org/webhooks/goemr',
    events: ['compliance.inspection_due', 'compliance.certificate_expiring', 'equipment.recall'],
    isActive: false,
    status: 'paused',
    secret: 'whsec_z1x2c3v4b5n6m7k8j9h0g1f2d3s4a5q6',
    headers: {
      'Authorization': 'Bearer smc-webhook-token-2025'
    },
    retryPolicy: {
      maxRetries: 3,
      retryIntervalSeconds: 300
    },
    stats: {
      totalDeliveries: 23,
      successfulDeliveries: 18,
      failedDeliveries: 5,
      successRate: 78.26
    },
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2026-01-20T09:00:00.000Z'
  }
];

const webhookDeliveries = [
  {
    id: 'whd-001',
    endpointId: 'wh-001',
    endpointName: 'Inventory Alert Webhook',
    eventType: 'inventory.low_stock',
    status: 'success',
    httpStatusCode: 200,
    requestBody: '{"event":"inventory.low_stock","itemId":"INV002","itemName":"Disposable Syringes 10ml","currentStock":85,"reorderLevel":100}',
    responseBody: '{"received":true}',
    createdAt: '2026-02-06T08:00:00.000Z',
    deliveredAt: '2026-02-06T08:00:01.000Z'
  },
  {
    id: 'whd-002',
    endpointId: 'wh-001',
    endpointName: 'Inventory Alert Webhook',
    eventType: 'inventory.out_of_stock',
    status: 'success',
    httpStatusCode: 200,
    requestBody: '{"event":"inventory.out_of_stock","itemId":"INV005","itemName":"Nitrile Gloves Medium","currentStock":0}',
    responseBody: '{"received":true}',
    createdAt: '2026-01-15T10:30:00.000Z',
    deliveredAt: '2026-01-15T10:30:01.000Z'
  },
  {
    id: 'whd-003',
    endpointId: 'wh-001',
    endpointName: 'Inventory Alert Webhook',
    eventType: 'inventory.expired',
    status: 'failed',
    httpStatusCode: 503,
    requestBody: '{"event":"inventory.expired","itemId":"INV007","itemName":"Blood Collection Tubes","expirationDate":"2025-12-31T00:00:00.000Z"}',
    responseBody: '{"error":"Service Unavailable"}',
    createdAt: '2026-01-01T00:05:00.000Z',
    deliveredAt: null
  },
  {
    id: 'whd-004',
    endpointId: 'wh-002',
    endpointName: 'Maintenance Event Webhook',
    eventType: 'maintenance.completed',
    status: 'success',
    httpStatusCode: 200,
    requestBody: '{"event":"maintenance.completed","equipmentId":"EQ001","maintenanceType":"preventive","completedAt":"2026-02-05T16:00:00.000Z"}',
    responseBody: '{"received":true,"ticketId":"MT-4521"}',
    createdAt: '2026-02-05T16:00:00.000Z',
    deliveredAt: '2026-02-05T16:00:02.000Z'
  },
  {
    id: 'whd-005',
    endpointId: 'wh-002',
    endpointName: 'Maintenance Event Webhook',
    eventType: 'work_order.created',
    status: 'success',
    httpStatusCode: 201,
    requestBody: '{"event":"work_order.created","workOrderId":"WO-2026-0042","equipmentId":"EQ004","priority":"high"}',
    responseBody: '{"received":true,"ticketId":"MT-4523"}',
    createdAt: '2026-02-04T09:15:00.000Z',
    deliveredAt: '2026-02-04T09:15:01.000Z'
  },
  {
    id: 'whd-006',
    endpointId: 'wh-003',
    endpointName: 'Compliance Notification Webhook',
    eventType: 'compliance.inspection_due',
    status: 'failed',
    httpStatusCode: 0,
    requestBody: '{"event":"compliance.inspection_due","equipmentId":"EQ-SMC-001","inspectionDueDate":"2026-03-01T00:00:00.000Z"}',
    responseBody: null,
    createdAt: '2026-01-20T06:00:00.000Z',
    deliveredAt: null
  }
];

module.exports = { webhooks, webhookDeliveries };
