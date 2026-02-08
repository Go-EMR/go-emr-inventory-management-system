const apiKeys = [
  {
    id: 'apikey-001',
    tenantId: 'tenant-1',
    name: 'Production Integration Key',
    keyPrefix: 'goemr_pk',
    scopes: ['inventory:read', 'inventory:write', 'equipment:read', 'equipment:write', 'maintenance:read'],
    isActive: true,
    expiresAt: '2026-12-31T23:59:59.000Z',
    lastUsedAt: '2026-02-07T06:45:00.000Z',
    rateLimitPerMinute: 120,
    totalRequests: 15420,
    createdBy: '1',
    createdByName: 'System Administrator',
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2026-02-07T06:45:00.000Z'
  },
  {
    id: 'apikey-002',
    tenantId: 'tenant-1',
    name: 'Reporting Dashboard Key',
    keyPrefix: 'goemr_rp',
    scopes: ['inventory:read', 'equipment:read', 'maintenance:read', 'reports:read'],
    isActive: true,
    expiresAt: '2026-06-30T23:59:59.000Z',
    lastUsedAt: '2026-02-06T22:00:00.000Z',
    rateLimitPerMinute: 60,
    totalRequests: 8340,
    createdBy: '2',
    createdByName: 'Sarah Johnson',
    createdAt: '2025-07-01T00:00:00.000Z',
    updatedAt: '2026-02-06T22:00:00.000Z'
  },
  {
    id: 'apikey-003',
    tenantId: 'tenant-2',
    name: 'EHR Integration Key',
    keyPrefix: 'goemr_eh',
    scopes: ['inventory:read', 'equipment:read', 'checkout:read', 'checkout:write'],
    isActive: false,
    expiresAt: '2025-12-31T23:59:59.000Z',
    lastUsedAt: '2025-12-28T18:30:00.000Z',
    rateLimitPerMinute: 90,
    totalRequests: 22150,
    createdBy: '1',
    createdByName: 'System Administrator',
    createdAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2025-12-31T23:59:59.000Z'
  }
];

const apiKeyUsage = [
  {
    apiKeyId: 'apikey-001',
    date: '2026-02-07T00:00:00.000Z',
    requestCount: 342,
    errorCount: 3,
    successCount: 339
  },
  {
    apiKeyId: 'apikey-001',
    date: '2026-02-06T00:00:00.000Z',
    requestCount: 1205,
    errorCount: 12,
    successCount: 1193
  },
  {
    apiKeyId: 'apikey-002',
    date: '2026-02-06T00:00:00.000Z',
    requestCount: 487,
    errorCount: 2,
    successCount: 485
  },
  {
    apiKeyId: 'apikey-002',
    date: '2026-02-05T00:00:00.000Z',
    requestCount: 523,
    errorCount: 8,
    successCount: 515
  },
  {
    apiKeyId: 'apikey-003',
    date: '2025-12-28T00:00:00.000Z',
    requestCount: 891,
    errorCount: 45,
    successCount: 846
  }
];

module.exports = { apiKeys, apiKeyUsage };
