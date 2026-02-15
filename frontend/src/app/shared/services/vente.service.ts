import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { Vente } from '../../core/models/vente.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from "./auth.service";
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class VenteService {
    private readonly endpoint = 'ventes';
    private baseUrl = environment.apiBaseUrl;

    constructor(private api: ApiService, private auth: AuthService, private http: HttpClient) { }

    createVente(vente: Partial<Vente>): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.api.post(`${this.endpoint}/add`, vente, headers);
    }

    getVentesByBoutique(boutiqueId: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.api.get(`${this.endpoint}/boutique/${boutiqueId}`, headers);
    }

    getVentesList(params: any = {}): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');

        const suffix = queryString ? `?${queryString}` : '';

        return this.api.get(`${this.endpoint}/boutique/all${suffix}`, headers);
    }

    getVenteById(id: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.api.get(`${this.endpoint}/${id}`, headers);
    }

    updateVente(id: string, vente: Partial<Vente>): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.api.put(`${this.endpoint}/${id}`, vente, headers);
    }

    updateStatus(id: string, status: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.api.patch(`${this.endpoint}/${id}/status`, { status }, headers);
    }

    getInvoice(id: string): Observable<Blob> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.http.get(`${this.baseUrl}/${this.endpoint}/${id}/invoice`, {
            headers,
            responseType: 'blob'
        });
    }
}
