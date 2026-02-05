// typescript
import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class ProductService {

    constructor(
        private api: ApiService,
        private auth: AuthService
    ) {}

    // createProduct(formData: FormData): Observable<any> {
    //     const token = this.auth.getToken();
    //     const headers = new HttpHeaders({
    //         Authorization: `Bearer ${token}`
    //         // Ne pas définir Content-Type pour FormData
    //     });
    //
    //     return this.api.post<any>('products', formData, headers);
    // }

    getProducts(params: any = {}): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');

        const url = queryString ? `products?${queryString}` : 'products';
        return this.api.get<any>(url, headers);
    }
}
