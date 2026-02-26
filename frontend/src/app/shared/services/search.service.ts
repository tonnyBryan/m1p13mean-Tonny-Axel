import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import {ResultSearch} from "../../core/models/search.model";

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private readonly endpoint = 'search';

    constructor(private api: ApiService, private auth: AuthService) { }

    /**
     * Recherche globale produits et boutiques
     * @param q mot-clé de recherche
     */
    globalSearch(q: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        const queryParam = encodeURIComponent(q);

        return this.api.get<any>(`${this.endpoint}?q=${queryParam}`, headers);
    }

    searchForBoutique(q: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return this.api.get<any>(`${this.endpoint}/boutique?q=${encodeURIComponent(q)}`, headers);
    }

    searchForAdmin(q: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
        return this.api.get<any>(`${this.endpoint}/admin?q=${encodeURIComponent(q)}`, headers);
    }
}
