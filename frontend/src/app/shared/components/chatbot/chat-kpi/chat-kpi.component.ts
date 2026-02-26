// chat/renderers/chat-kpi/chat-kpi.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {KpiData} from "../../../../core/models/chat.models";

@Component({
  selector: 'app-chat-kpi',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid gap-3 mt-2"
         [ngClass]="data.items.length === 1 ? 'grid-cols-1' : 'grid-cols-2'">
      <div *ngFor="let item of data.items"
           class="rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex flex-col gap-1 shadow-sm">
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
          {{ item.label }}
        </span>
        <div class="flex items-end gap-2">
          <span class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ item.value | number }}
          </span>
          <span *ngIf="item.unit" class="text-sm text-gray-500 dark:text-gray-400 mb-0.5">
            {{ item.unit }}
          </span>
        </div>
        <div *ngIf="item.trend" class="flex items-center gap-1 mt-0.5">
          <!-- Up arrow -->
          <svg *ngIf="item.trendDirection === 'up'" class="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
          </svg>
          <!-- Down arrow -->
          <svg *ngIf="item.trendDirection === 'down'" class="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
          </svg>
          <!-- Neutral dash -->
          <svg *ngIf="item.trendDirection === 'neutral' || !item.trendDirection" class="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"/>
          </svg>
          <span class="text-xs font-medium"
                [class.text-emerald-600]="item.trendDirection === 'up'"
                [class.text-red-500]="item.trendDirection === 'down'"
                [class.text-gray-400]="item.trendDirection === 'neutral' || !item.trendDirection"
                [class.dark:text-emerald-400]="item.trendDirection === 'up'"
                [class.dark:text-red-400]="item.trendDirection === 'down'">
            {{ item.trend }}
          </span>
        </div>
      </div>
    </div>
  `
})
export class ChatKpiComponent {
  @Input() data!: KpiData;
}