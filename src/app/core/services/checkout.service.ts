import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Checkout, CheckoutStatus, CheckoutSettings, OverdueCheckoutSummary, PaginatedResponse } from '../../shared/models';

export interface CheckoutRequest {
  itemId: string;
  quantity: number;
  checkedOutBy: string;
  department?: string;
  purpose?: string;
  expectedReturnDate: string;
  lotBarcodeId?: string;
  notes?: string;
}

export interface CheckinRequest {
  returnCondition: string;
  returnNotes?: string;
  inspectionPassed?: boolean;
}

export interface CheckoutSearchParams {
  itemId?: string;
  checkedOutBy?: string;
  status?: CheckoutStatus;
  overdueOnly?: boolean;
  department?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CheckoutAuditEvent {
  id: string;
  checkoutId: string;
  eventType: 'checkout' | 'checkin' | 'extend' | 'reminder_sent' | 'status_change' | 'note_added';
  description: string;
  performedBy: string;
  performedByName: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface CheckoutStats {
  totalActive: number;
  totalOverdue: number;
  totalReturnedToday: number;
  totalCheckedOutToday: number;
  avgCheckoutDuration: number;
  overdueByDepartment: { department: string; count: number }[];
  checkoutsByDepartment: { department: string; count: number }[];
}

export interface CheckoutTrend {
  date: string;
  checkouts: number;
  returns: number;
}

export interface ReminderRequest {
  checkoutId: string;
  method: 'email' | 'sms' | 'both';
  customMessage?: string;
}

export interface AvailableUser {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
}

export interface AvailableItem {
  id: string;
  name: string;
  sku: string;
  availableQuantity: number;
  isCheckable: boolean;
  photoUrl?: string;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory/checkouts`;
  private readonly USE_MOCK = true;

  // Mock data
  private mockCheckouts: Checkout[] = [
    {
      id: '1',
      itemId: 'item-1',
      itemName: 'Blood Pressure Monitor',
      itemSku: 'BPM-001',
      quantity: 1,
      checkedOutBy: 'user-1',
      checkedOutByName: 'Dr. Sarah Smith',
      checkedOutByEmail: 'sarah.smith@hospital.com',
      department: 'Cardiology',
      purpose: 'Patient rounds',
      status: CheckoutStatus.ACTIVE,
      checkoutDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      isOverdue: false,
      daysOverdue: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      itemId: 'item-2',
      itemName: 'Portable ECG Machine',
      itemSku: 'ECG-PORT-001',
      quantity: 1,
      checkedOutBy: 'user-2',
      checkedOutByName: 'Nurse Mike Johnson',
      checkedOutByEmail: 'mike.johnson@hospital.com',
      department: 'Emergency',
      purpose: 'Emergency response kit',
      status: CheckoutStatus.OVERDUE,
      checkoutDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      isOverdue: true,
      daysOverdue: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      itemId: 'item-3',
      itemName: 'Wheelchair',
      itemSku: 'WC-STD-001',
      quantity: 1,
      checkedOutBy: 'user-3',
      checkedOutByName: 'Physical Therapist Lee',
      checkedOutByEmail: 'pt.lee@hospital.com',
      department: 'Physical Therapy',
      purpose: 'Patient mobility',
      status: CheckoutStatus.RETURNED,
      checkoutDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      actualReturnDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      returnCondition: 'good',
      checkedInBy: 'user-3',
      checkedInByName: 'Physical Therapist Lee',
      isOverdue: false,
      daysOverdue: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      itemId: 'item-4',
      itemName: 'Defibrillator',
      itemSku: 'DEF-AED-001',
      quantity: 1,
      checkedOutBy: 'user-4',
      checkedOutByName: 'Dr. Emily Chen',
      checkedOutByEmail: 'emily.chen@hospital.com',
      department: 'ICU',
      purpose: 'Emergency backup',
      status: CheckoutStatus.OVERDUE,
      checkoutDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      isOverdue: true,
      daysOverdue: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      itemId: 'item-5',
      itemName: 'Pulse Oximeter',
      itemSku: 'PO-FINGER-001',
      quantity: 2,
      checkedOutBy: 'user-5',
      checkedOutByName: 'Nurse Patricia Brown',
      checkedOutByEmail: 'patricia.brown@hospital.com',
      department: 'General Medicine',
      purpose: 'Ward monitoring',
      status: CheckoutStatus.ACTIVE,
      checkoutDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      isOverdue: false,
      daysOverdue: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '6',
      itemId: 'item-6',
      itemName: 'Infusion Pump',
      itemSku: 'IP-SMART-001',
      quantity: 1,
      checkedOutBy: 'user-6',
      checkedOutByName: 'Dr. James Wilson',
      checkedOutByEmail: 'james.wilson@hospital.com',
      department: 'Oncology',
      purpose: 'Chemotherapy administration',
      status: CheckoutStatus.OVERDUE,
      checkoutDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      expectedReturnDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      isOverdue: true,
      daysOverdue: 18,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  private mockAuditEvents: CheckoutAuditEvent[] = [
    {
      id: 'evt-1',
      checkoutId: '1',
      eventType: 'checkout',
      description: 'Item checked out',
      performedBy: 'user-1',
      performedByName: 'Dr. Sarah Smith',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'evt-2',
      checkoutId: '2',
      eventType: 'checkout',
      description: 'Item checked out',
      performedBy: 'user-2',
      performedByName: 'Nurse Mike Johnson',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'evt-3',
      checkoutId: '2',
      eventType: 'reminder_sent',
      description: 'Overdue reminder sent via email',
      performedBy: 'system',
      performedByName: 'System',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    }
  ];

  checkout(request: CheckoutRequest): Observable<Checkout> {
    if (this.USE_MOCK) {
      const newCheckout: Checkout = {
        id: `checkout-${Date.now()}`,
        itemId: request.itemId,
        itemName: 'Mock Item',
        itemSku: 'MOCK-001',
        quantity: request.quantity,
        checkedOutBy: request.checkedOutBy,
        checkedOutByName: 'Current User',
        department: request.department,
        purpose: request.purpose,
        status: CheckoutStatus.ACTIVE,
        checkoutDate: new Date(),
        expectedReturnDate: new Date(request.expectedReturnDate),
        isOverdue: false,
        daysOverdue: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.mockCheckouts.push(newCheckout);
      return of(newCheckout).pipe(delay(300));
    }
    return this.http.post<Checkout>(this.apiUrl, request);
  }

  checkin(checkoutId: string, request: CheckinRequest): Observable<Checkout> {
    if (this.USE_MOCK) {
      const checkout = this.mockCheckouts.find(c => c.id === checkoutId);
      if (checkout) {
        checkout.status = CheckoutStatus.RETURNED;
        checkout.actualReturnDate = new Date();
        checkout.returnCondition = request.returnCondition;
        checkout.returnNotes = request.returnNotes;
        checkout.updatedAt = new Date();
      }
      return of(checkout!).pipe(delay(300));
    }
    return this.http.post<Checkout>(`${this.apiUrl}/${checkoutId}/checkin`, request);
  }

  extendCheckout(checkoutId: string, newExpectedReturnDate: string, reason: string): Observable<Checkout> {
    if (this.USE_MOCK) {
      const checkout = this.mockCheckouts.find(c => c.id === checkoutId);
      if (checkout) {
        checkout.expectedReturnDate = new Date(newExpectedReturnDate);
        checkout.status = CheckoutStatus.ACTIVE;
        checkout.isOverdue = false;
        checkout.daysOverdue = 0;
        checkout.updatedAt = new Date();

        // Add audit event
        this.mockAuditEvents.push({
          id: `evt-${Date.now()}`,
          checkoutId,
          eventType: 'extend',
          description: `Checkout extended. Reason: ${reason}`,
          performedBy: 'current-user',
          performedByName: 'Current User',
          timestamp: new Date()
        });
      }
      return of(checkout!).pipe(delay(300));
    }
    return this.http.post<Checkout>(`${this.apiUrl}/${checkoutId}/extend`, {
      new_expected_return_date: newExpectedReturnDate,
      reason
    });
  }

  getCheckout(id: string): Observable<Checkout> {
    if (this.USE_MOCK) {
      const checkout = this.mockCheckouts.find(c => c.id === id);
      return of(checkout!).pipe(delay(200));
    }
    return this.http.get<Checkout>(`${this.apiUrl}/${id}`);
  }

  getCheckouts(params?: CheckoutSearchParams): Observable<PaginatedResponse<Checkout>> {
    if (this.USE_MOCK) {
      let filtered = [...this.mockCheckouts];
      if (params?.itemId) {
        filtered = filtered.filter(c => c.itemId === params.itemId);
      }
      if (params?.checkedOutBy) {
        filtered = filtered.filter(c => c.checkedOutBy === params.checkedOutBy);
      }
      if (params?.status) {
        filtered = filtered.filter(c => c.status === params.status);
      }
      if (params?.overdueOnly) {
        filtered = filtered.filter(c => c.isOverdue);
      }
      if (params?.department) {
        filtered = filtered.filter(c => c.department === params.department);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(c =>
          c.itemName.toLowerCase().includes(search) ||
          c.itemSku.toLowerCase().includes(search) ||
          c.checkedOutByName.toLowerCase().includes(search)
        );
      }
      return of({
        items: filtered,
        total: filtered.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 25,
        totalPages: 1
      }).pipe(delay(200));
    }
    return this.http.get<PaginatedResponse<Checkout>>(this.apiUrl, { params: params as any });
  }

  getOverdueCheckouts(department?: string): Observable<OverdueCheckoutSummary> {
    if (this.USE_MOCK) {
      let overdue = this.mockCheckouts.filter(c => c.isOverdue);
      if (department) {
        overdue = overdue.filter(c => c.department === department);
      }
      return of({
        totalOverdue: overdue.length,
        overdue1To7Days: overdue.filter(c => c.daysOverdue <= 7).length,
        overdue8To14Days: overdue.filter(c => c.daysOverdue > 7 && c.daysOverdue <= 14).length,
        overdue15PlusDays: overdue.filter(c => c.daysOverdue > 14).length,
        overdueCheckouts: overdue.sort((a, b) => b.daysOverdue - a.daysOverdue)
      }).pipe(delay(200));
    }
    const params: any = {};
    if (department) params.department = department;
    return this.http.get<OverdueCheckoutSummary>(`${this.apiUrl}/overdue`, { params });
  }

  getCheckoutSettings(itemId: string): Observable<CheckoutSettings> {
    if (this.USE_MOCK) {
      return of({
        itemId,
        isCheckable: true,
        maxCheckoutDays: 7,
        maxQuantityPerCheckout: 1,
        requiresApproval: false,
        approverIds: [],
        sendReminders: true,
        reminderDaysBefore: [3, 1]
      }).pipe(delay(200));
    }
    return this.http.get<CheckoutSettings>(`${environment.apiUrl}/inventory/items/${itemId}/checkout-settings`);
  }

  updateCheckoutSettings(settings: CheckoutSettings): Observable<CheckoutSettings> {
    if (this.USE_MOCK) {
      return of(settings).pipe(delay(300));
    }
    return this.http.put<CheckoutSettings>(
      `${environment.apiUrl}/inventory/items/${settings.itemId}/checkout-settings`,
      { settings }
    );
  }

  getCheckoutHistory(checkoutId: string): Observable<CheckoutAuditEvent[]> {
    if (this.USE_MOCK) {
      const events = this.mockAuditEvents
        .filter(e => e.checkoutId === checkoutId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return of(events).pipe(delay(200));
    }
    return this.http.get<CheckoutAuditEvent[]>(`${this.apiUrl}/${checkoutId}/history`);
  }

  getCheckoutStats(): Observable<CheckoutStats> {
    if (this.USE_MOCK) {
      const active = this.mockCheckouts.filter(c => c.status === CheckoutStatus.ACTIVE);
      const overdue = this.mockCheckouts.filter(c => c.isOverdue);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const returnedToday = this.mockCheckouts.filter(c =>
        c.actualReturnDate && new Date(c.actualReturnDate) >= today
      );
      const checkedOutToday = this.mockCheckouts.filter(c =>
        new Date(c.checkoutDate) >= today
      );

      // Group overdue by department
      const overdueByDept = overdue.reduce((acc, c) => {
        const dept = c.department || 'Unknown';
        const existing = acc.find(x => x.department === dept);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ department: dept, count: 1 });
        }
        return acc;
      }, [] as { department: string; count: number }[]);

      // Group active by department
      const activeByDept = active.reduce((acc, c) => {
        const dept = c.department || 'Unknown';
        const existing = acc.find(x => x.department === dept);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ department: dept, count: 1 });
        }
        return acc;
      }, [] as { department: string; count: number }[]);

      return of({
        totalActive: active.length,
        totalOverdue: overdue.length,
        totalReturnedToday: returnedToday.length,
        totalCheckedOutToday: checkedOutToday.length,
        avgCheckoutDuration: 5.2,
        overdueByDepartment: overdueByDept,
        checkoutsByDepartment: activeByDept
      }).pipe(delay(200));
    }
    return this.http.get<CheckoutStats>(`${this.apiUrl}/stats`);
  }

  getCheckoutTrends(days: number = 30): Observable<CheckoutTrend[]> {
    if (this.USE_MOCK) {
      const trends: CheckoutTrend[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        trends.push({
          date: date.toISOString().split('T')[0],
          checkouts: Math.floor(Math.random() * 10) + 2,
          returns: Math.floor(Math.random() * 8) + 1
        });
      }
      return of(trends).pipe(delay(200));
    }
    return this.http.get<CheckoutTrend[]>(`${this.apiUrl}/trends`, { params: { days } });
  }

  sendReminder(request: ReminderRequest): Observable<{ success: boolean; message: string }> {
    if (this.USE_MOCK) {
      const checkout = this.mockCheckouts.find(c => c.id === request.checkoutId);
      if (checkout) {
        this.mockAuditEvents.push({
          id: `evt-${Date.now()}`,
          checkoutId: request.checkoutId,
          eventType: 'reminder_sent',
          description: `Reminder sent via ${request.method}`,
          performedBy: 'current-user',
          performedByName: 'Current User',
          timestamp: new Date(),
          metadata: { method: request.method, customMessage: request.customMessage }
        });
      }
      return of({
        success: true,
        message: `Reminder sent to ${checkout?.checkedOutByName}`
      }).pipe(delay(500));
    }
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/${request.checkoutId}/remind`, request);
  }

