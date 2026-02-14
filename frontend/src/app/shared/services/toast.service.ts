import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {Toast, ToastPosition, ToastType} from "../../core/models/toast.model";

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    public toasts$: Observable<Toast[]> = this.toastsSubject.asObservable();

    private defaultDuration = 50000; // 5 secondes
    private defaultPosition: ToastPosition = 'top-right';

    constructor() {}

    /**
     * Affiche un toast de succès
     */
    success(title: string, message?: string, duration?: number) {
        this.show('success', title, message, duration);
    }

    /**
     * Affiche un toast d'erreur
     */
    error(title: string, message?: string, duration?: number) {
        this.show('error', title, message, duration);
    }

    /**
     * Affiche un toast d'avertissement
     */
    warning(title: string, message?: string, duration?: number) {
        this.show('warning', title, message, duration);
    }

    /**
     * Affiche un toast d'information
     */
    info(title: string, message?: string, duration?: number) {
        this.show('info', title, message, duration);
    }

    /**
     * Affiche un toast personnalisé
     */
    show(
        type: ToastType,
        title: string,
        message?: string,
        duration?: number,
        position?: ToastPosition,
        action?: { label: string; onClick: () => void }
    ) {
        const toast: Toast = {
            id: this.generateId(),
            type,
            title,
            message,
            duration: duration ?? this.defaultDuration,
            position: position ?? this.defaultPosition,
            action
        };

        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next([...currentToasts, toast]);

        // Auto-remove après la durée spécifiée (sauf si duration = 0)
        if (toast.duration && toast.duration > 0) {
            setTimeout(() => {
                this.remove(toast.id);
            }, toast.duration);
        }
    }

    /**
     * Supprime un toast
     */
    remove(id: string) {
        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next(currentToasts.filter(t => t.id !== id));
    }

    /**
     * Supprime tous les toasts
     */
    clear() {
        this.toastsSubject.next([]);
    }

    /**
     * Génère un ID unique
     */
    private generateId(): string {
        return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}