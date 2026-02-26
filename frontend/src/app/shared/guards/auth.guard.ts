import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {

    constructor(
        private auth: AuthService,
        private router: Router
    ) {}

    canActivate() {
        if (!this.auth.isLoggedIn()) {
            this.router.navigate(['/signin']);
            return of(false);
        }

        return this.auth.verifyToken().pipe(
            map(() => true),
            catchError(() => {
                this.auth.logout();
                this.router.navigate(['/signin']);
                return of(false);
            })
        );
    }
}
