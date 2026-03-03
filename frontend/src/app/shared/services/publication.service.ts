import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class PublicationService {

    constructor(
        private api: ApiService,
        private auth: AuthService
    ) {}

    private getHeaders(): HttpHeaders {
        const token = this.auth.getToken();
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }

    private buildQuery(params: any = {}): string {
        const qs = Object.keys(params)
            .filter(k => params[k] !== null && params[k] !== undefined && params[k] !== '')
            .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
            .join('&');
        return qs ? `?${qs}` : '';
    }

    // ─── PUBLIC (no token required) ─────────────────────────────────────────

    /**
     * GET /api/publications
     * Public feed — accessible without an account
     * params: type?, authorType?, page?, limit?
     */
    getPublications(params: any = {}): Observable<any> {
        const qs = this.buildQuery(params);
        return this.api.get<any>(`publications${qs}`);
    }

    /**
     * GET /api/publications/:id
     * Publication details — accessible without an account
     */
    getPublicationById(id: string): Observable<any> {
        return this.api.get<any>(`publications/${id}`);
    }

    // ─── ADMIN + BOUTIQUE ─────────────────────────────────────────────────────

    /**
     * POST /api/publications
     * Create a publication with images (FormData)
     * - Admin -> published immediately
     * - Boutique -> pending, notify admin
     */
    createPublication(formData: FormData): Observable<any> {
        return this.api.post<any>('publications', formData, this.getHeaders());
    }

    /**
     * GET /api/publications/my
     * My publications (admin or boutique)
     */
    getMyPublications(): Observable<any> {
        return this.api.get<any>('publications/my', this.getHeaders());
    }

    /**
     * DELETE /api/publications/:id
     * Delete a publication
     * - Admin: any
     * - Boutique: only their own
     */
    deletePublication(id: string): Observable<any> {
        return this.api.delete<any>(`publications/${id}`, this.getHeaders());
    }

    // ─── ADMIN ONLY ───────────────────────────────────────────────────────────

    /**
     * GET /api/publications/pending
     * List of pending publications
     */
    getPendingPublications(): Observable<any> {
        return this.api.get<any>('publications/pending', this.getHeaders());
    }

    /**
     * PATCH /api/publications/:id/validate
     * Approve a publication
     */
    approvePublication(id: string): Observable<any> {
        return this.api.patch<any>(
            `publications/${id}/validate`,
            { action: 'approve' },
            this.getHeaders()
        );
    }

    /**
     * PATCH /api/publications/:id/validate
     * Reject a publication with a reason
     */
    rejectPublication(id: string, rejectedReason: string): Observable<any> {
        return this.api.patch<any>(
            `publications/${id}/validate`,
            { action: 'reject', rejectedReason },
            this.getHeaders()
        );
    }
}
