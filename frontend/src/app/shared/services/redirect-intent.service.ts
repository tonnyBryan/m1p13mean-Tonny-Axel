import { Injectable } from '@angular/core';

const STORAGE_KEY = 'redirect_intent';
const TTL_MS = 10 * 60 * 1000; // 10 minutes

interface RedirectIntent {
    url: string;
    expiry: number; // timestamp ms
}

/**
 * Service de redirection post-login.
 *
 * Usage :
 *   - Avant /signin : redirectIntentService.save('/v1/stores/abc123')
 *   - Après login   : const url = redirectIntentService.consume() → navigate
 */
@Injectable({ providedIn: 'root' })
export class RedirectIntentService {

    /**
     * Enregistre un lien avec une TTL de 10min dans le localStorage.
     */
    save(url: string): void {
        const intent: RedirectIntent = {
            url,
            expiry: Date.now() + TTL_MS
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
    }

    /**
     * Lit et supprime l'intent.
     * Retourne l'URL si elle existe et n'est pas expirée, null sinon.
     */
    consume(): string | null {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        try {
            const intent: RedirectIntent = JSON.parse(raw);
            localStorage.removeItem(STORAGE_KEY); // toujours supprimer après lecture

            if (Date.now() > intent.expiry) return null; // expiré
            return intent.url;

        } catch {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
    }

    /**
     * Vérifie si un intent valide existe sans le consommer.
     */
    has(): boolean {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        try {
            const intent: RedirectIntent = JSON.parse(raw);
            return Date.now() <= intent.expiry;
        } catch {
            return false;
        }
    }

    /**
     * Supprime l'intent sans le lire.
     */
    clear(): void {
        localStorage.removeItem(STORAGE_KEY);
    }
}