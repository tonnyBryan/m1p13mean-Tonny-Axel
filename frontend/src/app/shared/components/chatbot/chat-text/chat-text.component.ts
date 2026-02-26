// chat/renderers/chat-text/chat-text.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TextData} from "../../../../core/models/chat.models";

@Component({
  selector: 'app-chat-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mt-1 flex items-start gap-2 text-sm leading-relaxed"
         [ngClass]="variantClass">
      <!-- icon -->
      <svg *ngIf="data.variant === 'info'" class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <svg *ngIf="data.variant === 'success'" class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <svg *ngIf="data.variant === 'warning'" class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <svg *ngIf="data.variant === 'error'" class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <span>{{ data.message }}</span>
    </div>
  `
})
export class ChatTextComponent {
  @Input() data!: TextData;

  get variantClass(): string {
    const map: Record<string, string> = {
      info:    'text-gray-700 dark:text-gray-300',
      success: 'text-emerald-700 dark:text-emerald-400',
      warning: 'text-amber-700 dark:text-amber-400',
      error:   'text-red-600 dark:text-red-400',
    };
    return map[this.data.variant] ?? map['info'];
  }
}