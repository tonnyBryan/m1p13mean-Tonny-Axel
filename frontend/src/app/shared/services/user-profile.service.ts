import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class UserProfileService {

    constructor(
        private api: ApiService,
        private auth: AuthService
    ) { }

    getUserProfiles(params: any = {}): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        // Simple param serialization
        const queryParts = [];
        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
            }
        }
        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

        return this.api.get<any>(`users${queryString}`, headers);
    }

    getUserProfileById(id: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        return this.api.get<any>(`users/profile/${id}`, headers);
    }
}
