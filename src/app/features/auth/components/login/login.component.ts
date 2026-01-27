import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { InputOtpModule } from 'primeng/inputotp';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { UserRole } from '@shared/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    RippleModule,
    TooltipModule,
    InputOtpModule
  ],
  template: `
    <div class="login-container">
      <!-- Left Panel - Branding & Features -->
      <div class="login-branding">
        <div class="branding-content">
          <!-- Logo -->
          <div class="logo-container">
            <div class="logo">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="40" height="40" rx="8" fill="white" fill-opacity="0.15"/>
                <path d="M24 12V36" stroke="white" stroke-width="4" stroke-linecap="round"/>
                <path d="M12 24H36" stroke="white" stroke-width="4" stroke-linecap="round"/>
                <path d="M14 28C14 28 18 20 24 20C30 20 34 28 34 28" stroke="#4ADE80" stroke-width="3" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="logo-text">
              <span class="logo-title">GoEMR</span>
              <span class="logo-subtitle">Inventory</span>
            </div>
          </div>

          <!-- Tagline -->
          <div class="tagline">
            <h1>Medical Equipment<br/>Inventory Management</h1>
            <p>Streamline your healthcare facility's equipment tracking, maintenance scheduling, and inventory control with our comprehensive management system.</p>
          </div>

          <!-- Features -->
          <div class="features">
            <div class="feature-item">
              <div class="feature-icon">
                <i class="pi pi-box"></i>
              </div>
              <div class="feature-text">
                <h4>Asset Tracking</h4>
                <p>Real-time equipment location and status monitoring</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <i class="pi pi-wrench"></i>
              </div>
              <div class="feature-text">
                <h4>Maintenance Scheduling</h4>
                <p>Automated preventive maintenance reminders</p>
              </div>
            </div>
            <div class="feature-item">
              <div class="feature-icon">
                <i class="pi pi-chart-bar"></i>
              </div>
              <div class="feature-text">
                <h4>Inventory Analytics</h4>
                <p>Low-stock alerts and usage insights</p>
              </div>
            </div>
          </div>

          <!-- Compliance Badges -->
          <div class="compliance-badges">
            <div class="badge-item">
              <span>HIPAA</span>
            </div>
            <div class="badge-item">
              <span>ABDM</span>
            </div>
            <div class="badge-item">
              <span>ISO 13485</span>
            </div>
            <div class="badge-item">
              <span>CE</span>
            </div>
          </div>
        </div>

        <!-- Background Pattern -->
        <div class="pattern-overlay"></div>
      </div>

      <!-- Right Panel - Login Form -->
      <div class="login-form-panel">
        <!-- Theme Toggle -->
        <button 
          class="theme-toggle"
          (click)="toggleTheme()"
          [pTooltip]="themeService.isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          tooltipPosition="left"
        >
          <i [class]="themeService.isDarkMode() ? 'pi pi-sun' : 'pi pi-moon'"></i>
        </button>

        <div class="form-container">
          <!-- Mobile Logo -->
          <div class="mobile-logo">
            <div class="logo">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="40" height="40" rx="8" fill="#10b981" fill-opacity="0.15"/>
                <path d="M24 12V36" stroke="#10b981" stroke-width="4" stroke-linecap="round"/>
                <path d="M12 24H36" stroke="#10b981" stroke-width="4" stroke-linecap="round"/>
                <path d="M14 28C14 28 18 20 24 20C30 20 34 28 34 28" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="logo-text">GoEMR Inventory</span>
          </div>

          <!-- Step 1: Login Form -->
          @if (currentStep() === 'login') {
            <!-- Form Header -->
            <div class="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to access your inventory management dashboard</p>
            </div>

            <!-- Login Form -->
            <form (ngSubmit)="onLogin()" class="login-form">
              <!-- Username Field -->
              <div class="form-field">
                <label for="username">Username</label>
                <div class="input-wrapper">
                  <i class="pi pi-user input-icon"></i>
                  <input
                    pInputText
                    id="username"
                    type="text"
                    [(ngModel)]="credentials.username"
                    name="username"
                    placeholder="Enter your username"
                    [class.p-invalid]="authService.error()"
                    autocomplete="username"
                  />
                </div>
              </div>

              <!-- Password Field -->
              <div class="form-field">
                <label for="password">Password</label>
                <div class="input-wrapper">
                  <i class="pi pi-lock input-icon"></i>
                  <input
                    pInputText
                    id="password"
                    [type]="showPassword() ? 'text' : 'password'"
                    [(ngModel)]="credentials.password"
                    name="password"
                    placeholder="Enter your password"
                    [class.p-invalid]="authService.error()"
                    autocomplete="current-password"
                  />
                  <button 
                    type="button" 
                    class="password-toggle"
                    (click)="togglePassword()"
                    tabindex="-1"
                  >
                    <i [class]="showPassword() ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                  </button>
                </div>
              </div>

              <!-- Remember Me & Forgot Password -->
              <div class="form-options">
                <div class="remember-me">
                  <p-checkbox
                    [(ngModel)]="credentials.rememberMe"
                    name="rememberMe"
                    [binary]="true"
                    inputId="rememberMe"
                  />
                  <label for="rememberMe">Remember me</label>
                </div>
                <a href="javascript:void(0)" class="forgot-password">Forgot password?</a>
              </div>

              <!-- Error Message -->
              @if (authService.error()) {
                <div class="error-message">
                  <i class="pi pi-exclamation-circle"></i>
                  <span>{{ authService.error() }}</span>
                </div>
              }

              <!-- Submit Button -->
              <button
                pButton
                pRipple
                type="submit"
                label="Sign In"
                class="login-button"
                [loading]="authService.isLoading()"
                [disabled]="!credentials.username || !credentials.password"
              ></button>
            </form>

            <!-- Quick Access for Demo -->
            <div class="demo-access">
              <div class="demo-divider">
                <span>Quick Demo Access</span>
              </div>
              <div class="demo-buttons">
                <button
                  pButton
                  pRipple
                  type="button"
                  class="demo-btn admin"
                  (click)="quickLogin('ADMIN')"
                  [loading]="loadingRole() === 'ADMIN'"
                  pTooltip="Login as Admin"
                  tooltipPosition="top"
                >
                  <i class="pi pi-shield"></i>
                  <span>Admin</span>
                </button>
                <button
                  pButton
                  pRipple
                  type="button"
                  class="demo-btn manager"
                  (click)="quickLogin('MANAGER')"
                  [loading]="loadingRole() === 'MANAGER'"
                  pTooltip="Login as Manager"
                  tooltipPosition="top"
                >
                  <i class="pi pi-users"></i>
                  <span>Manager</span>
                </button>
                <button
                  pButton
                  pRipple
                  type="button"
                  class="demo-btn technician"
                  (click)="quickLogin('TECHNICIAN')"
                  [loading]="loadingRole() === 'TECHNICIAN'"
                  pTooltip="Login as Technician"
                  tooltipPosition="top"
                >
                  <i class="pi pi-wrench"></i>
                  <span>Technician</span>
                </button>
                <button
                  pButton
                  pRipple
                  type="button"
                  class="demo-btn viewer"
                  (click)="quickLogin('VIEWER')"
                  [loading]="loadingRole() === 'VIEWER'"
                  pTooltip="Login as Viewer"
                  tooltipPosition="top"
                >
                  <i class="pi pi-eye"></i>
                  <span>Viewer</span>
                </button>
              </div>
            </div>
          }

          <!-- Step 2: MFA Verification -->
          @if (currentStep() === 'mfa') {
            <!-- MFA Header -->
            <div class="form-header">
              <div class="mfa-icon">
                <i class="pi pi-shield"></i>
              </div>
              <h2>Two-Factor Authentication</h2>
              <p>Enter the 6-digit verification code sent to your registered device</p>
            </div>

            <!-- MFA Form -->
            <form (ngSubmit)="onVerifyMfa()" class="login-form mfa-form">
              <div class="mfa-code-container">
                <p-inputOtp 
                  [(ngModel)]="mfaCode" 
                  name="mfaCode"
                  [length]="6"
                  [integerOnly]="true"
                  styleClass="mfa-otp"
                />
              </div>

              <!-- Demo Hint -->
              <div class="mfa-hint">
                <i class="pi pi-info-circle"></i>
                <span>Demo code: <strong>000000</strong></span>
              </div>

              <!-- Error Message -->
              @if (mfaError()) {
                <div class="error-message">
                  <i class="pi pi-exclamation-circle"></i>
                  <span>{{ mfaError() }}</span>
                </div>
              }

              <!-- Verify Button -->
              <button
                pButton
                pRipple
                type="submit"
                label="Verify Code"
                class="login-button"
                [loading]="verifyingMfa()"
                [disabled]="!mfaCode || mfaCode.length !== 6"
              ></button>

              <!-- Resend Code -->
              <div class="mfa-actions">
                <button
                  pButton
                  pRipple
                  type="button"
                  label="Resend Code"
                  class="p-button-text p-button-sm"
                  icon="pi pi-refresh"
                  (click)="resendCode()"
                  [disabled]="resendCooldown() > 0"
                >
                </button>
                @if (resendCooldown() > 0) {
                  <span class="cooldown-timer">{{ resendCooldown() }}s</span>
                }
              </div>

              <!-- Back to Login -->
              <button
                pButton
                pRipple
                type="button"
                label="Back to Login"
                class="p-button-outlined back-button"
                icon="pi pi-arrow-left"
                (click)="backToLogin()"
              ></button>
            </form>
          }

          <!-- Footer -->
          <div class="form-footer">
            <p>© 2025 GoEMR Inventory. All rights reserved.</p>
            <div class="footer-links">
              <a href="#">Privacy Policy</a>
              <span>•</span>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      min-height: 100vh;
      background: var(--bg-secondary);
    }

    /* ===== LEFT PANEL - BRANDING ===== */
    .login-branding {
      flex: 1;
      background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%);
      padding: 3rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      overflow: hidden;

      @media (max-width: 1024px) {
        display: none;
      }
    }

    .branding-content {
      position: relative;
      z-index: 2;
      max-width: 540px;
      margin: 0 auto;
    }

    .pattern-overlay {
      position: absolute;
      inset: 0;
      background-image: 
        radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
        url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      opacity: 0.6;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 3rem;
    }

    .logo {
      width: 56px;
      height: 56px;
      
      svg {
        width: 100%;
        height: 100%;
      }
    }

    .logo-text {
      display: flex;
      flex-direction: column;
      
      .logo-title {
        font-family: var(--font-display);
        font-size: 1.75rem;
        font-weight: 700;
        color: white;
        line-height: 1.1;
      }
      
      .logo-subtitle {
        font-size: 0.9375rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.85);
      }
    }

    .tagline {
      margin-bottom: 3rem;
      
      h1 {
        font-family: var(--font-display);
        font-size: 2.5rem;
        font-weight: 700;
        color: white;
        line-height: 1.2;
        margin: 0 0 1rem 0;
      }
      
      p {
        font-size: 1.0625rem;
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.6;
        margin: 0;
      }
    }

    .features {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .feature-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      flex-shrink: 0;
      
      i {
        font-size: 1.25rem;
        color: white;
      }
    }

    .feature-text {
      h4 {
        font-size: 1rem;
        font-weight: 600;
        color: white;
        margin: 0 0 0.25rem 0;
      }
      
      p {
        font-size: 0.875rem;
        color: rgba(255, 255, 255, 0.75);
        margin: 0;
      }
    }

    .compliance-badges {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .badge-item {
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 9999px;
      
      span {
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
        letter-spacing: 0.05em;
      }
    }

    /* ===== RIGHT PANEL - FORM ===== */
    .login-form-panel {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      position: relative;
      background: var(--bg-primary);

      @media (min-width: 1025px) {
        max-width: 560px;
      }
    }

    .theme-toggle {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 50%;
      cursor: pointer;
      transition: all var(--transition-fast);
      
      i {
        font-size: 1.125rem;
        color: var(--text-secondary);
      }
      
      &:hover {
        background: var(--bg-hover);
        border-color: var(--primary-500);
        
        i {
          color: var(--primary-600);
        }
      }
    }

    .form-container {
      width: 100%;
      max-width: 400px;
    }

    .mobile-logo {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-bottom: 2rem;
      
      @media (max-width: 1024px) {
        display: flex;
      }
      
      .logo {
        width: 40px;
        height: 40px;
      }
      
      .logo-text {
        font-family: var(--font-display);
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--primary-600);
      }
    }

    .form-header {
      margin-bottom: 2rem;
      text-align: center;
      
      h2 {
        font-family: var(--font-display);
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 0.5rem 0;
      }
      
      p {
        font-size: 0.9375rem;
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .mfa-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 1rem auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-100) 0%, var(--primary-50) 100%);
      border-radius: 50%;
      
      i {
        font-size: 1.75rem;
        color: var(--primary-600);
      }
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      
      label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
      }
    }

    .input-wrapper {
      position: relative;
      
      .input-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        z-index: 1;
        pointer-events: none;
      }
      
      input[pInputText] {
        width: 100%;
        padding: 0.875rem 1rem 0.875rem 2.75rem;
        font-size: 0.9375rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        transition: all var(--transition-fast);
        
        &::placeholder {
          color: var(--text-muted);
        }
        
        &:focus {
          outline: none;
          border-color: var(--primary-500);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }
        
        &.p-invalid {
          border-color: var(--alert-500);
        }
      }
      
      /* Password field needs extra right padding for toggle button */
      input[type="password"],
      input#password {
        padding-right: 3rem;
      }
      
      .password-toggle {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        padding: 0.25rem;
        cursor: pointer;
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
        
        &:hover {
          color: var(--text-secondary);
          background: var(--bg-hover);
        }
        
        i {
          font-size: 1rem;
        }
      }
    }

    /* Remove old password-wrapper styles since we're using regular input now */

    .form-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .remember-me {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        label {
          font-size: 0.875rem;
          color: var(--text-secondary);
          cursor: pointer;
        }
      }
      
      .forgot-password {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--primary-600);
        
        &:hover {
          color: var(--primary-700);
          text-decoration: underline;
        }
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(244, 63, 94, 0.1);
      border: 1px solid rgba(244, 63, 94, 0.2);
      border-radius: var(--radius-md);
      
      i {
        color: var(--alert-500);
      }
      
      span {
        font-size: 0.875rem;
        color: var(--alert-600);
      }
    }

    .login-button {
      width: 100%;
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
      border: none;
      border-radius: var(--radius-md);
      color: white;
      cursor: pointer;
      transition: all var(--transition-fast);
      
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    /* MFA Specific Styles */
    .mfa-form {
      text-align: center;
    }

    .mfa-code-container {
      display: flex;
      justify-content: center;
      margin-bottom: 1rem;
      
      :host ::ng-deep .mfa-otp {
        gap: 0.5rem;
        
        .p-inputotp-input {
          width: 3rem;
          height: 3.5rem;
          font-size: 1.5rem;
          font-weight: 600;
          text-align: center;
          background: var(--bg-secondary);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          transition: all var(--transition-fast);
          
          &:focus {
            outline: none;
            border-color: var(--primary-500);
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
          }
        }
      }
    }

    .mfa-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--primary-50);
      border: 1px solid var(--primary-200);
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
      
      i {
        color: var(--primary-600);
      }
      
      span {
        font-size: 0.875rem;
        color: var(--primary-700);
        
        strong {
          font-family: var(--font-mono);
          letter-spacing: 0.1em;
        }
      }
    }

    .mfa-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
      
      .cooldown-timer {
        font-size: 0.875rem;
        color: var(--text-muted);
      }
    }

    .back-button {
      width: 100%;
      margin-top: 0.5rem;
    }

    .demo-access {
      margin-top: 2rem;
    }

    .demo-divider {
      display: flex;
      align-items: center;
      margin-bottom: 1.25rem;
      
      &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--border-color);
      }
      
      span {
        padding: 0 1rem;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }

    .demo-buttons {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .demo-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      font-size: 0.8125rem;
      font-weight: 500;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
      
      i {
        font-size: 0.875rem;
      }
      
      &:hover {
        border-color: var(--primary-500);
        color: var(--primary-600);
        background: var(--primary-50);
      }
      
      &.admin:hover {
        border-color: #8b5cf6;
        color: #8b5cf6;
        background: rgba(139, 92, 246, 0.1);
      }
      
      &.manager:hover {
        border-color: #0ea5e9;
        color: #0ea5e9;
        background: rgba(14, 165, 233, 0.1);
      }
      
      &.technician:hover {
        border-color: #f59e0b;
        color: #f59e0b;
        background: rgba(245, 158, 11, 0.1);
      }
      
      &.viewer:hover {
        border-color: #64748b;
        color: #64748b;
        background: rgba(100, 116, 139, 0.1);
      }
    }

    .form-footer {
      margin-top: 2rem;
      text-align: center;
      
      p {
        font-size: 0.8125rem;
        color: var(--text-muted);
        margin-bottom: 0.5rem;
      }
      
      .footer-links {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        
        a {
          font-size: 0.8125rem;
          color: var(--text-tertiary);
          
          &:hover {
            color: var(--primary-600);
          }
        }
        
        span {
          color: var(--text-muted);
        }
      }
    }
  `]
})
export class LoginComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private router = inject(Router);

  credentials = {
    username: '',
    password: '',
    rememberMe: false
  };

  // Password visibility toggle
  showPassword = signal(false);

  // MFA related state
  currentStep = signal<'login' | 'mfa'>('login');
  mfaCode = '';
  mfaError = signal<string | null>(null);
  verifyingMfa = signal(false);
  resendCooldown = signal(0);
  pendingRole: UserRole | null = null;

  loadingRole = signal<string | null>(null);

  // Magic code for demo
  private readonly MAGIC_CODE = '000000';

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  async onLogin(): Promise<void> {
    // First validate credentials
    const success = await this.authService.login(this.credentials);
    if (success) {
      // Show MFA step
      this.currentStep.set('mfa');
      this.startResendCooldown();
    }
  }

  async quickLogin(role: string): Promise<void> {
    this.loadingRole.set(role);
    const userRole = UserRole[role as keyof typeof UserRole];
    this.pendingRole = userRole;
    
    // Simulate credential validation
    await new Promise(resolve => setTimeout(resolve, 500));
    this.loadingRole.set(null);
    
    // Show MFA step
    this.currentStep.set('mfa');
    this.startResendCooldown();
  }

  async onVerifyMfa(): Promise<void> {
    this.mfaError.set(null);
    this.verifyingMfa.set(true);

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (this.mfaCode === this.MAGIC_CODE) {
      // MFA successful
      if (this.pendingRole) {
        // Quick login path
        await this.authService.quickLogin(this.pendingRole);
      }
      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    } else {
      this.mfaError.set('Invalid verification code. Please try again.');
      this.mfaCode = '';
    }

    this.verifyingMfa.set(false);
  }

  resendCode(): void {
    if (this.resendCooldown() > 0) return;
    
    // Simulate sending new code
    this.startResendCooldown();
    // In a real app, this would trigger an API call to resend the code
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(30);
    const interval = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        clearInterval(interval);
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  backToLogin(): void {
    this.currentStep.set('login');
    this.mfaCode = '';
    this.mfaError.set(null);
    this.pendingRole = null;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
