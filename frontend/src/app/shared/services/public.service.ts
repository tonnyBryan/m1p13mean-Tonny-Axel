import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class PublicService {

    constructor(private api: ApiService) {}

    /**
     * GET /api/public/preview?page=X
     * Boutiques actives + validées avec leurs 2 meilleurs produits
     */
    getStoresPreview(page: number = 1): Observable<any> {
        return this.api.get<any>(`public/preview?page=${page}`);
    }

    /**
     * GET /api/public/hero-products
     * 2 produits random pour le hero
     */
    getHeroProducts(): Observable<any> {
        return this.api.get<any>('public/hero-products');
    }
}