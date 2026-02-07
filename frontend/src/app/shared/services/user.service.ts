import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private api: ApiService, private auth: AuthService) {}

  getMyProfile(): Observable<any> {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.api.get<any>('users/me/profile', headers);
  }

  updateMyProfile(payload: any): Observable<any> {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.api.put<any>('users/me/profile', payload, headers);
  }

  addAddress(address: any): Observable<any> {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.api.post<any>('users/me/profile/addresses', address, headers);
  }

  removeAddress(addressId: string): Observable<any> {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.api.delete<any>(`users/me/profile/addresses/${addressId}`, headers);
  }
}
