import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { StockMovement, StockMovementCreate } from '../../core/models/stock-movement.model';
import { HttpHeaders } from '@angular/common/http';
import { AuthService } from "./auth.service";

@Injectable({
    providedIn: 'root'
})
export class StockMovementService {
    private readonly endpoint = 'stock-movements';

    constructor(private api: ApiService, private auth: AuthService) { }

    createStockMovements(boutiqueId: string, movements: StockMovementCreate[]): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.api.post(`${this.endpoint}`, { boutiqueId, movements }, headers);
    }

    getStockMovementList(params: any = {}): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');

        const suffix = queryString ? `?${queryString}` : '';

        return this.api.get(`${this.endpoint}${suffix}`, headers);
    }
}
