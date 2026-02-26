import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class StoreService {

    constructor(
        private api: ApiService,
        private auth: AuthService
    ) {}

    /**
     * Create product for connected store
     */
    createProduct(product: any): Observable<any> {
        const token = this.auth.getToken();

        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        return this.api.post<any>('products', product, headers);
    }

    getProductById(productId: string): Observable<any> {
        const token = this.auth.getToken();

        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        return this.api.get<any>(`products/${productId}`, headers);
    }


}
