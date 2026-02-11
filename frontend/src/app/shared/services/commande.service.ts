import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CommandeService {
    private cartCountSubject = new BehaviorSubject<number>(0);
    public cartCount$ = this.cartCountSubject.asObservable();

    constructor(private api: ApiService) {}

    private computeCountFromCommande(cmd: any): number {
        if (!cmd || !cmd.products || !Array.isArray(cmd.products)) return 0;
        return cmd.products.reduce((s: number, p: any) => s + (p.quantity || 0), 0);
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
            catchError(err => {
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

    getDraft(): Observable<any> {
        return this.api.get('commandes/draft');
    }
}
