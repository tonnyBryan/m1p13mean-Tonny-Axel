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

    // Met à jour un produit (PUT /api/products/:id)
    updateProduct(productId: string, data: any): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.api.put<any>(`products/${productId}`, data, headers);
    }

    // Convenience : activer/désactiver un produit
    toggleActive(productId: string, isActive: boolean): Observable<any> {
        return this.updateProduct(productId, { isActive });
    }

    // Activer / désactiver le sale flag (isSale)
    toggleSalePrice(productId: string, isSale: boolean): Observable<any> {
        return this.updateProduct(productId, { isSale });
    }


    // Add a rating for a product (POST /api/product-ratings/:productId)
    addProductRating(productId: string, payload: { rating: number; comment: string }): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.api.post<any>(`product-ratings/${productId}`, payload, headers);
    }

    // Remove current user's rating for a product (DELETE /api/product-ratings/:productId)
    removeProductRating(productId: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
        return this.api.delete<any>(`product-ratings/${productId}`, headers);
    }

    getRatingsByProduct(productId: string, params: any = {}): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        const allParams = { product : productId, ...params };

        const queryString = Object.keys(allParams)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(allParams[key])}`)
            .join('&');

        const url = `product-ratings?${queryString}`;
        return this.api.get<any>(url, headers);
    }

    // Share a product to a user (POST /api/products/share)
    shareProduct(productId: string, userId: string, additionalMessage?: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        const payload: any = { productId, userId };
        if (additionalMessage && additionalMessage.trim().length > 0) {
            payload.additionalMessage = additionalMessage.trim();
        }

        return this.api.post<any>('products/share', payload, headers);
    }

    getHeroProducts(): Observable<any> {
        return this.api.get<any>('public/hero-products');
    }
}
