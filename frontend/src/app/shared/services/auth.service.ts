import { Injectable } from '@angular/core';
import {ApiService} from "./api.service";
import {BehaviorSubject, Observable, tap} from "rxjs";
import {HttpHeaders} from "@angular/common/http";
import {User} from "../../core/models/user.model";
import { jwtDecode } from 'jwt-decode';


export interface JwtPayload {
    id: string;
    role: string;
    boutiqueId? : string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    constructor(private api: ApiService) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            this.userSubject.next(JSON.parse(savedUser));
        }

        this.loadUserFromToken();
    }

    private userSubject = new BehaviorSubject<User | null>(null);
    user$ = this.userSubject.asObservable();

    private userToken = new BehaviorSubject<JwtPayload | null>(null);
    userToken$ = this.userToken.asObservable();

    private loadUserFromToken() {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const decoded = jwtDecode<JwtPayload>(token);
            this.userToken.next(decoded);
        } catch (e) {
            console.warn('Token invalide, nettoyage…');
            this.logout();
        }
    }

    getRole(): string | null {
        return this.userToken.value?.role ?? null;
    }

    setUser(user: User) {
        this.userSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
    }

    get user(): User | null {
        return this.userSubject.value;
    }

    get userHash(): JwtPayload | null {
        return this.userToken.value;
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('token'); // true si token existe
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    setToken(token : string): void {
        localStorage.setItem('token', token);
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    refreshToken(): Observable<any> {
        return this.api.post<any>(
            'auth/refresh-token',
            {},
            undefined
        );
    }


    login(email: string, password: string, role: string = 'user'): Observable<any> {
        const body = { email, password, role };
        return this.api.post<any>('auth/login', body).pipe(
            tap(res => {
                if (res.success && res.data?.accessToken) {
                    localStorage.setItem('token', res.data.accessToken);
                    this.setUser(res.data.user);
                    this.loadUserFromToken();
                }
            })
        );
    }

    verifyToken(): Observable<any> {
        const token = this.getToken();

        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        return this.api.get<any>('auth/verify-token', headers);
    }
}
