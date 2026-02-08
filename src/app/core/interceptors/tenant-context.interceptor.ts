import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TenantService } from '@core/services/tenant.service';

/**
 * HTTP Interceptor that adds tenant context headers to all API requests.
 * This ensures that backend API calls are properly scoped to the current tenant.
 */
export const tenantContextInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const tenantService = inject(TenantService);

  // Skip adding headers for authentication endpoints
  if (req.url.includes('/auth/') || req.url.includes('/public/')) {
    return next(req);
  }

  const currentTenantId = tenantService.currentTenantId();

  if (currentTenantId) {
    // Clone the request and add tenant context headers
    const modifiedReq = req.clone({
      setHeaders: {
        'X-Tenant-ID': currentTenantId,
        'X-Tenant-Context': currentTenantId
      }
    });

    return next(modifiedReq);
  }

  // No tenant context - proceed without modification
  // This might happen during initial app load or tenant selection
  return next(req);
};
