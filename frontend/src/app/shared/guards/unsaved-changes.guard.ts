import { CanDeactivateFn } from '@angular/router';
import { ToastService } from '../services/toast.service'; // adapte le chemin

export interface HasUnsavedChanges {
    toastService: ToastService;
    hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
    if (!component.hasUnsavedChanges()) return true;

    return new Promise<boolean>((resolve) => {
        component.toastService.confirm(
            'Leave registration?',
            'You have unsaved information. If you leave, everything will be lost.',
            () => resolve(true),
            () => resolve(false),
            {
                confirmLabel: 'Yes, leave',
                cancelLabel: 'Stay',
                variant: 'danger',
                position: 'top-center',
                backdrop: true,
            }
        );
    });
};