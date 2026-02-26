import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class BoutiqueDashboardService {

    constructor(private api: ApiService, private auth: AuthService) {}

    private getHeaders(): HttpHeaders {
        const token = this.auth.getToken();
        return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
    }

    /**
     * Get realtime dashboard data for the connected boutique
     * GET /api/boutique-dashboard/realtime
     */
    getRealtime(): Observable<any> {
        return this.api.get<any>('boutique-dashboard/realtime', this.getHeaders());
    }

    /**
     * Get analytics data for the connected boutique
     * GET /api/boutique-dashboard/analytics?from=&to=
     */
    getAnalytics(from?: string, to?: string): Observable<any> {
        let params = new HttpParams();
        if (from) params = params.set('from', from);
        if (to) params = params.set('to', to);
        return this.api.get<any>(`boutique-dashboard/analytics?${params.toString()}`, this.getHeaders());
    }
}