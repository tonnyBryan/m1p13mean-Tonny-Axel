import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class AdminDashboardService {
    constructor(private api: ApiService, private auth: AuthService) { }

    private getHeaders(): HttpHeaders {
        const token = this.auth.getToken();
        return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
    }

    getRealtime(): Observable<any> {
        return this.api.get<any>('admin-dashboard/realtime', this.getHeaders());
    }

    getAnalytics(from?: string, to?: string): Observable<any> {
        let params = new HttpParams();
        if (from) params = params.set('from', from);
        if (to) params = params.set('to', to);

        const queryString = params.toString() ? `?${params.toString()}` : '';
        return this.api.get<any>(`admin-dashboard/analytics${queryString}`, this.getHeaders());
    }
}
