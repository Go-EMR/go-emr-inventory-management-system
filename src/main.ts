import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withViewTransitions, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { tenantContextInterceptor } from './app/core/interceptors/tenant-context.interceptor';
import { authTokenInterceptor } from './app/core/interceptors/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withViewTransitions(),
      withComponentInputBinding()
    ),
    provideHttpClient(withInterceptors([authTokenInterceptor, tenantContextInterceptor])),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          prefix: 'p',
          darkModeSelector: '[data-theme="dark"]',
          cssLayer: false
        }
      },
      ripple: true
    })
  ]
}).catch(err => console.error(err));
