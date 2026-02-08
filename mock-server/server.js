#!/usr/bin/env node

/**
 * GoEMR Mock Server
 * Express + json-server v0.17.4 with custom middleware
 */

const jsonServer = require('json-server');
const path = require('path');

const { loginHandler, authMiddleware } = require('./middleware/auth');
const { tenantFilterMiddleware } = require('./middleware/tenant-filter');
const { rbacMiddleware } = require('./middleware/rbac');
const { registerActionEndpoints } = require('./middleware/action-endpoints');
const { registerStatsEndpoints } = require('./middleware/stats-endpoints');
const { paginationMiddleware } = require('./middleware/pagination');
const { webhookLoggerMiddleware } = require('./middleware/webhook-logger');
const { errorHandler } = require('./middleware/error-handler');

const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(__dirname, 'db.json');

// Create json-server instance
const server = jsonServer.create();
const router = jsonServer.router(DB_PATH);
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, 'public'),
  noCors: false
});

// ==========================================
// Middleware Chain
// ==========================================

// 1. CORS + default json-server middleware (static, logger, CORS headers)
server.use(middlewares);

// 2. Body parser (json-server defaults include this, but ensure it's available)
server.use(jsonServer.bodyParser);

// 3. Custom CORS headers (ensure Angular dev server can access)
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Tenant-ID, X-Tenant-Context');
  res.header('Access-Control-Expose-Headers', 'X-Total-Count');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 4. Auth: Login endpoint
server.post('/api/auth/login', loginHandler);

// 5. Auth: Token validation for all other routes
server.use(authMiddleware);

// 6. Tenant filtering
server.use(tenantFilterMiddleware);

// 7. RBAC
server.use(rbacMiddleware);

// 8. Custom action endpoints (before json-server router)
registerActionEndpoints(server, router);

// 9. Stats/aggregation endpoints (before json-server router)
registerStatsEndpoints(server, router);

// 10. Webhook logger (wraps response to log after mutations)
server.use(webhookLoggerMiddleware(router));

// 11. Pagination wrapper
server.use(paginationMiddleware);

// 12. URL rewriting (/api/* -> /*)
const rewriteRules = require('./routes.json');
server.use(jsonServer.rewriter(rewriteRules));

// 13. json-server router (handles all standard CRUD)
// Mounted at root because the rewriter already strips /api/ prefix
server.use(router);

// 14. Error handler
server.use(errorHandler);

// ==========================================
// Start server
// ==========================================

server.listen(PORT, () => {
  console.log('');
  console.log('  GoEMR Mock API Server');
  console.log('  =====================');
  console.log(`  Server running at: http://localhost:${PORT}`);
  console.log(`  API base URL:      http://localhost:${PORT}/api`);
  console.log('');
  console.log('  Demo credentials:');
  console.log('    admin     / admin123    (Administrator, all tenants)');
  console.log('    manager   / manager123  (Manager, tenant-1)');
  console.log('    technician/ tech123     (Technician, tenant-1 & tenant-2)');
  console.log('    viewer    / viewer123   (Viewer, tenant-1)');
  console.log('');
  console.log('  Login endpoint:');
  console.log(`    POST http://localhost:${PORT}/api/auth/login`);
  console.log('    Body: { "username": "admin", "password": "admin123" }');
  console.log('');
  console.log('  Available tenants:');
  console.log('    tenant-1: City General Hospital');
  console.log('    tenant-2: Sunrise Medical Center');
  console.log('    tenant-3: Valley Health Clinic');
  console.log('    tenant-4: Riverside Community Hospital');
  console.log('');
});
