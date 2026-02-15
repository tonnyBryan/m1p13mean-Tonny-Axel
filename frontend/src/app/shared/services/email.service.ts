import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import {VerifyEmailRequest} from "../../core/models/verifyEmailRequest.model";


@Injectable({
    providedIn: 'root'
})
export class EmailService {
    private readonly endpoint = 'email';

    constructor(private api: ApiService, private auth: AuthService) {}

    /**
     * Créer un code de vérification pour l'email
     * @param email Email optionnel (si null, utilise l'email de l'utilisateur connecté)
     */
    sendVerification(email?: string): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        const queryParam = email ? `?email=${encodeURIComponent(email)}` : '';
        return this.api.get<any>(`${this.endpoint}/send-verification${queryParam}`, headers);
    }

    /**
     * Vérifier le code OTP pour l'email
     * @param body Contient email et code
     */
    verifyEmail(body: VerifyEmailRequest): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        return this.api.post<any>(`${this.endpoint}/verify`, body, headers);
    }

    /**
     * Récupérer le code de vérification actif pour l'utilisateur connecté
     * Retourne null si aucun code actif
     */
    getActiveVerification(): Observable<any> {
        const token = this.auth.getToken();
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        return this.api.get<any>(`${this.endpoint}/active-verification`, headers);
    }
}
