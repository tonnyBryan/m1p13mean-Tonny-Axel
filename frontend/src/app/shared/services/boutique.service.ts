import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class BoutiqueService {

    constructor(
        private api: ApiService,
        private auth: AuthService
    ) { }

    createBoutique(formData: FormData): Observable<any> {
        // Headers (Auth is usually handled, but if ApiService needs it manually):
        // Note: When sending FormData, DO NOT set Content-Type header manually (browser does it with boundary).
        const token = this.auth.getToken();

        // If ApiService.post automatically sets JSON content type, we might need a variant or handle it.
        // Assuming based on reference StoreService that it takes 'product' (any) and headers.

        // However, standard Angular HttpClient handles FormData correctly if no Content-Type is set.
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
            // Content-Type is explicitly NOT set here to allow FormData boundary
        });

        return this.api.post<any>('boutiques', formData, headers);
    }

    getBoutiques(params: any = {}): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        // Convert params to query string if needed, or if ApiService.get handles params object (usually it handles HttpParams)
        // But here ApiService.get takes endpoint string. So we need to construct query string.

        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');

        return this.api.get<any>(`boutiques?${queryString}`, headers);
    }

    getBoutiqueById(id: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        return this.api.get<any>(`boutiques/${id}`, headers);
    }

    updateBoutiqueStatus(id: string, isActive: boolean): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        return this.api.patch<any>(`boutiques/${id}/status`, { isActive }, headers);
    }
}
