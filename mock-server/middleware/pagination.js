// Wraps list responses in PaginatedResponse format
// Angular frontend expects: { items, total, page, pageSize, totalPages }

// Skip stat/summary/action endpoints (handled by custom handlers)
const SKIP_KEYWORDS = [
  'dashboard', 'tenant-stats', 'checkout-summary',
  'po-stats', 'auto-po-summary', 'shipment-summary',
  'discard-summary', 'ticket-stats', 'depreciation-summary',
  'vendor-performance-summary', 'picking-progress',
  'inventory-analytics', 'switch-context', 'auth'
];

function paginationMiddleware(req, res, next) {
  // Only intercept GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Use originalUrl which preserves the pre-rewrite path
  const url = req.originalUrl || req.url;

  // Must be an API request
  if (!url.startsWith('/api/')) {
    return next();
  }

  // Extract resource path after /api/
  const resourcePath = url.replace(/^\/api\//, '').split('?')[0];
  const pathParts = resourcePath.split('/').filter(Boolean);

  // Skip if requesting a specific resource by ID
  if (pathParts.length > 1) {
    return next();
  }

  // Skip known non-list endpoints
  if (SKIP_KEYWORDS.some(kw => resourcePath.includes(kw))) {
    return next();
  }

  // Intercept the response to wrap arrays
  const originalSend = res.send.bind(res);
  const originalJson = res.json.bind(res);

  function wrapIfArray(body) {
    try {
      const data = typeof body === 'string' ? JSON.parse(body) : body;

      if (!Array.isArray(data)) {
        return typeof body === 'string' ? body : JSON.stringify(body);
      }

      const page = parseInt(req.query._page) || 1;
      const pageSize = parseInt(req.query._limit) || data.length;
      const total = parseInt(res.getHeader('X-Total-Count')) || data.length;
      const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

      const wrapped = {
        items: data,
        total,
        page,
        pageSize,
        totalPages
      };

      return JSON.stringify(wrapped);
    } catch {
      return typeof body === 'string' ? body : JSON.stringify(body);
    }
  }

  res.json = function (body) {
    if (Array.isArray(body)) {
      const page = parseInt(req.query._page) || 1;
      const pageSize = parseInt(req.query._limit) || body.length;
      const total = parseInt(res.getHeader('X-Total-Count')) || body.length;
      const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 1;

      return originalJson({
        items: body,
        total,
        page,
        pageSize,
        totalPages
      });
    }
    return originalJson(body);
  };

  res.send = function (body) {
    // Only intercept if content-type is JSON
    const contentType = res.getHeader('Content-Type') || '';
    if (contentType.toString().includes('json') || (typeof body === 'string' && body.startsWith('['))) {
      const wrapped = wrapIfArray(body);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Length', Buffer.byteLength(wrapped));
      return originalSend(wrapped);
    }
    return originalSend(body);
  };

  next();
}

module.exports = { paginationMiddleware };
