import { inject } from '@angular/core';
import {
    HttpInterceptorFn,
    HttpRequest,
    HttpHandlerFn,
    HttpErrorResponse
} from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (
    req: HttpRequest<any>,
    next: HttpHandlerFn
) => {

    const authService = inject(AuthService);
    const router = inject(Router);

    // ⛔ ne pas intercepter le refresh token
    if (req.url.includes('/auth/refresh-token')) {
        return next(req);
    }

    const accessToken = authService.getToken();

    console.log("acess = " + accessToken);

    const authReq = accessToken
        ? req.clone({
            setHeaders: {
                Authorization: `Bearer ${accessToken}`
            }
        })
        : req;

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {


            console.log("status = " + error.status);
            /* 🔵 420 → access token expiré → refresh */
            if (error.status === 420 && !isRefreshing) {
                isRefreshing = true;

                return authService.refreshToken().pipe(
                    switchMap((res: any) => {
                        isRefreshing = false;

                        const newToken = res.data.accessToken;
                        authService.setToken(newToken);

                        const retryReq = authReq.clone({
                            setHeaders: {
                                Authorization: `Bearer ${newToken}`
                            }
                        });

                        return next(retryReq);
                    }),
                    catchError(err => {
                        isRefreshing = false;
                        forceLogout(authService, router);
                        return throwError(() => err);
                    })
                );
            }

            /* 🔴 450 → session expirée → logout */
            if (error.status === 450) {
                forceLogout(authService, router);
            }

            return throwError(() => error);
        })
    );
};

/* ===== Utils ===== */
function forceLogout(authService: AuthService, router: Router) {
    authService.logout();
    router.navigate(['/signin']);
}
