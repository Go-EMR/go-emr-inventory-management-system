// Logs webhook events on data mutations
// After POST/PUT/PATCH/DELETE, creates webhook delivery records for active endpoints

const { v4: uuidv4 } = require('uuid');

// Map resource mutations to webhook event types
const RESOURCE_EVENTS = {
  'equipment': { POST: 'item.created', PUT: 'item.updated', PATCH: 'item.updated', DELETE: 'item.deleted' },
  'inventory': { POST: 'item.created', PUT: 'item.updated', PATCH: 'item.updated', DELETE: 'item.deleted' },
  'checkouts': { POST: 'checkout.created', PUT: 'checkout.returned', PATCH: 'checkout.returned' },
  'purchase-orders': { POST: 'purchase_order.created', PUT: 'purchase_order.approved', PATCH: 'purchase_order.approved' },
  'alerts': { POST: 'alert.date' }
};

function webhookLoggerMiddleware(router) {
  return function (req, res, next) {
    // Only log mutations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    if (!req.path.startsWith('/api/')) {
      return next();
    }

    // Capture original end to log after response
    const originalEnd = res.end.bind(res);

    res.end = function (...args) {
      // Only log successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const resource = req.path.replace('/api/', '').split('/')[0];
          const eventMapping = RESOURCE_EVENTS[resource];

          if (eventMapping && eventMapping[req.method]) {
            const eventType = eventMapping[req.method];
            const tenantId = req.headers['x-tenant-id'];
            const db = router.db;

            // Find active webhook endpoints subscribed to this event
            const webhooks = db.get('webhooks')
              .filter(w => w.isActive && w.tenantId === tenantId)
              .value() || [];

            const matchingWebhooks = webhooks.filter(w =>
              (w.events || []).includes(eventType)
            );

            // Create delivery records
            matchingWebhooks.forEach(webhook => {
              const delivery = {
                id: `del-${uuidv4().slice(0, 8)}`,
                endpointId: webhook.id,
                endpointName: webhook.name,
                eventType,
                eventId: uuidv4(),
                status: 'success',
                httpStatusCode: 200,
                attemptNumber: 1,
                responseTimeMs: Math.floor(Math.random() * 200) + 50,
                createdAt: new Date().toISOString(),
                deliveredAt: new Date().toISOString()
              };

              db.get('webhook-deliveries').push(delivery).write();

              // Update webhook stats
              const current = db.get('webhooks').find({ id: webhook.id }).value();
              const stats = current.stats || { totalDeliveries: 0, successfulDeliveries: 0, failedDeliveries: 0 };
              stats.totalDeliveries += 1;
              stats.successfulDeliveries += 1;
              stats.successRate = stats.totalDeliveries > 0
                ? stats.successfulDeliveries / stats.totalDeliveries
                : 1;
              stats.lastSuccessAt = new Date().toISOString();

              db.get('webhooks')
                .find({ id: webhook.id })
                .assign({
                  stats,
                  lastDeliveryAt: new Date().toISOString(),
                  lastDeliveryStatus: 'success'
                })
                .write();
            });
          }
        } catch (err) {
          // Don't let webhook logging errors affect the response
          console.error('Webhook logger error:', err.message);
        }
      }

      return originalEnd(...args);
    };

    next();
  };
}

module.exports = { webhookLoggerMiddleware };
