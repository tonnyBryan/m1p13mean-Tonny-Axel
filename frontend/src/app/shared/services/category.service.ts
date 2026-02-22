import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    constructor(private api: ApiService, private auth: AuthService) {}

    getCategories(params: any = {}): Observable<any> {
        const token = this.auth.getToken();
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

        const queryString = Object.keys(params || {})
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
            .join('&');

        const url = queryString ? `categories?${queryString}` : 'categories';
        return this.api.get<any>(url, headers);
    }

    addCategory(payload: any): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
        return this.api.post<any>('categories', payload, headers);
    }
}
