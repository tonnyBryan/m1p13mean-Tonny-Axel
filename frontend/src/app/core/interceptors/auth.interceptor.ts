import { BehaviorSubject, filter, take, switchMap, catchError, throwError } from 'rxjs';
import {HttpErrorResponse, HttpInterceptorFn} from "@angular/common/http";
import {inject} from "@angular/core";
import {AuthService} from "../../shared/services/auth.service";
import {Router} from "@angular/router";

// Utilisez un Subject pour stocker le nouveau token et avertir les requêtes en attente
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (req.url.includes('/auth/refresh-token')) return next(req);

    const accessToken = authService.getToken();
    let authReq = req;
    if (accessToken) {
        authReq = req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            console.error(error);
            if (error.status === 420) {
                if (!isRefreshing) {
                    isRefreshing = true;
                    refreshTokenSubject.next(null);

                    return authService.refreshToken().pipe(
                        switchMap((res: any) => {
                            isRefreshing = false;
                            const newToken = res.data.accessToken;
                            authService.setToken(newToken);
                            refreshTokenSubject.next(newToken); // On libère les requêtes en attente

                            return next(req.clone({
                                setHeaders: { Authorization: `Bearer ${newToken}` }
                            }));
                        }),
                        catchError((err) => {
                            isRefreshing = false;
                            forceLogout(authService, router);
                            return throwError(() => err);
                        })
                    );
                } else {
                    // Si un refresh est déjà en cours, on attend que le sujet reçoive le nouveau token
                    return refreshTokenSubject.pipe(
                        filter(token => token !== null),
                        take(1),
                        switchMap((token) => next(req.clone({
                            setHeaders: { Authorization: `Bearer ${token}` }
                        })))
                    );
                }
            }

            if (error.status === 450) {
                forceLogout(authService, router);
            }
            return throwError(() => error);
        })
    );

    function forceLogout(authService: AuthService, router: Router) {
        authService.logout();
        router.navigate(['/']);
    }
};