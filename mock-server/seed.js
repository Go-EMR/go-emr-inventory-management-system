#!/usr/bin/env node

/**
 * Seed script: merges all data modules and writes db.json
 * Run: node seed.js
 */

const fs = require('fs');
const path = require('path');

console.log('Seeding database...');

// Import all data modules
const { users, tenantMemberships } = require('./data/users');
const { tenants, tenantUsers } = require('./data/tenants');
const { equipment } = require('./data/equipment');
const { inventory } = require('./data/inventory');
const { maintenance } = require('./data/maintenance');
const { workOrders } = require('./data/work-orders');
const { vendors } = require('./data/vendors');
const { alerts } = require('./data/alerts');
const { auditTrail } = require('./data/audit-trail');
const { checkouts, checkoutAuditEvents } = require('./data/checkouts');
const { purchaseOrders, autoPORules, autoPOExecutions } = require('./data/purchase-orders');
const { shipments, returns } = require('./data/shipments');
const { discards, discardReasons, expirationAlerts } = require('./data/discards');
const { kits } = require('./data/kits');
const { pickLists } = require('./data/pick-lists');
const { tags, itemTags } = require('./data/tags');
const { webhooks, webhookDeliveries } = require('./data/webhooks');
const { apiKeys, apiKeyUsage } = require('./data/api-keys');
const { lotBarcodes, barcodeScans } = require('./data/lot-barcodes');
const { labelTemplates, labelJobs, lotLabelTemplates, lotLabelJobs } = require('./data/labels');
const { tickets, ticketComments } = require('./data/helpdesk');
const { depreciationConfigs } = require('./data/depreciation');
const { trackedDates, dateAlerts, dateAlertConfig } = require('./data/date-alerts');
const { vendorScorecards, performanceIssues, scoringWeights } = require('./data/vendor-performance');

// Build the complete database
const db = {
  // Core
  users,
  'tenant-memberships': tenantMemberships,
  tenants,
  'tenant-users': tenantUsers,
  equipment,
  inventory,
  maintenance,
  'work-orders': workOrders,
  vendors,
  alerts,
  'audit-trail': auditTrail,
  departments: [
    { id: 'dept-1', name: 'Radiology', code: 'RAD' },
    { id: 'dept-2', name: 'Intensive Care', code: 'ICU' },
    { id: 'dept-3', name: 'Surgery', code: 'SUR' },
    { id: 'dept-4', name: 'Emergency', code: 'ER' },
    { id: 'dept-5', name: 'Cardiology', code: 'CAR' },
    { id: 'dept-6', name: 'Laboratory', code: 'LAB' },
    { id: 'dept-7', name: 'Medical', code: 'MED' },
    { id: 'dept-8', name: 'Central Sterile', code: 'CSSD' },
    { id: 'dept-9', name: 'Biomedical Engineering', code: 'BME' },
    { id: 'dept-10', name: 'Maintenance', code: 'MNT' },
    { id: 'dept-11', name: 'IT', code: 'IT' },
    { id: 'dept-12', name: 'Administration', code: 'ADM' },
    { id: 'dept-13', name: 'Nephrology', code: 'NEP' },
    { id: 'dept-14', name: 'Oncology', code: 'ONC' },
    { id: 'dept-15', name: 'Neonatal Care', code: 'NICU' },
    { id: 'dept-16', name: 'Operations', code: 'OPS' }
  ],

  // Operations
  checkouts,
  'checkout-audit-events': checkoutAuditEvents,
  'purchase-orders': purchaseOrders,
  'auto-po-rules': autoPORules,
  'auto-po-executions': autoPOExecutions,
  shipments,
  returns,
  discards,
  'discard-reasons': discardReasons,
  'expiration-alerts': expirationAlerts,
  kits,
  'pick-lists': pickLists,

  // Integrations
  webhooks,
  'webhook-deliveries': webhookDeliveries,
  'api-keys': apiKeys,
  'api-key-usage': apiKeyUsage,
  tags,
  'item-tags': itemTags,

  // Barcodes/Labels
  'lot-barcodes': lotBarcodes,
  'barcode-scans': barcodeScans,
  'label-templates': labelTemplates,
  'label-jobs': labelJobs,
  'lot-label-templates': lotLabelTemplates,
  'lot-label-jobs': lotLabelJobs,

  // Other
  tickets,
  'ticket-comments': ticketComments,
  'depreciation-configs': depreciationConfigs,
  'tracked-dates': trackedDates,
  'date-alerts': dateAlerts,
  'date-alert-config': dateAlertConfig,
  'vendor-scorecards': vendorScorecards,
  'performance-issues': performanceIssues,
  'scoring-weights': scoringWeights,

  // Import/Export (empty collections for CRUD)
  'import-jobs': [],
  'export-jobs': [],
  'import-templates': [
    {
      name: 'Equipment Import Template',
      description: 'Template for bulk importing equipment records',
      importType: 'items',
      downloadUrl: '/templates/equipment-import.csv',
      format: 'csv'
    },
    {
      name: 'Inventory Import Template',
      description: 'Template for bulk importing inventory items',
      importType: 'items',
      downloadUrl: '/templates/inventory-import.csv',
      format: 'csv'
    },
    {
      name: 'Vendor Import Template',
      description: 'Template for bulk importing vendors',
      importType: 'suppliers',
      downloadUrl: '/templates/vendor-import.csv',
      format: 'csv'
    }
  ]
};

// Write db.json
const dbPath = path.join(__dirname, 'db.json');
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

// Count records
let totalRecords = 0;
const collections = Object.keys(db);
collections.forEach(key => {
  const count = Array.isArray(db[key]) ? db[key].length : 1;
  totalRecords += count;
});

console.log(`Database seeded successfully!`);
console.log(`  Collections: ${collections.length}`);
console.log(`  Total records: ${totalRecords}`);
console.log(`  Output: ${dbPath}`);
