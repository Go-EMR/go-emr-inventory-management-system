import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

/**
 * HTTP Interceptor that adds Authorization Bearer token to all API requests.
 * Reads the token from localStorage (set after json-server login).
 * Skips auth endpoints to avoid circular header injection.
 */
export const authTokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Skip adding token for authentication and public endpoints
  if (req.url.includes('/auth/') || req.url.includes('/public/')) {
    return next(req);
  }

  const token = localStorage.getItem('auth_token');

  if (token) {
    const modifiedReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`
      }
    });
    return next(modifiedReq);
  }

  return next(req);
};
