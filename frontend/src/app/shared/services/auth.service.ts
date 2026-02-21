import { Injectable } from '@angular/core';
import {ApiService} from "./api.service";
import {BehaviorSubject, Observable, tap} from "rxjs";
import {HttpHeaders} from "@angular/common/http";
import {jwtDecode} from 'jwt-decode';
import {JwtPayload} from "../../core/models/jwtPayload.model";
import {SessionService} from "./session.service";
import {SocketService} from "./socket.service";
import {UserStateService} from "./user-state.service";


@Injectable({
    providedIn: 'root'
})
export class AuthService {

    constructor(private api: ApiService, private session : SessionService, private userState: UserStateService, private socketService : SocketService) {
        this.loadUserFromToken();
    }

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
        this.session.clear();
        this.userState.clear();
        this.socketService.disconnect();
        localStorage.removeItem('token');
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
                    this.loadUserFromToken();
                }
            })
        );
    }

    signup(username: string, email: string, password: string, role: string = 'user'): Observable<any> {
        const body = { name: username, email, password, role };
        console.log("body = " + body);
        return this.api.post<any>('auth/signup', body).pipe(
            tap(res => {
                if (res.success && res.data?.accessToken) {
                    localStorage.setItem('token', res.data.accessToken);
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
