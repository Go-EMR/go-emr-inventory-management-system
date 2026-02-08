// Custom action endpoints that json-server cannot handle natively
// These are registered as Express routes BEFORE the json-server router

const { v4: uuidv4 } = require('uuid');

function registerActionEndpoints(app, router) {
  // Helper to get the lowdb instance from json-server router
  function getDb() {
    return router.db;
  }

  // ==================== Checkout Actions ====================

  // POST /api/checkouts/:id/checkin
  app.post('/api/checkouts/:id/checkin', (req, res) => {
    const db = getDb();
    const checkout = db.get('checkouts').find({ id: req.params.id }).value();

    if (!checkout) {
      return res.status(404).json({ success: false, message: 'Checkout not found' });
    }

    const now = new Date().toISOString();
    db.get('checkouts')
      .find({ id: req.params.id })
      .assign({
        status: 'returned',
        actualReturnDate: now,
        checkedInBy: req.user?.userId || 'system',
        checkedInByName: req.body.checkedInByName || 'System',
        returnCondition: req.body.returnCondition || 'Good',
        returnNotes: req.body.returnNotes || '',
        isOverdue: false,
        daysOverdue: 0,
        updatedAt: now
      })
      .write();

    const updated = db.get('checkouts').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // POST /api/checkouts/:id/extend
  app.post('/api/checkouts/:id/extend', (req, res) => {
    const db = getDb();
    const checkout = db.get('checkouts').find({ id: req.params.id }).value();

    if (!checkout) {
      return res.status(404).json({ success: false, message: 'Checkout not found' });
    }

    const newReturnDate = req.body.expectedReturnDate || new Date(Date.now() + 7 * 86400000).toISOString();
    const now = new Date().toISOString();

    db.get('checkouts')
      .find({ id: req.params.id })
      .assign({
        expectedReturnDate: newReturnDate,
        extensionCount: (checkout.extensionCount || 0) + 1,
        isOverdue: false,
        daysOverdue: 0,
        updatedAt: now
      })
      .write();

    const updated = db.get('checkouts').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // ==================== Purchase Order Actions ====================

  // POST /api/purchase-orders/:id/approve
  app.post('/api/purchase-orders/:id/approve', (req, res) => {
    const db = getDb();
    const po = db.get('purchase-orders').find({ id: req.params.id }).value();

    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    if (po.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: `Cannot approve PO in status: ${po.status}` });
    }

    const now = new Date().toISOString();
    db.get('purchase-orders')
      .find({ id: req.params.id })
      .assign({
        status: 'approved',
        approvedBy: req.user?.userId || 'system',
        approvedByName: req.body.approvedByName || 'System',
        updatedAt: now
      })
      .write();

    const updated = db.get('purchase-orders').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // POST /api/purchase-orders/:id/send
  app.post('/api/purchase-orders/:id/send', (req, res) => {
    const db = getDb();
    const po = db.get('purchase-orders').find({ id: req.params.id }).value();

    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    const now = new Date().toISOString();
    db.get('purchase-orders')
      .find({ id: req.params.id })
      .assign({ status: 'sent', updatedAt: now })
      .write();

    const updated = db.get('purchase-orders').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // POST /api/purchase-orders/:id/receive
  app.post('/api/purchase-orders/:id/receive', (req, res) => {
    const db = getDb();
    const po = db.get('purchase-orders').find({ id: req.params.id }).value();

    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    const now = new Date().toISOString();
    const receivedLines = req.body.lines || [];

    // Update line quantities if provided
    const updatedLines = (po.lines || []).map(line => {
      const received = receivedLines.find(r => r.id === line.id);
      if (received) {
        return { ...line, quantityReceived: received.quantityReceived || line.quantityOrdered };
      }
      return { ...line, quantityReceived: line.quantityOrdered };
    });

    const allReceived = updatedLines.every(l => l.quantityReceived >= l.quantityOrdered);

    db.get('purchase-orders')
      .find({ id: req.params.id })
      .assign({
        status: allReceived ? 'received' : 'partially_received',
        lines: updatedLines,
        receivedDate: now,
        updatedAt: now
      })
      .write();

    const updated = db.get('purchase-orders').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // POST /api/purchase-orders/:id/cancel
  app.post('/api/purchase-orders/:id/cancel', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('purchase-orders')
      .find({ id: req.params.id })
      .assign({ status: 'cancelled', updatedAt: now })
      .write();

    const updated = db.get('purchase-orders').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // ==================== Shipment Actions ====================

  // POST /api/shipments/:id/ship
  app.post('/api/shipments/:id/ship', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('shipments')
      .find({ id: req.params.id })
      .assign({
        status: 'shipped',
        shippedAt: now,
        trackingNumber: req.body.trackingNumber || `TRK${Date.now()}`,
        carrier: req.body.carrier || 'UPS',
        shippedBy: req.user?.userId,
        shippedByName: req.body.shippedByName,
        updatedAt: now
      })
      .write();

    const updated = db.get('shipments').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // POST /api/shipments/:id/deliver
  app.post('/api/shipments/:id/deliver', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('shipments')
      .find({ id: req.params.id })
      .assign({
        status: 'delivered',
        actualDelivery: now,
        updatedAt: now
      })
      .write();

    const updated = db.get('shipments').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // ==================== Discard Actions ====================

  // POST /api/discards/:id/approve
  app.post('/api/discards/:id/approve', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('discards')
      .find({ id: req.params.id })
      .assign({
        status: 'approved',
        approvedBy: req.user?.userId,
        approvedByName: req.body.approvedByName || 'System',
        approvedAt: now,
        approvalNotes: req.body.approvalNotes,
        updatedAt: now
      })
      .write();

    const updated = db.get('discards').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // POST /api/discards/:id/complete
  app.post('/api/discards/:id/complete', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('discards')
      .find({ id: req.params.id })
      .assign({
        status: 'completed',
        disposalVerified: true,
        disposalVerifiedAt: now,
        disposalVerifiedBy: req.user?.userId,
        updatedAt: now
      })
      .write();

    const updated = db.get('discards').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // ==================== Pick List Actions ====================

  // POST /api/pick-lists/:id/start
  app.post('/api/pick-lists/:id/start', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('pick-lists')
      .find({ id: req.params.id })
      .assign({
        status: 'in_progress',
        startedAt: now,
        assignedPickerId: req.user?.userId,
        assignedPickerName: req.body.pickerName,
        updatedAt: now
      })
      .write();

    const updated = db.get('pick-lists').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // POST /api/pick-lists/:id/complete
  app.post('/api/pick-lists/:id/complete', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('pick-lists')
      .find({ id: req.params.id })
      .assign({
        status: 'completed',
        completedAt: now,
        updatedAt: now
      })
      .write();

    const updated = db.get('pick-lists').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // ==================== Ticket Actions ====================

  // POST /api/tickets/:id/assign
  app.post('/api/tickets/:id/assign', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('tickets')
      .find({ id: req.params.id })
      .assign({
        assignedToId: req.body.assignedToId,
        assignedToName: req.body.assignedToName,
        status: 'In Progress',
        updatedAt: now
      })
      .write();

    const updated = db.get('tickets').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // POST /api/tickets/:id/resolve
  app.post('/api/tickets/:id/resolve', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('tickets')
      .find({ id: req.params.id })
      .assign({
        status: 'Resolved',
        resolvedAt: now,
        updatedAt: now
      })
      .write();

    const updated = db.get('tickets').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // POST /api/tickets/:id/close
  app.post('/api/tickets/:id/close', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('tickets')
      .find({ id: req.params.id })
      .assign({
        status: 'Closed',
        closedAt: now,
        updatedAt: now
      })
      .write();

    const updated = db.get('tickets').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // ==================== Return Actions ====================

  // POST /api/returns/:id/approve
  app.post('/api/returns/:id/approve', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('returns')
      .find({ id: req.params.id })
      .assign({
        status: 'approved',
        approvedAt: now,
        approvedBy: req.user?.userId,
        updatedAt: now
      })
      .write();

    const updated = db.get('returns').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // POST /api/returns/:id/complete
  app.post('/api/returns/:id/complete', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('returns')
      .find({ id: req.params.id })
      .assign({
        status: 'completed',
        actualReturnDate: now,
        updatedAt: now
      })
      .write();

    const updated = db.get('returns').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // ==================== Auto-PO Actions ====================

  // POST /api/auto-po-rules/:id/execute
  app.post('/api/auto-po-rules/:id/execute', (req, res) => {
    const db = getDb();
    const rule = db.get('auto-po-rules').find({ id: req.params.id }).value();

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Auto-PO rule not found' });
    }

    const now = new Date().toISOString();
    const execution = {
      id: `exec-${uuidv4().slice(0, 8)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      executedAt: now,
      status: 'completed',
      itemsEvaluated: 10,
      itemsBelowThreshold: 2,
      posCreated: 1,
      linesCreated: 2,
      totalValue: 5000,
      purchaseOrderIds: [],
      issues: [],
      triggeredBy: req.user?.userId || 'system'
    };

    db.get('auto-po-executions').push(execution).write();

    db.get('auto-po-rules')
      .find({ id: req.params.id })
      .assign({ lastTriggeredAt: now, totalPOsGenerated: (rule.totalPOsGenerated || 0) + 1 })
      .write();

    res.json({ success: true, data: execution });
  });

  // ==================== Alert Actions ====================

  // POST /api/alerts/:id/acknowledge
  app.post('/api/alerts/:id/acknowledge', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('alerts')
      .find({ id: req.params.id })
      .assign({ isAcknowledged: true, isRead: true, updatedAt: now })
      .write();

    const updated = db.get('alerts').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // POST /api/alerts/:id/read
  app.post('/api/alerts/:id/read', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('alerts')
      .find({ id: req.params.id })
      .assign({ isRead: true, updatedAt: now })
      .write();

    const updated = db.get('alerts').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // ==================== Webhook Actions ====================

  // POST /api/webhooks/:id/test
  app.post('/api/webhooks/:id/test', (req, res) => {
    const db = getDb();
    const webhook = db.get('webhooks').find({ id: req.params.id }).value();

    if (!webhook) {
      return res.status(404).json({ success: false, message: 'Webhook not found' });
    }

    const delivery = {
      id: `del-${uuidv4().slice(0, 8)}`,
      endpointId: webhook.id,
      endpointName: webhook.name,
      eventType: 'test.ping',
      eventId: uuidv4(),
      status: 'success',
      httpStatusCode: 200,
      attemptNumber: 1,
      responseTimeMs: 150,
      createdAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString()
    };

    db.get('webhook-deliveries').push(delivery).write();

    res.json({ success: true, data: delivery });
  });

  // POST /api/webhooks/:id/toggle
  app.post('/api/webhooks/:id/toggle', (req, res) => {
    const db = getDb();
    const webhook = db.get('webhooks').find({ id: req.params.id }).value();

    if (!webhook) {
      return res.status(404).json({ success: false, message: 'Webhook not found' });
    }

    const now = new Date().toISOString();
    const newStatus = webhook.isActive ? false : true;

    db.get('webhooks')
      .find({ id: req.params.id })
      .assign({
        isActive: newStatus,
        status: newStatus ? 'active' : 'paused',
        updatedAt: now
      })
      .write();

    const updated = db.get('webhooks').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // ==================== Label/Barcode Actions ====================

  // POST /api/label-jobs
  app.post('/api/label-jobs/generate', (req, res) => {
    const job = {
      id: `lj-${uuidv4().slice(0, 8)}`,
      tenantId: req.headers['x-tenant-id'],
      templateId: req.body.templateId,
      itemIds: req.body.itemIds || [],
      status: 'completed',
      outputFormat: req.body.outputFormat || 'pdf',
      outputUrl: '/mock-labels/output.pdf',
      labelCount: (req.body.itemIds || []).length,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const db = getDb();
    db.get('label-jobs').push(job).write();
    res.json({ success: true, data: job });
  });

  // POST /api/lot-label-jobs/generate
  app.post('/api/lot-label-jobs/generate', (req, res) => {
    const job = {
      id: `llj-${uuidv4().slice(0, 8)}`,
      tenantId: req.headers['x-tenant-id'],
      templateId: req.body.templateId,
      lotBarcodeIds: req.body.lotBarcodeIds || [],
      status: 'completed',
      outputFormat: req.body.outputFormat || 'pdf',
      outputUrl: '/mock-labels/lot-output.pdf',
      labelCount: (req.body.lotBarcodeIds || []).length,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    const db = getDb();
    db.get('lot-label-jobs').push(job).write();
    res.json({ success: true, data: job });
  });

  // POST /api/barcode-scans/lookup
  app.post('/api/barcode-scans/lookup', (req, res) => {
    const db = getDb();
    const { barcodeValue } = req.body;

    // Check lot barcodes first
    const lotBarcode = db.get('lot-barcodes').find({ barcodeValue }).value();
    if (lotBarcode) {
      return res.json({
        success: true,
        data: {
          barcodeValue,
          found: true,
          isLotBarcode: true,
          isItemBarcode: false,
          itemId: lotBarcode.itemId,
          itemName: lotBarcode.itemName,
          itemSku: lotBarcode.itemSku,
          lotNumber: lotBarcode.lotNumber,
          expirationDate: lotBarcode.expirationDate,
          isExpired: lotBarcode.expirationDate ? new Date(lotBarcode.expirationDate) < new Date() : false
        }
      });
    }

    // Check inventory by SKU
    const item = db.get('inventory').find({ sku: barcodeValue }).value();
    if (item) {
      return res.json({
        success: true,
        data: {
          barcodeValue,
          found: true,
          isLotBarcode: false,
          isItemBarcode: true,
          itemId: item.id,
          itemName: item.name,
          itemSku: item.sku
        }
      });
    }

    res.json({
      success: true,
      data: { barcodeValue, found: false, isLotBarcode: false, isItemBarcode: false }
    });
  });

  // ==================== Tenant Actions ====================

  // POST /api/tenants/:id/suspend
  app.post('/api/tenants/:id/suspend', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('tenants')
      .find({ id: req.params.id })
      .assign({
        status: 'Suspended',
        suspendedAt: now,
        suspensionReason: req.body.reason,
        updatedAt: now
      })
      .write();

    const updated = db.get('tenants').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });

  // POST /api/tenants/:id/activate
  app.post('/api/tenants/:id/activate', (req, res) => {
    const db = getDb();
    const now = new Date().toISOString();

    db.get('tenants')
      .find({ id: req.params.id })
      .assign({
        status: 'Active',
        suspendedAt: null,
        suspensionReason: null,
        updatedAt: now
      })
      .write();

    const updated = db.get('tenants').find({ id: req.params.id }).value();
    res.json({ success: true, data: updated });
  });
}

module.exports = { registerActionEndpoints };
