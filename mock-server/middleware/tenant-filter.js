// Tenant isolation middleware
// Reads X-Tenant-ID header and filters/injects tenantId

// Resources that are tenant-scoped (most resources)
const TENANT_SCOPED_RESOURCES = [
  'equipment', 'inventory', 'maintenance', 'work-orders', 'vendors',
  'alerts', 'checkouts', 'purchase-orders', 'shipments', 'returns',
  'discards', 'discard-reasons', 'expiration-alerts', 'kits', 'pick-lists',
  'tags', 'item-tags', 'webhooks', 'webhook-deliveries', 'api-keys',
  'api-key-usage', 'lot-barcodes', 'barcode-scans', 'label-templates',
  'label-jobs', 'lot-label-templates', 'lot-label-jobs', 'tickets',
  'ticket-comments', 'depreciation-configs', 'tracked-dates', 'date-alerts',
  'date-alert-config', 'vendor-scorecards', 'performance-issues',
  'scoring-weights', 'auto-po-rules', 'auto-po-executions',
  'checkout-audit-events', 'audit-trail', 'import-jobs', 'export-jobs'
];

// Paths that skip tenant filtering
const SKIP_PATTERNS = [
  /^\/api\/auth\//,
  /^\/api\/public\//,
  /^\/api\/tenants$/,
  /^\/api\/tenants\//,
  /^\/api\/tenant-memberships/,
  /^\/api\/tenant-users/,
  /^\/api\/users$/,
  /^\/api\/users\//,
  /^\/api\/departments/,
  /^\/api\/import-templates/
];

function tenantFilterMiddleware(req, res, next) {
  // Skip for non-API routes and excluded paths
  if (!req.path.startsWith('/api/') || SKIP_PATTERNS.some(p => p.test(req.path))) {
    return next();
  }

  // Skip for OPTIONS
  if (req.method === 'OPTIONS') {
    return next();
  }

  const tenantId = req.headers['x-tenant-id'] || req.headers['x-tenant-context'];

  if (!tenantId) {
    return next();
  }

  // Extract the resource name from the path: /api/resource-name/...
  const pathParts = req.path.replace('/api/', '').split('/');
  const resource = pathParts[0];

  if (!TENANT_SCOPED_RESOURCES.includes(resource)) {
    return next();
  }

  // For GET list requests, inject tenantId query parameter
  if (req.method === 'GET') {
    req.query.tenantId = tenantId;
  }

  // For POST/PUT/PATCH, inject tenantId into body
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    req.body.tenantId = tenantId;
  }

  next();
}

module.exports = { tenantFilterMiddleware };
