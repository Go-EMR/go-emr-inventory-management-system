import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemTrackedDate, DateAlertConfig, DateAlert, TrackedDateType, DateAlertSeverity } from '../../shared/models';

export interface CreateTrackedDateRequest {
  itemId: string;
  dateType: TrackedDateType;
  customTypeName?: string;
  dueDate: string;
  notes?: string;
  isRecurring: boolean;
  recurrenceDays?: number;
}

@Injectable({ providedIn: 'root' })
export class DateAlertService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory`;
  private readonly USE_MOCK = true;

  // Mock data
  private mockAlerts: DateAlert[] = [
    {
      id: '1',
      itemId: 'item-1',
      itemName: 'Defibrillator AED',
      trackedDateId: 'td-1',
      dateType: TrackedDateType.MAINTENANCE_DUE,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      daysUntilDue: 5,
      severity: DateAlertSeverity.URGENT,
      isAcknowledged: false,
      createdAt: new Date()
    },
    {
      id: '2',
      itemId: 'item-2',
      itemName: 'Calibration Kit',
      trackedDateId: 'td-2',
      dateType: TrackedDateType.CALIBRATION_DUE,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      daysUntilDue: 14,
      severity: DateAlertSeverity.WARNING,
      isAcknowledged: false,
      createdAt: new Date()
    },
    {
      id: '3',
      itemId: 'item-3',
      itemName: 'Ultrasound Machine',
      trackedDateId: 'td-3',
      dateType: TrackedDateType.WARRANTY_EXPIRY,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      daysUntilDue: 30,
      severity: DateAlertSeverity.INFO,
      isAcknowledged: false,
      createdAt: new Date()
    },
    {
      id: '4',
      itemId: 'item-4',
      itemName: 'Surgical Laser',
      trackedDateId: 'td-4',
      dateType: TrackedDateType.INSPECTION_DUE,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      daysUntilDue: -2,
      severity: DateAlertSeverity.CRITICAL,
      isAcknowledged: false,
      createdAt: new Date()
    }
  ];

  private mockConfigs: DateAlertConfig[] = [
    {
      id: '1',
      dateType: TrackedDateType.MAINTENANCE_DUE,
      alertDaysBefore: [30, 14, 7, 1],
      emailEnabled: true,
      dashboardEnabled: true,
      webhookEnabled: false,
      emailRecipients: ['maintenance@example.com'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      dateType: TrackedDateType.CALIBRATION_DUE,
      alertDaysBefore: [30, 14, 7, 1],
      emailEnabled: true,
      dashboardEnabled: true,
      webhookEnabled: false,
      emailRecipients: ['calibration@example.com'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  createTrackedDate(request: CreateTrackedDateRequest): Observable<ItemTrackedDate> {
    if (this.USE_MOCK) {
      const tracked: ItemTrackedDate = {
        id: `td-${Date.now()}`,
        itemId: request.itemId,
        dateType: request.dateType,
        customTypeName: request.customTypeName,
        dueDate: new Date(request.dueDate),
        notes: request.notes,
        isRecurring: request.isRecurring,
        recurrenceDays: request.recurrenceDays,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return of(tracked).pipe(delay(300));
    }
    return this.http.post<ItemTrackedDate>(`${this.apiUrl}/items/${request.itemId}/tracked-dates`, request);
  }

  getTrackedDates(itemId: string, dateType?: TrackedDateType): Observable<ItemTrackedDate[]> {
    if (this.USE_MOCK) {
      return of([]).pipe(delay(200));
    }
    const params: any = {};
    if (dateType) params.date_type_filter = dateType;
    return this.http.get<ItemTrackedDate[]>(`${this.apiUrl}/items/${itemId}/tracked-dates`, { params });
  }

  completeTrackedDate(id: string, notes?: string): Observable<ItemTrackedDate> {
    if (this.USE_MOCK) {
      return of({
        id,
        itemId: 'item-1',
        dateType: TrackedDateType.MAINTENANCE_DUE,
        dueDate: new Date(),
        completedDate: new Date(),
        notes,
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).pipe(delay(300));
    }
    return this.http.post<ItemTrackedDate>(`${this.apiUrl}/tracked-dates/${id}/complete`, { notes });
  }

  deleteTrackedDate(id: string): Observable<void> {
    if (this.USE_MOCK) {
      return of(void 0).pipe(delay(200));
    }
    return this.http.delete<void>(`${this.apiUrl}/tracked-dates/${id}`);
  }

  getAlertConfigs(): Observable<DateAlertConfig[]> {
    if (this.USE_MOCK) {
      return of(this.mockConfigs).pipe(delay(200));
    }
    return this.http.get<DateAlertConfig[]>(`${this.apiUrl}/date-alert-configs`);
  }

  updateAlertConfig(config: DateAlertConfig): Observable<DateAlertConfig> {
    if (this.USE_MOCK) {
      const index = this.mockConfigs.findIndex(c => c.id === config.id);
      if (index >= 0) {
        this.mockConfigs[index] = { ...config, updatedAt: new Date() };
      }
      return of(config).pipe(delay(300));
    }
    return this.http.patch<DateAlertConfig>(`${this.apiUrl}/date-alert-configs/${config.id}`, config);
  }

  getUpcomingAlerts(daysAhead: number = 30, dateType?: TrackedDateType, includeAcknowledged: boolean = false): Observable<DateAlert[]> {
    if (this.USE_MOCK) {
      let filtered = this.mockAlerts.filter(a => a.daysUntilDue <= daysAhead);
      if (dateType) {
        filtered = filtered.filter(a => a.dateType === dateType);
      }
      if (!includeAcknowledged) {
        filtered = filtered.filter(a => !a.isAcknowledged);
      }
      return of(filtered.sort((a, b) => a.daysUntilDue - b.daysUntilDue)).pipe(delay(200));
    }
    const params: any = { days_ahead: daysAhead, include_acknowledged: includeAcknowledged };
    if (dateType) params.date_type_filter = dateType;
    return this.http.get<DateAlert[]>(`${this.apiUrl}/date-alerts/upcoming`, { params });
  }

  acknowledgeAlert(id: string, notes?: string): Observable<DateAlert> {
    if (this.USE_MOCK) {
      const alert = this.mockAlerts.find(a => a.id === id);
      if (alert) {
        alert.isAcknowledged = true;
        alert.acknowledgedAt = new Date();
      }
      return of(alert!).pipe(delay(300));
    }
    return this.http.post<DateAlert>(`${this.apiUrl}/date-alerts/${id}/acknowledge`, { notes });
  }
}
