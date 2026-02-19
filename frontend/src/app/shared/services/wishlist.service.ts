import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import {BehaviorSubject, Observable, of} from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import {WishlistItem} from "../../core/models/WishlistItem.model";
import {tap} from "rxjs/operators";
import {ToastService} from "./toast.service";

@Injectable({
    providedIn: 'root'
})
export class WishlistService {

    private wishlistSubject = new BehaviorSubject<WishlistItem[]>([]);
    public wishlist$ = this.wishlistSubject.asObservable();
    private wishlistLoaded = false;


    constructor(
        private api: ApiService,
        private auth: AuthService,
        private toast : ToastService
    ) {}

    private getHeaders(): HttpHeaders {
        const token = this.auth.getToken();
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    // Vérifier si un produit est dans la wishlist
    isWishlisted(productId: string): boolean {
        console.log("oke = " + this.wishlistSubject.value);
        return this.wishlistSubject.value.some(item => item.product._id === productId);
    }

    // Add a product to the current user's wishlist
    addToWishlist(productId: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        // backend endpoint: POST /api/wishlist/add/:productId
        return this.api.post<any>(`wishlist/add/${productId}`, {}, headers);
    }

    // Remove a product from the current user's wishlist
    removeFromWishlist(productId: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        return this.api.post<any>(`wishlist/remove/${productId}`, {}, headers);
    }

    loadWishlist(): Observable<any> {
        if (this.wishlistLoaded) {
            return of(null);
        }

        return this.api.get<any>('wishlist/me', this.getHeaders()).pipe(
            tap(res => {
                if (res.success) {
                    const items = res?.data?.products || [];
                    this.wishlistSubject.next(items);
                    this.wishlistLoaded = true;
                }
            })
        );
    }

    // Get the current user's wishlist
    getMyWishlist(): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        return this.api.get<any>('wishlist/me', headers);
    }
}
