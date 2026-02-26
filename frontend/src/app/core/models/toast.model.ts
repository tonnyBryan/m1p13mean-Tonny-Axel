export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'confirm';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number; // en ms, 0 = permanent
    position?: ToastPosition;
    action?: {
        label: string;
        onClick: () => void;
    };
    confirmActions?: {
        confirm: {
            label: string;
            onClick: () => void;
            variant?: 'primary' | 'danger' | 'success';
        };
        cancel: {
            label: string;
            onClick?: () => void;
        };
    };
    backdrop?: boolean;
}