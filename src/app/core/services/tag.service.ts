import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tag, ItemTag, PaginatedResponse } from '../../shared/models';

export interface CreateTagRequest {
  name: string;
  color: string;
  description?: string;
}

export interface TagSearchParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory/tags`;
  private readonly USE_MOCK = true;

  // Mock data
  private mockTags: Tag[] = [
    { id: '1', name: 'Critical', color: '#EF4444', description: 'Critical items requiring immediate attention', itemCount: 12, createdAt: new Date(), updatedAt: new Date() },
    { id: '2', name: 'Hazardous', color: '#F59E0B', description: 'Hazardous materials requiring special handling', itemCount: 8, createdAt: new Date(), updatedAt: new Date() },
    { id: '3', name: 'Refrigerated', color: '#3B82F6', description: 'Items requiring cold storage', itemCount: 25, createdAt: new Date(), updatedAt: new Date() },
    { id: '4', name: 'Controlled', color: '#8B5CF6', description: 'Controlled substances with regulatory requirements', itemCount: 15, createdAt: new Date(), updatedAt: new Date() },
    { id: '5', name: 'High Value', color: '#10B981', description: 'High-value items requiring extra security', itemCount: 6, createdAt: new Date(), updatedAt: new Date() },
  ];

  getTags(params?: TagSearchParams): Observable<PaginatedResponse<Tag>> {
    if (this.USE_MOCK) {
      let filtered = [...this.mockTags];
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(t => t.name.toLowerCase().includes(search) || t.description?.toLowerCase().includes(search));
      }
      return of({
        items: filtered,
        total: filtered.length,
        page: params?.page || 1,
        pageSize: params?.pageSize || 25,
        totalPages: 1
      }).pipe(delay(300));
    }
    return this.http.get<PaginatedResponse<Tag>>(this.apiUrl, { params: params as any });
  }

  getTag(id: string): Observable<Tag> {
    if (this.USE_MOCK) {
      const tag = this.mockTags.find(t => t.id === id);
      return of(tag!).pipe(delay(200));
    }
    return this.http.get<Tag>(`${this.apiUrl}/${id}`);
  }

  createTag(request: CreateTagRequest): Observable<Tag> {
    if (this.USE_MOCK) {
      const newTag: Tag = {
        id: (this.mockTags.length + 1).toString(),
        ...request,
        itemCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.mockTags.push(newTag);
      return of(newTag).pipe(delay(300));
    }
    return this.http.post<Tag>(this.apiUrl, request);
  }

  updateTag(id: string, updates: Partial<Tag>): Observable<Tag> {
    if (this.USE_MOCK) {
      const index = this.mockTags.findIndex(t => t.id === id);
      if (index >= 0) {
        this.mockTags[index] = { ...this.mockTags[index], ...updates, updatedAt: new Date() };
        return of(this.mockTags[index]).pipe(delay(300));
      }
      return of(null as any).pipe(delay(300));
    }
    return this.http.patch<Tag>(`${this.apiUrl}/${id}`, updates);
  }

  deleteTag(id: string): Observable<void> {
    if (this.USE_MOCK) {
      this.mockTags = this.mockTags.filter(t => t.id !== id);
      return of(void 0).pipe(delay(300));
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  tagItem(itemId: string, tagId: string): Observable<void> {
    if (this.USE_MOCK) {
      return of(void 0).pipe(delay(200));
    }
    return this.http.post<void>(`${environment.apiUrl}/inventory/items/${itemId}/tags`, { tag_id: tagId });
  }

  untagItem(itemId: string, tagId: string): Observable<void> {
    if (this.USE_MOCK) {
      return of(void 0).pipe(delay(200));
    }
    return this.http.delete<void>(`${environment.apiUrl}/inventory/items/${itemId}/tags/${tagId}`);
  }

  getItemTags(itemId: string): Observable<ItemTag[]> {
    if (this.USE_MOCK) {
      const mockItemTags: ItemTag[] = [
        { itemId, tagId: '1', tagName: 'Critical', tagColor: '#EF4444', taggedAt: new Date(), taggedBy: 'user1' },
        { itemId, tagId: '3', tagName: 'Refrigerated', tagColor: '#3B82F6', taggedAt: new Date(), taggedBy: 'user1' },
      ];
      return of(mockItemTags).pipe(delay(200));
    }
    return this.http.get<ItemTag[]>(`${environment.apiUrl}/inventory/items/${itemId}/tags`);
  }
}
