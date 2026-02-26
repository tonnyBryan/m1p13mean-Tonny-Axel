import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { AuthService } from "./auth.service";

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private readonly endpoint = 'inventories';

    constructor(private api: ApiService, private auth: AuthService) { }

    createInventory(boutiqueId: string, note: string, lines: any[]): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.api.post(`${this.endpoint}`, { boutiqueId, note, lines }, headers);
    }

    getInventoryList(params: any = {}): Observable<any> {
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

    getInventoryById(id: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.api.get(`${this.endpoint}/${id}`, headers);
    }
}
