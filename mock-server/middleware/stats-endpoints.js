// Computed aggregation endpoints for dashboards and summaries

function registerStatsEndpoints(app, router) {
  function getDb() {
    return router.db;
  }

  // GET /api/dashboard/stats
  app.get('/api/dashboard/stats', (req, res) => {
    const db = getDb();
    const tenantId = req.headers['x-tenant-id'];

    const equipment = db.get('equipment').filter({ tenantId }).value() || [];
    const inventory = db.get('inventory').filter({ tenantId }).value() || [];
    const workOrders = db.get('work-orders').filter({ tenantId }).value() || [];
    const maintenance = db.get('maintenance').filter({ tenantId }).value() || [];
    const alerts = db.get('alerts').filter({ tenantId }).value() || [];

    const costByTenant = { 'tenant-1': 45750, 'tenant-2': 38500, 'tenant-4': 125000 };

    res.json({
      totalEquipment: equipment.length,
      activeEquipment: equipment.filter(e => e.status === 'In Service').length,
      underMaintenance: equipment.filter(e => e.status === 'Under Maintenance').length,
      outOfService: equipment.filter(e => e.status === 'Out of Service').length,
      totalInventoryItems: inventory.length,
      lowStockItems: inventory.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length,
      pendingWorkOrders: workOrders.filter(w => w.status === 'Open' || w.status === 'In Progress').length,
      overdueMaintenances: maintenance.filter(m => m.status === 'Overdue').length,
      alertsCount: alerts.filter(a => !a.isRead).length,
      monthlyMaintenanceCost: costByTenant[tenantId] || 50000
    });
  });

  // GET /api/tenant-stats (or /api/tenants/:id/stats)
  app.get('/api/tenant-stats', (req, res) => {
    const db = getDb();
    const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;

    const tenantUsers = db.get('tenant-users').filter({ tenantId }).value() || [];
    const equipment = db.get('equipment').filter({ tenantId }).value() || [];
    const inventory = db.get('inventory').filter({ tenantId }).value() || [];

    const totalValue = equipment.reduce((sum, e) => sum + (e.currentValue || 0), 0) +
                       inventory.reduce((sum, i) => sum + (i.totalValue || 0), 0);

    res.json({
      totalUsers: tenantUsers.length,
      activeUsers: tenantUsers.filter(u => u.status === 'active').length,
      totalEquipment: equipment.length,
      totalInventoryItems: inventory.length,
      totalValue,
      storageUsedBytes: 1024 * 1024 * 512,
      apiCallsThisMonth: Math.floor(Math.random() * 20000) + 5000,
      lastActivityAt: new Date().toISOString()
    });
  });

  // GET /api/checkout-summary
  app.get('/api/checkout-summary', (req, res) => {
    const db = getDb();
    const tenantId = req.headers['x-tenant-id'];
    const checkouts = db.get('checkouts').filter({ tenantId }).value() || [];

    const overdue = checkouts.filter(c => c.status === 'overdue' || c.isOverdue);

    res.json({
      totalActive: checkouts.filter(c => c.status === 'active').length,
      totalOverdue: overdue.length,
      overdue1To7Days: overdue.filter(c => c.daysOverdue <= 7).length,
      overdue8To14Days: overdue.filter(c => c.daysOverdue > 7 && c.daysOverdue <= 14).length,
      overdue15PlusDays: overdue.filter(c => c.daysOverdue > 14).length,
      overdueCheckouts: overdue
    });
  });

  // GET /api/po-stats
  app.get('/api/po-stats', (req, res) => {
    const db = getDb();
    const tenantId = req.headers['x-tenant-id'];
    const pos = db.get('purchase-orders').filter({ tenantId }).value() || [];

    res.json({
      totalPOs: pos.length,
      pendingApproval: pos.filter(p => p.status === 'pending_approval').length,
      awaitingDelivery: pos.filter(p => ['approved', 'sent'].includes(p.status)).length,
      receivedThisMonth: pos.filter(p => p.status === 'received').length,
      totalValuePending: pos.filter(p => p.status !== 'cancelled' && p.status !== 'received')
        .reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      totalValueThisMonth: pos.filter(p => p.status === 'received')
        .reduce((sum, p) => sum + (p.totalAmount || 0), 0),
      averageLeadTimeDays: 14,
      onTimeDeliveryRate: 0.87
    });
  });

  // GET /api/auto-po-summary
  app.get('/api/auto-po-summary', (req, res) => {
    const db = getDb();
    const tenantId = req.headers['x-tenant-id'];
    const rules = db.get('auto-po-rules').filter({ tenantId }).value() || [];
    const executions = db.get('auto-po-executions').value() || [];

    res.json({
      activeRules: rules.filter(r => r.isEnabled).length,
      itemsMonitored: rules.reduce((sum, r) => sum + (r.itemIds?.length || 0), 0),
      itemsBelowReorder: 3,
      pendingAutoPOs: 1,
      posCreatedToday: 0,
      posCreatedThisWeek: 1,
      posCreatedThisMonth: 3,
      totalValueThisMonth: 15000,
      lastExecutionAt: executions[0]?.executedAt,
      recentExecutions: executions.slice(0, 5)
    });
  });

  // GET /api/shipment-summary
  app.get('/api/shipment-summary', (req, res) => {
    const db = getDb();
    const tenantId = req.headers['x-tenant-id'];
    const shipments = db.get('shipments').filter({ tenantId }).value() || [];
    const returns = db.get('returns').filter({ tenantId }).value() || [];

    res.json({
      totalShipments: shipments.length,
      pendingShipments: shipments.filter(s => s.status === 'pending' || s.status === 'ready_to_ship').length,
      inTransitShipments: shipments.filter(s => s.status === 'shipped' || s.status === 'in_transit').length,
      deliveredThisMonth: shipments.filter(s => s.status === 'delivered').length,
      pendingReturns: returns.filter(r => r.status === 'pending' || r.status === 'approved').length,
      overdueReturns: 0
    });
  });

  // GET /api/discard-summary
  app.get('/api/discard-summary', (req, res) => {
    const db = getDb();
    const tenantId = req.headers['x-tenant-id'];
    const discards = db.get('discards').filter({ tenantId }).value() || [];
    const expAlerts = db.get('expiration-alerts').filter({ tenantId }).value() || [];

    res.json({
      pendingDiscards: discards.filter(d => d.status === 'pending').length,
      pendingApprovals: discards.filter(d => d.status === 'pending' && d.requiresApproval).length,
      completedThisMonth: discards.filter(d => d.status === 'completed').length,
      totalWasteCostThisMonth: discards.filter(d => d.status === 'completed')
        .reduce((sum, d) => sum + (d.totalCost || 0), 0),
      expiringAlerts: expAlerts.filter(a => a.alertType === 'expiring_soon' && !a.isResolved).length,
      expiredAlerts: expAlerts.filter(a => a.alertType === 'expired' && !a.isResolved).length
    });
  });

  // GET /api/ticket-stats
  app.get('/api/ticket-stats', (req, res) => {
    const db = getDb();
    const tenantId = req.headers['x-tenant-id'];
    const tickets = db.get('tickets').filter({ tenantId }).value() || [];

    res.json({
      totalTickets: tickets.length,
      openTickets: tickets.filter(t => t.status === 'Open').length,
      inProgressTickets: tickets.filter(t => t.status === 'In Progress').length,
      pendingTickets: tickets.filter(t => t.status === 'Pending').length,
      resolvedTickets: tickets.filter(t => t.status === 'Resolved').length,
      closedTickets: tickets.filter(t => t.status === 'Closed').length,
      avgResolutionTimeHours: 18.5,
      avgFirstResponseTimeMinutes: 45,
      slaComplianceRate: 0.92,
      ticketsByCategory: [
        { category: 'Equipment Issue', count: tickets.filter(t => t.category === 'Equipment Issue').length },
        { category: 'Inventory Request', count: tickets.filter(t => t.category === 'Inventory Request').length },
        { category: 'Maintenance Request', count: tickets.filter(t => t.category === 'Maintenance Request').length },
        { category: 'IT Support', count: tickets.filter(t => t.category === 'IT Support').length },
        { category: 'General Inquiry', count: tickets.filter(t => t.category === 'General Inquiry').length }
      ],
      ticketsByPriority: [
        { priority: 'Urgent', count: tickets.filter(t => t.priority === 'Urgent').length },
        { priority: 'High', count: tickets.filter(t => t.priority === 'High').length },
        { priority: 'Medium', count: tickets.filter(t => t.priority === 'Medium').length },
        { priority: 'Low', count: tickets.filter(t => t.priority === 'Low').length }
      ]
    });
  });

  // GET /api/depreciation-summary
  app.get('/api/depreciation-summary', (req, res) => {
    const db = getDb();
    const tenantId = req.headers['x-tenant-id'];
    const configs = db.get('depreciation-configs').filter({ tenantId }).value() || [];

    const totalAcquisition = configs.reduce((sum, c) => sum + (c.acquisitionCost || 0), 0);
    const totalAccum = configs.reduce((sum, c) => sum + (c.accumulatedDepreciation || 0), 0);
    const totalBook = configs.reduce((sum, c) => sum + (c.currentBookValue || 0), 0);

    res.json({
      totalAssets: configs.length,
      totalAcquisitionCost: totalAcquisition,
      totalAccumulatedDepreciation: totalAccum,
      totalCurrentBookValue: totalBook,
      depreciationExpenseThisMonth: Math.round(totalAccum / 12),
      depreciationExpenseYTD: Math.round(totalAccum / 2),
      fullyDepreciatedAssets: configs.filter(c => c.status === 'Fully Depreciated').length,
      activeDepreciatingAssets: configs.filter(c => c.status === 'Active').length
    });
  });

  // GET /api/vendor-performance-summary
  app.get('/api/vendor-performance-summary', (req, res) => {
    const db = getDb();
    const tenantId = req.headers['x-tenant-id'];
    const scorecards = db.get('vendor-scorecards').filter({ tenantId }).value() || [];
    const issues = db.get('performance-issues').filter({ tenantId }).value() || [];

    res.json({
      totalActiveSuppliers: scorecards.filter(s => s.isActive).length,
      platinumTierCount: scorecards.filter(s => s.tier === 'platinum').length,
      goldTierCount: scorecards.filter(s => s.tier === 'gold').length,
      silverTierCount: scorecards.filter(s => s.tier === 'silver').length,
      bronzeTierCount: scorecards.filter(s => s.tier === 'bronze').length,
      atRiskCount: scorecards.filter(s => s.tier === 'at_risk').length,
      averageOnTimeRate: scorecards.length > 0 ? scorecards.reduce((sum, s) => sum + s.onTimeRate, 0) / scorecards.length : 0,
      averageQualityRate: scorecards.length > 0 ? scorecards.reduce((sum, s) => sum + s.qualityRate, 0) / scorecards.length : 0,
      totalSpendPeriod: scorecards.reduce((sum, s) => sum + (s.totalSpend || 0), 0),
      openQualityIssues: issues.filter(i => i.status === 'open' && i.issueType === 'quality_defect').length,
      lateDeliveriesThisMonth: issues.filter(i => i.issueType === 'late_delivery').length,
      contractsExpiringSoon: scorecards.filter(s => s.contractExpiringSoon).length,
      topPerformers: scorecards.filter(s => s.overallScore >= 80).slice(0, 3),
      needsAttention: scorecards.filter(s => s.overallScore < 60 || s.hasActiveIssues).slice(0, 3)
    });
  });

  // GET /api/picking-progress/:id
  app.get('/api/picking-progress/:id', (req, res) => {
    const db = getDb();
    const pickList = db.get('pick-lists').find({ id: req.params.id }).value();

    if (!pickList) {
      return res.status(404).json({ success: false, message: 'Pick list not found' });
    }

    const items = pickList.items || [];
    const picked = items.filter(i => i.status === 'picked').length;
    const pending = items.filter(i => i.status === 'pending').length;
    const oos = items.filter(i => i.status === 'out_of_stock').length;

    res.json({
      pickListId: pickList.id,
      totalItems: items.length,
      pickedItems: picked,
      pendingItems: pending,
      outOfStockItems: oos,
      completionPercentage: items.length > 0 ? Math.round((picked / items.length) * 100) : 0
    });
  });

  // GET /api/inventory-analytics
  app.get('/api/inventory-analytics', (req, res) => {
    const db = getDb();
    const tenantId = req.headers['x-tenant-id'];
    const inventory = db.get('inventory').filter({ tenantId }).value() || [];

    const totalValue = inventory.reduce((sum, i) => sum + (i.totalValue || 0), 0);

    res.json({
      totalItems: inventory.length,
      totalSkuCount: inventory.length,
      totalStockValue: totalValue,
      inStockCount: inventory.filter(i => i.status === 'In Stock').length,
      lowStockCount: inventory.filter(i => i.status === 'Low Stock').length,
      outOfStockCount: inventory.filter(i => i.status === 'Out of Stock').length,
      expiringSoonCount: inventory.filter(i => {
        if (!i.expiryDate) return false;
        const days = (new Date(i.expiryDate) - new Date()) / 86400000;
        return days > 0 && days <= 90;
      }).length,
      itemsReceivedThisMonth: 15,
      itemsIssuedThisMonth: 42,
      turnoverRate: 3.2,
      categoryDistribution: [
        { category: 'Consumables', itemCount: inventory.filter(i => i.category === 'Consumables').length, value: 0, percentage: 0 },
        { category: 'Spare Parts', itemCount: inventory.filter(i => i.category === 'Spare Parts').length, value: 0, percentage: 0 },
        { category: 'Reagents', itemCount: inventory.filter(i => i.category === 'Reagents').length, value: 0, percentage: 0 },
        { category: 'Accessories', itemCount: inventory.filter(i => i.category === 'Accessories').length, value: 0, percentage: 0 }
      ]
    });
  });

  // GET /api/switch-context
  app.get('/api/switch-context', (req, res) => {
    const db = getDb();
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const tenantId = req.headers['x-tenant-id'] || user.tenantId;
    const tenant = db.get('tenants').find({ id: tenantId }).value();
    const memberships = db.get('tenant-memberships').filter({ userId: user.userId }).value() || [];

    res.json({
      currentTenantId: tenantId,
      currentTenantName: tenant?.name || '',
      currentTenantSlug: tenant?.slug || '',
      currentRole: (user.tenantMemberships || []).find(m => m.tenantId === tenantId)?.role || 'Viewer',
      availableTenants: memberships.filter(m => m.status === 'active')
    });
  });
}

module.exports = { registerStatsEndpoints };
