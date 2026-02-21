import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CurrentUser {
    name: string;
    email: string;
    role: string;
    avatar: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class UserStateService {
    private currentUser = new BehaviorSubject<CurrentUser | null>(null);
    private isLoading = new BehaviorSubject<boolean>(true); // true par défaut !

    currentUser$ = this.currentUser.asObservable();
    isLoading$ = this.isLoading.asObservable();

    setUser(user: CurrentUser | null): void {
        this.currentUser.next(user);
    }

    setLoading(loading: boolean): void {
        this.isLoading.next(loading);
    }

    getUser(): CurrentUser | null {
        return this.currentUser.value;
    }

    clear(): void {
        this.currentUser.next(null);
    }
}