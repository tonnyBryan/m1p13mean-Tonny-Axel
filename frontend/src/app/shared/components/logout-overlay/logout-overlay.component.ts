import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {LogoutService} from "../../services/logout.service";

@Component({
  selector: 'app-logout-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
        <div *ngIf="logoutService.isLoggingOut$ | async"
             class="fixed inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-[999999] flex flex-col items-center justify-center gap-6">

            <!-- Spinner -->
            <div class="relative w-20 h-20">
                <svg class="animate-spin w-20 h-20 text-brand-100 dark:text-brand-900/30" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg class="animate-spin w-20 h-20 text-brand-500 absolute inset-0" fill="none" viewBox="0 0 24 24" style="animation-duration: 0.8s;">
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                    <img src="/logo.svg" alt="logo" class="w-10 h-10 drop-shadow-sm"/>
                </div>
            </div>

            <!-- Text -->
            <div class="text-center">
                <p class="text-base font-bold text-gray-900 dark:text-white mb-1">Signing out...</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">See you soon!</p>
            </div>

            <!-- Progress bar -->
            <div class="w-52 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full animate-progress"></div>
            </div>
        </div>
    `,
  styles: [`
        @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
        }
        .animate-progress {
            animation: progress 3s ease-in-out forwards;
        }
    `]
})
export class LogoutOverlayComponent {
  constructor(public logoutService: LogoutService) {}
}