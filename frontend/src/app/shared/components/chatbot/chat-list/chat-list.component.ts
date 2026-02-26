// chat/renderers/chat-list/chat-list.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {BadgeColor, ListData} from "../../../../core/models/chat.models";

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mt-2 flex flex-col gap-1.5">
      <div *ngFor="let item of data.items"
           class="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors">
        <div class="flex flex-col min-w-0">
          <span class="text-sm font-medium text-gray-800 dark:text-white truncate">{{ item.label }}</span>
          <span *ngIf="item.sublabel" class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ item.sublabel }}</span>
        </div>
        <span *ngIf="item.badge"
              class="ml-3 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
              [ngClass]="badgeClass(item.badgeColor)">
          {{ item.badge }}
        </span>
      </div>
      <p *ngIf="data.items.length === 0" class="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
        No items found
      </p>
    </div>
  `
})
export class ChatListComponent {
  @Input() data!: ListData;

  badgeClass(color?: BadgeColor): string {
    const map: Record<BadgeColor, string> = {
      red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      gray:   'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
      indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    };
    return map[color ?? 'gray'];
  }
}