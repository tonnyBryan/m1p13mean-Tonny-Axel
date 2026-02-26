import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class SupportRequestService {

    constructor(
        private api: ApiService,
        private auth: AuthService
    ) { }

    /**
     * Public endpoint to submit a support request
     * POST /api/support-requests/submit
     */
    submit(payload: { fullName: string; subject: string; email: string; message: string }): Observable<any> {
        return this.api.post<any>('support-requests/submit', payload);
    }

    /**
     * Admin endpoint to get support requests with optional query params
     * GET /api/support-requests
     */
    getSupportRequests(params: any = {}): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        const keys = Object.keys(params || {});
        const queryString = keys.length
            ? '?' + keys.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`).join('&')
            : '';

        return this.api.get<any>(`support-requests${queryString}`, headers);
    }

    /**
     * Admin endpoint to get a single support request by id
     * GET /api/support-requests/:id
     */
    getSupportRequestById(id: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.api.get<any>(`support-requests/${encodeURIComponent(id)}`, headers);
    }

}
