// Role-based access control middleware

// Role hierarchy (higher index = more permissions)
const ROLE_LEVELS = {
  'Viewer': 0,
  'Staff': 1,
  'Technician': 1,
  'Manager': 2,
  'Tenant Admin': 3,
  'Super Admin': 4,
  'Administrator': 4
};

// Minimum role required for write operations on each resource
const WRITE_PERMISSIONS = {
  'equipment': 'Technician',
  'inventory': 'Technician',
  'maintenance': 'Technician',
  'work-orders': 'Technician',
  'vendors': 'Manager',
  'alerts': 'Technician',
  'checkouts': 'Staff',
  'purchase-orders': 'Manager',
  'shipments': 'Manager',
  'returns': 'Staff',
  'discards': 'Technician',
  'kits': 'Manager',
  'pick-lists': 'Staff',
  'tags': 'Manager',
  'item-tags': 'Technician',
  'webhooks': 'Tenant Admin',
  'api-keys': 'Tenant Admin',
  'lot-barcodes': 'Technician',
  'label-templates': 'Manager',
  'label-jobs': 'Staff',
  'lot-label-templates': 'Manager',
  'lot-label-jobs': 'Staff',
  'tickets': 'Staff',
  'ticket-comments': 'Staff',
  'depreciation-configs': 'Manager',
  'tracked-dates': 'Technician',
  'date-alerts': 'Technician',
  'date-alert-config': 'Manager',
  'vendor-scorecards': 'Manager',
  'performance-issues': 'Manager',
  'scoring-weights': 'Tenant Admin',
  'auto-po-rules': 'Manager',
  'tenants': 'Super Admin',
  'tenant-users': 'Tenant Admin',
  'users': 'Tenant Admin',
  'import-jobs': 'Manager',
  'export-jobs': 'Manager'
};

function rbacMiddleware(req, res, next) {
  // Only check write operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Skip for auth endpoints
  if (req.path.includes('/auth/') || req.path.includes('/public/')) {
    return next();
  }

  // Skip if no user attached (auth middleware will have caught this)
  if (!req.user) {
    return next();
  }

  const resource = req.path.replace('/api/', '').split('/')[0];
  const requiredRole = WRITE_PERMISSIONS[resource];

  if (!requiredRole) {
    return next(); // No restriction defined
  }

  const userRole = req.user.role;
  const userLevel = ROLE_LEVELS[userRole] || 0;
  const requiredLevel = ROLE_LEVELS[requiredRole] || 0;

  if (userLevel < requiredLevel) {
    return res.status(403).json({
      success: false,
      message: `Insufficient permissions. Role '${userRole}' cannot perform write operations on '${resource}'. Required: '${requiredRole}' or higher.`
    });
  }

  next();
}

module.exports = { rbacMiddleware };
