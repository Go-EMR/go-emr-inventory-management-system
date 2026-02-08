import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ItemPhoto, PresignedUrl } from '../../shared/models';

export interface PhotoUploadRequest {
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface PhotoUploadResponse {
  uploadUrl: PresignedUrl;
  photoId: string;
  storageKey: string;
}

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory/items`;
  private readonly USE_MOCK = true;

  // Mock data
  private mockPhotos: Map<string, ItemPhoto[]> = new Map();

  getUploadUrl(itemId: string, request: PhotoUploadRequest): Observable<PhotoUploadResponse> {
    if (this.USE_MOCK) {
      const photoId = `photo-${Date.now()}`;
      return of({
        uploadUrl: {
          url: `https://storage.example.com/upload/${photoId}`,
          expiresAt: new Date(Date.now() + 3600000),
          headers: { 'Content-Type': request.contentType }
        },
        photoId,
        storageKey: `inventory/${itemId}/photos/${photoId}/${request.filename}`
      }).pipe(delay(300));
    }
    return this.http.post<PhotoUploadResponse>(`${this.apiUrl}/${itemId}/photos/upload-url`, request);
  }

  confirmUpload(itemId: string, photoId: string, caption?: string): Observable<ItemPhoto> {
    if (this.USE_MOCK) {
      const photos = this.mockPhotos.get(itemId) || [];
      const newPhoto: ItemPhoto = {
        id: photoId,
        itemId,
        storageKey: `inventory/${itemId}/photos/${photoId}/photo.jpg`,
        filename: 'photo.jpg',
        contentType: 'image/jpeg',
        sizeBytes: 1024000,
        displayOrder: photos.length,
        isPrimary: photos.length === 0,
        caption,
        uploadStatus: 'confirmed',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      photos.push(newPhoto);
      this.mockPhotos.set(itemId, photos);
      return of(newPhoto).pipe(delay(300));
    }
    return this.http.post<ItemPhoto>(`${this.apiUrl}/${itemId}/photos/confirm`, { photo_id: photoId, caption });
  }

  getItemPhotos(itemId: string): Observable<ItemPhoto[]> {
    if (this.USE_MOCK) {
      const photos = this.mockPhotos.get(itemId) || [];
      return of(photos).pipe(delay(200));
    }
    return this.http.get<ItemPhoto[]>(`${this.apiUrl}/${itemId}/photos`);
  }

  deletePhoto(itemId: string, photoId: string): Observable<void> {
    if (this.USE_MOCK) {
      const photos = this.mockPhotos.get(itemId) || [];
      this.mockPhotos.set(itemId, photos.filter(p => p.id !== photoId));
      return of(void 0).pipe(delay(300));
    }
    return this.http.delete<void>(`${this.apiUrl}/${itemId}/photos/${photoId}`);
  }

  setPrimaryPhoto(itemId: string, photoId: string): Observable<ItemPhoto> {
    if (this.USE_MOCK) {
      const photos = this.mockPhotos.get(itemId) || [];
      photos.forEach(p => p.isPrimary = p.id === photoId);
      this.mockPhotos.set(itemId, photos);
      const photo = photos.find(p => p.id === photoId)!;
      return of(photo).pipe(delay(300));
    }
    return this.http.post<ItemPhoto>(`${this.apiUrl}/${itemId}/photos/${photoId}/set-primary`, {});
  }

  reorderPhotos(itemId: string, photoIds: string[]): Observable<void> {
    if (this.USE_MOCK) {
      const photos = this.mockPhotos.get(itemId) || [];
      photoIds.forEach((id, index) => {
        const photo = photos.find(p => p.id === id);
        if (photo) photo.displayOrder = index;
      });
      this.mockPhotos.set(itemId, photos);
      return of(void 0).pipe(delay(300));
    }
    return this.http.post<void>(`${this.apiUrl}/${itemId}/photos/reorder`, { photo_ids: photoIds });
  }
}
