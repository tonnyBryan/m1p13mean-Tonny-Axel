import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ToastService } from "../../../services/toast.service";
import { Toast, ToastPosition } from "../../../../core/models/toast.model";
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.css'],
  animations: [
    // ✅ Animation pour chaque toast individuel
    trigger('toastAnimation', [
      transition(':enter', [
        style({
          opacity: 0,
          transform: 'translateX(100%) scale(0.8)'
        }),
        animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            style({
              opacity: 1,
              transform: 'translateX(0) scale(1)'
            })
        )
      ]),
      transition(':leave', [
        animate('250ms cubic-bezier(0.4, 0, 1, 1)',
            style({
              opacity: 0,
              transform: 'translateX(100%) scale(0.8)',
              maxHeight: 0,
              marginBottom: 0,
              paddingTop: 0,
              paddingBottom: 0
            })
        )
      ])
    ]),

    // ✅ Animation pour le container (effet de décalage)
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({
            opacity: 0,
            transform: 'translateX(100%) scale(0.8)',
            height: 0,
            marginBottom: 0
          }),
          stagger(50, [
            animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                style({
                  opacity: 1,
                  transform: 'translateX(0) scale(1)',
                  height: '*',
                  marginBottom: '*'
                })
            )
          ])
        ], { optional: true }),

        query(':leave', [
          stagger(50, [
            animate('250ms cubic-bezier(0.4, 0, 1, 1)',
                style({
                  opacity: 0,
                  transform: 'translateX(100%) scale(0.8)',
                  height: 0,
                  marginBottom: 0
                })
            )
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class ToastContainerComponent implements OnInit {
  toasts$: Observable<Toast[]>;

  readonly positions: ToastPosition[] = [
    'top-right',
    'top-left',
    'bottom-right',
    'bottom-left',
    'top-center',
    'bottom-center'
  ];

  constructor(private toastService: ToastService) {
    this.toasts$ = this.toastService.toasts$;
  }

  ngOnInit() {}

  removeToast(id: string) {
    this.toastService.remove(id);
  }

  getToastsByPosition(toasts: Toast[], position: ToastPosition): Toast[] {
    return toasts.filter(t => (t.position || 'top-right') === position);
  }

  getPositionClasses(position: ToastPosition): string {
    const baseClasses = 'fixed z-[99999] flex flex-col gap-3 pointer-events-none';

    switch (position) {
      case 'top-right':
        return `${baseClasses} top-20 right-4`;
      case 'top-left':
        return `${baseClasses} top-20 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'top-center':
        return `${baseClasses} top-20 left-1/2 -translate-x-1/2`;
      case 'bottom-center':
        return `${baseClasses} bottom-4 left-1/2 -translate-x-1/2`;
      default:
        return `${baseClasses} top-20 right-4`;
    }
  }

  getToastClasses(): string {
    return 'pointer-events-auto min-w-[320px] max-w-md p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl';
  }

  getIconWrapperClasses(type: string): string {
    const baseClasses = 'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center';

    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-100 dark:bg-green-900/30`;
      case 'error':
        return `${baseClasses} bg-red-100 dark:bg-red-900/30`;
      case 'warning':
        return `${baseClasses} bg-amber-100 dark:bg-amber-900/30`;
      case 'info':
        return `${baseClasses} bg-blue-100 dark:bg-blue-900/30`;
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-700`;
    }
  }

  getIconClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'w-6 h-6 text-green-600 dark:text-green-400';
      case 'error':
        return 'w-6 h-6 text-red-600 dark:text-red-400';
      case 'warning':
        return 'w-6 h-6 text-amber-600 dark:text-amber-400';
      case 'info':
        return 'w-6 h-6 text-blue-600 dark:text-blue-400';
      default:
        return 'w-6 h-6 text-gray-600 dark:text-gray-400';
    }
  }

  getTitleClasses(type: string): string {
    return 'text-gray-900 dark:text-white';
  }

  getMessageClasses(type: string): string {
    return 'text-gray-600 dark:text-gray-400';
  }

  getProgressBarClasses(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-green-500 dark:bg-green-400';
      case 'error':
        return 'bg-red-500 dark:bg-red-400';
      case 'warning':
        return 'bg-amber-500 dark:bg-amber-400';
      case 'info':
        return 'bg-blue-500 dark:bg-blue-400';
      default:
        return 'bg-gray-500 dark:bg-gray-400';
    }
  }

  // ✅ Track by pour optimiser le rendering
  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }
}