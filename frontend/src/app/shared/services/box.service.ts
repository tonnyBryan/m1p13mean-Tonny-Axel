import { Injectable } from '@angular/core';
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class BoxService {

    constructor(
        private api: ApiService,
        private auth: AuthService
    ) { }

    private getHeaders(): HttpHeaders {
        const token = this.auth.getToken();
        return new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
    }

    getBoxes(status?: string): Observable<any> {
        let queryString = '';
        if (status && status !== 'all') {
            queryString = `?status=${status}`;
        }
        return this.api.get<any>(`boxes${queryString}`, this.getHeaders());
    }

    getBoxById(id: string): Observable<any> {
        return this.api.get<any>(`boxes/${id}`, this.getHeaders());
    }

    createBox(data: any): Observable<any> {
        return this.api.post<any>('boxes', data, this.getHeaders());
    }

    updateBox(id: string, data: any): Observable<any> {
        return this.api.patch<any>(`boxes/${id}`, data, this.getHeaders());
    }

    deleteBox(id: string): Observable<any> {
        return this.api.delete<any>(`boxes/${id}`, this.getHeaders());
    }
}
