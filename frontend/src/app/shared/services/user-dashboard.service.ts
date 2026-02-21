import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class UserDashboardService {

    constructor(private api: ApiService, private auth: AuthService) { }

    /**
     * Get KPI summary for the currently authenticated user
     * GET /api/user-dashboard/kpi
     */
    getKpi(): Observable<any> {
        const token = this.auth.getToken();
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
        return this.api.get<any>('user-dashboard/kpi', headers);
    }

    /**
     * Get orders tab for the currently authenticated user
     * GET /api/user-dashboard/orders
     */
    getOrders(): Observable<any> {
        const token = this.auth.getToken();
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
        return this.api.get<any>('user-dashboard/orders', headers);
    }
}
