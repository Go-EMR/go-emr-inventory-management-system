import { Injectable, inject, effect } from '@angular/core';
import { TenantService } from './tenant.service';
import { TenantBranding } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class BrandingService {
  private tenantService = inject(TenantService);

  private defaultBranding: TenantBranding = {
    primaryColor: '#10b981',
    secondaryColor: '#0ea5e9',
    accentColor: '#f59e0b',
    companyName: 'GoEMR Inventory'
  };

  constructor() {
    // React to tenant changes
    effect(() => {
      const tenant = this.tenantService.currentTenant();
      if (tenant?.branding) {
        this.applyBranding(tenant.branding);
      } else {
        this.applyBranding(this.defaultBranding);
      }
    });
  }

  applyBranding(branding: TenantBranding): void {
    const root = document.documentElement;

    // Apply primary color
    if (branding.primaryColor) {
      root.style.setProperty('--tenant-primary', branding.primaryColor);
      root.style.setProperty('--primary-500', branding.primaryColor);
      this.setColorVariants(root, 'primary', branding.primaryColor);
    }

    // Apply secondary color
    if (branding.secondaryColor) {
      root.style.setProperty('--tenant-secondary', branding.secondaryColor);
      root.style.setProperty('--secondary-500', branding.secondaryColor);
    }

    // Apply accent color
    if (branding.accentColor) {
      root.style.setProperty('--tenant-accent', branding.accentColor);
    }

    // Update favicon if provided
    if (branding.faviconUrl) {
      this.updateFavicon(branding.faviconUrl);
    }

    // Update document title
    if (branding.companyName) {
      this.updatePageTitle(branding.companyName);
    }

    // Apply custom CSS if provided
    if (branding.customCss) {
      this.applyCustomCss(branding.customCss);
    }
  }

  private setColorVariants(root: HTMLElement, prefix: string, baseColor: string): void {
    // Generate color variants (simplified - in production use a proper color library)
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Lighter variants
    root.style.setProperty(`--${prefix}-400`, this.adjustBrightness(r, g, b, 20));
    root.style.setProperty(`--${prefix}-300`, this.adjustBrightness(r, g, b, 40));

    // Darker variants
    root.style.setProperty(`--${prefix}-600`, this.adjustBrightness(r, g, b, -20));
    root.style.setProperty(`--${prefix}-700`, this.adjustBrightness(r, g, b, -40));
  }

  private adjustBrightness(r: number, g: number, b: number, percent: number): string {
    const factor = percent / 100;
    const newR = Math.min(255, Math.max(0, Math.round(r + (255 - r) * factor)));
    const newG = Math.min(255, Math.max(0, Math.round(g + (255 - g) * factor)));
    const newB = Math.min(255, Math.max(0, Math.round(b + (255 - b) * factor)));
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  private updateFavicon(url: string): void {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement ||
      document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = url;
    document.getElementsByTagName('head')[0].appendChild(link);
  }

  private updatePageTitle(companyName: string): void {
    const baseTitle = document.title.split(' - ').pop() || 'Inventory';
    document.title = `${companyName} - ${baseTitle}`;
  }

  private applyCustomCss(css: string): void {
    // Remove existing custom CSS
    const existingStyle = document.getElementById('tenant-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new custom CSS
    const style = document.createElement('style');
    style.id = 'tenant-custom-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  resetBranding(): void {
    this.applyBranding(this.defaultBranding);

    // Remove custom CSS
    const existingStyle = document.getElementById('tenant-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }
  }

  getLogoUrl(): string {
    const tenant = this.tenantService.currentTenant();
    return tenant?.branding?.logoUrl || '/assets/logo.svg';
  }

  getSmallLogoUrl(): string {
    const tenant = this.tenantService.currentTenant();
    return tenant?.branding?.logoSmallUrl || tenant?.branding?.logoUrl || '/assets/logo-small.svg';
  }

  getCompanyName(): string {
    const tenant = this.tenantService.currentTenant();
    return tenant?.branding?.companyName || 'GoEMR Inventory';
  }

  getTagline(): string {
    const tenant = this.tenantService.currentTenant();
    return tenant?.branding?.tagline || 'Inventory Management System';
  }
}
