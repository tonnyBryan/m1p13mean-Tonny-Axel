import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { Vente } from '../../core/models/vente.model';

@Injectable({
    providedIn: 'root'
})
export class VenteService {
    private readonly endpoint = 'ventes';

    constructor(private api: ApiService) { }

    createVente(vente: Partial<Vente>): Observable<any> {
        return this.api.post(`${this.endpoint}/add`, vente);
    }

    getVentesByBoutique(boutiqueId: string): Observable<any> {
        return this.api.get(`${this.endpoint}/boutique/${boutiqueId}`);
    }

    getVentesList(params: any = {}): Observable<any> {
        return this.api.get(`${this.endpoint}/boutique/all`, params);
    }

    getVenteById(id: string): Observable<any> {
        return this.api.get(`${this.endpoint}/${id}`);
    }

    updateVente(id: string, vente: Partial<Vente>): Observable<any> {
        return this.api.put(`${this.endpoint}/${id}`, vente);
    }

    updateStatus(id: string, status: string): Observable<any> {
        return this.api.patch(`${this.endpoint}/${id}/status`, { status });
    }

    getInvoice(id: string): Observable<any> {
        return this.api.get(`${this.endpoint}/${id}/invoice`);
    }
}