  sendBulkReminders(checkoutIds: string[], method: 'email' | 'sms' | 'both'): Observable<{ sent: number; failed: number }> {
    if (this.USE_MOCK) {
      checkoutIds.forEach(id => {
        this.mockAuditEvents.push({
          id: `evt-${Date.now()}-${id}`,
          checkoutId: id,
          eventType: 'reminder_sent',
          description: `Bulk reminder sent via ${method}`,
          performedBy: 'current-user',
          performedByName: 'Current User',
          timestamp: new Date()
        });
      });
      return of({ sent: checkoutIds.length, failed: 0 }).pipe(delay(500));
    }
    return this.http.post<{ sent: number; failed: number }>(`${this.apiUrl}/bulk-remind`, {
      checkout_ids: checkoutIds,
      method
    });
  }

  getAvailableUsers(search?: string): Observable<AvailableUser[]> {
    if (this.USE_MOCK) {
      const users: AvailableUser[] = [
        { id: 'user-1', name: 'Dr. Sarah Smith', email: 'sarah.smith@hospital.com', department: 'Cardiology', role: 'Physician' },
        { id: 'user-2', name: 'Nurse Mike Johnson', email: 'mike.johnson@hospital.com', department: 'Emergency', role: 'Nurse' },
        { id: 'user-3', name: 'Physical Therapist Lee', email: 'pt.lee@hospital.com', department: 'Physical Therapy', role: 'Therapist' },
        { id: 'user-4', name: 'Dr. Emily Chen', email: 'emily.chen@hospital.com', department: 'ICU', role: 'Physician' },
        { id: 'user-5', name: 'Nurse Patricia Brown', email: 'patricia.brown@hospital.com', department: 'General Medicine', role: 'Nurse' },
        { id: 'user-6', name: 'Dr. James Wilson', email: 'james.wilson@hospital.com', department: 'Oncology', role: 'Physician' },
        { id: 'user-7', name: 'Lab Tech Rodriguez', email: 'lab.rodriguez@hospital.com', department: 'Laboratory', role: 'Technician' },
        { id: 'user-8', name: 'Radiology Tech Kim', email: 'rad.kim@hospital.com', department: 'Radiology', role: 'Technician' }
      ];
      let filtered = users;
      if (search) {
        const s = search.toLowerCase();
        filtered = users.filter(u =>
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          u.department.toLowerCase().includes(s)
        );
      }
      return of(filtered).pipe(delay(100));
    }
    return this.http.get<AvailableUser[]>(`${environment.apiUrl}/users`, { params: search ? { search } : {} });
  }

