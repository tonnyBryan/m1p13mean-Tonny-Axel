import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {

    constructor(
        private api: ApiService,
        private auth: AuthService
    ) { }

    /**
     * Public endpoint to subscribe an email to the mailing list
     * POST /api/subscriptions/subscribe
     */
    subscribe(email: string): Observable<any> {
        const payload = { email };
        // public endpoint - no auth header required
        return this.api.post<any>('subscriptions/subscribe', payload);
    }

    /**
     * Admin endpoint to get subscriptions with optional query params
     * GET /api/subscriptions
     */
    getSubscriptions(params: any = {}): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        const keys = Object.keys(params || {});
        const queryString = keys.length
            ? '?' + keys.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&')
            : '';

        return this.api.get<any>(`subscriptions${queryString}`, headers);
    }

    /**
     * Convenience method to fetch all subscriptions without params
     */
    getAllSubscriptions(): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.api.get<any>('subscriptions', headers);
    }
}
