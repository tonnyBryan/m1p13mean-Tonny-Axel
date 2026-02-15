import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import {ToastService} from "./toast.service";
import {Router} from "@angular/router";
import {SessionService} from "./session.service";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userSubject = new BehaviorSubject<any | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private api: ApiService, private auth: AuthService, private toast : ToastService, private router: Router, private session : SessionService) { }

  getMyProfile(): Observable<any> {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.api.get<any>('users/me/profile', headers);
  }

  loadUser(): void {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    this.api.get<any>('users/me', headers).subscribe({
      next: res => {
        if (res.success) {
          this.session.setUser(res.data);
        } else {
          this.toast.error('Error', 'Error fetching user data', 0);
          this.auth.logout();
          this.router.navigate(['/signin']);
        }
      },
      error: (err) => {
        console.error('Error fetching user', err);

        if (err.error && err.error.message) {
          this.toast.error('Error', err.error.message, 0);
        } else {
          this.toast.error('Error', 'An error occurred while header user', 0);
        }

        this.auth.logout();
        this.router.navigate(['/signin']);
      }
    });
  }

  getUser(userId: String | null): Observable<any> {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    let id;
    if (userId === null) {
      id = this.auth.userHash?.id;
    }

    return this.api.get<any>('users/' + id, headers);
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
