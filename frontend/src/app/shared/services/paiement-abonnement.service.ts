import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class PaiementAbonnementService {
    private readonly endpoint = 'paiement-abonnements';

    constructor(private api: ApiService, private auth: AuthService) {}

    /**
     * Admin endpoint: list payments for a boutique
     * GET /api/paiement-abonnements/boutique/:boutiqueId
     */
    getPaymentsByBoutique(boutiqueId: string, params: any = {}): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');

        const suffix = queryString ? `?${queryString}` : '';
        return this.api.get<any>(`${this.endpoint}/boutique/${boutiqueId}${suffix}`, headers);
    }

    /**
     * Admin endpoint: register a subscription payment
     * POST /api/paiement-abonnements/pay
     */
    paySubscription(payload: {
        boutiqueId: string;
        amount?: number;
        currency?: string;
        method?: string;
        paidAt?: string | Date;
    }): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.api.post<any>(`${this.endpoint}/pay`, payload, headers);
    }
}