  getAvailableItems(search?: string): Observable<AvailableItem[]> {
    if (this.USE_MOCK) {
      const items: AvailableItem[] = [
        { id: 'item-1', name: 'Blood Pressure Monitor', sku: 'BPM-001', availableQuantity: 5, isCheckable: true, category: 'Monitoring' },
        { id: 'item-2', name: 'Portable ECG Machine', sku: 'ECG-PORT-001', availableQuantity: 2, isCheckable: true, category: 'Diagnostics' },
        { id: 'item-3', name: 'Wheelchair', sku: 'WC-STD-001', availableQuantity: 8, isCheckable: true, category: 'Mobility' },
        { id: 'item-4', name: 'Defibrillator', sku: 'DEF-AED-001', availableQuantity: 3, isCheckable: true, category: 'Emergency' },
        { id: 'item-5', name: 'Pulse Oximeter', sku: 'PO-FINGER-001', availableQuantity: 15, isCheckable: true, category: 'Monitoring' },
        { id: 'item-6', name: 'Infusion Pump', sku: 'IP-SMART-001', availableQuantity: 4, isCheckable: true, category: 'Infusion' },
        { id: 'item-7', name: 'Ventilator', sku: 'VENT-ICU-001', availableQuantity: 2, isCheckable: true, category: 'Respiratory' },
        { id: 'item-8', name: 'Patient Monitor', sku: 'PM-BEDSIDE-001', availableQuantity: 6, isCheckable: true, category: 'Monitoring' }
      ];
      let filtered = items;
      if (search) {
        const s = search.toLowerCase();
        filtered = items.filter(i =>
          i.name.toLowerCase().includes(s) ||
          i.sku.toLowerCase().includes(s) ||
          i.category?.toLowerCase().includes(s)
        );
      }
      return of(filtered).pipe(delay(100));
    }
    return this.http.get<AvailableItem[]>(`${environment.apiUrl}/inventory/items/available`, {
      params: search ? { search } : {}
    });
  }

