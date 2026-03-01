import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CommandeService {
    cartCountSubject = new BehaviorSubject<number>(0);
    public cartCount$ = this.cartCountSubject.asObservable();

    constructor(private api: ApiService, private auth: AuthService) {}

    private computeCountFromCommande(cmd: any): number {
        if (!cmd || !cmd.products || !Array.isArray(cmd.products)) return 0;
        return cmd.products.reduce((s: number, p: any) => s + (p.quantity || 0), 0);
    }

    // Expose methods to adjust the local cart count for optimistic UI updates
    public setCartCount(count: number) {
        this.cartCountSubject.next(Math.max(0, Number(count) || 0));
    }

    public adjustCartCount(delta: number) {
        const cur = this.cartCountSubject.getValue() || 0;
        const next = cur + Number(delta || 0);
        this.cartCountSubject.next(Math.max(0, next));
    }

    refreshDraftCount(): Observable<any> {
        return this.getDraft().pipe(
            tap((res: any) => {
                if (res?.success && res?.data) {
                    const count = this.computeCountFromCommande(res.data);
                    this.cartCountSubject.next(count);
                } else {
                    this.cartCountSubject.next(0);
                }
            }),
            catchError(() => {
                // On error, treat as empty
                this.cartCountSubject.next(0);
                return of(null);
            })
        );
    }

    addToCart(productId: string, quantity: number = 1): Observable<any> {
        return this.api.post('commandes/add', { productId, quantity }).pipe(
            tap((res: any) => {
                if (res?.success && res?.data) {
                    const count = this.computeCountFromCommande(res.data);
                    this.cartCountSubject.next(count);
                }
            })
        );
    }

    directBuy(productId: string, quantity: number = 1): Observable<any> {
        return this.api.post('commandes/buy', { productId, quantity }).pipe(
            tap((res: any) => {
                if (res?.success && res?.data) {
                    const count = this.computeCountFromCommande(res.data);
                    this.cartCountSubject.next(count);
                }
            })
        );
    }

    getDraft(): Observable<any> {
        return this.api.get('commandes/draft');
    }

    // New: get full draft with populated boutique and products information
    getDraftFull(): Observable<any> {
        return this.api.get('commandes/draft/full');
    }

    // Update quantity for a product in the draft (set absolute quantity)
    updateItemQuantity(productId: string, quantity: number): Observable<any> {
        return this.api.patch(`commandes/products/${productId}/quantity`, { quantity }).pipe(
            tap((res: any) => {
                if (res?.success && res?.data) {
                    const count = this.computeCountFromCommande(res.data);
                    this.cartCountSubject.next(count);
                }
            })
        );
    }

    // Remove product from draft
    removeFromCart(productId: string): Observable<any> {
        return this.api.delete(`commandes/products/${productId}`).pipe(
            tap((res: any) => {
                if (res?.success && res?.data) {
                    const count = this.computeCountFromCommande(res.data);
                    this.cartCountSubject.next(count);
                }
            })
        );
    }

    // POST /api/commandes/pay
    payCommand(payload: any): Observable<any> {
        return this.api.post('commandes/pay', payload).pipe(
            tap((res: any) => {
                // On successful payment we clear local draft count
                if (res?.success) {
                    this.cartCountSubject.next(0);
                }
            })
        );
    }

    /**
     * List orders (supports pagination and filters via query params)
     * For user: returns only the user's orders (backend handles it)
     */
    getOrders(params: any = {}): Observable<any> {
        const token = this.auth.getToken();
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

        const queryString = Object.keys(params)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');

        const url = queryString ? `commandes?${queryString}` : 'commandes';
        return this.api.get<any>(url, headers);
    }

    /**
     * Get a single order by id
     */
    getOrderById(orderId: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
        return this.api.get<any>(`commandes/${orderId}`, headers);
    }

    // --- status change API calls (boutique only) ---
    acceptOrder(orderId: string): Observable<any> {
        return this.api.patch(`commandes/${orderId}/accept`, {});
    }

    cancelOrder(orderId: string, reasonCancellation: string | null = null): Observable<any> {
        return this.api.patch(`commandes/${orderId}/cancel`, { reasonCancellation });
    }

    startDelivery(orderId: string): Observable<any> {
        return this.api.patch(`commandes/${orderId}/start-delivery`, {});
    }

    markAsPickedUp(orderId: string): Observable<any> {
        return this.api.patch(`commandes/${orderId}/pickup`, {});
    }

    markAsDelivered(orderId: string): Observable<any> {
        return this.api.patch(`commandes/${orderId}/deliver`, {});
    }
}
