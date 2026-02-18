import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    constructor(private api: ApiService) {}

    loadNotifications(page = 1, limit = 5, sort: string = '-createdAt'): Observable<any> {
        const params = `?page=${page}&limit=${limit}&sort=${encodeURIComponent(sort)}`;
        return this.api.get<any>(`notifications${params}`);
    }

    markAsRead(id: string): Observable<any> {
        return this.api.patch<any>(`notifications/${id}/read`, {});
    }

    markAllAsRead(): Observable<any> {
        return this.api.patch<any>(`notifications/read-all`, {});
    }
}
