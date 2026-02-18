import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
    constructor(private api: ApiService) {}

    loadNotifications(page = 1, limit = 5): Observable<any> {
        const params = `?page=${page}&limit=${limit}`;
        return this.api.get<any>(`notifications${params}`);
    }
}
