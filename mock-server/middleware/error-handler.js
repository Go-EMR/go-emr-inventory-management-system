// Consistent error response formatting

function errorHandler(err, req, res, _next) {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    errors: err.errors || [],
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}

// 404 handler for unmatched routes
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}

module.exports = { errorHandler, notFoundHandler };