  lookupByBarcode(barcode: string): Observable<AvailableItem | null> {
    if (this.USE_MOCK) {
      // Simulate barcode lookup - map some barcodes to items
      const barcodeMap: Record<string, string> = {
        'BPM001': 'item-1',
        'ECG001': 'item-2',
        'WC001': 'item-3'
      };
      const itemId = barcodeMap[barcode.toUpperCase()];
      if (itemId) {
        return this.getAvailableItems().pipe(
          map(items => items.find(item => item.id === itemId) || null),
          delay(100)
        );
      }
      return of(null).pipe(delay(100));
    }
    return this.http.get<AvailableItem | null>(`${environment.apiUrl}/inventory/barcodes/lookup`, {
      params: { barcode }
    });
  }

  getDepartments(): Observable<string[]> {
    if (this.USE_MOCK) {
      return of([
        'Cardiology',
        'Emergency',
        'General Medicine',
        'ICU',
        'Laboratory',
        'Oncology',
        'Physical Therapy',
        'Radiology',
        'Surgery',
        'Pediatrics'
      ]).pipe(delay(100));
    }
    return this.http.get<string[]>(`${environment.apiUrl}/departments`);
  }

  addNote(checkoutId: string, note: string): Observable<CheckoutAuditEvent> {
    if (this.USE_MOCK) {
      const event: CheckoutAuditEvent = {
        id: `evt-${Date.now()}`,
        checkoutId,
        eventType: 'note_added',
        description: note,
        performedBy: 'current-user',
        performedByName: 'Current User',
        timestamp: new Date()
      };
      this.mockAuditEvents.push(event);
      return of(event).pipe(delay(200));
    }
    return this.http.post<CheckoutAuditEvent>(`${this.apiUrl}/${checkoutId}/notes`, { note });
  }
}
