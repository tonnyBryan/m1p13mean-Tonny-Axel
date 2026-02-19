import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import {BehaviorSubject, map, Observable, of} from 'rxjs';
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
        return this.api.post<any>(`wishlist/add/${productId}`, {}, this.getHeaders()).pipe(
            tap(res => {
                if (res.success) {
                    if (res.data.products) {
                        this.wishlistSubject.next(res.data.products);
                    }
                    else if (res.data.product) {
                        const current = this.wishlistSubject.value;
                        this.wishlistSubject.next([...current, res.data]);
                    }
                }
            })
        );
    }

    removeFromWishlist(productId: string): Observable<any> {
        return this.api.post<any>(`wishlist/remove/${productId}`, {}, this.getHeaders()).pipe(
            tap(res => {
                if (res.success) {
                    if (res.data.products) {
                        this.wishlistSubject.next(res.data.products);
                    }
                    else {
                        const current = this.wishlistSubject.value;
                        this.wishlistSubject.next(current.filter(item => item.product._id !== productId));
                    }
                }
            })
        );
    }


    loadWishlist(): Observable<any> {
        if (this.wishlistLoaded) {
            return of(null);
        }

        console.log("Vo antsoooooooooooooo")

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

    getWishlistCount(): Observable<number> {
        return this.wishlist$.pipe(map(list => list.length));
    }
}
