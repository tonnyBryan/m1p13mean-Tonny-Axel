import { Injectable } from '@angular/core';
import {ApiService} from "./api.service";
import {BehaviorSubject, Observable, tap} from "rxjs";
import {HttpHeaders} from "@angular/common/http";
import {User} from "../../core/models/user.model";

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    constructor(private api: ApiService) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            this.userSubject.next(JSON.parse(savedUser));
        }
    }

    private userSubject = new BehaviorSubject<User | null>(null);
    user$ = this.userSubject.asObservable();

    setUser(user: User) {
        this.userSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
    }

    get user(): User | null {
        return this.userSubject.value;
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('token'); // true si token existe
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    logout(): void {
        localStorage.removeItem('token');
    }

    login(email: string, password: string, role: string = 'user'): Observable<any> {
        const body = { email, password, role };
        return this.api.post<any>('auth/login', body).pipe(
            tap(res => {
                if (res.success && res.data?.accessToken) {
                    localStorage.setItem('token', res.data.accessToken);
                    this.setUser(res.data.user);
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
